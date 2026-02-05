import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/** GET /api/track-order?order_number=CT-XXXXXXXX — public order status by order number (no auth). */
export async function GET(request: NextRequest) {
  const orderNumber = request.nextUrl.searchParams.get("order_number")?.trim();
  if (!orderNumber) {
    return NextResponse.json({ error: "Missing order_number" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("order_number, status, summary, total, created_at, tracking_number, tracking_carrier, tracking_url")
    .eq("order_number", orderNumber.toUpperCase())
    .maybeSingle();

  if (error) {
    console.error("[track-order]", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order_number: data.order_number,
    status: data.status ?? "new",
    summary: data.summary ?? "",
    total: data.total,
    created_at: data.created_at,
    tracking_number: data.tracking_number ?? null,
    tracking_carrier: data.tracking_carrier ?? null,
    tracking_url: data.tracking_url ?? null,
  });
}
