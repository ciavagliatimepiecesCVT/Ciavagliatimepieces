import { getApprovedReviews } from "@/app/[locale]/reviews/actions";
import ReviewForm from "./ReviewForm";

type Product = { id: string; name: string };

type Props = {
  productId?: string;
  productName?: string;
  products?: Product[];
  locale: string;
};

export default async function ReviewSection({
  productId,
  productName,
  products = [],
  locale,
}: Props) {
  const reviews = await getApprovedReviews(productId);
  const isFr = locale === "fr";

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="border-t border-white/10 px-6 py-16">
      <div className="mx-auto max-w-4xl">
        {/* Section header */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">
            {isFr ? "Avis clients" : "Customer reviews"}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-4">
            <h2 className="text-3xl font-semibold text-white">
              {isFr ? "Ce que disent nos clients" : "What our clients say"}
            </h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--logo-gold)]">
                  {"★".repeat(Math.round(avgRating))}
                  {"☆".repeat(5 - Math.round(avgRating))}
                </span>
                <span className="text-sm text-white/50">
                  {avgRating.toFixed(1)} &middot; {reviews.length}{" "}
                  {isFr
                    ? reviews.length > 1
                      ? "avis"
                      : "avis"
                    : reviews.length > 1
                      ? "reviews"
                      : "review"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Reviews grid */}
        {reviews.length === 0 ? (
          <p className="mb-16 text-sm text-white/35">
            {isFr
              ? "Aucun avis pour le moment. Soyez le premier !"
              : "No reviews yet. Be the first to share your experience!"}
          </p>
        ) : (
          <div className="mb-16 grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/5 p-6"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{review.reviewer_name}</p>
                    {review.watch_purchased && (
                      <p className="mt-0.5 text-xs text-white/40">
                        {isFr ? "A acheté" : "Purchased"}: {review.watch_purchased}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-sm text-[var(--logo-gold)]" aria-label={`${review.rating} stars`}>
                    {"★".repeat(review.rating)}
                    <span className="text-white/20">{"★".repeat(5 - review.rating)}</span>
                  </div>
                </div>
                {review.message && (
                  <p className="text-sm leading-relaxed text-white/70">{review.message}</p>
                )}
                <p className="mt-auto text-xs text-white/25">
                  {new Date(review.created_at).toLocaleDateString(
                    isFr ? "fr-FR" : "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="mb-10 border-t border-white/10" />

        {/* Review form */}
        <div>
          <h3 className="mb-6 text-xl font-medium text-white">
            {isFr ? "Laisser un avis" : "Leave a review"}
          </h3>
          <ReviewForm
            productId={productId}
            productName={productName}
            products={products}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}
