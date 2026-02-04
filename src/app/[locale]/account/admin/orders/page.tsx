"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ScrollReveal from "@/components/ScrollReveal";
import { getAdminOrders, updateOrderStatus, deleteOrder } from "../actions";
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
  const printRef = useRef<HTMLDivElement>(null);

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

  const handlePrintLabels = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${isFr ? "Étiquettes d'expédition" : "Shipping labels"}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 16px; }
            .label { border: 1px solid #ccc; padding: 16px; margin-bottom: 24px; max-width: 4in; white-space: pre-line; font-size: 14px; line-height: 1.4; }
            .label strong { display: block; margin-bottom: 4px; }
            .meta { color: #666; font-size: 12px; margin-top: 8px; }
            @media print { body { padding: 0; } .label { break-inside: avoid; page-break-inside: avoid; } }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
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
  const ordersWithShipping = displayedOrders.filter(
    (o) => o.shipping_line1 || o.shipping_name || o.customer_email
  );

  return (
    <div className="space-y-8">
      <ScrollReveal>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{isFr ? "Commandes" : "Orders"}</h1>
            <p className="mt-1 text-foreground/70">
              {isFr
                ? "Adresses de livraison pour imprimer les étiquettes d'expédition."
                : "Shipping addresses to print shipping labels."}
            </p>
          </div>
          {ordersWithShipping.length > 0 && (
            <button
              type="button"
              onClick={handlePrintLabels}
              className="btn-hover rounded-full bg-foreground px-5 py-2.5 text-sm font-medium uppercase tracking-[0.2em] text-white transition hover:opacity-90"
            >
              {isFr ? "Imprimer les étiquettes" : "Print shipping labels"}
            </button>
          )}
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

      {/* Hidden content for print */}
      <div ref={printRef} className="hidden">
        {ordersWithShipping.map((order) => (
          <div key={order.id} className="label">
            <strong>{order.shipping_name || order.customer_email || "—"}</strong>
            {order.shipping_line1 && <span>{order.shipping_line1}</span>}
            {order.shipping_line2 && `\n${order.shipping_line2}`}
            {(order.shipping_city || order.shipping_state || order.shipping_postal_code) &&
              `\n${[order.shipping_city, order.shipping_state, order.shipping_postal_code].filter(Boolean).join(", ")}`}
            {order.shipping_country && `\n${order.shipping_country}`}
            <div className="meta">
              {order.summary} · ${Number(order.total).toLocaleString()} · {new Date(order.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

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
                  <th className="p-4 font-semibold">{isFr ? "Date" : "Date"}</th>
                  <th className="p-4 font-semibold">{isFr ? "Résumé" : "Summary"}</th>
                  <th className="p-4 font-semibold">{isFr ? "Total" : "Total"}</th>
                  <th className="p-4 font-semibold">{isFr ? "Statut" : "Status"}</th>
                  <th className="p-4 font-semibold">{isFr ? "E-mail" : "Email"}</th>
                  <th className="p-4 font-semibold">{isFr ? "Adresse de livraison" : "Shipping address"}</th>
                  <th className="p-4 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-foreground/5">
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
