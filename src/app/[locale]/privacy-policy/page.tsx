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
    title: isFr ? "Politique de confidentialité" : "Privacy Policy",
    description: isFr
      ? "Comment Ciavaglia Timepieces collecte, utilise et protège vos données personnelles."
      : "How Ciavaglia Timepieces collects, uses, and protects your personal data.",
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <section className="px-6">
      <div className="mx-auto max-w-3xl space-y-10">
        <ScrollReveal>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">
              {isFr ? "Legal" : "Legal"}
            </p>
            <h1 className="mt-4 text-4xl">
              {isFr ? "Politique de confidentialité" : "Privacy Policy"}
            </h1>
            <p className="mt-4 text-foreground/70">
              {isFr
                ? "Ciavaglia Timepieces (« nous », « notre ») s'engage à protéger vos données."
                : "Ciavaglia Timepieces (« we », « our ») is committed to protecting your data."}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="prose prose-neutral max-w-none text-foreground/80">
            <h2 className="text-xl font-semibold text-foreground">
              {isFr ? "1. Informations collectées" : "1. Information we collect"}
            </h2>
            <p>
              {isFr
                ? "Nous collectons les informations que vous nous fournissez lors d'une commande (nom, adresse, e-mail, téléphone) et les données de navigation nécessaires au bon fonctionnement du site."
                : "We collect information you provide when placing an order (name, address, email, phone) and browsing data necessary for the site to function."}
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              {isFr ? "2. Utilisation" : "2. Use of information"}
            </h2>
            <p>
              {isFr
                ? "Vos données sont utilisées pour traiter les commandes, vous envoyer des confirmations et des mises à jour de livraison, et répondre à vos demandes. Nous ne vendons pas vos données à des tiers."
                : "Your data is used to process orders, send confirmation and shipping updates, and respond to your requests. We do not sell your data to third parties."}
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              {isFr ? "3. Cookies et suivi" : "3. Cookies and tracking"}
            </h2>
            <p>
              {isFr
                ? "Nous utilisons des cookies essentiels pour le panier et la session. Vous pouvez gérer les préférences dans les paramètres de votre navigateur."
                : "We use essential cookies for cart and session. You can manage preferences in your browser settings."}
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              {isFr ? "4. Contact" : "4. Contact"}
            </h2>
            <p>
              {isFr
                ? "Pour toute question sur cette politique ou vos données : contact@ciavagliatimepieces.com"
                : "For questions about this policy or your data: contact@ciavagliatimepieces.com"}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
