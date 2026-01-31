"use client";

import { ReactNode, useEffect, useRef } from "react";

export default function Parallax({ children, speed = 0.2 }: { children: ReactNode; speed?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame = 0;

    const update = () => {
      const rect = node.getBoundingClientRect();
      const offset = rect.top * speed;
      node.style.transform = `translateY(${offset}px)`;
      frame = 0;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return (
    <div ref={ref} className="parallax">
      {children}
    </div>
  );
}
