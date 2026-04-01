/**
 * About page content for admin editing.
 * Stored in site_settings as key "about".
 */
export type AboutSettings = {
  title: string;
  body: string;
};

export const DEFAULT_ABOUT: AboutSettings = {
  title: "About Me",
  body: "Ciavaglia Timepieces is built around hand-finished watchmaking and personal craftsmanship. This section can be edited from the admin panel.",
};
