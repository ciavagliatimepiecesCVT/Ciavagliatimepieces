import { NextRequest, NextResponse } from "next/server";
import { getFlagshipToken } from "@/lib/shipping/env";
import { getShippingQuotes } from "@/lib/shipping/flagship-service";
import { SHIPPING_ALLOWED_COUNTRIES, type ShippingAddressInput, type ShippingQuoteRequest } from "@/lib/shipping/types";

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function validateAddress(raw: unknown): ShippingAddressInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const line1 = typeof o.line1 === "string" ? o.line1.trim() : "";
  const city = typeof o.city === "string" ? o.city.trim() : "";
  const state = typeof o.state === "string" ? o.state.trim() : "";
  const postal = typeof o.postal_code === "string" ? o.postal_code.trim() : "";
  const country = typeof o.country === "string" ? o.country.trim() : "";
  const name = typeof o.name === "string" ? o.name.trim() : "Customer";
  if (!line1 || !city || !state || !postal || country.length !== 2) return null;
  return {
    name,
    line1,
    line2: typeof o.line2 === "string" ? o.line2 : null,
    city,
    state,
    postal_code: postal,
    country: country.toUpperCase(),
    phone: typeof o.phone === "string" ? o.phone : null,
    is_commercial: typeof o.is_commercial === "boolean" ? o.is_commercial : false,
  };
}

/**
 * POST /api/shipping/quote
 * Server-side FlagShip rates; never exposes API tokens to the client.
 */
export async function POST(request: NextRequest) {
  if (!getFlagshipToken()) {
    return bad("Shipping quotes are not configured.", 503);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("Invalid JSON");
  }

  const locale = typeof body.locale === "string" ? body.locale : "en";
  const currency = body.currency === "USD" || body.currency === "CAD" ? body.currency : "CAD";
  const to = validateAddress(body.to);
  if (!to) {
    return bad("Invalid or incomplete shipping address (name, line1, city, state, postal_code, country required).");
  }
  if (!(SHIPPING_ALLOWED_COUNTRIES as readonly string[]).includes(to.country)) {
    return bad("Shipping is only available to the United States and Canada.");
  }

  const type = body.type;
  let req: ShippingQuoteRequest;

  if (type === "cart") {
    req = {
      locale,
      currency,
      type: "cart",
      userId: typeof body.userId === "string" ? body.userId : null,
      guestCart: Array.isArray(body.guestCart) ? (body.guestCart as CheckoutQuoteGuest[]) : undefined,
    };
  } else if (type === "custom") {
    if (!body.configuration || typeof body.configuration !== "object") {
      return bad("Missing configuration for custom quote.");
    }
    req = {
      locale,
      currency,
      type: "custom",
      configuration: body.configuration as Record<string, unknown>,
    };
  } else if (type === "built") {
    if (typeof body.productId !== "string" || !body.productId.trim()) {
      return bad("Missing productId for built quote.");
    }
    req = {
      locale,
      currency,
      type: "built",
      productId: body.productId.trim(),
    };
  } else {
    return bad("Invalid type (expected cart, custom, or built).");
  }

  try {
    const { options, used_fallback_dimensions } = await getShippingQuotes(req, to);
    return NextResponse.json({
      options,
      used_fallback_dimensions,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Shipping quote failed.";
    console.error("[api/shipping/quote]", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

type CheckoutQuoteGuest = {
  product_id: string;
  quantity: number;
  price: number;
  title?: string | null;
  configuration?: unknown;
};
