import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sendOrderEmails } from "@/lib/email";
import { sendMetaPurchaseEvent } from "@/lib/meta-conversions";
import { createServerClient } from "@/lib/supabase/server";
import { getSiteUrl, getStripe } from "@/lib/stripe";

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor?.trim()) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || null;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let payload: string;
  try {
    payload = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read body" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret?.trim()) {
    console.error("Webhook: STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    console.log("[Webhook] checkout.session.completed received");
    try {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true, skipped: "payment not paid" });
      }

      const configurationId = session.metadata?.configuration_id;
      const summary = session.metadata?.summary ?? "Ciavaglia order";
      const userId = session.metadata?.user_id || null;
      const locale = session.metadata?.locale === "fr" ? "fr" : "en";
      const total = (session.amount_total ?? 0) / 100;
      let customerEmail: string | null =
        (session.customer_details as { email?: string | null } | undefined)?.email ||
        (session as { customer_email?: string | null }).customer_email ||
        null;
      if (!customerEmail?.trim() && typeof session.customer === "string") {
        try {
          const stripe = getStripe();
          const customer = await stripe.customers.retrieve(session.customer);
          if (customer && !("deleted" in customer)) {
            customerEmail = customer.email ?? null;
          }
        } catch (e) {
          console.warn("[Webhook] Could not fetch customer email:", e);
        }
      }
      if (customerEmail?.trim()) {
        console.log("[Webhook] Customer confirmation will be sent to:", customerEmail.trim());
      } else {
        console.warn("[Webhook] No customer email on session; only atelier notification will be sent.");
      }

      const customerPhone = session.customer_details?.phone?.trim() || null;

      const shipping = session.collected_information?.shipping_details ?? (session as { shipping_details?: { address?: { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string }; name?: string } }).shipping_details;
      const addr = shipping?.address;
      const shippingName = shipping?.name ?? session.customer_details?.name ?? null;
      const shippingLine1 = (addr as { line1?: string } | null)?.line1 ?? null;
      const shippingLine2 = (addr as { line2?: string } | null)?.line2 ?? null;
      const shippingCity = (addr as { city?: string } | null)?.city ?? null;
      const shippingState = (addr as { state?: string } | null)?.state ?? null;
      const shippingPostalCode = (addr as { postal_code?: string } | null)?.postal_code ?? null;
      const shippingCountry = (addr as { country?: string } | null)?.country ?? null;

      const supabase = createServerClient();

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (existingOrder) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      if (configurationId) {
        const { data: config } = await supabase
          .from("configurations")
          .select("type, options")
          .eq("id", configurationId)
          .single();

        const { error: updateConfigError } = await supabase
          .from("configurations")
          .update({ status: "paid" })
          .eq("id", configurationId);

        if (updateConfigError) {
          console.error("Webhook: failed to update configuration", updateConfigError);
          return NextResponse.json(
            { error: "Failed to update configuration", received: false },
            { status: 500 }
          );
        }

        if (config?.type === "built" && config.options?.product_id) {
          const productId = config.options.product_id as string;
          const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", productId)
            .single();

          const currentStock = product?.stock ?? 0;
          if (currentStock > 0) {
            await supabase
              .from("products")
              .update({
                stock: currentStock - 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", productId)
              .gt("stock", 0);
          }
        }
      }

      const orderType = session.metadata?.type;
      const cartProductQuantitiesRaw = session.metadata?.cart_product_quantities;
      if (orderType === "cart" && typeof cartProductQuantitiesRaw === "string") {
        try {
          const cartProductQuantities = JSON.parse(cartProductQuantitiesRaw) as Array<{ product_id: string; quantity: number }>;
          for (const { product_id, quantity } of cartProductQuantities) {
            const qty = Math.max(0, Number(quantity) || 1);
            if (!product_id || qty < 1) continue;
            if (product_id.startsWith("custom-")) continue;
            const { data: product } = await supabase
              .from("products")
              .select("stock")
              .eq("id", product_id)
              .single();
            const currentStock = product?.stock ?? 0;
            if (currentStock > 0) {
              await supabase
                .from("products")
                .update({
                  stock: Math.max(0, currentStock - qty),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", product_id);
            }
          }
        } catch (e) {
          console.error("Webhook: failed to parse cart_product_quantities", e);
        }
      }
      if (orderType === "cart" && userId) {
        await supabase.from("cart_items").delete().eq("user_id", userId);
      }

      let shippingCarrier: string | null = null;
      let shippingService: string | null = null;
      let shippingCost: number | null = null;
      let shipmentStatus: string | null = null;
      const fqRaw = session.metadata?.flagship_quote;
      if (typeof fqRaw === "string" && fqRaw.trim()) {
        try {
          const fq = JSON.parse(fqRaw) as { car?: string; svc?: string; p?: number };
          shippingCarrier = typeof fq.car === "string" ? fq.car : null;
          shippingService = typeof fq.svc === "string" ? fq.svc : null;
          shippingCost = typeof fq.p === "number" && Number.isFinite(fq.p) ? fq.p : null;
          shipmentStatus = "quoted";
        } catch {
          console.warn("[Webhook] Could not parse flagship_quote metadata");
        }
      }

      const { data: insertedOrder, error: insertOrderError } = await supabase
        .from("orders")
        .insert({
          configuration_id: orderType === "cart" ? null : configurationId || null,
          user_id: userId,
          total,
          status: "paid",
          summary,
          stripe_session_id: session.id,
          customer_email: customerEmail ?? null,
          customer_phone: customerPhone || null,
          shipping_name: shippingName,
          shipping_line1: shippingLine1,
          shipping_line2: shippingLine2,
          shipping_city: shippingCity,
          shipping_state: shippingState,
          shipping_postal_code: shippingPostalCode,
          shipping_country: shippingCountry,
          shipping_carrier: shippingCarrier,
          shipping_service: shippingService,
          shipping_cost: shippingCost,
          shipment_status: shipmentStatus,
        })
        .select("id")
        .single();

      if (insertOrderError || !insertedOrder?.id) {
        console.error("Webhook: failed to insert order", insertOrderError);
        return NextResponse.json(
          { error: "Failed to create order", received: false },
          { status: 500 }
        );
      }

      const orderNumber =
        "CT-" +
        insertedOrder.id.replace(/-/g, "").slice(0, 8).toUpperCase();
      await supabase
        .from("orders")
        .update({ order_number: orderNumber })
        .eq("id", insertedOrder.id);

      try {
        const siteUrl = getSiteUrl();
        await sendMetaPurchaseEvent({
          eventId: session.id,
          eventSourceUrl: `${siteUrl}/${locale}/checkout/success?session_id=${encodeURIComponent(session.id)}`,
          value: total,
          currency: session.currency?.toUpperCase() || "CAD",
          orderId: orderNumber,
          email: customerEmail,
          phone: customerPhone,
          clientIp: getClientIp(request),
          userAgent: request.headers.get("user-agent"),
        });
      } catch (metaError) {
        console.warn("[Webhook] Meta Purchase event failed (order already created):", metaError);
      }

      try {
        console.log("[Webhook] Sending order emails…");
        await sendOrderEmails({
          customerEmail: customerEmail ?? null,
          atelierEmail: process.env.ORDER_NOTIFY_EMAIL ?? "atelier@civagliatimepieces.com",
          summary,
          total,
          locale,
          orderNumber,
        });
        console.log("[Webhook] Order emails sent");
      } catch (emailError) {
        console.error("[Webhook] Order emails failed (order already created):", emailError);
        // Do not return 500; order was created successfully
      }
    } catch (error) {
      console.error("Webhook: checkout.session.completed handler error", error);
      return NextResponse.json(
        { error: "Webhook handler failed", received: false },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
