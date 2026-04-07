/**
 * About page content for admin editing.
 * Stored in site_settings as key "about".
 */
export type AboutSettings = {
  title: string;
  body: string;
  /** Optional hero / inline image (URL or from admin upload). */
  image_url: string;
  /** Optional YouTube, Vimeo, or direct .mp4/.webm URL. */
  video_url: string;
  /** CSS object-position value for the hero image, e.g. "50% 30%". */
  image_position: string;
};

export const DEFAULT_ABOUT: AboutSettings = {
  title: "About Me",
  body: "Ciavaglia Timepieces is built around hand-finished watchmaking and personal craftsmanship. This section can be edited from the admin panel.",
  image_url: "",
  video_url: "",
  image_position: "50% 50%",
};
