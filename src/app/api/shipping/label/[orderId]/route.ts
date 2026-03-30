import { NextRequest, NextResponse } from "next/server";
import { getShipmentLabel } from "@/lib/shipping/flagship-service";
import { requireAdminApi } from "@/lib/shipping/require-admin-api";

/**
 * GET /api/shipping/label/[orderId]
 * Admin-only: returns the stored label URL (FlagShip regular PDF link).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { orderId } = await context.params;
  if (!orderId?.trim()) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  try {
    const { url } = await getShipmentLabel(orderId.trim());
    if (!url) {
      return NextResponse.json({ error: "No label URL on file for this order." }, { status: 404 });
    }
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[api/shipping/label]", e);
    return NextResponse.json({ error: "Could not load label." }, { status: 500 });
  }
}
