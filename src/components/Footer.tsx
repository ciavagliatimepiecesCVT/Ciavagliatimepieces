import Link from "next/link";

export default function Footer({ locale }: { locale: string }) {
  const isFr = locale === "fr";

  return (
    <footer className="mt-20 border-t border-foreground/10 px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-foreground/60">Ciavaglia Timepieces</p>
          <p className="mt-4 text-foreground/70">
            {isFr
              ? "Montres sur mesure, concues a Montreal."
              : "Custom timepieces, crafted in Montreal."}
          </p>
        </div>
        <div className="text-sm uppercase tracking-[0.2em]">
          <p className="text-foreground/60">{isFr ? "Explorer" : "Explore"}</p>
          <div className="mt-4 flex flex-col gap-2 text-foreground/80">
            <Link href={`/${locale}/shop`}>{isFr ? "Montres" : "Watches"}</Link>
            <Link href={`/${locale}/configurator`}>{isFr ? "Configurateur" : "Configurator"}</Link>
            <Link href={`/${locale}/contact`}>{isFr ? "Contact" : "Contact"}</Link>
            <Link href={`/${locale}/blog`}>{isFr ? "Journal" : "Journal"}</Link>
          </div>
        </div>
        <div className="text-sm uppercase tracking-[0.2em]">
          <p className="text-foreground/60">{isFr ? "Contact" : "Contact"}</p>
          <div className="mt-4 flex flex-col gap-2 text-foreground/80">
            <span>contact@ciavagliatimepieces.com</span>
            <a href="tel:+15142432116" className="hover:text-foreground">+1 514 243 2116</a>
            <span>{isFr ? "Montréal" : "Montreal"}</span>
          </div>
        </div>
      </div>
      <p className="mt-12 text-center text-xs uppercase tracking-[0.3em] text-foreground/40">
        © {new Date().getFullYear()} Ciavaglia Timepieces · Montreal
      </p>
    </footer>
  );
}
