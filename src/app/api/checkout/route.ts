import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSiteUrl, getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { locale, type, userId } = payload as {
      locale: string;
      type: "custom" | "built";
      userId?: string | null;
      configuration?: Record<string, string | number>;
      productId?: string;
    };

    // Validate type
    if (type !== "custom" && type !== "built") {
      return NextResponse.json({ error: "Invalid checkout type" }, { status: 400 });
    }

    const supabase = createServerClient();

  let summary = "Civaglia timepiece";
  let amount = 0;
  let configurationId: string | null = null;

  if (type === "custom" && payload.configuration) {
    summary = `Custom build · ${payload.configuration.case} / ${payload.configuration.dial} / ${payload.configuration.strap}`;
    amount = Number(payload.configuration.price ?? 0);

    const { data, error } = await supabase
      .from("configurations")
      .insert({
        type: "custom",
        options: payload.configuration,
        status: "pending",
        price: amount,
        user_id: userId ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    configurationId = data.id;
  }

  if (type === "built" && payload.productId) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price, stock")
      .eq("id", payload.productId)
      .eq("active", true)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Unknown product" }, { status: 404 });
    }

    const stock = product.stock ?? 0;
    if (stock < 1) {
      return NextResponse.json({ error: "Out of stock" }, { status: 400 });
    }

    summary = `Built watch · ${product.name}`;
    amount = Number(product.price);

    const { data, error } = await supabase
      .from("configurations")
      .insert({
        type: "built",
        options: { product_id: product.id, title: product.name },
        status: "pending",
        price: amount,
        user_id: userId ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    configurationId = data.id;
  }

  const siteUrl = getSiteUrl();
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: {
            name: summary,
          },
          unit_amount: Math.round(amount * 100),
        },
      },
    ],
    success_url: `${siteUrl}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/${locale}/checkout/cancel`,
    metadata: {
      configuration_id: configurationId ?? "",
      summary,
      locale,
      type,
      user_id: userId ?? "",
    },
    billing_address_collection: "required",
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
