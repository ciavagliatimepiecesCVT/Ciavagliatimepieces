"use client";

import { ReactNode, useEffect, useRef } from "react";

export default function ScrollReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        node.classList.toggle("is-visible", entry.isIntersecting);
      },
      {
        threshold: 0.15,
        // Extend viewport downward so content below the fold (e.g. watches on mobile) reveals on load
        rootMargin: "0px 0px 30vh 0px",
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
