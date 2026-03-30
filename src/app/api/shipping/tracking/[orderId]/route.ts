import { NextRequest, NextResponse } from "next/server";
import { getFlagshipToken } from "@/lib/shipping/env";
import { getTrackingInfo } from "@/lib/shipping/flagship-service";
import { requireAdminApi } from "@/lib/shipping/require-admin-api";

/**
 * GET /api/shipping/tracking/[orderId]
 * Admin-only: latest tracking snapshot from FlagShip /ship/track.
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

  if (!getFlagshipToken()) {
    return NextResponse.json({ error: "FlagShip is not configured." }, { status: 503 });
  }

  try {
    const info = await getTrackingInfo(orderId.trim());
    return NextResponse.json(info);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Tracking lookup failed.";
    console.error("[api/shipping/tracking]", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
