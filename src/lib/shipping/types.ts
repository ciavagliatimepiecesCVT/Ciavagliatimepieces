/** ISO 3166-1 alpha-2 — only these countries receive shipping at checkout. */
export const SHIPPING_ALLOWED_COUNTRIES = ["US", "CA"] as const;

/**
 * Normalized shipping option returned to the storefront (not raw FlagShip payloads).
 * raw_service_code carries what /ship/confirm needs (courier slug + service code).
 */
export type ShippingQuoteOption = {
  carrier: string;
  service_name: string;
  estimated_delivery: string | null;
  price: number;
  currency: "CAD";
  raw_service_code: string;
};

/** Persisted in Stripe metadata and replayed into orders after payment. */
export type SelectedShippingPayload = {
  carrier: string;
  service_name: string;
  /** FlagShip confirm expects lowercase courier slug, e.g. fedex */
  courier_name: string;
  courier_code: string;
  price: number;
  currency: "CAD";
  estimated_delivery: string | null;
};

export type ShippingAddressInput = {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string | null;
  is_commercial?: boolean;
};

export type CheckoutQuotePayload = {
  locale: string;
  currency: "USD" | "CAD";
  /** Cart checkout: pass items (guest) or rely on userId for server cart */
  type: "cart";
  userId?: string | null;
  guestCart?: Array<{
    product_id: string;
    quantity: number;
    price: number;
    title?: string | null;
    configuration?: unknown;
  }>;
};

export type CustomQuotePayload = {
  locale: string;
  currency: "USD" | "CAD";
  type: "custom";
  configuration: Record<string, unknown>;
};

export type BuiltQuotePayload = {
  locale: string;
  currency: "USD" | "CAD";
  type: "built";
  productId: string;
};

export type ShippingQuoteRequest = CheckoutQuotePayload | CustomQuotePayload | BuiltQuotePayload;

export type FlagShipRatesResponse = {
  content?: unknown;
  errors?: unknown;
  notices?: unknown;
};

export type FlagShipConfirmResponse = {
  content?: {
    shipment_id?: string | number;
    tracking_number?: string;
    price?: { total?: number };
    service?: {
      courier_name?: string;
      courier_code?: string;
      courier_desc?: string;
    };
    labels?: { regular?: string; thermal?: string };
  };
  errors?: unknown;
  notices?: unknown;
};
