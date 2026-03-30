import { createServerClient } from "@/lib/supabase/server";
import type { FlagShipPackageItem } from "./flagship-adapter";
import { FALLBACK_PACKAGE_IMPERIAL } from "./fallback-package";

export type PackageBuildResult = {
  items: FlagShipPackageItem[];
  /** True if any line used default dimensions/weight instead of product data. */
  used_fallback_dimensions: boolean;
};

type ProductRow = {
  id: string;
  weight_lb: number | null;
  length_in: number | null;
  width_in: number | null;
  height_in: number | null;
};

/**
 * Merge cart lines into a single box: total weight = sum(weight * qty),
 * each dimension = max(line dimensions). Missing product data uses FALLBACK_PACKAGE_IMPERIAL.
 */
export async function buildPackagesForCart(
  supabase: ReturnType<typeof createServerClient>,
  lines: Array<{ product_id: string; quantity: number }>
): Promise<PackageBuildResult> {
  const ids = [...new Set(lines.map((l) => l.product_id).filter((id) => !id.startsWith("custom-")))];
  let usedFallback = false;

  const customLines = lines.filter((l) => l.product_id.startsWith("custom-"));
  let totalWeight = 0;
  let maxL = 0;
  let maxW = 0;
  let maxH = 0;

  for (const cl of customLines) {
    const qty = Math.max(1, cl.quantity);
    totalWeight += FALLBACK_PACKAGE_IMPERIAL.weight * qty;
    maxL = Math.max(maxL, FALLBACK_PACKAGE_IMPERIAL.length);
    maxW = Math.max(maxW, FALLBACK_PACKAGE_IMPERIAL.width);
    maxH = Math.max(maxH, FALLBACK_PACKAGE_IMPERIAL.height);
    usedFallback = true;
  }

  if (ids.length) {
    const { data: products } = await supabase
      .from("products")
      .select("id, weight_lb, length_in, width_in, height_in")
      .in("id", ids);
    const map = new Map((products ?? []).map((p) => [p.id, p as ProductRow]));

    for (const line of lines) {
      if (line.product_id.startsWith("custom-")) continue;
      const qty = Math.max(1, line.quantity);
      const p = map.get(line.product_id);
      const w = p?.weight_lb != null ? Number(p.weight_lb) : FALLBACK_PACKAGE_IMPERIAL.weight;
      const l = p?.length_in != null ? Number(p.length_in) : FALLBACK_PACKAGE_IMPERIAL.length;
      const wi = p?.width_in != null ? Number(p.width_in) : FALLBACK_PACKAGE_IMPERIAL.width;
      const h = p?.height_in != null ? Number(p.height_in) : FALLBACK_PACKAGE_IMPERIAL.height;
      if (!p?.weight_lb || !p?.length_in || !p?.width_in || !p?.height_in) usedFallback = true;
      totalWeight += Math.ceil(w) * qty;
      maxL = Math.max(maxL, Math.ceil(l));
      maxW = Math.max(maxW, Math.ceil(wi));
      maxH = Math.max(maxH, Math.ceil(h));
    }
  }

  if (totalWeight < 1) totalWeight = 1;
  if (maxL < 1) maxL = FALLBACK_PACKAGE_IMPERIAL.length;
  if (maxW < 1) maxW = FALLBACK_PACKAGE_IMPERIAL.width;
  if (maxH < 1) maxH = FALLBACK_PACKAGE_IMPERIAL.height;

  const items: FlagShipPackageItem[] = [
    {
      length: maxL,
      width: maxW,
      height: maxH,
      weight: Math.max(1, Math.ceil(totalWeight)),
      description: "Ciavaglia order",
    },
  ];

  return { items, used_fallback_dimensions: usedFallback };
}

export async function buildPackagesForProductId(
  supabase: ReturnType<typeof createServerClient>,
  productId: string,
  quantity: number
): Promise<PackageBuildResult> {
  const { data: p } = await supabase
    .from("products")
    .select("weight_lb, length_in, width_in, height_in")
    .eq("id", productId)
    .maybeSingle();
  const row = p as ProductRow | null;
  const usedFallback = !row?.weight_lb || !row?.length_in || !row?.width_in || !row?.height_in;
  const w = row?.weight_lb != null ? Number(row.weight_lb) : FALLBACK_PACKAGE_IMPERIAL.weight;
  const l = row?.length_in != null ? Number(row.length_in) : FALLBACK_PACKAGE_IMPERIAL.length;
  const wi = row?.width_in != null ? Number(row.width_in) : FALLBACK_PACKAGE_IMPERIAL.width;
  const h = row?.height_in != null ? Number(row.height_in) : FALLBACK_PACKAGE_IMPERIAL.height;
  const qty = Math.max(1, quantity);
  const items: FlagShipPackageItem[] = [
    {
      length: Math.max(1, Math.ceil(l)),
      width: Math.max(1, Math.ceil(wi)),
      height: Math.max(1, Math.ceil(h)),
      weight: Math.max(1, Math.ceil(w * qty)),
      description: "Ciavaglia built watch",
    },
  ];
  return { items, used_fallback_dimensions: usedFallback };
}

/** Custom configurator build: no SKU; use conservative default single box. */
export function buildPackagesForCustomBuild(): PackageBuildResult {
  return {
    items: [
      {
        length: FALLBACK_PACKAGE_IMPERIAL.length,
        width: FALLBACK_PACKAGE_IMPERIAL.width,
        height: FALLBACK_PACKAGE_IMPERIAL.height,
        weight: FALLBACK_PACKAGE_IMPERIAL.weight,
        description: "Custom watch build (estimated dimensions)",
      },
    ],
    used_fallback_dimensions: true,
  };
}
