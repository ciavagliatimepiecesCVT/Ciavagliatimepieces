import Link from "next/link";

export default function Footer({ locale }: { locale: string }) {
  const isFr = locale === "fr";

  return (
    <footer className="mt-20 border-t border-foreground/10 px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-foreground/60">Ciavaglia Timepieces</p>
          <p className="mt-4 text-foreground/70">
            {isFr
              ? "Montres sur mesure, concues a Montreal."
              : "Custom timepieces, crafted in Montreal."}
          </p>
        </div>
        <div className="text-sm uppercase tracking-[0.2em]">
          <p className="font-semibold text-foreground/80">{isFr ? "Explorer" : "Explore"}</p>
          <div className="mt-4 flex flex-col gap-2 text-foreground/80">
            <Link href={`/${locale}/shop`} className="hover:text-foreground">{isFr ? "Montres" : "Watches"}</Link>
            <Link href={`/${locale}/configurator`} className="hover:text-foreground">{isFr ? "Configurateur" : "Configurator"}</Link>
            <Link href={`/${locale}/contact`} className="hover:text-foreground">{isFr ? "Contact" : "Contact"}</Link>
            <Link href={`/${locale}/blog`} className="hover:text-foreground">{isFr ? "Journal" : "Journal"}</Link>
          </div>
        </div>
        <div className="text-sm uppercase tracking-[0.2em]">
          <p className="font-semibold text-foreground/80">{isFr ? "Ressources" : "Resources"}</p>
          <div className="mt-4 flex flex-col gap-2 text-foreground/80">
            <Link href={`/${locale}/track-order`} className="hover:text-foreground">{isFr ? "Suivre une commande" : "Track Order"}</Link>
            <Link href={`/${locale}/faq`} className="hover:text-foreground">{isFr ? "Expédition" : "Shipping"}</Link>
            <Link href={`/${locale}/contact`} className="hover:text-foreground">{isFr ? "Contact" : "Contact"}</Link>
            <Link href={`/${locale}/privacy-policy`} className="hover:text-foreground">{isFr ? "Politique de confidentialité" : "Privacy Policy"}</Link>
            <Link href={`/${locale}/terms-of-service`} className="hover:text-foreground">{isFr ? "Conditions d'utilisation" : "Terms of Service"}</Link>
          </div>
        </div>
        <div className="text-sm uppercase tracking-[0.2em]">
          <p className="font-semibold text-foreground/80">{isFr ? "Contact" : "Contact"}</p>
          <div className="mt-4 flex flex-col gap-2 text-foreground/80">
            <a href="mailto:ciavagliatimepieces@gmail.com" className="hover:text-foreground">ciavagliatimepieces@gmail.com</a>
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
