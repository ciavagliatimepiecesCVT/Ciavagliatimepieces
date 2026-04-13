import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServerClient } from "@/lib/supabase/server";
import { getUsdToCadRate } from "@/lib/currency";
import { optionAppliesToFunction } from "@/lib/configurator-constants";
import { getSiteUrl, getStripe } from "@/lib/stripe";
import { parseShippingSelection } from "@/lib/shipping/parse-selection";
import { SHIPPING_ALLOWED_COUNTRIES, type SelectedShippingPayload } from "@/lib/shipping/types";

/** Stripe line item name: include chosen variant so checkout clearly shows what they're buying. */
function getBuiltProductLineItemName(
  baseName: string,
  configuration: unknown
): string {
  if (!configuration || typeof configuration !== "object") return baseName;
  const cfg = configuration as Record<string, unknown>;
  const variant = cfg.bracelet_title && typeof cfg.bracelet_title === "string" ? cfg.bracelet_title : "";
  if (!variant) return baseName;
  return `${baseName} · ${variant}`;
}

/** Stripe minimum unit amount (cents). */
const STRIPE_MIN_UNIT_CENTS = 50;

/** Build Stripe line items for a custom build from configuration.summaryLines so checkout and invoice show each part with its price. */
function getCustomBuildStripeLineItems(
  configuration: unknown,
  totalPrice: number,
  locale: "en" | "fr"
): Array<{ quantity: number; price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number } }> {
  const cfg = configuration && typeof configuration === "object" ? (configuration as Record<string, unknown>) : null;
  const rawSummary = Array.isArray(cfg?.summaryLines) ? cfg.summaryLines : [];
  const summaryLines = rawSummary
    .filter((line): line is { label: string; price: number } => line != null && typeof line === "object")
    .map((line) => ({
      label: typeof (line as { label?: unknown }).label === "string" ? (line as { label: string }).label : String((line as { label?: unknown }).label ?? ""),
      price: Number((line as { price?: unknown }).price) || 0,
    }));
  if (summaryLines.length === 0) {
    const name = locale === "fr" ? "Montre sur mesure" : "Custom Build";
    return [
      {
        quantity: 1,
        price_data: {
          currency: "cad",
          product_data: { name },
          unit_amount: Math.max(0, Math.round(totalPrice * 100)),
        },
      },
    ];
  }
  const items: Array<{ quantity: number; price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number } }> = [];
  const zeroPriceLabels: string[] = [];
  let partsTotalCents = 0;

  for (const line of summaryLines) {
    const price = Number(line.price) || 0;
    const label = typeof line.label === "string" ? line.label : String(line.label);
    if (price < 0.5) {
      if (price >= 0) zeroPriceLabels.push(label);
      continue;
    }
    const unitCents = Math.max(0, Math.round(price * 100));
    items.push({
      quantity: 1,
      price_data: {
        currency: "cad",
        product_data: { name: label },
        unit_amount: unitCents,
      },
    });
    partsTotalCents += unitCents;
  }

  if (zeroPriceLabels.length > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: "cad",
        product_data: {
          name: locale === "fr" ? "Options incluses" : "Included options",
          description: zeroPriceLabels.join(", "),
        },
        unit_amount: 0,
      },
    });
  }

  const desiredTotalCents = Math.round(totalPrice * 100);
  let adjustment = desiredTotalCents - partsTotalCents;
  if (adjustment !== 0) {
    if (adjustment < 0) {
      let discountCents = Math.round(-adjustment);
      for (let i = items.length - 1; i >= 0 && discountCents > 0; i--) {
        const amt = items[i].price_data.unit_amount;
        if (amt > 0) {
          const take = Math.min(amt, discountCents);
          items[i].price_data.unit_amount = Math.max(0, Math.round(amt - take));
          adjustment += take;
          discountCents -= take;
        }
      }
    }
    if (adjustment > 0) {
      items.push({
        quantity: 1,
        price_data: {
          currency: "cad",
          product_data: {
            name: locale === "fr" ? "Ajustement" : "Adjustment",
          },
          unit_amount: Math.round(adjustment),
        },
      });
    }
  }

  return items;
}

