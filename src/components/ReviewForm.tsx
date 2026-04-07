"use client";

import { useState } from "react";
import { submitReview } from "@/app/[locale]/reviews/actions";

type Product = { id: string; name: string };

type Props = {
  productId?: string;
  productName?: string;
  products?: Product[];
  locale: string;
};

export default function ReviewForm({ productId, productName, products = [], locale }: Props) {
  const isFr = locale === "fr";
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(productId ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError(isFr ? "Veuillez choisir une note." : "Please select a rating.");
      return;
    }
    if (!name.trim()) {
      setError(isFr ? "Votre prénom est requis." : "Your name is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const isCustomBuild = selectedProductId === "__custom_build__";
      const watchName = isCustomBuild
        ? (isFr ? "Construction sur mesure" : "Custom Build")
        : selectedProductId
          ? (products.find((p) => p.id === selectedProductId)?.name ?? productName ?? undefined)
          : undefined;

      await submitReview({
        reviewer_name: name,
        rating,
        message: message.trim() || undefined,
        product_id: isCustomBuild ? undefined : (selectedProductId || undefined),
        watch_purchased: watchName,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : isFr ? "Une erreur est survenue." : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/5 p-8 text-center">
        <div className="mb-3 text-4xl text-[var(--logo-gold)]">★</div>
        <p className="text-lg font-medium text-white">
          {isFr ? "Merci pour votre avis !" : "Thank you for your review!"}
        </p>
        <p className="mt-2 text-sm text-white/50">
          {isFr
            ? "Votre avis sera visible après validation par notre équipe."
            : "Your review will appear once approved by our team."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Star rating picker */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          {isFr ? "Votre note" : "Your rating"}{" "}
          <span className="text-red-400">*</span>
        </p>
        <div className="mt-3 flex gap-1" role="group" aria-label={isFr ? "Choisir une note" : "Choose a rating"}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="text-3xl transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${star} ${isFr ? "étoile" : "star"}${star !== 1 ? "s" : ""}`}
              aria-pressed={rating === star}
            >
              <span
                className={
                  (hovered || rating) >= star
                    ? "text-[var(--logo-gold)]"
                    : "text-white/20"
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-white/60">
          {isFr ? "Votre prénom" : "Your name"}{" "}
          <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
          placeholder={isFr ? "Ex : Jean" : "e.g. Alex"}
          className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/25 outline-none transition focus:border-white/50 focus:bg-white/8"
        />
      </div>

      {/* Watch selector — only when no product pre-selected and product list provided */}
      {!productId && products.length > 0 && (
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-white/60">
            {isFr ? "Montre achetée (optionnel)" : "Watch purchased (optional)"}
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/20 bg-[var(--logo-green)] px-4 py-3 text-white outline-none transition focus:border-white/50"
          >
            <option value="">{isFr ? "Choisir une montre..." : "Select a watch..."}</option>
            <option value="__custom_build__">{isFr ? "Construction sur mesure" : "Custom Build"}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Badge showing pre-selected product */}
      {productId && productName && (
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">
            {isFr ? "Pour" : "For"}:
          </span>
          <span className="rounded-full border border-[var(--logo-gold)]/40 px-3 py-1 text-sm text-[var(--logo-gold)]">
            {productName}
          </span>
        </div>
      )}

      {/* Message */}
      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-white/60">
          {isFr ? "Votre message (optionnel)" : "Your message (optional)"}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder={
            isFr
              ? "Partagez votre expérience avec cette montre..."
              : "Share your experience with this watch..."
          }
          className="mt-2 w-full resize-none rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/25 outline-none transition focus:border-white/50"
        />
        <p className="mt-1 text-right text-xs text-white/25">{message.length}/1000</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-hover rounded-full bg-[var(--logo-gold)] px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-[var(--logo-green)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? isFr
            ? "Envoi en cours..."
            : "Submitting..."
          : isFr
            ? "Envoyer l'avis"
            : "Submit review"}
      </button>
    </form>
  );
}
