"use client";

import { ReactNode, useEffect, useRef } from "react";

export default function ScrollReveal({
  children,
  className = "",
  disableOnMobile = false,
}: {
  children: ReactNode;
  className?: string;
  disableOnMobile?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("is-visible");
      return;
    }

    // On mobile, scroll-reveal causes content (e.g. watches below the fold) to sit
    // invisible until the reveal lags into view — it reads as "not loading". Skip the
    // animation on mobile and show everything immediately. `disableOnMobile` is kept
    // for back-compat but the mobile behavior is now unconditional.
    if (window.matchMedia("(max-width: 767px)").matches) {
      node.classList.add("is-visible");
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }

    // Desktop failsafe: reveal on-screen content even if IntersectionObserver's
    // initial callback never fires (a known Safari quirk).
    const fallback = window.setTimeout(() => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.3 && rect.bottom > 0) {
        node.classList.add("is-visible");
      }
    }, 1000);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.classList.add("is-visible");
        observer.unobserve(node);
        window.clearTimeout(fallback);
      },
      {
        threshold: 0.01,
        // Extend viewport downward so content below the fold (e.g. watches on mobile) reveals on load
        rootMargin: "0px 0px 30% 0px",
      }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [disableOnMobile]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
