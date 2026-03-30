"use client";

import { useCallback, useState } from "react";
import { useCurrency } from "@/components/CurrencyContext";
import type { SelectedShippingPayload } from "@/lib/shipping/types";
import type { ShippingQuoteOption } from "@/lib/shipping/types";

type QuoteReq =
  | { type: "cart"; userId?: string | null; guestCart?: unknown[] }
  | { type: "custom"; configuration: Record<string, unknown> }
  | { type: "built"; productId: string };

function optionToSelected(o: ShippingQuoteOption): SelectedShippingPayload {
  const raw = JSON.parse(o.raw_service_code) as { courier_name: string; courier_code: string };
  return {
    carrier: o.carrier,
    service_name: o.service_name,
    courier_name: raw.courier_name,
    courier_code: raw.courier_code,
    price: o.price,
    currency: "CAD",
    estimated_delivery: o.estimated_delivery,
  };
}

type Addr = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
};

const emptyAddr: Addr = {
  name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "CA",
  phone: "",
};

/**
 * Collects destination address, loads FlagShip rates from the server, and lets the customer pick a service.
 */
export function ShippingQuoteSection({
  locale,
  isFr,
  quoteRequest,
  selected,
  onSelect,
}: {
  locale: string;
  quoteRequest: QuoteReq;
  isFr: boolean;
  selected: SelectedShippingPayload | null;
  onSelect: (s: SelectedShippingPayload | null) => void;
}) {
  const { currency } = useCurrency();
  const [addr, setAddr] = useState<Addr>(emptyAddr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ShippingQuoteOption[]>([]);
  const [fallbackNote, setFallbackNote] = useState(false);

  const loadQuotes = useCallback(async () => {
    setError(null);
    setLoading(true);
    setOptions([]);
    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          currency,
          to: {
            name: addr.name || "Customer",
            line1: addr.line1,
            line2: addr.line2 || undefined,
            city: addr.city,
            state: addr.state,
            postal_code: addr.postal_code,
            country: addr.country,
            phone: addr.phone || undefined,
          },
          ...quoteRequest,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not load shipping rates.");
        return;
      }
      setOptions(Array.isArray(data?.options) ? data.options : []);
      setFallbackNote(!!data?.used_fallback_dimensions);
      if (!data?.options?.length) {
        setError(isFr ? "Aucun transporteur disponible." : "No carriers available for this address.");
      }
    } catch {
      setError(isFr ? "Erreur réseau." : "Network error.");
    } finally {
      setLoading(false);
    }
  }, [addr, currency, isFr, locale, quoteRequest]);

  const pick = (o: ShippingQuoteOption) => {
    const payload = optionToSelected(o);
    onSelect(payload);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-foreground/15 bg-white/95 p-4 text-foreground shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
        {isFr ? "Livraison" : "Shipping"}
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="rounded-lg border border-foreground/20 px-3 py-2 text-sm"
          placeholder={isFr ? "Nom complet" : "Full name"}
          value={addr.name}
          onChange={(e) => setAddr((a) => ({ ...a, name: e.target.value }))}
        />
        <input
          className="rounded-lg border border-foreground/20 px-3 py-2 text-sm"
          placeholder={isFr ? "Téléphone" : "Phone"}
          value={addr.phone}
          onChange={(e) => setAddr((a) => ({ ...a, phone: e.target.value }))}
        />
        <input
          className="sm:col-span-2 rounded-lg border border-foreground/20 px-3 py-2 text-sm"
          placeholder={isFr ? "Adresse ligne 1" : "Address line 1"}
          value={addr.line1}
          onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))}
        />
        <input
          className="sm:col-span-2 rounded-lg border border-foreground/20 px-3 py-2 text-sm"
          placeholder={isFr ? "Adresse ligne 2 (optionnel)" : "Address line 2 (optional)"}
          value={addr.line2}
          onChange={(e) => setAddr((a) => ({ ...a, line2: e.target.value }))}
        />
        <input
          className="rounded-lg border border-foreground/20 px-3 py-2 text-sm"
          placeholder={isFr ? "Ville" : "City"}
          value={addr.city}
          onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))}
        />
        <input
          className="rounded-lg border border-foreground/20 px-3 py-2 text-sm"
          placeholder={isFr ? "Province / État" : "State / Province"}
          value={addr.state}
          onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))}
        />
        <input
          className="rounded-lg border border-foreground/20 px-3 py-2 text-sm"
          placeholder={isFr ? "Code postal" : "Postal code"}
          value={addr.postal_code}
          onChange={(e) => setAddr((a) => ({ ...a, postal_code: e.target.value }))}
        />
        <select
          className="rounded-lg border border-foreground/20 px-3 py-2 text-sm"
          value={addr.country}
          onChange={(e) => setAddr((a) => ({ ...a, country: e.target.value }))}
        >
          <option value="CA">Canada</option>
          <option value="US">United States</option>
        </select>
      </div>
      <button
        type="button"
        onClick={loadQuotes}
        disabled={loading || !addr.line1 || !addr.city || !addr.postal_code || addr.country.length !== 2}
        className="rounded-full bg-foreground px-5 py-2 text-xs font-medium uppercase tracking-wider text-white disabled:opacity-50"
      >
        {loading ? "…" : isFr ? "Obtenir les tarifs" : "Get shipping rates"}
      </button>
      {fallbackNote && (
        <p className="text-xs text-amber-800">
          {isFr
            ? "Dimensions par défaut utilisées pour un ou plusieurs articles (poids / boîte estimés)."
            : "Default box dimensions were used for one or more items (estimated weight/size)."}
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {options.length > 0 && (
        <ul className="space-y-2">
          {options.map((o) => {
            const sel =
              selected &&
              selected.courier_code === JSON.parse(o.raw_service_code).courier_code &&
              Math.abs(selected.price - o.price) < 0.02;
            return (
              <li key={o.raw_service_code}>
                <button
                  type="button"
                  onClick={() => pick(o)}
                  className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                    sel ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-foreground/15 hover:border-foreground/30"
                  }`}
                >
                  <span>
                    <span className="font-medium">{o.carrier}</span> — {o.service_name}
                    {o.estimated_delivery ? (
                      <span className="block text-xs text-foreground/60">{o.estimated_delivery}</span>
                    ) : null}
                  </span>
                  <span className="font-semibold">
                    {currency === "USD" ? `US$` : `C$`}
                    {o.price.toFixed(2)} {o.currency}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
