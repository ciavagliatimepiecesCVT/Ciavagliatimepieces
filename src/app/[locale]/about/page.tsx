import type { Metadata } from "next";
import ScrollReveal from "@/components/ScrollReveal";
import { getAboutSettings } from "@/app/[locale]/account/admin/actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";
  return {
    title: isFr ? "A propos | Ciavaglia Timepieces" : "About Me | Ciavaglia Timepieces",
    description: isFr
      ? "Decouvrez l'histoire et la vision de Ciavaglia Timepieces."
      : "Discover the story and vision behind Ciavaglia Timepieces.",
  };
}

export default async function AboutPage() {
  const about = await getAboutSettings();

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        <ScrollReveal>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">About</p>
          <h1 className="mt-4 text-4xl text-white">{about.title}</h1>
        </ScrollReveal>
        <ScrollReveal>
          <div className="rounded-[26px] border border-white/70 bg-white/80 p-6 text-foreground shadow-[0_20px_70px_rgba(15,20,23,0.1)]">
            <p className="whitespace-pre-line text-foreground/80">{about.body}</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