/** Build Stripe line-item description for a built product with bracelet/addons (so customers see what they're buying). */
function getBuiltProductConfigDescription(
  configuration: unknown,
  locale: "en" | "fr"
): string {
  if (!configuration || typeof configuration !== "object") return "";
  const cfg = configuration as Record<string, unknown>;
  const lines: string[] = [];
  const labelKey = locale === "fr" ? "option_label_fr" : "option_label_en";
  if (cfg.bracelet_title && typeof cfg.bracelet_title === "string") {
    lines.push(`${locale === "fr" ? "Variante" : "Variant"}: ${cfg.bracelet_title}`);
  }
  const addons = Array.isArray(cfg.addons) ? cfg.addons : [];
  if (addons.length > 0) {
    const extraLabels = addons
      .map((a) => {
        if (!a || typeof a !== "object") return null;
        const o = a as Record<string, unknown>;
        const label = (o[labelKey] ?? o.option_label_en ?? o.option_label_fr) as string | undefined;
        const price = typeof o.price === "number" ? o.price : undefined;
        if (label) return price != null ? `${label} (C$${price})` : label;
        return null;
      })
      .filter(Boolean);
    if (extraLabels.length) {
      lines.push(`${locale === "fr" ? "Extras" : "Extras"}: ${extraLabels.join(", ")}`);
    }
  }
  return lines.join("\n");
}

/** Build a human-readable list of parts for a custom build (for Stripe product description).
 * config.steps = [functionOptionId, ...optionIds in step order].
 * config.dropdownSelections = optional { optionId: dropdownItemId } for dropdown sub-options.
 * Uses label_en or label_fr based on locale.
 */
async function getCustomBuildPartsSummary(
  supabase: ReturnType<typeof createServerClient>,
  config: { steps?: unknown[]; extras?: unknown[]; addonIds?: unknown[]; dropdownSelections?: Record<string, string>; sizeOptionId?: string },
  locale: "en" | "fr"
): Promise<string> {
  const stepsPayload = Array.isArray(config.steps) ? config.steps : [];
  const extras = Array.isArray(config.extras) ? config.extras : [];
  const addonIds = Array.isArray(config.addonIds) ? config.addonIds : [];
  const dropdownSelections: Record<string, string> =
    config.dropdownSelections && typeof config.dropdownSelections === "object" && !Array.isArray(config.dropdownSelections)
      ? (config.dropdownSelections as Record<string, string>)
      : {};
  const labelKey = locale === "fr" ? "label_fr" : "label_en";

  const functionOptionId = stepsPayload[0] && typeof stepsPayload[0] === "string" ? stepsPayload[0] : null;
  if (!functionOptionId) return "Custom build";

  const { data: functionStepRows } = await supabase
    .from("configurator_function_steps")
    .select("step_id, sort_order")
    .eq("function_option_id", functionOptionId)
    .order("sort_order", { ascending: true });
  const stepIdsOrdered = (functionStepRows ?? []).map((r: { step_id: string }) => r.step_id);
  if (!stepIdsOrdered.length) return "Custom build";

  const parts: string[] = [];

  const { data: functionOpt } = await supabase
    .from("configurator_options")
    .select("label_en, label_fr")
    .eq("id", functionOptionId)
    .single();
  const functionLabel = (functionOpt as Record<string, string> | null)?.[labelKey] ?? "Function";
  parts.push(`${locale === "fr" ? "Fonction" : "Function"}: ${functionLabel}`);

  const sizeOptionId = typeof config.sizeOptionId === "string" && config.sizeOptionId ? config.sizeOptionId : null;
  if (sizeOptionId) {
    const { data: sizeStep } = await supabase.from("configurator_steps").select("label_en, label_fr").eq("step_key", "size").maybeSingle();
    const { data: sizeOpt } = await supabase.from("configurator_options").select("label_en, label_fr").eq("id", sizeOptionId).single();
    const sizeStepLabel = (sizeStep as Record<string, string> | null)?.[labelKey] ?? "Size";
    const sizeOptLabel = (sizeOpt as Record<string, string> | null)?.[labelKey] ?? "";
    if (sizeOptLabel) parts.push(`${sizeStepLabel}: ${sizeOptLabel}`);
  }

  for (let i = 0; i < stepIdsOrdered.length; i++) {
    const stepId = stepIdsOrdered[i];
    const selectedOptionId = stepsPayload[i + 1] && typeof stepsPayload[i + 1] === "string" ? stepsPayload[i + 1] : null;

    const { data: stepRow } = await supabase.from("configurator_steps").select("id, step_key, label_en, label_fr").eq("id", stepId).single();
    const stepLabel = (stepRow as Record<string, string> | null)?.[labelKey] ?? "Step";
    const stepKey = (stepRow as { step_key?: string } | null)?.step_key;

    if (stepKey === "extra") {
      const idsToSum = extras.length ? extras : (selectedOptionId ? [selectedOptionId] : []);
      for (const id of idsToSum) {
        if (typeof id !== "string" || !id) continue;
        const { data: opt } = await supabase.from("configurator_options").select("label_en, label_fr").eq("id", id).single();
        const optLabel = (opt as Record<string, string> | null)?.[labelKey] ?? "";
        if (optLabel) parts.push(`${stepLabel}: ${optLabel}`);
      }
    } else if (selectedOptionId && typeof selectedOptionId === "string") {
      const { data: opt } = await supabase.from("configurator_options").select("label_en, label_fr").eq("id", selectedOptionId).single();
      const optLabel = (opt as Record<string, string> | null)?.[labelKey] ?? "";
      const dropdownItemId = dropdownSelections[selectedOptionId];
      let partLine = optLabel ? `${stepLabel}: ${optLabel}` : "";
      if (dropdownItemId && typeof dropdownItemId === "string") {
        const { data: ddRow } = await supabase.from("configurator_dropdown_items").select("label_en, label_fr").eq("id", dropdownItemId).single();
        const ddLabel = (ddRow as Record<string, string> | null)?.[labelKey];
        if (ddLabel) partLine += ` → ${ddLabel}`;
      }
      if (partLine) parts.push(partLine);
    }
  }

  if (addonIds.length > 0) {
    const { data: addons } = await supabase.from("configurator_addons").select("id, label_en, label_fr");
    for (const id of addonIds) {
      if (typeof id !== "string") continue;
      const addon = (addons ?? []).find((a: { id: string }) => a.id === id) as Record<string, string> | undefined;
      if (addon?.[labelKey]) parts.push(addon[labelKey]);
    }
  }

  return parts.length ? parts.join("\n") : "Custom build";
}

