import ShopGrid from "@/components/ShopGrid";
import ScrollReveal from "@/components/ScrollReveal";
import { builtWatches } from "@/data/watches";
import { Locale } from "@/lib/i18n";

export default async function ShopPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <section className="px-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <ScrollReveal>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">
              {isFr ? "Montres pretes" : "Built Watches"}
            </p>
            <h1 className="mt-4 text-4xl">
              {isFr ? "Des pieces pretes a expedier." : "Ready-to-ship masterpieces."}
            </h1>
            <p className="mt-4 text-foreground/70">
              {isFr
                ? "Chaque piece est assemblee dans l'atelier Civaglia et disponible en quantite limitee."
                : "Each piece is built in the Civaglia atelier and available in limited quantities. Add to cart or checkout instantly."}
            </p>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <ShopGrid watches={builtWatches} locale={locale} />
        </ScrollReveal>
      </div>
    </section>
  );
}
