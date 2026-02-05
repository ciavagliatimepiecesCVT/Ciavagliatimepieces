"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ScrollReveal from "@/components/ScrollReveal";
import { getAdminOrders, updateOrderStatus, updateOrderTracking, deleteOrder } from "../actions";
import type { OrderRow, OrderStatus } from "../actions";

const ORDER_STATUSES: { value: OrderStatus; labelEn: string; labelFr: string }[] = [
  { value: "new", labelEn: "New", labelFr: "Nouvelle" },
  { value: "shipped", labelEn: "Shipped", labelFr: "Expédiée" },
  { value: "completed", labelEn: "Completed", labelFr: "Terminée" },
];

function isNewOrder(order: OrderRow): boolean {
  const s = (order.status ?? "").toLowerCase();
  return s === "paid" || s === "new" || s === "";
}

function formatAddress(order: OrderRow): string {
  const parts: string[] = [];
  if (order.shipping_name) parts.push(order.shipping_name);
  if (order.shipping_line1) parts.push(order.shipping_line1);
  if (order.shipping_line2) parts.push(order.shipping_line2);
  const cityLine = [order.shipping_city, order.shipping_state, order.shipping_postal_code].filter(Boolean).join(", ");
  if (cityLine) parts.push(cityLine);
  if (order.shipping_country) parts.push(order.shipping_country);
  return parts.join("\n") || (order.customer_email ?? "—");
}

/** Carrier tracking URL templates — {tracking} is replaced with the tracking number. */
const CARRIER_TRACKING_URLS: Record<string, string> = {
  "Canada Post": "https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor={tracking}",
  "UPS": "https://www.ups.com/track?tracknum={tracking}",
  "DHL": "https://www.dhl.com/en/express/tracking.html?AWB={tracking}",
  "FedEx": "https://www.fedex.com/fedextrack/?trknbr={tracking}",
  "Purolator": "https://www.purolator.com/en/ship-track/tracking-search.page?q={tracking}",
  "USPS": "https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking}",
};

const CARRIER_OPTIONS = [
  "",
  "Canada Post",
  "UPS",
  "DHL",
  "FedEx",
  "Purolator",
  "USPS",
  "Other",
];

function buildTrackingUrl(carrier: string, trackingNumber: string): string {
  const trimmed = trackingNumber.trim();
  if (!trimmed) return "";
  const template = CARRIER_TRACKING_URLS[carrier];
  if (!template) return "";
  return template.replace("{tracking}", encodeURIComponent(trimmed));
}

