"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ShippingQuoteSection } from "@/components/shipping/ShippingQuoteSection";
import { useCurrency } from "@/components/CurrencyContext";
import { createBrowserClient } from "@/lib/supabase/client";
import { getGuestCart } from "@/lib/guest-cart";
import type { SelectedShippingPayload } from "@/lib/shipping/types";
import type { CartItem } from "@/components/CartView";

/**
 * Pre-Stripe checkout: shipping quotes (FlagShip) then payment via Stripe Checkout.
 */
export default function CheckoutPage() {
  const params = useParams<{ locale?: string | string[] }>();
  const searchParams = useSearchParams();
  const locale = Array.isArray(params.locale) ? params.locale[0] : params.locale ?? "en";
  const isFr = locale === "fr";
  const { currency, formatPrice } = useCurrency();

  const typeParam = searchParams.get("type") ?? "cart";
  const productIdParam = searchParams.get("productId") ?? "";

  const [items, setItems] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [freeShipping, setFreeShipping] = useState<boolean | null>(null);
  const [shippingSelection, setShippingSelection] = useState<SelectedShippingPayload | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkoutType = typeParam === "built" && productIdParam ? "built" : "cart";

  const loadCart = useCallback(async () => {
    setLoadingCart(true);
    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      if (!user) {
        const guestItems = getGuestCart().map((g) => ({
          id: g.id,
          product_id: g.product_id,
          quantity: g.quantity,
          price: g.price,
          title: g.title,
          image_url: g.image_url,
          configuration: g.configuration,
        }));
        setItems(guestItems);
      } else {
        const { data } = await supabase
          .from("cart_items")
          .select("id, product_id, quantity, price, title, image_url, configuration")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        setItems(
          (data ?? []).map((r) => ({
            ...r,
            price: Number(r.price),
            quantity: Number(r.quantity),
            configuration: (r as { configuration?: unknown }).configuration,
          }))
        );
      }
    } finally {
      setLoadingCart(false);
    }
  }, []);

  useEffect(() => {
    if (checkoutType === "cart") {
      void loadCart();
    } else {
      setLoadingCart(false);
    }
  }, [checkoutType, loadCart]);

  useEffect(() => {
    if (checkoutType === "cart" && !loadingCart && items.length === 0) {
      setFreeShipping(true);
    }
  }, [checkoutType, loadingCart, items.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (checkoutType === "built" && productIdParam) {
        const res = await fetch("/api/checkout/shipping-eligibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "built", productId: productIdParam }),
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setFreeShipping(!!data?.freeShippingApplicable);
        return;
      }
      if (checkoutType !== "cart") return;
      if (userId === null && items.length === 0) return;
      const guestCart =
        !userId && items.length > 0
          ? items.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
              price: i.price,
              title: i.title,
              configuration: i.configuration,
            }))
          : undefined;
      const res = await fetch("/api/checkout/shipping-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cart",
          userId: userId ?? null,
          guestCart,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!cancelled) setFreeShipping(!!data?.freeShippingApplicable);
    })();
    return () => {
      cancelled = true;
    };
  }, [checkoutType, productIdParam, items, userId]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handlePay = async () => {
    setError(null);
    setPayLoading(true);
    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (checkoutType === "cart" && items.length === 0) {
        setError(isFr ? "Votre panier est vide." : "Your cart is empty.");
        return;
      }

      if (freeShipping === false && !shippingSelection) {
        setError(
          isFr
            ? "Choisissez une option de livraison."
            : "Please choose a shipping option."
        );
        return;
      }

      const body: Record<string, unknown> = {
        locale,
        currency,
      };

      if (checkoutType === "built") {
        body.type = "built";
        body.productId = productIdParam;
        body.userId = user?.id ?? null;
        if (freeShipping === false && shippingSelection) body.shippingSelection = shippingSelection;
      } else {
        body.type = "cart";
        body.userId = user?.id ?? null;
        if (!user) {
          body.guestCart = items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            price: i.price,
            title: i.title,
            configuration: i.configuration,
          }));
        }
        if (freeShipping === false && shippingSelection) body.shippingSelection = shippingSelection;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.url) {
        window.location.href = data.url as string;
        return;
      }
      setError(typeof data?.error === "string" ? data.error : "Checkout failed.");
    } finally {
      setPayLoading(false);
    }
  };

  if (loadingCart || freeShipping === null) {
    return (
      <section className="min-h-[50vh] px-6 py-16">
        <div className="mx-auto max-w-3xl text-center text-white/80">Loading…</div>
      </section>
    );
  }

  if (checkoutType === "cart" && items.length === 0) {
    return (
      <section className="min-h-[50vh] px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/20 bg-white/90 p-10 text-center text-foreground">
          <p className="text-lg">{isFr ? "Votre panier est vide." : "Your cart is empty."}</p>
          <Link
            href={`/${locale}/shop`}
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-medium text-white"
          >
            {isFr ? "Continuer vos achats" : "Continue shopping"}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[var(--logo-green)] px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-medium text-white">
            {isFr ? "Commande" : "Checkout"}
          </h1>
          <p className="mt-1 text-sm text-white/80">
            {isFr
              ? "Livraison estimée via FlagShip, puis paiement sécurisé par Stripe."
              : "Estimated shipping via FlagShip, then secure payment with Stripe."}
          </p>
        </div>

        {checkoutType === "cart" && (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/90 p-4 text-foreground"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-foreground/5">
                  <Image
                    src={item.image_url?.startsWith("http") ? item.image_url : "/images/hero-1.svg"}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={item.image_url?.startsWith("http") && !item.image_url?.includes("supabase")}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-foreground/70">
                    ×{item.quantity} · {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {checkoutType === "built" && (
          <p className="rounded-2xl border border-white/20 bg-white/90 p-4 text-foreground">
            {isFr ? "Produit : référence " : "Product ID: "}
            <span className="font-mono">{productIdParam}</span>
          </p>
        )}

        {freeShipping === false && (
          <ShippingQuoteSection
            locale={locale}
            isFr={isFr}
            quoteRequest={
              checkoutType === "built"
                ? { type: "built", productId: productIdParam }
                : userId
                  ? { type: "cart", userId }
                  : {
                      type: "cart",
                      guestCart: items.map((i) => ({
                        product_id: i.product_id,
                        quantity: i.quantity,
                        price: i.price,
                        title: i.title,
                        configuration: i.configuration,
                      })),
                    }
            }
            selected={shippingSelection}
            onSelect={setShippingSelection}
          />
        )}

        {freeShipping === true && (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {isFr ? "Livraison gratuite pour cette commande." : "Free shipping applies to this order."}
          </p>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        <div className="flex flex-col items-end gap-4 rounded-2xl border border-white/20 bg-white/90 p-6 text-foreground">
          {checkoutType === "cart" && (
            <p className="w-full text-lg font-semibold">
              {isFr ? "Sous-total" : "Subtotal"}: {formatPrice(subtotal)}
            </p>
          )}
          <button
            type="button"
            onClick={handlePay}
            disabled={payLoading || (freeShipping === false && !shippingSelection)}
            className="rounded-full bg-foreground px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white disabled:opacity-50"
          >
            {payLoading ? "…" : isFr ? "Payer avec Stripe" : "Pay with Stripe"}
          </button>
          <Link href={`/${locale}/cart`} className="text-sm text-foreground/60 underline">
            {isFr ? "← Retour au panier" : "← Back to cart"}
          </Link>
        </div>
      </div>
    </section>
  );
}
