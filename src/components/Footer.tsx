import Link from "next/link";

export default function Footer({ locale }: { locale: string }) {
  const isFr = locale === "fr";

  return (
    <footer className="mt-20 border-t border-foreground/10 px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-foreground/60">Civaglia Timepieces</p>
          <p className="mt-4 text-foreground/70">
            {isFr
              ? "Design genevois, énergie milanaise, et une approche sur mesure."
              : "Geneva-inspired design, Milanese flair, and a customer-led build process."}
          </p>
        </div>
        <div className="text-sm uppercase tracking-[0.2em]">
          <p className="text-foreground/60">{isFr ? "Explorer" : "Explore"}</p>
          <div className="mt-4 flex flex-col gap-2 text-foreground/80">
            <Link href={`/${locale}/shop`}>{isFr ? "Montres" : "Watches"}</Link>
            <Link href={`/${locale}/configurator`}>{isFr ? "Configurateur" : "Configurator"}</Link>
            <Link href={`/${locale}/blog`}>{isFr ? "Journal" : "Journal"}</Link>
            <Link href={`/${locale}/faq`}>FAQ</Link>
          </div>
        </div>
        <div className="text-sm uppercase tracking-[0.2em]">
          <p className="text-foreground/60">{isFr ? "Contact" : "Contact"}</p>
          <div className="mt-4 flex flex-col gap-2 text-foreground/80">
            <span>atelier@civagliatimepieces.com</span>
            <span>+33 1 84 90 00 00</span>
            <span>{isFr ? "Paris · Milano · Genève" : "Paris · Milano · Geneva"}</span>
          </div>
        </div>
      </div>
      <p className="mt-12 text-center text-xs uppercase tracking-[0.3em] text-foreground/40">
        Crafted with intent · © 2026 Civaglia
      </p>
    </footer>
  );
}
