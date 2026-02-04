import { NextResponse } from "next/server";
import { sendOrderEmails } from "@/lib/email";

/**
 * Dev-only: test that order emails work without going through Stripe.
 * POST /api/test-email — sends a test "New order" to ORDER_NOTIFY_EMAIL (or info@spaxio.ca).
 * Only works when NODE_ENV === "development".
 */
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const to = process.env.ORDER_NOTIFY_EMAIL ?? "info@spaxio.ca";
  try {
    await sendOrderEmails({
      customerEmail: "test@example.com",
      atelierEmail: to,
      summary: "Test order (dev)",
      total: 99.99,
    });
    return NextResponse.json({
      ok: true,
      message: `Test emails sent. Check ${to} and test@example.com (if your SMTP allows).`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[test-email]", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
