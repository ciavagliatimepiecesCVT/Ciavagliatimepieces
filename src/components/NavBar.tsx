"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { localeLabels, locales } from "@/lib/i18n";

type NavLabels = {
  home: string;
  shop: string;
  configurator: string;
  blog: string;
  faq: string;
  account: string;
};

const navItems = [
  { key: "home", href: "" },
  { key: "shop", href: "shop" },
  { key: "configurator", href: "configurator" },
  { key: "blog", href: "blog" },
  { key: "faq", href: "faq" },
];

export default function NavBar({ locale, labels }: { locale: string; labels: NavLabels }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      const currentY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setHidden(currentY > lastY && currentY > 80);
          lastY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href={`/${locale}`}
          className="text-lg font-semibold tracking-[0.3em] uppercase text-foreground"
        >
          Civaglia
        </Link>
        <nav className="hidden items-center gap-6 text-sm uppercase tracking-[0.2em] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={`/${locale}/${item.href}`}
              className="text-foreground/80 transition hover:text-foreground"
            >
              {labels[item.key as keyof NavLabels]}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/account/login`}
            className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/80 transition hover:border-foreground hover:text-foreground"
          >
            {labels.account}
          </Link>
          <LocaleSwitcher currentLocale={locale} />
        </div>
      </div>
      <div className="glass mx-6 rounded-full border border-white/50"></div>
    </header>
  );
}

function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const rest = segments.slice(1).join("/");

  return (
    <div className="flex items-center gap-2 rounded-full border border-foreground/20 bg-white/70 px-2 py-1 text-xs uppercase tracking-[0.2em]">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}/${rest}`.replace(/\/$/, "")}
          className={`px-2 py-1 transition ${currentLocale === locale ? "text-foreground" : "text-foreground/40"}`}
        >
          {localeLabels[locale].slice(0, 2)}
        </Link>
      ))}
    </div>
  );
}
