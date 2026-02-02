export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  fr: "Francais",
};

export const dictionaries = {
  en: {
    nav: {
      home: "Home",
      shop: "Watches",
      configurator: "Configurator",
      blog: "Journal",
      faq: "FAQ",
      account: "Account",
      signIn: "Sign In",
      createAccount: "Create Account",
      logout: "Logout",
    },
    hero: {
      title: "Civaglia Timepieces",
      subtitle: "Bespoke mechanical art for wrists that command the room.",
      ctaPrimary: "Configure yours",
      ctaSecondary: "Explore built pieces",
    },
  },
  fr: {
    nav: {
      home: "Accueil",
      shop: "Montres",
      configurator: "Configurateur",
      blog: "Journal",
      faq: "FAQ",
      account: "Compte",
      signIn: "Connexion",
      createAccount: "Creer un compte",
      logout: "Deconnexion",
    },
    hero: {
      title: "Civaglia Timepieces",
      subtitle: "Des montres mecaniques sur mesure pour des poignets qui s'imposent.",
      ctaPrimary: "Configurer la votre",
      ctaSecondary: "Decouvrir les pieces",
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
