"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import { createBrowserClient } from "@/lib/supabase/client";

type Watch = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock?: number;
};

export default function ShopGrid({ watches, locale }: { watches: Watch[]; locale: string }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const pathname = usePathname();
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
        window.location.href = `/${activeLocale}/account/login`;
        return;
      }

      await supabase.from("cart_items").upsert({
        user_id: user.id,
        product_id: watch.id,
        quantity: 1,
        price: watch.price,
        title: watch.name,
        image_url: watch.image,
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleBuyNow = async (watch: Watch) => {
    if ((watch.stock ?? 1) < 1) return;
    setLoadingId(watch.id);
    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: activeLocale,
          type: "built",
          productId: watch.id,
          userId: user?.id ?? null,
        }),
      });

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {watches.map((watch) => (
        <ScrollReveal key={watch.id}>
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
            <Image
              src={watch.image}
              alt={watch.name}
              width={420}
              height={420}
              className="h-60 w-full rounded-[22px] object-cover"
            />
            <h3 className="mt-6 text-2xl">{watch.name}</h3>
            <p className="mt-2 text-sm text-foreground/70">{watch.description}</p>
            <p className="mt-4 text-lg font-semibold">${watch.price.toLocaleString()}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {(watch.stock ?? 1) < 1 ? (
                <span className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-foreground/50">
                  {isFr ? "Rupture de stock" : "Out of stock"}
                </span>
              ) : (
                <>
                  <button
                    onClick={() => handleAddToCart(watch)}
                    className="rounded-full border border-foreground/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-foreground/70"
                    disabled={loadingId === watch.id}
                  >
                    {isFr ? "Ajouter" : "Add to cart"}
                  </button>
                  <button
                    onClick={() => handleBuyNow(watch)}
                    className="rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
                    disabled={loadingId === watch.id}
                  >
                    {isFr ? "Acheter" : "Buy now"}
                  </button>
                </>
              )}
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
