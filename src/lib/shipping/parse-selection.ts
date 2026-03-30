import type { SelectedShippingPayload } from "./types";

/** Validates client-submitted shipping choice before creating a Stripe session. */
export function parseShippingSelection(raw: unknown): SelectedShippingPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const price = Number(o.price);
  if (!Number.isFinite(price) || price < 0) return null;
  const courier_name = typeof o.courier_name === "string" ? o.courier_name.trim() : "";
  const courier_code = typeof o.courier_code === "string" ? o.courier_code.trim() : "";
  const carrier = typeof o.carrier === "string" ? o.carrier.trim() : "";
  const service_name = typeof o.service_name === "string" ? o.service_name.trim() : "";
  if (!courier_name || !courier_code || !carrier || !service_name) return null;
  const cur = o.currency === "CAD" || o.currency === "cad" ? "CAD" : null;
  if (!cur) return null;
  const estimated_delivery =
    typeof o.estimated_delivery === "string" ? o.estimated_delivery : null;
  return {
    carrier,
    service_name,
    courier_name,
    courier_code,
    price: Math.round(price * 100) / 100,
    currency: "CAD",
    estimated_delivery,
  };
}
