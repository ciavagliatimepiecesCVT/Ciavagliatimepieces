import Image from "next/image";
import Link from "next/link";
import Parallax from "@/components/Parallax";
import ScrollReveal from "@/components/ScrollReveal";
import { getDictionary, Locale } from "@/lib/i18n";

const showcases = [
  {
    title: "Obsidian Atelier",
    subtitle: "A matte noir case with a meteorite dial.",
    image: "/images/hero-1.svg",
  },
  {
    title: "Aria Chrono",
    subtitle: "Rose gold warmth with a sapphire heartbeat.",
    image: "/images/hero-2.svg",
  },
  {
    title: "Vento GMT",
    subtitle: "Dual-time precision wrapped in brushed steel.",
    image: "/images/hero-3.svg",
  },
];

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  const isFr = locale === "fr";

  return (
    <div className="space-y-24">
      <section className="relative overflow-hidden px-6">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">
              {isFr ? "Atelier sur mesure" : "Bespoke Atelier"}
            </p>
            <h1 className="text-4xl leading-tight md:text-6xl">{dictionary.hero.title}</h1>
            <p className="text-lg text-foreground/70">{dictionary.hero.subtitle}</p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/${locale}/configurator`}
                className="rounded-full bg-foreground px-6 py-3 text-sm uppercase tracking-[0.3em] text-white transition hover:bg-foreground/90"
              >
                {dictionary.hero.ctaPrimary}
              </Link>
              <Link
                href={`/${locale}/shop`}
                className="rounded-full border border-foreground/30 px-6 py-3 text-sm uppercase tracking-[0.3em] text-foreground/70 transition hover:border-foreground hover:text-foreground"
              >
                {dictionary.hero.ctaSecondary}
              </Link>
            </div>
          </div>
          <Parallax>
            <div className="relative rounded-[36px] border border-white/60 bg-white/70 p-6 shadow-[0_30px_120px_rgba(15,20,23,0.15)]">
              <Image
                src="/images/hero-hero.svg"
                alt="Ciavaglia showcase"
                width={520}
                height={640}
                className="h-[420px] w-full rounded-[28px] object-cover"
              />
              <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-foreground/60">
                <span>{isFr ? "Finition main" : "Hand-finished"}</span>
                <span>{isFr ? "Serie 12" : "Limited 12"}</span>
              </div>
            </div>
          </Parallax>
        </div>
      </section>

      <section className="px-6">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {showcases.map((item) => (
            <ScrollReveal key={item.title}>
              <div className="group rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={420}
                  height={460}
                  className="h-60 w-full rounded-[22px] object-cover transition duration-500 group-hover:scale-[1.02]"
                />
                <h3 className="mt-6 text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm text-foreground/70">
                  {isFr ? "Une interpretation unique signee Ciavaglia." : item.subtitle}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="px-6">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1fr]">
          <ScrollReveal>
            <div className="rounded-[32px] border border-white/60 bg-white/70 p-10">
              <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">
                {isFr ? "Le processus" : "The Process"}
              </p>
              <h2 className="mt-6 text-3xl">
                {isFr ? "Du croquis au poignet en six etapes." : "From sketch to wrist in six deliberate steps."}
              </h2>
              <p className="mt-4 text-foreground/70">
                {isFr
                  ? "Le configurateur vous guide pour creer la piece parfaite, validee ensuite par l'atelier."
                  : "Our configurator lets you sculpt the dial, case, movement, and strap with live pricing. Each build is reviewed by the Ciavaglia atelier before it ships."}
              </p>
              <div className="mt-8 grid gap-4 text-sm uppercase tracking-[0.3em] text-foreground/60">
                <span>01 · {isFr ? "Consultation" : "Consultation"}</span>
                <span>02 · {isFr ? "Configuration" : "Configuration"}</span>
                <span>03 · {isFr ? "Artisanat" : "Craftsmanship"}</span>
                <span>04 · {isFr ? "Assemblage" : "Assembly"}</span>
                <span>05 · {isFr ? "Tests" : "Testing"}</span>
                <span>06 · {isFr ? "Livraison" : "Delivery"}</span>
              </div>
            </div>
          </ScrollReveal>
          <Parallax>
            <Image
              src="/images/workshop.svg"
              alt="Ciavaglia atelier"
              width={520}
              height={640}
              className="h-[520px] w-full rounded-[32px] object-cover shadow-[0_30px_120px_rgba(15,20,23,0.16)]"
            />
          </Parallax>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 rounded-[36px] border border-white/60 bg-gradient-to-br from-[#f6efe6] via-[#f2e7d6] to-[#efe0cb] p-12 text-center shadow-[0_40px_120px_rgba(15,20,23,0.12)]">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl">
              {isFr
                ? "Dessinez une montre signature entierement votre."
                : "Design a signature timepiece that is entirely yours."}
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <p className="text-foreground/70">
              {isFr
                ? "Creez en quelques minutes. Nous fabriquons en quelques semaines."
                : "Build it in minutes. We will craft it in weeks. Your personalized watch ships with an artist dossier, warranty, and hand-numbered certificate."}
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={`/${locale}/configurator`}
                className="rounded-full bg-foreground px-8 py-3 text-xs uppercase tracking-[0.3em] text-white"
              >
                {isFr ? "Commencer" : "Start Configuring"}
              </Link>
              <Link
                href={`/${locale}/blog`}
                className="rounded-full border border-foreground/30 px-8 py-3 text-xs uppercase tracking-[0.3em] text-foreground/70"
              >
                {isFr ? "Lire le journal" : "Read the Journal"}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
