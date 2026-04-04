"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import { getAdminOrderById } from "../../actions";
import type { OrderRow } from "../../actions";

function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="toast-in fixed bottom-6 right-6 z-[200] max-w-sm rounded-2xl border border-foreground/15 bg-white p-4 text-sm text-foreground shadow-lg">
      <p>{message}</p>
      <button type="button" onClick={onDismiss} className="mt-2 text-xs text-foreground/60 underline">
        Dismiss
      </button>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ locale?: string | string[]; orderId?: string | string[] }>();
  const router = useRouter();
  const locale = Array.isArray(params.locale) ? params.locale[0] : params.locale ?? "en";
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId ?? "";
  const isFr = locale === "fr";

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const row = await getAdminOrderById(orderId);
      setOrder(row);
      if (!row) setError(isFr ? "Commande introuvable." : "Order not found.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unauthorized");
    } finally {
      setLoading(false);
    }
  }, [orderId, isFr]);

  useEffect(() => {
    void load();
  }, [load]);

  const paid = String(order?.status ?? "").toLowerCase() === "paid";

  const createShipment = async () => {
    if (!order) return;
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch("/api/shipping/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast(typeof data?.error === "string" ? data.error : "Shipment failed.");
        return;
      }
      setToast(isFr ? "Expédition créée." : "Shipment created.");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const refreshTracking = async () => {
    if (!order) return;
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch(`/api/shipping/tracking/${encodeURIComponent(order.id)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast(typeof data?.error === "string" ? data.error : "Tracking failed.");
        return;
      }
      setToast(
        data?.status_desc
          ? String(data.status_desc)
          : isFr
            ? "Suivi mis à jour."
            : "Tracking updated."
      );
    } finally {
      setBusy(false);
    }
  };

  const openLabel = async () => {
    if (!order) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/shipping/label/${encodeURIComponent(order.id)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data?.url === "string" && data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        setToast(isFr ? "Aucune étiquette." : "No label URL on file.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <p className="text-white/90">{isFr ? "Chargement…" : "Loading…"}</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-12">
        <p className="text-red-600">{error ?? "—"}</p>
        <Link href={`/${locale}/account/admin/orders`} className="mt-4 inline-block text-white underline">
          {isFr ? "← Commandes" : "← Orders"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      <ScrollReveal>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/account/admin/orders`)}
              className="mb-2 text-sm text-white/80 hover:text-white"
            >
              ← {isFr ? "Commandes" : "Orders"}
            </button>
            <h1 className="text-3xl font-semibold text-white">
              {isFr ? "Commande" : "Order"} {order.order_number ?? order.id.slice(0, 8)}
            </h1>
            <p className="mt-1 text-white/80">{order.summary}</p>
            {(order.customer_email || order.customer_phone) && (
              <p className="mt-3 text-sm text-white/70">
                {order.customer_email && <span className="block">{order.customer_email}</span>}
                {order.customer_phone?.trim() && (
                  <span className="mt-1 block">{order.customer_phone.trim()}</span>
                )}
              </p>
            )}
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 text-foreground shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
          <h2 className="text-lg font-semibold">{isFr ? "Livraison FlagShip" : "FlagShip shipping"}</h2>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-foreground/60">{isFr ? "Service" : "Service"}</dt>
              <dd>{order.shipping_service ?? order.shipping_carrier ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/60">{isFr ? "Statut" : "Status"}</dt>
              <dd>{order.shipment_status ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/60">{isFr ? "Coût (estimé)" : "Shipping cost"}</dt>
              <dd>{order.shipping_cost != null ? `$${Number(order.shipping_cost).toFixed(2)}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/60">{isFr ? "N° FlagShip" : "FlagShip ID"}</dt>
              <dd className="font-mono text-xs">{order.flagship_shipment_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/60">{isFr ? "Suivi" : "Tracking"}</dt>
              <dd className="font-mono text-xs">{order.tracking_number ?? "—"}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!paid || busy || !!order.flagship_shipment_id}
              onClick={createShipment}
              className="rounded-full bg-foreground px-5 py-2 text-xs font-medium uppercase tracking-wider text-white disabled:opacity-50"
            >
              {busy ? "…" : isFr ? "Créer l’expédition" : "Create shipment"}
            </button>
            <button
              type="button"
              disabled={busy || !order.flagship_shipment_id}
              onClick={openLabel}
              className="rounded-full border border-foreground/30 px-5 py-2 text-xs font-medium uppercase tracking-wider disabled:opacity-50"
            >
              {isFr ? "Télécharger l’étiquette" : "Download label"}
            </button>
            <button
              type="button"
              disabled={busy || !order.flagship_shipment_id}
              onClick={refreshTracking}
              className="rounded-full border border-foreground/30 px-5 py-2 text-xs font-medium uppercase tracking-wider disabled:opacity-50"
            >
              {isFr ? "Actualiser le suivi" : "Refresh tracking"}
            </button>
          </div>
          {!paid && (
            <p className="mt-3 text-xs text-foreground/60">
              {isFr ? "Paiement requis avant création d’expédition." : "Payment required before creating a shipment."}
            </p>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}
