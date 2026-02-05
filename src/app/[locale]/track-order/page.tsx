"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ScrollReveal from "@/components/ScrollReveal";

const STATUS_LABELS: Record<string, { en: string; fr: string }> = {
  paid: { en: "Confirmed", fr: "Confirmée" },
  new: { en: "New", fr: "Nouvelle" },
  shipped: { en: "Shipped", fr: "Expédiée" },
  completed: { en: "Completed", fr: "Terminée" },
};

function getStatusLabel(status: string, locale: string): string {
  const key = (status ?? "").toLowerCase();
  const labels = STATUS_LABELS[key] ?? { en: status || "—", fr: status || "—" };
  return locale === "fr" ? labels.fr : labels.en;
}

type TrackResult = {
  order_number: string;
  status: string;
  summary: string;
  total: number;
  created_at: string;
  tracking_number: string | null;
  tracking_carrier: string | null;
  tracking_url: string | null;
};

export default function TrackOrderPage() {
  const params = useParams<{ locale?: string | string[] }>();
  const searchParams = useSearchParams();
  const locale = Array.isArray(params.locale) ? params.locale[0] : params.locale ?? "en";
  const isFr = locale === "fr";
  const q = searchParams.get("order_number")?.trim() ?? "";
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  useEffect(() => {
    if (q) setOrderNumber(q);
  }, [q]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = orderNumber.trim().toUpperCase();
    if (!num) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/track-order?order_number=${encodeURIComponent(num)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isFr ? "Commande introuvable." : "Order not found."));
        return;
      }
      setResult(data as TrackResult);
    } catch {
      setError(isFr ? "Erreur de connexion." : "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-6">
      <div className="mx-auto max-w-2xl space-y-10">
        <ScrollReveal>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">
              {isFr ? "Suivi" : "Tracking"}
            </p>
            <h1 className="mt-4 text-4xl">
              {isFr ? "Suivre une commande" : "Track your order"}
            </h1>
            <p className="mt-4 text-foreground/70">
              {isFr
                ? "Entrez le numéro de commande indiqué dans votre e-mail de confirmation."
                : "Enter the order number from your confirmation email."}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="mb-1 block text-sm font-medium text-foreground/80">
                {isFr ? "Numéro de commande" : "Order number"}
              </span>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="CT-XXXXXXXX"
                className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/30"
                disabled={loading}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (isFr ? "Recherche…" : "Searching…") : (isFr ? "Rechercher" : "Track")}
            </button>
          </form>
        </ScrollReveal>

        {error && (
          <ScrollReveal>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              {error}
            </p>
          </ScrollReveal>
        )}

        {result && (
          <ScrollReveal>
            <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
              <h2 className="text-lg font-semibold text-foreground/90">
                {isFr ? "Résultat" : "Order status"}
              </h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-foreground/60">{isFr ? "Numéro" : "Order number"}</dt>
                  <dd className="font-mono font-medium">{result.order_number}</dd>
                </div>
                <div>
                  <dt className="text-foreground/60">{isFr ? "Statut" : "Status"}</dt>
                  <dd className="font-medium">{getStatusLabel(result.status, locale)}</dd>
                </div>
                {result.summary && (
                  <div>
                    <dt className="text-foreground/60">{isFr ? "Résumé" : "Summary"}</dt>
                    <dd className="text-foreground/80">{result.summary}</dd>
                  </div>
                )}
                {result.total != null && (
                  <div>
                    <dt className="text-foreground/60">{isFr ? "Total" : "Total"}</dt>
                    <dd>${Number(result.total).toLocaleString()}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-foreground/60">{isFr ? "Date" : "Date"}</dt>
                  <dd>{new Date(result.created_at).toLocaleDateString(locale)}</dd>
                </div>
                {(result.tracking_url || result.tracking_number) && (
                  <div className="mt-4 border-t border-foreground/10 pt-4">
                    <p className="mb-1 text-foreground/60">
                      {isFr ? "Suivi livraison" : "Delivery tracking"}
                    </p>
                    <div className="space-y-1">
                      {result.tracking_carrier && (
                        <span className="block text-foreground/80">
                          {result.tracking_carrier}
                          {result.tracking_number && ` · ${result.tracking_number}`}
                        </span>
                      )}
                      {result.tracking_number && !result.tracking_carrier && (
                        <span className="block font-mono text-foreground/80">{result.tracking_number}</span>
                      )}
                      {result.tracking_url && (
                        <a
                          href={result.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block rounded-full bg-foreground px-4 py-2 text-sm font-medium uppercase tracking-wide text-white transition hover:opacity-90"
                        >
                          {isFr ? "Suivre le colis" : "Track package"}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </dl>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