/** Calculate custom build total from DB only (do not trust client price).
 * config.steps = [functionOptionId, ...optionIds in step order for that function].
 * config.extras = optional extra-step option ids; config.addonIds = addon UUIDs (e.g. Frosted Finish).
 * config.dropdownSelections = optional { optionId: dropdownItemId } for options that have dropdown menus.
 */
async function calculateCustomBuildPrice(
  supabase: ReturnType<typeof createServerClient>,
  config: { steps?: unknown[]; extras?: unknown[]; addonIds?: unknown[]; dropdownSelections?: Record<string, string>; sizeOptionId?: string }
): Promise<number> {
  const stepsPayload = Array.isArray(config.steps) ? config.steps : [];
  const extras = Array.isArray(config.extras) ? config.extras : [];
  const addonIds = Array.isArray(config.addonIds) ? config.addonIds : [];
  const dropdownSelections: Record<string, string> =
    config.dropdownSelections && typeof config.dropdownSelections === "object" && !Array.isArray(config.dropdownSelections)
      ? (config.dropdownSelections as Record<string, string>)
      : {};

  const functionOptionId = stepsPayload[0] && typeof stepsPayload[0] === "string" ? stepsPayload[0] : null;
  if (!functionOptionId) return 0;

  let total = 0;

  // Include the function option's own price (the client-side total includes it).
  const { data: funcOpt } = await supabase
    .from("configurator_options")
    .select("price, discount_percent")
    .eq("id", functionOptionId)
    .single();
  if (funcOpt) {
    const p = Number((funcOpt as { price?: number }).price ?? 0);
    const d = Math.min(100, Math.max(0, Number((funcOpt as { discount_percent?: number }).discount_percent ?? 0)));
    total += d > 0 ? p * (1 - d / 100) : p;
  }
  const sizeOptionId = typeof config.sizeOptionId === "string" && config.sizeOptionId ? config.sizeOptionId : null;
  if (sizeOptionId) {
    const { data: sizeOpt } = await supabase
      .from("configurator_options")
      .select("price, discount_percent")
      .eq("id", sizeOptionId)
      .single();
    if (sizeOpt) {
      const p = Number((sizeOpt as { price?: number }).price ?? 0);
      const d = Math.min(100, Math.max(0, Number((sizeOpt as { discount_percent?: number }).discount_percent ?? 0)));
      total += d > 0 ? p * (1 - d / 100) : p;
    }
  }

  const { data: functionStepRows } = await supabase
    .from("configurator_function_steps")
    .select("step_id, sort_order")
    .eq("function_option_id", functionOptionId)
    .order("sort_order", { ascending: true });
  const stepIdsOrdered = (functionStepRows ?? []).map((r: { step_id: string }) => r.step_id);
  if (!stepIdsOrdered.length) return total;

  for (let i = 0; i < stepIdsOrdered.length; i++) {
    const stepId = stepIdsOrdered[i];
    const selectedOptionId = stepsPayload[i + 1] && typeof stepsPayload[i + 1] === "string" ? stepsPayload[i + 1] : null;

    const { data: stepRow } = await supabase.from("configurator_steps").select("id, step_key").eq("id", stepId).single();
    const stepKey = (stepRow as { step_key?: string } | null)?.step_key;

    let optionsRaw: { id: string; price: number; discount_percent?: number | null; parent_option_id?: string | null; for_function_ids?: string[] | null }[] | null = null;
    const { data: withForFunctionIds, error: err1 } = await supabase
      .from("configurator_options")
      .select("id, price, discount_percent, parent_option_id, for_function_ids")
      .eq("step_id", stepId);
    if (!err1 && withForFunctionIds) optionsRaw = withForFunctionIds as NonNullable<typeof optionsRaw>;
    if (optionsRaw == null) {
      const { data: fallback } = await supabase
        .from("configurator_options")
        .select("id, price, discount_percent, parent_option_id")
        .eq("step_id", stepId);
      optionsRaw = (fallback ?? []).map((o) => ({ ...o, for_function_ids: null }));
    }
    const options = (optionsRaw ?? []).filter((o): o is NonNullable<typeof o> => o != null && optionAppliesToFunction(o, functionOptionId));

    const effectivePrice = (opt: { price: number; discount_percent?: number | null }) => {
      const p = Number(opt.price ?? 0);
      const d = Math.min(100, Math.max(0, Number(opt.discount_percent ?? 0)));
      return d > 0 ? p * (1 - d / 100) : p;
    };

    if (stepKey === "extra") {
      const idsToSum = extras.length ? extras : (selectedOptionId ? [selectedOptionId] : []);
      for (const id of idsToSum) {
        if (typeof id !== "string" || !id) continue;
        const opt = options?.find((o: { id: string }) => o.id === id);
        if (opt) total += effectivePrice(opt as { price: number; discount_percent?: number | null });
      }
    } else if (selectedOptionId && typeof selectedOptionId === "string" && selectedOptionId) {
      const opt = options?.find((o: { id: string }) => o.id === selectedOptionId);
      if (opt) total += effectivePrice(opt as { price: number; discount_percent?: number | null });
      const dropdownItemId = dropdownSelections[selectedOptionId];
      if (dropdownItemId && typeof dropdownItemId === "string") {
        const { data: ddRow } = await supabase
          .from("configurator_dropdown_items")
          .select("price")
          .eq("id", dropdownItemId)
          .single();
        if (ddRow && typeof (ddRow as { price?: number }).price === "number") total += Number((ddRow as { price: number }).price);
      }
    }
  }

  if (addonIds.length > 0) {
    const { data: addons } = await supabase.from("configurator_addons").select("id, price");
    for (const id of addonIds) {
      if (typeof id !== "string") continue;
      const addon = addons?.find((a: { id: string }) => a.id === id);
      if (addon) total += Number((addon as { price: number }).price);
    }
  }

  return total;
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Missing or invalid body" }, { status: 400 });
  }

  type CheckoutPayload = {
    locale?: string;
    type?: string;
    userId?: string | null;
    currency?: "USD" | "CAD";
    guestCart?: Array<{
      product_id: string;
      quantity: number;
      price: number;
      title?: string | null;
      configuration?: unknown;
    }>;
    configuration?: Record<string, string | number>;
    productId?: string;
    /** FlagShip-selected rate from /api/shipping/quote (required when shipping is not free). */
    shippingSelection?: unknown;
  };
  const body = payload as CheckoutPayload;
  const { locale, type, userId } = body;
  const currency = body.currency === "CAD" ? "cad" : "usd";

  if (!locale || typeof locale !== "string") {
    return NextResponse.json({ error: "Missing locale" }, { status: 400 });
  }
  const validLocales: ("en" | "fr")[] = ["en", "fr"];
  const localeSegment: "en" | "fr" = validLocales.includes(locale as "en" | "fr") ? (locale as "en" | "fr") : "en";
  if (type !== "custom" && type !== "built" && type !== "cart") {
    return NextResponse.json({ error: "Invalid checkout type" }, { status: 400 });
  }
  if (type === "custom" && !body.configuration) {
    return NextResponse.json({ error: "Missing configuration for custom build" }, { status: 400 });
  }
  if (type === "built" && !body.productId) {
    return NextResponse.json({ error: "Missing product" }, { status: 400 });
  }
  if (type === "cart" && !userId && (!Array.isArray(body.guestCart) || body.guestCart.length === 0)) {
    return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    let stripe: ReturnType<typeof getStripe>;
    let siteUrl: string;
    try {
      stripe = getStripe();
      siteUrl = getSiteUrl();
    } catch (configError) {
      const msg = configError instanceof Error ? configError.message : "Configuration error";
      console.error("Checkout config error:", msg);
      return NextResponse.json(
        { error: "Checkout is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    let summary = "Ciavaglia timepiece";
    let amount = 0;
    let configurationId: string | null = null;
    let guestCartProductQuantitiesJson: string | null = null;
    type LineItem = {
      quantity: number;
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
    };
    const lineItems: LineItem[] = [];
    let freeShippingApplicable = false;
    let paidShipping: SelectedShippingPayload | null = null;

    if (type === "custom" && body.configuration) {
      const cfg = body.configuration as Record<string, unknown>;
      amount = await calculateCustomBuildPrice(supabase, {
        steps: Array.isArray(cfg.steps) ? cfg.steps : [],
        extras: Array.isArray(cfg.extras) ? cfg.extras : [],
        addonIds: Array.isArray(cfg.addonIds) ? cfg.addonIds : [],
        dropdownSelections: cfg.dropdownSelections && typeof cfg.dropdownSelections === "object" ? (cfg.dropdownSelections as Record<string, string>) : undefined,
        sizeOptionId: typeof cfg.sizeOptionId === "string" && cfg.sizeOptionId ? cfg.sizeOptionId : undefined,
      });
      if (amount === 0 && typeof cfg.price === "number" && cfg.price > 0) {
        amount = cfg.price;
      }
      const { data: discountRow } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "configurator_discount_percent")
        .single();
      const discountPercent = Math.min(100, Math.max(0, Number((discountRow as { value?: string } | null)?.value ?? 0)));
      if (discountPercent > 0) {
        amount = amount * (1 - discountPercent / 100);
      }
      summary = "Custom build";

      const { data, error } = await supabase
        .from("configurations")
        .insert({
          type: "custom",
          options: body.configuration,
          status: "pending",
          price: amount,
          user_id: userId ?? null,
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      configurationId = data.id;
      const customLineItems = getCustomBuildStripeLineItems(body.configuration, amount, localeSegment);
      for (const li of customLineItems) {
        lineItems.push(li);
      }
      const { data: freeShipRow } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "configurator_free_shipping")
        .single();
      freeShippingApplicable = (freeShipRow as { value?: string } | null)?.value === "true" || (freeShipRow as { value?: string } | null)?.value === "1";
    }

    if (type === "built" && body.productId) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, name, price, stock, free_shipping")
        .eq("id", body.productId)
        .eq("active", true)
        .single();

      if (productError || !product) {
        return NextResponse.json({ error: "Unknown product" }, { status: 404 });
      }

      const stock = product.stock ?? 0;
      if (stock < 1) {
        return NextResponse.json({ error: "Out of stock" }, { status: 400 });
      }

      summary = `Built watch · ${product.name}`;
      const amount = Number(product.price);

      const { data, error } = await supabase
        .from("configurations")
        .insert({
          type: "built",
          options: { product_id: product.id, title: product.name },
          status: "pending",
          price: amount,
          user_id: userId ?? null,
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      configurationId = data.id;
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "cad",
          product_data: { name: summary },
          unit_amount: Math.round(amount * 100),
        },
      });
      freeShippingApplicable = !!(product as { free_shipping?: boolean }).free_shipping;
    }

    if (type === "cart" && userId) {
      const { data: cartRows, error: cartError } = await supabase
        .from("cart_items")
        .select("id, product_id, quantity, price, title, configuration")
        .eq("user_id", userId);

      if (cartError || !cartRows?.length) {
        return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
      }

      const isConfiguratorCustom = (r: { product_id?: string }) =>
        typeof r.product_id === "string" && r.product_id.startsWith("custom-");
      const builtProductIds = [...new Set(cartRows.filter((r) => !isConfiguratorCustom(r)).map((r) => r.product_id))];
      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, stock, active, free_shipping")
        .in("id", builtProductIds);

      const productMap = new Map((products ?? []).map((p) => [p.id, p]));
      const cartProductQuantities: { product_id: string; quantity: number }[] = [];

      for (const row of cartRows) {
        const qty = Math.max(1, Math.floor(Number(row.quantity) || 1));
        const isCustom = isConfiguratorCustom(row);

        if (isCustom) {
          const unitPrice = Number(row.price) || 0;
          if (unitPrice < 0) continue;
          const customBuildItems = getCustomBuildStripeLineItems(row.configuration, unitPrice, localeSegment);
          for (const li of customBuildItems) {
            lineItems.push({ ...li, quantity: Math.max(1, Math.floor(li.quantity * qty)) });
          }
          cartProductQuantities.push({ product_id: row.product_id, quantity: qty });
          continue;
        }

        const product = productMap.get(row.product_id);
        if (!product || !product.active) {
          return NextResponse.json(
            { error: `Product "${row.title ?? row.product_id}" is no longer available` },
            { status: 400 }
          );
        }
        const stock = product.stock ?? 0;
        if (stock < qty) {
          return NextResponse.json(
            { error: `Not enough stock for "${row.title ?? product.name}"` },
            { status: 400 }
          );
        }
        const unitPrice = Number(row.price ?? product.price);
        const baseName = row.title ?? product.name;
        const configDescription = row.configuration
          ? getBuiltProductConfigDescription(row.configuration, localeSegment)
          : undefined;
        lineItems.push({
          quantity: qty,
          price_data: {
            currency: "cad",
            product_data: {
              name: getBuiltProductLineItemName(baseName, row.configuration),
              ...(configDescription ? { description: configDescription } : {}),
            },
            unit_amount: Math.round(unitPrice * 100),
          },
        });
        cartProductQuantities.push({ product_id: row.product_id, quantity: qty });
      }

      const hasCustomItems = cartRows.some((r) => isConfiguratorCustom(r));
      const allBuiltFreeShipping = cartRows
        .filter((r) => !isConfiguratorCustom(r))
        .every((r) => (productMap.get(r.product_id) as { free_shipping?: boolean } | undefined)?.free_shipping);
      if (hasCustomItems) {
        const { data: freeShipRow } = await supabase.from("site_settings").select("value").eq("key", "configurator_free_shipping").single();
        const configuratorFree = (freeShipRow as { value?: string } | null)?.value === "true" || (freeShipRow as { value?: string } | null)?.value === "1";
        freeShippingApplicable = allBuiltFreeShipping && configuratorFree;
      } else {
        freeShippingApplicable = allBuiltFreeShipping;
      }

      summary = `Cart · ${cartRows.length} item${cartRows.length === 1 ? "" : "s"}`;
    }

    if (type === "cart" && !userId && Array.isArray(body.guestCart) && body.guestCart.length > 0) {
      const guestCart = body.guestCart;
      const isConfiguratorCustom = (r: { product_id?: string }) =>
        typeof r.product_id === "string" && r.product_id.startsWith("custom-");
      const builtProductIds = [...new Set(guestCart.filter((r) => !isConfiguratorCustom(r)).map((r) => r.product_id))];
      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, stock, active, free_shipping")
        .in("id", builtProductIds);
      const productMap = new Map((products ?? []).map((p) => [p.id, p]));
      const cartProductQuantities: { product_id: string; quantity: number }[] = [];

      for (const row of guestCart) {
        const qty = Math.max(1, Math.floor(Number(row.quantity) || 1));
        const isCustom = isConfiguratorCustom(row);

        if (isCustom) {
          const cfg = row.configuration as Record<string, unknown> | undefined;
          let unitPrice = Number(row.price) || 0;
          if (unitPrice <= 0 && cfg && typeof (cfg as { price?: number }).price === "number") {
            const serverPrice = await calculateCustomBuildPrice(supabase, {
              steps: Array.isArray(cfg?.steps) ? cfg.steps : [],
              extras: Array.isArray(cfg?.extras) ? cfg.extras : [],
              addonIds: Array.isArray(cfg?.addonIds) ? cfg.addonIds : [],
              dropdownSelections: cfg?.dropdownSelections && typeof cfg.dropdownSelections === "object" ? (cfg.dropdownSelections as Record<string, string>) : undefined,
              sizeOptionId: typeof cfg.sizeOptionId === "string" && cfg.sizeOptionId ? cfg.sizeOptionId : undefined,
            });
            if (serverPrice > 0) unitPrice = serverPrice;
          }
          if (unitPrice > 0) {
            const customBuildItems = getCustomBuildStripeLineItems(row.configuration, unitPrice, localeSegment);
            for (const li of customBuildItems) {
              lineItems.push({ ...li, quantity: Math.max(1, Math.floor(li.quantity * qty)) });
            }
          }
          cartProductQuantities.push({ product_id: row.product_id, quantity: qty });
          continue;
        }

        const product = productMap.get(row.product_id);
        if (!product || !product.active) {
          return NextResponse.json(
            { error: `Product "${row.title ?? row.product_id}" is no longer available` },
            { status: 400 }
          );
        }
        const stock = product.stock ?? 0;
        if (stock < qty) {
          return NextResponse.json(
            { error: `Not enough stock for "${row.title ?? product.name}"` },
            { status: 400 }
          );
        }
        const unitPrice = Number(row.price ?? product.price);
        const baseName = row.title ?? product.name;
        const configDescription = row.configuration
          ? getBuiltProductConfigDescription(row.configuration, localeSegment)
          : undefined;
        lineItems.push({
          quantity: qty,
          price_data: {
            currency: "cad",
            product_data: {
              name: getBuiltProductLineItemName(baseName, row.configuration),
              ...(configDescription ? { description: configDescription } : {}),
            },
            unit_amount: Math.round(unitPrice * 100),
          },
        });
        cartProductQuantities.push({ product_id: row.product_id, quantity: qty });
      }

      const hasCustomItems = guestCart.some((r) => isConfiguratorCustom(r));
      const allBuiltFreeShipping = guestCart
        .filter((r) => !isConfiguratorCustom(r))
        .every((r) => (productMap.get(r.product_id) as { free_shipping?: boolean } | undefined)?.free_shipping);
      if (hasCustomItems) {
        const { data: freeShipRow } = await supabase.from("site_settings").select("value").eq("key", "configurator_free_shipping").single();
        const configuratorFree = (freeShipRow as { value?: string } | null)?.value === "true" || (freeShipRow as { value?: string } | null)?.value === "1";
        freeShippingApplicable = allBuiltFreeShipping && configuratorFree;
      } else {
        freeShippingApplicable = allBuiltFreeShipping;
      }

      summary = `Cart · ${guestCart.length} item${guestCart.length === 1 ? "" : "s"}`;
      guestCartProductQuantitiesJson = JSON.stringify(cartProductQuantities);
    }

    if (freeShippingApplicable) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "cad",
          product_data: { name: "Shipping", description: "Free shipping" },
          unit_amount: 0,
        },
      });
    } else {
      paidShipping = parseShippingSelection(body.shippingSelection);
      if (!paidShipping) {
        return NextResponse.json(
          {
            error:
              "Please complete shipping: open checkout, enter your address, choose a carrier, then pay.",
          },
          { status: 400 }
        );
      }
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: "Nothing to checkout" }, { status: 400 });
    }

    // All line amounts are in CAD. If user chose USD, convert to USD.
    let usdToCad = 1;
    if (currency === "usd") {
      usdToCad = await getUsdToCadRate();
    }
    let finalLineItems = lineItems;
    if (currency === "usd") {
      finalLineItems = lineItems.map((item) => ({
        ...item,
        price_data: {
          ...item.price_data,
          currency: "usd",
          unit_amount: Math.round(item.price_data.unit_amount / usdToCad),
        },
      }));
    }

    // Stripe minimum is 0.50 in the selected currency (include FlagShip shipping when applicable).
    const STRIPE_MIN_CENTS = 50;
    const lineSumCents = finalLineItems.reduce(
      (sum, item) => sum + item.quantity * item.price_data.unit_amount,
      0
    );
    let shippingCentsForMin = 0;
    if (paidShipping) {
      const shipCadCents = Math.round(paidShipping.price * 100);
      shippingCentsForMin =
        currency === "usd" ? Math.round(shipCadCents / usdToCad) : shipCadCents;
    }
    const totalCents = lineSumCents + shippingCentsForMin;
    if (totalCents < STRIPE_MIN_CENTS) {
      const symbol = currency === "cad" ? "C$" : "$";
      const totalFormatted = (totalCents / 100).toFixed(2);
      return NextResponse.json(
        {
          error: `Minimum order amount is ${symbol}0.50. Your total is ${symbol}${totalFormatted}. Please add more items or use a product with a higher price.`,
        },
        { status: 400 }
      );
    }

    const metadata: Record<string, string> = {
      configuration_id: configurationId ?? "",
      summary,
      locale,
      type,
      user_id: typeof userId === "string" ? userId : "",
    };
    if (type === "cart" && userId) {
      const { data: cartRows } = await supabase
        .from("cart_items")
        .select("product_id, quantity")
        .eq("user_id", userId);
      const cartProductQuantities = (cartRows ?? []).map((r) => ({
        product_id: r.product_id,
        quantity: Number(r.quantity) || 1,
      }));
      metadata.cart_product_quantities = JSON.stringify(cartProductQuantities);
    } else if (type === "cart" && guestCartProductQuantitiesJson) {
      metadata.cart_product_quantities = guestCartProductQuantitiesJson;
    }

    if (paidShipping) {
      // Compact JSON for Stripe metadata (500 char limit per value). Used again when purchasing labels.
      metadata.flagship_quote = JSON.stringify({
        cn: paidShipping.courier_name,
        cc: paidShipping.courier_code,
        p: paidShipping.price,
        car: paidShipping.carrier,
        svc: paidShipping.service_name,
      });
    }

    const stripeCurrency = currency === "cad" ? "cad" : "usd";
    const shippingStripeCents = paidShipping
      ? currency === "usd"
        ? Math.max(0, Math.round((paidShipping.price * 100) / usdToCad))
        : Math.max(0, Math.round(paidShipping.price * 100))
      : 0;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: finalLineItems,
      success_url: `${siteUrl}/${localeSegment}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${localeSegment}/checkout/cancel`,
      metadata,
      locale: localeSegment === "fr" ? "fr" : "en",
      phone_number_collection: { enabled: true },
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: [...SHIPPING_ALLOWED_COUNTRIES],
      },
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      invoice_creation: { enabled: true },
    };

    if (paidShipping && shippingStripeCents >= 0) {
      const displayName = `${paidShipping.carrier} — ${paidShipping.service_name}`.slice(0, 100);
      sessionParams.shipping_options = [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingStripeCents,
              currency: stripeCurrency,
            },
            display_name: displayName,
          },
        },
      ];
    }

    let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (stripeErr) {
      const stripeMsg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
      const isTaxOrInvoiceError =
        /tax|invoice|settings|configuration/i.test(stripeMsg) ||
        (stripeErr as { code?: string }).code === "account_invalid";
      if (isTaxOrInvoiceError) {
        console.warn("Checkout: Stripe tax/invoice error, retrying without automatic_tax and invoice_creation:", stripeMsg);
        const { automatic_tax, invoice_creation, ...paramsWithoutTax } = sessionParams;
        session = await stripe.checkout.sessions.create(paramsWithoutTax);
      } else {
        throw stripeErr;
      }
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Checkout error:", message, stack ?? "");
    if (process.env.NODE_ENV === "development" && error instanceof Error) {
      console.error("Checkout error name:", error.name, "cause:", (error as { cause?: unknown }).cause);
    }
    if (message.includes("stock") || message.includes("product")) {
      return NextResponse.json({ error: "Product unavailable. Please refresh and try again." }, { status: 400 });
    }
    if (message.toLowerCase().includes("amount") || message.toLowerCase().includes("minimum")) {
      return NextResponse.json(
        { error: "The order total is below Stripe's minimum ($0.50 USD). Please add more items or choose a higher-priced product." },
        { status: 400 }
      );
    }
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Failed to create checkout session. Please try again.",
        ...(isDev ? { debug: message } : {}),
      },
      { status: 500 }
    );
  }
}
