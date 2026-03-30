import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/checkout/shipping-eligibility
 * Read-only: whether the order qualifies for free shipping (same rules as /api/checkout).
 * Used by the checkout page to show or hide FlagShip rate selection.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type;
  const supabase = createServerClient();

  if (type === "custom") {
    const { data: freeShipRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "configurator_free_shipping")
      .single();
    const free =
      (freeShipRow as { value?: string } | null)?.value === "true" ||
      (freeShipRow as { value?: string } | null)?.value === "1";
    return NextResponse.json({ freeShippingApplicable: free });
  }

  if (type === "built") {
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }
    const { data: product } = await supabase
      .from("products")
      .select("free_shipping")
      .eq("id", productId)
      .eq("active", true)
      .maybeSingle();
    const free = !!(product as { free_shipping?: boolean } | null)?.free_shipping;
    return NextResponse.json({ freeShippingApplicable: free });
  }

  if (type === "cart") {
    const userId = typeof body.userId === "string" ? body.userId : null;
    const guestCart = Array.isArray(body.guestCart) ? body.guestCart : null;

    const isConfiguratorCustom = (r: { product_id?: string }) =>
      typeof r.product_id === "string" && r.product_id.startsWith("custom-");

    if (userId) {
      const { data: cartRows } = await supabase
        .from("cart_items")
        .select("product_id, quantity")
        .eq("user_id", userId);
      if (!cartRows?.length) {
        return NextResponse.json({ error: "Cart empty", freeShippingApplicable: false }, { status: 400 });
      }
      const builtProductIds = [...new Set(cartRows.filter((r) => !isConfiguratorCustom(r)).map((r) => r.product_id))];
      const { data: products } = await supabase
        .from("products")
        .select("id, free_shipping")
        .in("id", builtProductIds);
      const productMap = new Map((products ?? []).map((p) => [p.id, p]));
      const hasCustomItems = cartRows.some((r) => isConfiguratorCustom(r));
      const allBuiltFreeShipping = cartRows
        .filter((r) => !isConfiguratorCustom(r))
        .every((r) => (productMap.get(r.product_id) as { free_shipping?: boolean } | undefined)?.free_shipping);
      let freeShippingApplicable = false;
      if (hasCustomItems) {
        const { data: freeShipRow } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "configurator_free_shipping")
          .single();
        const configuratorFree =
          (freeShipRow as { value?: string } | null)?.value === "true" ||
          (freeShipRow as { value?: string } | null)?.value === "1";
        freeShippingApplicable = allBuiltFreeShipping && configuratorFree;
      } else {
        freeShippingApplicable = allBuiltFreeShipping;
      }
      return NextResponse.json({ freeShippingApplicable });
    }

    if (guestCart && guestCart.length > 0) {
      const builtProductIds = [
        ...new Set(
          guestCart
            .filter((r: { product_id?: string }) => !isConfiguratorCustom(r))
            .map((r: { product_id: string }) => r.product_id)
        ),
      ];
      const { data: products } = await supabase
        .from("products")
        .select("id, free_shipping")
        .in("id", builtProductIds);
      const productMap = new Map((products ?? []).map((p) => [p.id, p]));
      const hasCustomItems = guestCart.some((r: { product_id?: string }) => isConfiguratorCustom(r));
      const allBuiltFreeShipping = guestCart
        .filter((r: { product_id?: string }) => !isConfiguratorCustom(r))
        .every((r: { product_id: string }) => (productMap.get(r.product_id) as { free_shipping?: boolean } | undefined)?.free_shipping);
      let freeShippingApplicable = false;
      if (hasCustomItems) {
        const { data: freeShipRow } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "configurator_free_shipping")
          .single();
        const configuratorFree =
          (freeShipRow as { value?: string } | null)?.value === "true" ||
          (freeShipRow as { value?: string } | null)?.value === "1";
        freeShippingApplicable = allBuiltFreeShipping && configuratorFree;
      } else {
        freeShippingApplicable = allBuiltFreeShipping;
      }
      return NextResponse.json({ freeShippingApplicable });
    }

    return NextResponse.json({ error: "Cart required" }, { status: 400 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
