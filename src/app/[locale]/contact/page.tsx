import ScrollReveal from "@/components/ScrollReveal";
import ContactForm from "@/components/ContactForm";
import { getDictionary, type Locale } from "@/lib/i18n";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dictionary = getDictionary(locale as Locale);
  const t = dictionary.contact;

  return (
    <section className="px-6">
      <div className="mx-auto max-w-2xl space-y-10">
        <ScrollReveal>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">{t.title}</p>
            <h1 className="mt-4 text-4xl">{t.heading}</h1>
            <p className="mt-4 text-foreground/70">{t.subtitle}</p>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <ContactForm labels={t} />
        </ScrollReveal>
      </div>
    </section>
  );
}
