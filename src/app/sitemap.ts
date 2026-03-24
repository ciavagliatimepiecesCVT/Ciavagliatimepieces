import type { MetadataRoute } from "next";
import { fullUrl } from "@/lib/seo";
import { locales } from "@/lib/i18n";
import { getWatchCategories } from "@/lib/watch-categories";

const STATIC_PATHS = [
  "",
  "shop",
  "configurator",
  "contact",
  "blog",
  "faq",
  "privacy-policy",
  "terms-of-service",
  "track-order",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = fullUrl("");
  const entries: MetadataRoute.Sitemap = [];

  let shopCategorySlugs: string[] = [];
  try {
    const categories = await getWatchCategories();
    shopCategorySlugs = categories.map((c) => c.slug);
  } catch {
    // e.g. build without Supabase env
  }

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      const pathSegment = path ? `/${path}` : "";
      entries.push({
        url: `${base}/${locale}${pathSegment}`,
        lastModified: new Date(),
        changeFrequency: path === "" || path === "shop" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "shop" || path === "configurator" ? 0.9 : 0.7,
      });
    }
    for (const slug of shopCategorySlugs) {
      entries.push({
        url: `${base}/${locale}/shop/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
