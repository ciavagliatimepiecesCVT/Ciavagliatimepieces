type MetaEventParameters = Record<string, string | number | boolean | string[] | undefined>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaEvent(
  eventName: string,
  parameters?: MetaEventParameters,
  options?: { eventID?: string }
) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", eventName, parameters, options);
}

export function trackMetaProductEvent(
  eventName: "AddToCart" | "InitiateCheckout" | "ViewContent",
  product: {
    id: string;
    name?: string | null;
    price?: number | null;
    currency?: string;
    quantity?: number;
  }
) {
  trackMetaEvent(eventName, {
    content_ids: [product.id],
    content_name: product.name ?? undefined,
    content_type: "product",
    value: product.price ?? undefined,
    currency: product.currency ?? "CAD",
    num_items: product.quantity ?? undefined,
  });
}

