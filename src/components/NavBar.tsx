"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { localeLabels, locales } from "@/lib/i18n";
import { createBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type NavLabels = {
  home: string;
  shop: string;
  configurator: string;
  blog: string;
  faq: string;
  account: string;
  signIn: string;
  createAccount: string;
  logout: string;
};

const navItems = [
  { key: "home", href: "" },
  { key: "shop", href: "shop" },
  { key: "configurator", href: "configurator" },
  { key: "blog", href: "blog" },
  { key: "faq", href: "faq" },
];

export default function NavBar({ locale, labels }: { locale: string; labels: NavLabels }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeLocale = locale || pathname.split("/").filter(Boolean)[0] || "en";
  const [hidden, setHidden] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push(`/${activeLocale}`);
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href={`/${activeLocale}`}
          className="text-lg font-semibold tracking-[0.3em] uppercase text-foreground"
        >
          Civaglia
        </Link>
        <nav className="hidden items-center gap-6 text-sm uppercase tracking-[0.2em] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={`/${activeLocale}/${item.href}`}
              className="text-foreground/80 transition hover:text-foreground"
            >
              {labels[item.key as keyof NavLabels]}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
              <>
                <Link
                  href={`/${activeLocale}/account/manage`}
                  className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/80 transition hover:border-foreground hover:text-foreground"
                >
                  {labels.account}
                </Link>
                <Link
                  href={`/${activeLocale}/account/admin`}
                  className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/80 transition hover:border-foreground hover:text-foreground"
                >
                  Admin
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/80 transition hover:border-foreground hover:text-foreground"
                >
                  {labels.logout}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${activeLocale}/account/login`}
                  className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/80 transition hover:border-foreground hover:text-foreground"
                >
                  {labels.signIn}
                </Link>
                <Link
                  href={`/${activeLocale}/account/sign-up`}
                  className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/80 transition hover:border-foreground hover:text-foreground"
                >
                  {labels.createAccount}
                </Link>
              </>
            )}
          <LocaleSwitcher currentLocale={activeLocale} />
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
