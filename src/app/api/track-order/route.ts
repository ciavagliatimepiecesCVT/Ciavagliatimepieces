import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/** GET /api/track-order?order_number=CT-XXXXXXXX&email=... — public order status.
 * Requires the order number AND the email used at purchase so order numbers
 * alone cannot be enumerated to read other customers' order details. */
export async function GET(request: NextRequest) {
  const orderNumber = request.nextUrl.searchParams.get("order_number")?.trim();
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!orderNumber || orderNumber.length > 40) {
    return NextResponse.json({ error: "Missing order_number" }, { status: 400 });
  }
  if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Missing or invalid email" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "order_number, status, summary, total, created_at, tracking_number, tracking_carrier, tracking_url, customer_email"
    )
    .eq("order_number", orderNumber.toUpperCase())
    .maybeSingle();

  if (error) {
    console.error("[track-order]", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  // Same response for "no such order" and "email mismatch" so the endpoint
  // can't be used as an oracle for valid order numbers.
  const orderEmail = (data?.customer_email ?? "").trim().toLowerCase();
  if (!data || (orderEmail && orderEmail !== email)) {
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
