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
      contact: "Contact",
      blog: "Journal",
      account: "Account",
      signIn: "Sign In",
      createAccount: "Create Account",
      logout: "Logout",
    },
    contact: {
      title: "Contact",
      heading: "Get in touch.",
      subtitle: "Inquiries, bespoke requests, or simply a conversation about time. We reply within one business day.",
      name: "Name",
      email: "Email",
      message: "Message",
      send: "Send message",
      success: "Thank you. We will reply shortly.",
    },
    hero: {
      title: "Ciavaglia Timepieces",
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
      contact: "Contact",
      blog: "Journal",
      account: "Compte",
      signIn: "Connexion",
      createAccount: "Creer un compte",
      logout: "Deconnexion",
    },
    contact: {
      title: "Contact",
      heading: "Restons en contact.",
      subtitle: "Demandes, projets sur mesure ou simplement une conversation sur le temps. Nous repondons sous un jour ouvrable.",
      name: "Nom",
      email: "E-mail",
      message: "Message",
      send: "Envoyer",
      success: "Merci. Nous vous repondrons sous peu.",
    },
    hero: {
      title: "Ciavaglia Timepieces",
      subtitle: "Des montres mecaniques sur mesure pour des poignets qui s'imposent.",
      ctaPrimary: "Configurer la votre",
      ctaSecondary: "Decouvrir les pieces",
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
