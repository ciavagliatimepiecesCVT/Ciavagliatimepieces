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

    if (disableOnMobile && window.matchMedia("(max-width: 767px)").matches) {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.classList.add("is-visible");
        observer.unobserve(node);
      },
      {
        threshold: 0.01,
        // Extend viewport downward so content below the fold (e.g. watches on mobile) reveals on load
        rootMargin: "0px 0px 30% 0px",
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [disableOnMobile]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
