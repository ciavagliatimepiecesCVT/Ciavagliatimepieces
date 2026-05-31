"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCurrency } from "@/components/CurrencyContext";
import { createBrowserClient } from "@/lib/supabase/client";
import { addGuestCartItem } from "@/lib/guest-cart";
import { trackMetaProductEvent } from "@/lib/meta-pixel";

type Watch = {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number | null;
  image: string;
  stock?: number;
  hasConfiguratorPreset?: boolean;
};

function shopCardImageSrc(src: string) {
  try {
    const url = new URL(src);

    if (url.hostname.includes("supabase.co")) {
      url.pathname = url.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/"
      );
      url.searchParams.set("width", "560");
      url.searchParams.set("quality", "76");
      url.searchParams.set("resize", "cover");
      return url.toString();
    }

    if (url.hostname.includes("images.unsplash.com")) {
      url.searchParams.set("w", "560");
      url.searchParams.set("q", "76");
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", "crop");
      return url.toString();
    }
  } catch {
    // Local assets and malformed external URLs fall through unchanged.
  }

  return src;
}

export default function ShopGrid({ watches, locale }: { watches: Watch[]; locale: string }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const { currency, formatPrice } = useCurrency();
  const activeLocale = locale || pathname.split("/").filter(Boolean)[0] || "en";
  const isFr = activeLocale === "fr";

  const handleAddToCart = async (watch: Watch) => {
    if ((watch.stock ?? 1) < 1) return;
    setLoadingId(watch.id);
    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        addGuestCartItem({
          product_id: watch.id,
          quantity: 1,
          price: watch.price,
          title: watch.name,
          image_url: watch.image,
        });
        window.dispatchEvent(new CustomEvent("cart-updated"));
        window.dispatchEvent(new CustomEvent("cart-item-added"));
        trackMetaProductEvent("AddToCart", {
          id: watch.id,
          name: watch.name,
          price: watch.price,
          currency,
          quantity: 1,
        });
        return;
      }

      const { data: existing } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id)
        .eq("product_id", watch.id)
        .maybeSingle();
      const newQty = (existing?.quantity ?? 0) + 1;

      await supabase.from("cart_items").upsert({
        user_id: user.id,
        product_id: watch.id,
        quantity: newQty,
        price: watch.price,
        title: watch.name,
        image_url: watch.image,
      });
      window.dispatchEvent(new CustomEvent("cart-updated"));
      window.dispatchEvent(new CustomEvent("cart-item-added"));
      trackMetaProductEvent("AddToCart", {
        id: watch.id,
        name: watch.name,
        price: watch.price,
        currency,
        quantity: 1,
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleBuyNow = (watch: Watch) => {
    if ((watch.stock ?? 1) < 1) return;
    trackMetaProductEvent("InitiateCheckout", {
      id: watch.id,
      name: watch.name,
      price: watch.price,
      currency,
      quantity: 1,
    });
    window.location.href = `/${activeLocale}/checkout/review?type=built&productId=${encodeURIComponent(watch.id)}`;
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 md:gap-8">
      {watches.map((watch, index) => (
        <div
          key={watch.id}
          className="min-w-0 rounded-2xl border border-white/70 bg-white/80 p-3 text-foreground shadow-[0_12px_32px_rgba(15,20,23,0.08)] sm:rounded-[24px] sm:p-5 md:rounded-[28px] md:p-6 md:shadow-[0_16px_48px_rgba(15,20,23,0.08)]"
        >
          <Link
            href={`/${activeLocale}/shop/product/${watch.id}`}
            className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 sm:rounded-[18px] md:rounded-[22px]"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[var(--logo-green)]/10 sm:rounded-[18px] md:rounded-[22px]">
              {!loadedImages[watch.id] && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--logo-green)]/10" aria-hidden>
                  <span className="h-7 w-7 animate-spin rounded-full border-2 border-foreground/15 border-t-[var(--accent)]" />
                </div>
              )}
              <Image
                src={shopCardImageSrc(watch.image)}
                alt={watch.name}
                fill
                className={`object-cover transition-opacity duration-300 ${loadedImages[watch.id] ? "opacity-100" : "opacity-0"}`}
                sizes="(max-width: 767px) calc((100vw - 60px) / 2), (max-width: 1023px) calc((100vw - 96px) / 3), 341px"
                priority={index < 6}
                loading={index < 6 ? undefined : "lazy"}
                decoding="async"
                onLoad={() => setLoadedImages((prev) => ({ ...prev, [watch.id]: true }))}
                onError={() => setLoadedImages((prev) => ({ ...prev, [watch.id]: true }))}
              />
            </div>
            <h3 className="mt-3 text-base leading-tight hover:underline sm:mt-5 sm:text-xl md:mt-6 md:text-2xl">{watch.name}</h3>
          </Link>
          <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-foreground/70 sm:mt-2 sm:text-sm">{watch.description}</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-1.5 sm:mt-4 sm:gap-2">
            {watch.original_price != null && watch.original_price > watch.price ? (
              <>
                <span className="rounded bg-red-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white sm:px-2 sm:text-xs">
                  {isFr ? "Réduction" : "Discount"} {Math.round((1 - watch.price / watch.original_price) * 100)}%
                </span>
                <span className="text-sm font-semibold text-foreground/70 line-through sm:text-base md:text-lg">{formatPrice(watch.original_price)}</span>
                <span className="text-sm font-semibold text-[var(--accent)] sm:text-base md:text-lg">{formatPrice(watch.price)}</span>
              </>
            ) : (
              <span className="text-sm font-semibold sm:text-base md:text-lg">{formatPrice(watch.price)}</span>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-3 md:mt-6">
            {(watch.stock ?? 1) < 1 ? (
              <span className="rounded-full border border-foreground/20 px-3 py-2 text-center text-[10px] uppercase tracking-[0.12em] text-foreground/50 sm:px-4 sm:text-xs sm:tracking-[0.2em] md:tracking-[0.3em]">
                {isFr ? "Rupture de stock" : "Out of stock"}
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleAddToCart(watch)}
                  className="btn-hover rounded-full border border-foreground/30 px-2.5 py-2 text-[10px] uppercase tracking-[0.12em] text-foreground/70 disabled:pointer-events-none disabled:opacity-60 sm:px-4 sm:text-xs sm:tracking-[0.2em] md:tracking-[0.3em]"
                  disabled={loadingId === watch.id}
                >
                  {isFr ? "Ajouter" : "Add to cart"}
                </button>
                <button
                  type="button"
                  onClick={() => handleBuyNow(watch)}
                  className="btn-hover rounded-full bg-foreground px-2.5 py-2 text-[10px] uppercase tracking-[0.12em] text-white disabled:pointer-events-none disabled:opacity-60 sm:px-4 sm:text-xs sm:tracking-[0.2em] md:tracking-[0.3em]"
                  disabled={loadingId === watch.id}
                >
                  {isFr ? "Acheter" : "Buy now"}
                </button>
                {watch.hasConfiguratorPreset ? (
                  <Link
                    href={`/${activeLocale}/configurator?product=${encodeURIComponent(watch.id)}`}
                    className="btn-hover inline-flex items-center justify-center rounded-full border border-foreground/30 px-2.5 py-2 text-center text-[10px] uppercase tracking-[0.12em] text-foreground/70 transition hover:border-foreground/45 hover:bg-foreground/[0.04] sm:px-4 sm:text-xs sm:tracking-[0.2em] md:tracking-[0.3em]"
                  >
                    {isFr ? "Personnaliser" : "Customize now"}
                  </Link>
                ) : null}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
