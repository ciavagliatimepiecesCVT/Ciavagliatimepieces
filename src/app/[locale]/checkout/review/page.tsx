"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getPublicConfiguratorData } from "@/app/[locale]/account/admin/actions";
import type { PublicConfiguratorData } from "@/app/[locale]/account/admin/actions";
import { CartItemPreview } from "@/components/CartItemPreview";
import { ShippingQuoteSection } from "@/components/shipping/ShippingQuoteSection";
import { useCurrency } from "@/components/CurrencyContext";
import { createBrowserClient } from "@/lib/supabase/client";
import { getGuestCart } from "@/lib/guest-cart";
import type { SelectedShippingPayload } from "@/lib/shipping/types";
import type { CartItem } from "@/components/CartView";

/**
 * Review order before Stripe: line items, shipping (FlagShip when not free), then one CTA to pay.
 */
export default function ReviewOrderPage() {
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
  const [builtProduct, setBuiltProduct] = useState<{ name: string; price: number; image: string | null } | null>(null);
  const [configuratorData, setConfiguratorData] = useState<PublicConfiguratorData | null>(null);

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
    if (checkoutType !== "built" || !productIdParam) return;
    const supabase = createBrowserClient();
    void supabase
      .from("products")
      .select("name, price, image")
      .eq("id", productIdParam)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data && typeof data.name === "string") {
          setBuiltProduct({
            name: data.name,
            price: Number(data.price) ?? 0,
            image: typeof data.image === "string" ? data.image : null,
          });
        }
      });
  }, [checkoutType, productIdParam]);

  useEffect(() => {
    const hasCustom = items.some((i) => i.product_id.startsWith("custom-"));
    if (!hasCustom) {
      setConfiguratorData(null);
      return;
    }
    void getPublicConfiguratorData().then(setConfiguratorData);
  }, [items]);

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

  const handleContinueToPayment = async () => {
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
      <section className="relative min-h-[50vh] overflow-hidden bg-[var(--logo-green)] px-6 py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(201,162,39,0.14),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_100%,rgba(0,0,0,0.22),transparent_50%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center text-sm tracking-wide text-white/75">
          {isFr ? "Chargement…" : "Loading…"}
        </div>
      </section>
    );
  }

  if (checkoutType === "cart" && items.length === 0) {
    return (
      <section className="relative min-h-[50vh] overflow-hidden bg-[var(--logo-green)] px-6 py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(201,162,39,0.14),transparent_55%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-lg rounded-[var(--radius-xl)] border border-white/20 bg-white/[0.96] p-10 text-center text-foreground shadow-[0_24px_64px_-12px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <p className="font-display text-xl tracking-tight">{isFr ? "Votre panier est vide." : "Your cart is empty."}</p>
          <Link
            href={`/${locale}/shop`}
            className="btn-hover mt-8 inline-block rounded-full border border-foreground/15 bg-foreground px-8 py-3 text-sm font-medium tracking-wide text-white"
          >
            {isFr ? "Continuer vos achats" : "Continue shopping"}
          </Link>
        </div>
      </section>
    );
  }

  const reviewShell = "rounded-[var(--radius-xl)] border border-white/[0.22] bg-white/[0.97] text-foreground shadow-[0_32px_80px_-16px_rgba(0,0,0,0.38)] backdrop-blur-[2px]";

  return (
    <section className="relative min-h-screen overflow-hidden bg-[var(--logo-green)] px-4 py-10 sm:px-6 sm:py-14">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_110%_55%_at_50%_-15%,rgba(201,162,39,0.16),transparent_52%),radial-gradient(ellipse_90%_45%_at_100%_80%,rgba(0,0,0,0.2),transparent_55%),radial-gradient(ellipse_70%_40%_at_0%_100%,rgba(0,0,0,0.12),transparent_50%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl space-y-10">
        <header className="space-y-4 border-b border-white/15 pb-8">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[var(--logo-gold)]/95">
            {isFr ? "Étape 1 sur 2 — Vérification" : "Step 1 of 2 — Review"}
          </p>
          <div className="h-px w-12 bg-[var(--logo-gold)]/70" aria-hidden />
          <h1 className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
            {isFr ? "Réviser votre commande" : "Review your order"}
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-white/80">
            {isFr
              ? "Vérifiez les articles et la livraison ci-dessous. Le paiement sécurisé par Stripe s’ouvrira à l’étape suivante."
              : "Confirm your items and shipping below. Secure payment with Stripe happens on the next step."}
          </p>
        </header>

        {checkoutType === "cart" && (
          <ul className="space-y-5">
            {items.map((item) => {
              const isCustomBuild = item.product_id.startsWith("custom-");
              return (
                <li
                  key={item.id}
                  className={`${reviewShell} flex flex-col gap-5 p-5 sm:flex-row sm:items-stretch sm:gap-6 sm:p-6`}
                >
                  <div className="mx-auto shrink-0 sm:mx-0">
                    {isCustomBuild && configuratorData ? (
                      <div className="rounded-2xl bg-[linear-gradient(165deg,#faf6ef_0%,#ebe4d8_100%)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-black/[0.06]">
                        <CartItemPreview
                          configuration={item.configuration as { steps?: unknown[]; extras?: unknown[] } | undefined}
                          configData={configuratorData}
                          locale={locale}
                          sizePx={176}
                        />
                      </div>
                    ) : isCustomBuild ? (
                      <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-[linear-gradient(165deg,#faf6ef_0%,#ebe4d8_100%)] ring-1 ring-black/[0.06]">
                        <span className="text-xs text-foreground/45">…</span>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-[linear-gradient(165deg,#faf6ef_0%,#ebe4d8_100%)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-black/[0.06]">
                        <div className="relative h-40 w-40 overflow-hidden rounded-xl bg-foreground/[0.04] sm:h-36 sm:w-36">
                          <Image
                            src={
                              item.image_url?.startsWith("http")
                                ? item.image_url
                                : "/images/hero-1.svg"
                            }
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized={
                              item.image_url?.startsWith("http") &&
                              !item.image_url?.includes("supabase")
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 border-t border-foreground/[0.08] pt-4 text-center sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6 sm:text-left">
                    <p className="font-display text-lg font-medium tracking-tight text-foreground">{item.title}</p>
                    {isCustomBuild && (
                      <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.2em] text-foreground/45">
                        {isFr ? "Aperçu de votre configuration" : "Your build preview"}
                      </p>
                    )}
                    <p className="mt-3 text-sm tabular-nums text-foreground/65">
                      ×{item.quantity} · {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {checkoutType === "built" && (
          <div className={`${reviewShell} overflow-hidden`}>
            <div className="grid gap-0 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-stretch">
              <div className="relative min-h-[min(52vw,320px)] bg-[linear-gradient(180deg,#f3ede3_0%,#e5ddd0_45%,#dcd3c4_100%)] md:min-h-[360px]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_40%,rgba(255,255,255,0.35),transparent_65%)]" aria-hidden />
                <div className="relative flex h-full min-h-[280px] items-center justify-center p-6 sm:p-8 md:min-h-[360px]">
                  <div className="relative aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-2xl shadow-[0_24px_48px_-12px_rgba(15,20,23,0.35)] ring-1 ring-black/[0.08]">
                    <Image
                      src={
                        builtProduct?.image &&
                        (builtProduct.image.startsWith("/") || builtProduct.image.startsWith("http"))
                          ? builtProduct.image
                          : "/images/hero-1.svg"
                      }
                      alt={builtProduct?.name ?? ""}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 90vw, 320px"
                      unoptimized={
                        !!builtProduct?.image &&
                        builtProduct.image.startsWith("http") &&
                        !builtProduct.image.includes("supabase")
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-4 border-t border-foreground/[0.08] p-6 sm:p-8 md:border-t-0 md:border-l md:border-foreground/[0.08]">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/45">
                    {isFr ? "Achat direct" : "Direct purchase"}
                  </p>
                  <p className="mt-3 font-display text-2xl font-medium tracking-tight text-foreground sm:text-[1.65rem]">
                    {builtProduct?.name ?? productIdParam}
                  </p>
                </div>
                {builtProduct != null && (
                  <p className="text-xl tabular-nums tracking-tight text-foreground/90">{formatPrice(builtProduct.price)}</p>
                )}
                <p className="text-sm leading-relaxed text-foreground/55">
                  {isFr
                    ? "Vous serez redirigé vers un paiement sécurisé à l’étape suivante."
                    : "You’ll be redirected to secure payment on the next step."}
                </p>
              </div>
            </div>
          </div>
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
          <p className="rounded-2xl border border-emerald-300/60 bg-emerald-50/95 px-5 py-3.5 text-sm leading-relaxed text-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
            {isFr ? "Livraison gratuite pour cette commande." : "Free shipping applies to this order."}
          </p>
        )}

        {error && (
          <div className="rounded-2xl border border-red-300/70 bg-red-50 px-5 py-3.5 text-sm leading-relaxed text-red-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            {error}
          </div>
        )}

        <div className={`${reviewShell} flex flex-col gap-5 p-6 sm:p-8`}>
          {checkoutType === "cart" && (
            <div className="flex flex-col gap-1 border-b border-foreground/[0.08] pb-5">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-foreground/45">
                {isFr ? "Résumé" : "Summary"}
              </span>
              <p className="font-display text-xl font-medium tabular-nums tracking-tight text-foreground">
                {isFr ? "Sous-total" : "Subtotal"}{" "}
                <span className="text-foreground/80">{formatPrice(subtotal)}</span>
              </p>
            </div>
          )}
          <p className="text-sm leading-relaxed text-foreground/55">
            {isFr
              ? "Étape suivante : page de paiement Stripe (carte, etc.)."
              : "Next: Stripe’s hosted checkout to enter payment details."}
          </p>
          <button
            type="button"
            onClick={handleContinueToPayment}
            disabled={payLoading || (freeShipping === false && !shippingSelection)}
            className="btn-hover rounded-full border border-[var(--logo-gold)]/35 bg-foreground px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)] disabled:pointer-events-none disabled:opacity-45"
          >
            {payLoading
              ? "…"
              : isFr
                ? "Continuer vers le paiement sécurisé"
                : "Continue to secure payment"}
          </button>
          <div className="pt-1 text-sm text-foreground/50">
            {checkoutType === "cart" ? (
              <Link href={`/${locale}/cart`} className="underline decoration-foreground/25 underline-offset-4 transition hover:text-foreground hover:decoration-foreground/50">
                {isFr ? "← Retour au panier" : "← Back to cart"}
              </Link>
            ) : (
              <Link href={`/${locale}/shop`} className="underline decoration-foreground/25 underline-offset-4 transition hover:text-foreground hover:decoration-foreground/50">
                {isFr ? "← Retour à la boutique" : "← Back to shop"}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
