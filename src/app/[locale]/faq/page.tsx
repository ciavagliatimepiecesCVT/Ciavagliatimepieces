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
    title: isFr ? "FAQ | Questions fréquentes" : "FAQ | Frequently Asked Questions",
    description: isFr
      ? "Délais de fabrication, livraison internationale, modifications après achat. Réponses aux questions courantes."
      : "Build times, international shipping, post-purchase changes. Answers to common questions.",
    openGraph: {
      title: isFr ? "FAQ | Ciavaglia Timepieces" : "FAQ | Ciavaglia Timepieces",
    },
  };
}

const faqs = [
  {
    question: "How long does a custom build take?",
    answer: "Custom builds take 4-8 weeks depending on movement complexity and hand-finishing requirements.",
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes. We ship worldwide with insured, tracked delivery and signature confirmation.",
  },
  {
    question: "Can I update my configuration after payment?",
    answer: "Minor adjustments are possible within 48 hours of purchase. Contact our support team immediately.",
  },
];

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <section className="px-6">
      <div className="mx-auto max-w-5xl space-y-10">
        <ScrollReveal>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">FAQ</p>
            <h1 className="mt-4 text-4xl text-white">
              {isFr ? "Questions detaillees." : "Questions answered in full."}
            </h1>
            <p className="mt-4 text-white/80">
              {isFr
                ? "Si vous avez besoin de plus de details, ecrivez-nous et nous repondrons rapidement."
                : "If you need more detail, email us and we will respond within one business day."}
            </p>
          </div>
        </ScrollReveal>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <ScrollReveal key={faq.question}>
              <div className="rounded-[26px] border border-white/70 bg-white/80 p-6 text-foreground shadow-[0_20px_70px_rgba(15,20,23,0.1)]">
                <h2 className="text-xl">{faq.question}</h2>
                <p className="mt-3 text-foreground/70">{faq.answer}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
