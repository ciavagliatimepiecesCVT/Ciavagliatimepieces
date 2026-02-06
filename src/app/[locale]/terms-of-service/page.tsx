import type { Metadata } from "next";
import ScrollReveal from "@/components/ScrollReveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";
  return {
    title: isFr ? "Conditions d'utilisation" : "Terms of Service",
    description: isFr
      ? "Conditions d'utilisation du site et des achats Ciavaglia Timepieces."
      : "Terms of use for the Ciavaglia Timepieces website and purchases.",
    robots: { index: true, follow: true },
  };
}

export default async function TermsOfServicePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <section className="px-6">
      <div className="mx-auto max-w-3xl space-y-10">
        <ScrollReveal>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              {isFr ? "Legal" : "Legal"}
            </p>
            <h1 className="mt-4 text-4xl text-white">
              {isFr ? "Conditions d'utilisation" : "Terms of Service"}
            </h1>
            <p className="mt-4 text-white/80">
              {isFr
                ? "En utilisant le site Ciavaglia Timepieces, vous acceptez les présentes conditions."
                : "By using the Ciavaglia Timepieces website, you agree to these terms."}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="prose prose-neutral max-w-none text-foreground/80">
            <h2 className="text-xl font-semibold text-foreground">
              {isFr ? "1. Produits et commandes" : "1. Products and orders"}
            </h2>
            <p>
              {isFr
                ? "Les montres et services proposés sont décrits sur le site. En passant commande, vous confirmez avoir lu les descriptions et accepté les prix. Nous nous réservons le droit de refuser une commande."
                : "Watches and services are described on the site. By placing an order, you confirm you have read the descriptions and accept the prices. We reserve the right to refuse an order."}
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              {isFr ? "2. Paiement et livraison" : "2. Payment and delivery"}
            </h2>
            <p>
              {isFr
                ? "Le paiement est sécurisé (Stripe). Les délais de fabrication et de livraison sont indiqués selon le type de produit. Le suivi de commande est disponible via le numéro envoyé par e-mail."
                : "Payment is secure (Stripe). Manufacturing and delivery times are indicated by product type. Order tracking is available via the number sent by email."}
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              {isFr ? "3. Propriété intellectuelle" : "3. Intellectual property"}
            </h2>
            <p>
              {isFr
                ? "Le contenu du site (textes, images, marques) est protégé. Toute reproduction non autorisée est interdite."
                : "Site content (text, images, brands) is protected. Unauthorized reproduction is prohibited."}
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              {isFr ? "4. Contact" : "4. Contact"}
            </h2>
            <p>
              {isFr
                ? "Questions sur les conditions : contact@ciavagliatimepieces.com"
                : "Questions about these terms: contact@ciavagliatimepieces.com"}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
