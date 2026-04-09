"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getAdminReviews,
  approveReview,
  disapproveReview,
  deleteReview,
} from "@/app/[locale]/reviews/actions";
import type { Review } from "@/app/[locale]/reviews/actions";

export default function AdminReviewsPage() {
  const params = useParams<{ locale?: string | string[] }>();
  const locale = Array.isArray(params.locale) ? params.locale[0] : (params.locale ?? "en");
  const isFr = locale === "fr";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminReviews();
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (id: string) => {
    setBusy(id);
    try {
      await approveReview(id);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, approved: true } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve.");
    } finally {
      setBusy(null);
    }
  };

  const handleDisapprove = async (id: string) => {
    setBusy(id);
    try {
      await disapproveReview(id);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, approved: false } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish.");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isFr ? "Supprimer cet avis ?" : "Delete this review?")) return;
    setBusy(id);
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setBusy(null);
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.approved;
    if (filter === "approved") return r.approved;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.approved).length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {isFr ? "Avis clients" : "Customer Reviews"}
          </h1>
          {pendingCount > 0 && (
            <p className="mt-1 text-sm text-[var(--logo-gold)]">
              {pendingCount} {isFr ? "avis en attente" : "pending review"}{pendingCount > 1 && !isFr ? "s" : ""}
            </p>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] transition ${
                filter === f
                  ? "bg-white text-[var(--logo-green)]"
                  : "border border-white/30 text-white hover:border-white hover:bg-white/10"
              }`}
            >
              {f === "all"
                ? isFr ? "Tous" : "All"
                : f === "pending"
                  ? isFr ? "En attente" : "Pending"
                  : isFr ? "Approuvés" : "Approved"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/50">{isFr ? "Chargement..." : "Loading..."}</p>
      ) : filtered.length === 0 ? (
        <p className="text-white/40">
          {filter === "pending"
            ? isFr ? "Aucun avis en attente." : "No pending reviews."
            : filter === "approved"
              ? isFr ? "Aucun avis approuvé." : "No approved reviews."
              : isFr ? "Aucun avis." : "No reviews yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div
              key={review.id}
              className={`rounded-2xl border p-6 transition ${
                review.approved
                  ? "border-white/15 bg-white/5"
                  : "border-[var(--logo-gold)]/25 bg-[var(--logo-gold)]/5"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Review info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-white">{review.reviewer_name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        review.approved
                          ? "bg-green-500/20 text-green-400"
                          : "bg-[var(--logo-gold)]/20 text-[var(--logo-gold)]"
                      }`}
                    >
                      {review.approved
                        ? isFr ? "Approuvé" : "Approved"
                        : isFr ? "En attente" : "Pending"}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/50">
                    <span className="text-[var(--logo-gold)]">
                      {"★".repeat(review.rating)}
                      <span className="text-white/20">{"★".repeat(5 - review.rating)}</span>
                    </span>
                    {review.watch_purchased && (
                      <span>
                        {isFr ? "Montre" : "Watch"}: <span className="text-white/70">{review.watch_purchased}</span>
                      </span>
                    )}
                    {review.product_id && !review.watch_purchased && (
                      <span className="text-white/40">ID: {review.product_id}</span>
                    )}
                    <span>
                      {new Date(review.created_at).toLocaleDateString(
                        isFr ? "fr-FR" : "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </span>
                  </div>

                  {review.message && (
                    <p className="mt-3 text-sm leading-relaxed text-white/70">{review.message}</p>
                  )}
                  {review.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.image_url}
                      alt="Review photo"
                      className="mt-3 h-32 w-32 rounded-xl object-cover border border-white/15"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-wrap gap-2">
                  {review.approved ? (
                    <button
                      onClick={() => handleDisapprove(review.id)}
                      disabled={busy === review.id}
                      className="rounded-full border border-white/30 px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-white transition hover:border-white hover:bg-white/10 disabled:opacity-50"
                    >
                      {isFr ? "Dépublier" : "Unpublish"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={busy === review.id}
                      className="rounded-full bg-[var(--logo-gold)] px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-[var(--logo-green)] transition hover:opacity-90 disabled:opacity-50"
                    >
                      {isFr ? "Approuver" : "Approve"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={busy === review.id}
                    className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-red-400 transition hover:border-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {isFr ? "Supprimer" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
