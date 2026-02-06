import type { Metadata } from "next";
import ScrollReveal from "@/components/ScrollReveal";
import ContactForm from "@/components/ContactForm";
import { getDictionary, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";
  return {
    title: isFr ? "Contact | Nous joindre" : "Contact | Get in Touch",
    description: isFr
      ? "Contactez Ciavaglia Timepieces. Demandes sur mesure, questions ou commandes. Réponse sous un jour ouvrable."
      : "Contact Ciavaglia Timepieces. Custom inquiries, questions, or orders. We reply within one business day.",
    openGraph: {
      title: isFr ? "Contact | Ciavaglia Timepieces" : "Contact | Ciavaglia Timepieces",
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dictionary = getDictionary(locale as Locale);
  const t = dictionary.contact;

  return (
    <section className="px-6">
      <div className="mx-auto max-w-2xl space-y-10">
        <ScrollReveal>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">{t.title}</p>
            <h1 className="mt-4 text-4xl text-white">{t.heading}</h1>
            <p className="mt-4 text-white/80">{t.subtitle}</p>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <ContactForm labels={t} />
        </ScrollReveal>
      </div>
    </section>
  );
}
