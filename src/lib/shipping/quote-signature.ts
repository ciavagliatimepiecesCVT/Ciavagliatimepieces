import { createHmac, timingSafeEqual } from "crypto";

/** Shipping quotes are signed server-side so checkout can trust the client-echoed
 * price without re-calling FlagShip. Unsigned or tampered selections are rejected. */

const QUOTE_TTL_MS = 30 * 60 * 1000; // re-quote after 30 minutes

function getSecret(): string {
  const secret =
    process.env.SHIPPING_QUOTE_SIGNING_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("No server secret available to sign shipping quotes.");
  return secret;
}

type SignableSelection = {
  carrier: string;
  service_name: string;
  courier_name: string;
  courier_code: string;
  price: number;
};

function payloadString(s: SignableSelection, exp: number): string {
  return [s.courier_name, s.courier_code, s.carrier, s.service_name, s.price.toFixed(2), String(exp)].join("|");
}

export function signShippingSelection(s: SignableSelection): { sig: string; exp: number } {
  const exp = Date.now() + QUOTE_TTL_MS;
  const sig = createHmac("sha256", getSecret()).update(payloadString(s, exp)).digest("hex");
  return { sig, exp };
}

export function verifyShippingSelectionSignature(
  s: SignableSelection,
  sig: unknown,
  exp: unknown
): boolean {
  if (typeof sig !== "string" || !/^[0-9a-f]{64}$/.test(sig)) return false;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Date.now()) return false;
  const expected = createHmac("sha256", getSecret()).update(payloadString(s, expNum)).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
  } catch {
    return false;
  }
}
