import { NextRequest, NextResponse } from "next/server";
import { getFlagshipToken } from "@/lib/shipping/env";
import { createShipmentForOrder } from "@/lib/shipping/flagship-service";
import { requireAdminApi } from "@/lib/shipping/require-admin-api";

/**
 * POST /api/shipping/create-shipment
 * Admin-only: purchases label via FlagShip /ship/confirm and updates the order.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  if (!getFlagshipToken()) {
    return NextResponse.json({ error: "FlagShip is not configured." }, { status: 503 });
  }

  let body: { orderId?: string; force?: boolean };
  try {
    body = (await request.json()) as { orderId?: string; force?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const force = body.force === true;

  try {
    const result = await createShipmentForOrder(orderId, force);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Shipment creation failed.";
    const code = /already exists/i.test(msg) ? 409 : 400;
    console.error("[api/shipping/create-shipment]", e);
    return NextResponse.json({ error: msg }, { status: code });
  }
}
