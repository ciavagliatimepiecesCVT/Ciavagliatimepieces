"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CustomBuildDetail = {
  type: "custom";
  cartItemId: string;
  lineItems: { label: string; price: number }[];
};

export default function CartToast({ locale }: { locale: string }) {
  const [visible, setVisible] = useState(false);
  const [customDetail, setCustomDetail] = useState<CustomBuildDetail | null>(null);
  const isFr = locale === "fr";

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<CustomBuildDetail | undefined>)?.detail;
      setVisible(true);
      if (detail?.type === "custom" && detail.cartItemId && Array.isArray(detail.lineItems)) {
        setCustomDetail({
          type: "custom",
          cartItemId: detail.cartItemId,
          lineItems: detail.lineItems,
        });
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setVisible(false);
          setCustomDetail(null);
        }, 8000);
      } else {
        setCustomDetail(null);
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setVisible(false), 2500);
      }
    };
    window.addEventListener("cart-item-added", handler);
    return () => {
      window.removeEventListener("cart-item-added", handler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (!visible) return null;

  const localeSegment = locale || "en";

  if (customDetail) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="toast-in fixed bottom-6 right-6 z-[100] w-[min(22rem,calc(100vw-3rem))] rounded-2xl border border-foreground/15 bg-white p-4 text-foreground shadow-lg ring-1 ring-foreground/10"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15">
            <svg
              className="h-5 w-5 text-[var(--accent)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {isFr ? "Ajouté au panier" : "Added to cart"}
            </p>
            <p className="mt-1 text-xs text-foreground/70">
              {isFr ? "Votre montre sur mesure" : "Your custom build"}
            </p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto border-t border-foreground/10 pt-2 text-xs text-foreground/80">
              {customDetail.lineItems.map((item, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="truncate">{item.label}</span>
                  <span className="shrink-0 font-medium">${item.price.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <Link
              href={`/${localeSegment}/configurator?edit=${encodeURIComponent(customDetail.cartItemId)}`}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
            >
              {isFr ? "Modifier le build" : "Edit build"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="toast-in fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-full border border-foreground/15 bg-white px-4 py-3 text-foreground shadow-lg ring-1 ring-foreground/10"
    >
      <svg
        className="h-5 w-5 shrink-0 text-accent"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-sm font-medium text-foreground">
        {isFr ? "Ajouté au panier" : "Added to cart"}
      </span>
    </div>
  );
}
