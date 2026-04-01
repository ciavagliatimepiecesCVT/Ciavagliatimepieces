/**
 * High-level FlagShip operations: quotes, shipment creation, tracking.
 * Uses the adapter for HTTP so request shapes stay in one place.
 */

import { createServerClient } from "@/lib/supabase/server";
import { getShipperProfile } from "./env";
import {
  adapterGetTrack,
  adapterPostConfirm,
  adapterPostRates,
  type FlagShipAddress,
  type FlagShipConfirmBody,
  type FlagShipRatesBody,
} from "./flagship-adapter";
import {
  buildPackagesForCart,
  buildPackagesForCustomBuild,
  buildPackagesForProductId,
} from "./packages-from-order";
import type {
  SelectedShippingPayload,
  ShippingAddressInput,
  ShippingQuoteOption,
  ShippingQuoteRequest,
} from "./types";

function logFlagshipFailure(context: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[FlagShip] ${context}:`, msg);
}

function slugCourierName(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^the/, "");
}

function toFlagShipAddressFrom(
  shipper: ReturnType<typeof getShipperProfile>,
  profileName: string
): FlagShipAddress {
  return {
    name: shipper.company || profileName,
    attn: profileName,
    address: shipper.address1,
    ...(shipper.address2 ? { suite: shipper.address2 } : {}),
    city: shipper.city,
    country: shipper.country,
    state: shipper.province,
    postal_code: normalizePostal(shipper.postal_code, shipper.country),
    phone: digitsOnly(shipper.phone),
    is_commercial: true,
  };
}

function toFlagShipAddressTo(to: ShippingAddressInput, defaultName: string): FlagShipAddress {
  return {
    name: to.name?.trim() || defaultName,
    address: to.line1.trim(),
    ...(to.line2?.trim() ? { suite: to.line2.trim() } : {}),
    city: to.city.trim(),
    country: to.country.trim().toUpperCase(),
    state: to.state.trim(),
    postal_code: normalizePostal(to.postal_code, to.country),
    phone: digitsOnly(to.phone || "0000000000"),
    is_commercial: to.is_commercial ?? false,
  };
}

function normalizePostal(pc: string, country: string): string {
  const c = country.trim().toUpperCase();
  const s = pc.trim().toUpperCase().replace(/\s+/g, "");
  if (c === "CA") return s.replace(/^(.{3})(.{3})$/, "$1 $2");
  return pc.trim();
}

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "") || "0000000000";
}

function normalizeRatesPayload(data: unknown): ShippingQuoteOption[] {
  const root = data as { content?: unknown; errors?: unknown };
  if (root.errors && Array.isArray(root.errors) && root.errors.length) {
    console.warn("[FlagShip] rates response includes errors:", root.errors);
  }
  const arr = Array.isArray(root.content) ? root.content : [];
  const out: ShippingQuoteOption[] = [];
  for (const row of arr) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const priceObj = r.price as Record<string, unknown> | undefined;
    const service = r.service as Record<string, unknown> | undefined;
    const total = Number(priceObj?.total ?? 0);
    if (!Number.isFinite(total) || total < 0) continue;
    const courierName = String(service?.courier_name ?? "").trim() || "Carrier";
    const courierCode = String(service?.courier_code ?? "").trim();
    if (!courierCode) continue;
    const courierDesc = String(service?.courier_desc ?? courierCode).trim();
    const slug = slugCourierName(courierName);
    const ed =
      (typeof service?.estimated_delivery_date === "string" && service.estimated_delivery_date) ||
      (typeof service?.transit_time === "number" ? `~${service.transit_time} business days` : null);
    out.push({
      carrier: courierName,
      service_name: courierDesc,
      estimated_delivery: ed,
      price: Math.round(total * 100) / 100,
      currency: "CAD",
      raw_service_code: JSON.stringify({ courier_name: slug, courier_code: courierCode }),
    });
  }
  return out.sort((a, b) => a.price - b.price);
}

async function buildRatesBody(
  supabase: ReturnType<typeof createServerClient>,
  req: ShippingQuoteRequest,
  to: ShippingAddressInput
): Promise<{ body: FlagShipRatesBody; used_fallback: boolean }> {
  const shipper = getShipperProfile();
  const from = toFlagShipAddressFrom(shipper, shipper.name);
  const toAddr = toFlagShipTo(to, "Recipient");

  let packages: Awaited<ReturnType<typeof buildPackagesForCart>>;
  if (req.type === "cart") {
    const lines: Array<{ product_id: string; quantity: number }> = [];
    if (req.userId) {
      const { data: cartRows } = await supabase
        .from("cart_items")
        .select("product_id, quantity")
        .eq("user_id", req.userId);
      for (const row of cartRows ?? []) {
        lines.push({
          product_id: String(row.product_id),
          quantity: Math.max(1, Number(row.quantity) || 1),
        });
      }
    } else if (Array.isArray(req.guestCart)) {
      for (const g of req.guestCart) {
        lines.push({
          product_id: g.product_id,
          quantity: Math.max(1, Number(g.quantity) || 1),
        });
      }
    }
    packages = await buildPackagesForCart(supabase, lines);
  } else if (req.type === "built") {
    packages = await buildPackagesForProductId(supabase, req.productId, 1);
  } else {
    packages = buildPackagesForCustomBuild();
  }

  const body: FlagShipRatesBody = {
    from,
    to: toAddr,
    packages: {
      items: packages.items,
      units: "imperial",
      type: "package",
      content: "goods",
    },
    payment: { payer: "F" },
    options: {
      reference: "Quote",
    },
  };
  return { body, used_fallback: packages.used_fallback_dimensions };
}

function toFlagShipTo(to: ShippingAddressInput, defaultName: string): FlagShipAddress {
  return toFlagShipAddressTo(to, defaultName);
}

export async function getShippingQuotes(
  req: ShippingQuoteRequest,
  to: ShippingAddressInput
): Promise<{ options: ShippingQuoteOption[]; used_fallback_dimensions: boolean }> {
  const supabase = createServerClient();
  const { body, used_fallback } = await buildRatesBody(supabase, req, to);
  const res = await adapterPostRates(body);
  if (!res.ok || !res.data) {
    logFlagshipFailure("rates HTTP", res.text);
    throw new Error(
      res.status === 429
        ? "Shipping rate service is busy. Please wait a moment and try again."
        : "FlagShip returned an error while fetching rates."
    );
  }
  const options = normalizeRatesPayload(res.data);
  if (options.length === 0) {
    console.error("[FlagShip] No rates in response:", JSON.stringify(res.data).slice(0, 500));
    throw new Error("No shipping services are available for this address and package.");
  }
  return { options, used_fallback_dimensions: used_fallback };
}

/** Re-fetch rates and ensure the selected option still exists with a close price. */
export async function verifySelectedShipping(
  req: ShippingQuoteRequest,
  to: ShippingAddressInput,
  selected: SelectedShippingPayload
): Promise<boolean> {
  const { options } = await getShippingQuotes(req, to);
  const match = options.find((o) => o.raw_service_code === JSON.stringify({
    courier_name: selected.courier_name,
    courier_code: selected.courier_code,
  }));
  if (!match) {
    const alt = options.find((o) => o.raw_service_code.includes(selected.courier_code));
    if (!alt) return false;
    return Math.abs(alt.price - selected.price) <= Math.max(2, selected.price * 0.15);
  }
  return Math.abs(match.price - selected.price) <= Math.max(2, selected.price * 0.15);
}

export async function createShipmentForOrder(orderId: string, force: boolean): Promise<{
  shipment_id: string;
  tracking_number: string | null;
  shipping_cost: number | null;
  carrier: string | null;
  service: string | null;
  label_url: string | null;
}> {
  const supabase = createServerClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, status, flagship_shipment_id, shipping_name, shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, configuration_id, stripe_session_id, customer_email"
    )
    .eq("id", orderId)
    .single();

  if (error || !order) throw new Error("Order not found.");

  const paid = String(order.status ?? "").toLowerCase() === "paid";
  if (!paid) throw new Error("Order must be paid before creating a shipment.");
  const customerEmail = (order as { customer_email?: string | null }).customer_email?.trim() || null;

  if ((order as { flagship_shipment_id?: string | null }).flagship_shipment_id && !force) {
    throw new Error("A shipment already exists for this order. Pass force=true to create another.");
  }

  const to: ShippingAddressInput = {
    name: (order as { shipping_name?: string }).shipping_name || "Customer",
    line1: (order as { shipping_line1?: string }).shipping_line1 || "",
    line2: (order as { shipping_line2?: string }).shipping_line2 ?? null,
    city: (order as { shipping_city?: string }).shipping_city || "",
    state: (order as { shipping_state?: string }).shipping_state || "",
    postal_code: (order as { shipping_postal_code?: string }).shipping_postal_code || "",
    country: (order as { shipping_country?: string }).shipping_country || "",
    phone: null,
  };

  if (!to.line1 || !to.city || !to.postal_code || !to.country) {
    throw new Error("Order is missing a complete shipping address.");
  }

  const shipper = getShipperProfile();
  const from = toFlagShipAddressFrom(shipper, shipper.name);
  const toAddr = toFlagShipAddressTo(to, "Recipient");

  let packages: Awaited<ReturnType<typeof buildPackagesForCart>>;
  const configurationId = (order as { configuration_id?: string | null }).configuration_id;
  const sessionId = (order as { stripe_session_id?: string | null }).stripe_session_id;

  if (configurationId) {
    const { data: cfg } = await supabase
      .from("configurations")
      .select("type, options")
      .eq("id", configurationId)
      .maybeSingle();
    const type = cfg?.type as string | undefined;
    const opts = cfg?.options as Record<string, unknown> | undefined;
    if (type === "built" && opts?.product_id && typeof opts.product_id === "string") {
      packages = await buildPackagesForProductId(supabase, opts.product_id, 1);
    } else {
      packages = buildPackagesForCustomBuild();
    }
  } else if (sessionId) {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const raw = session.metadata?.cart_product_quantities;
    const lines: Array<{ product_id: string; quantity: number }> = [];
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw) as Array<{ product_id: string; quantity: number }>;
        for (const row of parsed) {
          lines.push({
            product_id: row.product_id,
            quantity: Math.max(1, Number(row.quantity) || 1),
          });
        }
      } catch (e) {
        logFlagshipFailure("parse cart_product_quantities", e);
      }
    }
    if (!lines.length) {
      throw new Error("Could not determine cart lines for this order.");
    }
    packages = await buildPackagesForCart(supabase, lines);
  } else {
    throw new Error("Order has no configuration or Stripe session to build packages from.");
  }

  const fsMeta = sessionId
    ? await loadFlagshipMetaFromStripeSession(sessionId)
    : null;

  if (!fsMeta?.courier_code || !fsMeta?.courier_name) {
    throw new Error("Order is missing FlagShip service selection (checkout metadata).");
  }

  const confirmBody: FlagShipConfirmBody = {
    from,
    to: toAddr,
    packages: {
      items: packages.items,
      units: "imperial",
      type: "package",
      content: "goods",
    },
    payment: { payer: "F" },
    service: {
      courier_name: fsMeta.courier_name,
      courier_code: fsMeta.courier_code,
    },
    options: {
      reference: ((order as { id: string }).id.replace(/-/g, "").slice(0, 12)),
      return_documents_as: "url",
      ...(customerEmail ? { shipment_tracking_emails: customerEmail } : {}),
    },
  };

  const res = await adapterPostConfirm(confirmBody);
  if (!res.ok || !res.data) {
    logFlagshipFailure("confirm", res.text);
    throw new Error("FlagShip could not create the shipment. Check logs and order details.");
  }

  const content = (res.data as { content?: Record<string, unknown> }).content;
  if (!content) {
    throw new Error("FlagShip returned an empty shipment response.");
  }

  const shipmentId = String(content.shipment_id ?? "");
  const tracking = (content.tracking_number as string) || null;
  const priceBlock = content.price as { total?: number } | undefined;
  const total = priceBlock?.total != null ? Number(priceBlock.total) : null;
  const svc = content.service as { courier_name?: string; courier_desc?: string } | undefined;
  const labels = content.labels as { regular?: string } | undefined;

  const carrier = svc?.courier_name ?? null;
  const service = svc?.courier_desc ?? null;
  const labelUrl = labels?.regular ?? null;

  await supabase
    .from("orders")
    .update({
      flagship_shipment_id: shipmentId || null,
      tracking_number: tracking,
      tracking_carrier: carrier,
      shipping_carrier: carrier,
      shipping_service: service,
      shipping_cost: total,
      shipping_label_url: labelUrl,
      shipment_status: "created",
      tracking_url: tracking ? buildCarrierTrackingUrl(carrier, tracking) : null,
    })
    .eq("id", orderId);

  return {
    shipment_id: shipmentId,
    tracking_number: tracking,
    shipping_cost: total,
    carrier,
    service,
    label_url: labelUrl,
  };
}

async function loadFlagshipMetaFromStripeSession(sessionId: string): Promise<{
  courier_name: string;
  courier_code: string;
} | null> {
  const { getStripe } = await import("@/lib/stripe");
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const compact = session.metadata?.flagship_quote;
  if (typeof compact === "string" && compact.trim()) {
    try {
      const j = JSON.parse(compact) as { cn?: string; cc?: string };
      if (j.cn && j.cc) return { courier_name: j.cn, courier_code: j.cc };
    } catch {
      /* fall through */
    }
  }
  return null;
}

function buildCarrierTrackingUrl(carrier: string | null, tracking: string): string | null {
  if (!carrier || !tracking) return null;
  const c = carrier.toLowerCase();
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tracking)}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${encodeURIComponent(tracking)}`;
  if (c.includes("purolator")) return `https://www.purolator.com/en/ship-track/tracking-search.page?q=${encodeURIComponent(tracking)}`;
  if (c.includes("canada post") || c.includes("canadapost")) {
    return `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${encodeURIComponent(tracking)}`;
  }
  if (c.includes("dhl")) return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(tracking)}`;
  return null;
}

export async function getShipmentLabel(orderId: string): Promise<{ url: string | null }> {
  const supabase = createServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("shipping_label_url, flagship_shipment_id")
    .eq("id", orderId)
    .maybeSingle();
  const url =
    (order as { shipping_label_url?: string | null } | null)?.shipping_label_url ?? null;
  if (url) return { url };
  const sid = (order as { flagship_shipment_id?: string } | null)?.flagship_shipment_id;
  if (!sid) return { url: null };
  const base = process.env.FLAGSHIP_API_BASE_URL?.replace(/\/$/, "") || "https://api.smartship.io";
  const token = process.env.FLAGSHIP_API_KEY || process.env.FLAGSHIP_API_SECRET || "";
  if (!token) return { url: null };
  return {
    url: `${base}/ship/${encodeURIComponent(sid)}/labels?document=reg`,
  };
}

export async function getTrackingInfo(orderId: string): Promise<{
  shipment_id: string | null;
  current_status: string | null;
  status_desc: string | null;
  courier_update: string | null;
}> {
  const supabase = createServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("flagship_shipment_id, tracking_number")
    .eq("id", orderId)
    .maybeSingle();
  const shipmentId = (order as { flagship_shipment_id?: string } | null)?.flagship_shipment_id;
  const tracking = (order as { tracking_number?: string } | null)?.tracking_number;
  const res = await adapterGetTrack({
    shipmentId: shipmentId || undefined,
    trackingNumber: !shipmentId && tracking ? tracking : undefined,
  });
  if (!res.ok || !res.data) {
    logFlagshipFailure("tracking", res.text);
    throw new Error("Could not load tracking from FlagShip.");
  }
  const content = (res.data as { content?: Record<string, unknown> }).content;
  return {
    shipment_id: shipmentId ?? null,
    current_status: (content?.current_status as string) ?? null,
    status_desc: (content?.status_desc as string) ?? null,
    courier_update: (content?.courier_update as string) ?? null,
  };
}
