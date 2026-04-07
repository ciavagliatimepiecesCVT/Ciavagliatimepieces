import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import ReviewSection from "@/components/ReviewSection";
import type { Locale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";
  return {
    title: isFr ? "Avis clients | Ciavaglia Timepieces" : "Customer Reviews | Ciavaglia Timepieces",
    description: isFr
      ? "Découvrez ce que nos clients pensent de nos montres Ciavaglia. Laissez votre propre avis."
      : "Read what our clients think about Ciavaglia Timepieces. Share your own experience.",
  };
}

export default async function ReviewsPage({ params }: Props) {
  const { locale } = await params;
  const isFr = locale === "fr";

  const supabase = createServerClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <div>
      {/* Page header */}
      <div className="px-6 pb-4 pt-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">
            Ciavaglia Timepieces
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-white md:text-5xl">
            {isFr ? "Avis clients" : "Customer Reviews"}
          </h1>
          <p className="mt-4 max-w-xl text-white/60">
            {isFr
              ? "Les avis honnêtes de nos clients sur leurs montres Ciavaglia."
              : "Honest reviews from our clients about their Ciavaglia timepieces."}
          </p>
        </div>
      </div>

      <ReviewSection products={products ?? []} locale={locale} />
    </div>
  );
}
