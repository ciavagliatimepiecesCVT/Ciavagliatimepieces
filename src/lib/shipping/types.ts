/** ISO 3166-1 alpha-2 — only these countries receive shipping at checkout. */
export const SHIPPING_ALLOWED_COUNTRIES = [
  "US",
  "CA",
  "AD",
  "AL",
  "AM",
  "AT",
  "AX",
  "AZ",
  "BA",
  "BE",
  "BG",
  "CH",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FO",
  "FR",
  "GB",
  "GE",
  "GG",
  "GI",
  "GR",
  "HR",
  "HU",
  "IE",
  "IM",
  "IS",
  "IT",
  "JE",
  "LI",
  "LT",
  "LU",
  "LV",
  "MC",
  "MD",
  "ME",
  "MK",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "RS",
  "SE",
  "SI",
  "SK",
  "SM",
  "TR",
  "UA",
  "VA",
  "XK",
] as const;

export const SHIPPING_COUNTRY_OPTIONS: Array<{
  code: (typeof SHIPPING_ALLOWED_COUNTRIES)[number];
  name: string;
}> = [
  { code: "CA", name: "Canada" },
  { code: "US", name: "United States" },
  { code: "AD", name: "Andorra" },
  { code: "AL", name: "Albania" },
  { code: "AM", name: "Armenia" },
  { code: "AT", name: "Austria" },
  { code: "AX", name: "Aland Islands" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "CH", name: "Switzerland" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DE", name: "Germany" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "ES", name: "Spain" },
  { code: "FI", name: "Finland" },
  { code: "FO", name: "Faroe Islands" },
  { code: "FR", name: "France" },
  { code: "GB", name: "United Kingdom" },
  { code: "GE", name: "Georgia" },
  { code: "GG", name: "Guernsey" },
  { code: "GI", name: "Gibraltar" },
  { code: "GR", name: "Greece" },
  { code: "HR", name: "Croatia" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IM", name: "Isle of Man" },
  { code: "IS", name: "Iceland" },
  { code: "IT", name: "Italy" },
  { code: "JE", name: "Jersey" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "LV", name: "Latvia" },
  { code: "MC", name: "Monaco" },
  { code: "MD", name: "Moldova" },
  { code: "ME", name: "Montenegro" },
  { code: "MK", name: "North Macedonia" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "NO", name: "Norway" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "RS", name: "Serbia" },
  { code: "SE", name: "Sweden" },
  { code: "SI", name: "Slovenia" },
  { code: "SK", name: "Slovakia" },
  { code: "SM", name: "San Marino" },
  { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" },
  { code: "VA", name: "Vatican City" },
  { code: "XK", name: "Kosovo" },
];

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
