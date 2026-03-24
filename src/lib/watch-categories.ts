import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export type WatchCategory = {
  id: string;
  slug: string;
  label_en: string;
  label_fr: string;
  sort_order: number;
  image_url: string | null;
  display_price: number | null;
};

async function getWatchCategoriesUncached(): Promise<WatchCategory[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("watch_categories")
      .select("id, slug, label_en, label_fr, sort_order, image_url, display_price")
      .order("sort_order", { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

/** Server-only: fetch watch categories for nav and shop. Cached 60s to speed up layout. */
export const getWatchCategories = unstable_cache(
  getWatchCategoriesUncached,
  ["watch-categories"],
  { revalidate: 60, tags: ["watch-categories"] }
);