function TrackingForm({
  order,
  isFr,
  saving,
  onSave,
  onCancel,
}: {
  order: OrderRow;
  isFr: boolean;
  saving: boolean;
  onSave: (num: string, carrier: string, url: string) => void;
  onCancel: () => void;
}) {
  const [num, setNum] = useState(order.tracking_number ?? "");
  const [carrier, setCarrier] = useState(order.tracking_carrier ?? "");
  const [url, setUrl] = useState(order.tracking_url ?? "");
  const isKnownCarrier = carrier && carrier !== "Other" && CARRIER_TRACKING_URLS[carrier];
  const suggestedUrl = isKnownCarrier ? buildTrackingUrl(carrier, num) : "";
  const effectiveUrl = url.trim() || suggestedUrl;

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder={isFr ? "N° de suivi" : "Tracking number"}
        value={num}
        onChange={(e) => setNum(e.target.value)}
        className="w-full rounded border border-foreground/20 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-foreground/30"
      />
      <select
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
        className="w-full rounded border border-foreground/20 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-foreground/30"
      >
        <option value="">{isFr ? "Choisir un transporteur" : "Choose carrier"}</option>
        {CARRIER_OPTIONS.filter((c) => c).map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      {carrier === "Other" && (
        <input
          type="url"
          placeholder={isFr ? "Lien suivi (URL)" : "Tracking URL (paste link)"}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded border border-foreground/20 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-foreground/30"
        />
      )}
      {isKnownCarrier && num.trim() && (
        <p className="text-xs text-foreground/50">
          {isFr ? "Lien généré automatiquement." : "Link will be generated automatically."}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(num, carrier, effectiveUrl)}
          disabled={saving}
          className="text-xs font-medium text-foreground/80 hover:underline disabled:opacity-50"
        >
          {saving ? (isFr ? "Enregistrement…" : "Saving…") : (isFr ? "Enregistrer" : "Save")}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-foreground/60 hover:underline">
          {isFr ? "Annuler" : "Cancel"}
        </button>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const params = useParams<{ locale?: string | string[] }>();
  const locale = Array.isArray(params.locale) ? params.locale[0] : params.locale ?? "en";
  const isFr = locale === "fr";
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"new" | "shipped">("new");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [trackingSavingId, setTrackingSavingId] = useState<string | null>(null);

  const newOrders = orders.filter(isNewOrder);
  const shippedOrders = orders.filter((o) => !isNewOrder(o));

  const refresh = async () => {
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unauthorized");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAdminOrders();
        setOrders(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unauthorized");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm(isFr ? "Supprimer cette commande ?" : "Delete this order?")) return;
    setDeletingId(orderId);
    try {
      await deleteOrder(orderId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveTracking = async (
    orderId: string,
    tracking_number: string,
    tracking_carrier: string,
    tracking_url: string
  ) => {
    setTrackingSavingId(orderId);
    try {
      await updateOrderTracking(orderId, {
        tracking_number: tracking_number.trim() || null,
        tracking_carrier: tracking_carrier.trim() || null,
        tracking_url: tracking_url.trim() || null,
      });
      await refresh();
      setEditingTrackingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save tracking");
    } finally {
      setTrackingSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <p className="text-foreground/70">{isFr ? "Chargement..." : "Loading..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const displayedOrders = activeTab === "new" ? newOrders : shippedOrders;

  return (
    <div className="space-y-8">
      <ScrollReveal>
        <div>
          <h1 className="text-3xl font-semibold">{isFr ? "Commandes" : "Orders"}</h1>
          <p className="mt-1 text-foreground/70">
            {isFr
              ? "Consultez et gérez les commandes et les adresses de livraison."
              : "View and manage orders and shipping addresses."}
          </p>
        </div>
      </ScrollReveal>

      {error && <p className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {/* Tabs */}
      <ScrollReveal>
        <div className="flex gap-2 border-b border-foreground/10">
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === "new"
                ? "border-foreground text-foreground"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            {isFr ? "Nouvelles" : "New"} ({newOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shipped")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === "shipped"
                ? "border-foreground text-foreground"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            {isFr ? "Expédiées et terminées" : "Shipped & Completed"} ({shippedOrders.length})
          </button>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="overflow-x-auto rounded-[28px] border border-white/70 bg-white/80 shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
          {displayedOrders.length === 0 ? (
            <div className="p-10 text-center text-foreground/60">
              {activeTab === "new"
                ? (isFr ? "Aucune nouvelle commande." : "No new orders.")
                : (isFr ? "Aucune commande expédiée ou terminée." : "No shipped or completed orders.")}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-foreground/10">
                  <th className="p-4 font-semibold">{isFr ? "N° commande" : "Order #"}</th>
                  <th className="p-4 font-semibold">{isFr ? "Date" : "Date"}</th>
                  <th className="p-4 font-semibold">{isFr ? "Résumé" : "Summary"}</th>
                  <th className="p-4 font-semibold">{isFr ? "Total" : "Total"}</th>
                  <th className="p-4 font-semibold">{isFr ? "Statut" : "Status"}</th>
                  <th className="p-4 font-semibold">{isFr ? "E-mail" : "Email"}</th>
                  <th className="p-4 font-semibold">{isFr ? "Suivi" : "Tracking"}</th>
                  <th className="p-4 font-semibold">{isFr ? "Adresse de livraison" : "Shipping address"}</th>
                  <th className="p-4 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-foreground/5">
                    <td className="p-4 font-mono text-sm text-foreground/80">
                      {order.order_number ?? "—"}
                    </td>
                    <td className="p-4 text-foreground/80">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">{order.summary ?? "—"}</td>
                    <td className="p-4 font-medium">${Number(order.total).toLocaleString()}</td>
                    <td className="p-4">
                      <select
                        value={(order.status ?? "paid").toLowerCase() === "paid" ? "new" : (order.status ?? "new")}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        disabled={updatingId === order.id}
                        className="rounded border border-foreground/20 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30 disabled:opacity-50"
                      >
                        {ORDER_STATUSES.map(({ value, labelEn, labelFr }) => (
                          <option key={value} value={value}>
                            {isFr ? labelFr : labelEn}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">{order.customer_email ?? "—"}</td>
                    <td className="max-w-[200px] p-4">
                      {editingTrackingId === order.id ? (
                        <TrackingForm
                          order={order}
                          isFr={isFr}
                          saving={trackingSavingId === order.id}
                          onSave={(num, carrier, url) => handleSaveTracking(order.id, num, carrier, url)}
                          onCancel={() => setEditingTrackingId(null)}
                        />
                      ) : order.tracking_number || order.tracking_url ? (
                        <div className="space-y-1">
                          {order.tracking_carrier && (
                            <span className="block text-sm text-foreground/80">{order.tracking_carrier}</span>
                          )}
                          {order.tracking_number && (
                            <span className="block font-mono text-xs text-foreground/70">{order.tracking_number}</span>
                          )}
                          {order.tracking_url && (
                            <a
                              href={order.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate text-xs text-foreground/60 underline hover:text-foreground"
                            >
                              {isFr ? "Lien suivi" : "Track link"}
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingTrackingId(order.id)}
                            className="text-xs text-foreground/60 hover:underline"
                          >
                            {isFr ? "Modifier" : "Edit"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingTrackingId(order.id)}
                          className="text-sm text-foreground/60 hover:underline"
                        >
                          {isFr ? "Ajouter suivi" : "Add tracking"}
                        </button>
                      )}
                    </td>
                    <td className="max-w-xs whitespace-pre-line p-4 text-foreground/80">
                      {formatAddress(order)}
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleDelete(order.id)}
                        disabled={deletingId === order.id}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingId === order.id ? (isFr ? "Suppression…" : "Deleting…") : (isFr ? "Supprimer" : "Delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}
