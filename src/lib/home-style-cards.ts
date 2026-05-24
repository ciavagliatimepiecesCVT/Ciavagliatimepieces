/**
 * Home "Select your style" – Custom Build and Shop cards (not in DB).
 * Stored in site_settings key "home_style_cards" (JSON).
 */

export type HomeStyleCard = {
  title_en: string;
  title_fr: string;
  image_url: string;
  price: number | null;
};

export type HomeStyleCards = {
  custom_build: HomeStyleCard & { description_en: string; description_fr: string };
  shop: HomeStyleCard;
};

export const DEFAULT_SHOP_IMAGE = "/images/hero-1.svg";

export const DEFAULT_HOME_STYLE_CARDS: HomeStyleCards = {
  custom_build: {
    title_en: "Custom Build",
    title_fr: "Construction sur mesure",
    description_en: "Design dial, case, movement, and strap. Live pricing. Reviewed before it ships.",
    description_fr: "Concevez cadran, boîtier, mouvement et bracelet. Prix en direct. Révisé avant expédition.",
    image_url: "",
    price: null,
  },
  shop: {
    title_en: "Watches",
    title_fr: "Montres",
    image_url: DEFAULT_SHOP_IMAGE,
    price: null,
  },
};
