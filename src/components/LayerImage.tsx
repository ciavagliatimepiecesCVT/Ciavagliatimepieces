"use client";

import { useEffect, useState } from "react";

/** Only pixels with r,g,b ALL below this are made transparent. No ramp—dark grey (watch body) is never touched. */
const PURE_BLACK_THRESHOLD = 4;

type LayerImageProps = {
  src: string;
  alt: string;
  fill: boolean;
  className?: string;
  sizes?: string;
  style?: React.CSSProperties;
  zIndex: number;
  /**
   * If true, converts pure black pixels (r,g,b all below threshold) to transparent for black-background assets.
   * No ramp: only true black is removed so dark grey watch parts stay fully opaque and not faded.
   */
  convertBlackToTransparent?: boolean;
  /**
   * Optional: max r,g,b for a pixel to be made transparent. Default 4. Only used when convertBlackToTransparent is true.
   */
  blackToTransparentThreshold?: number;
};

/**
 * Renders a layer image. By default shows the image as-is so it matches the PNG.
 * Optionally set convertBlackToTransparent for assets that use a solid black background instead of alpha.
 */
export function LayerImage({ src, alt, fill, className, sizes, style, zIndex, convertBlackToTransparent = false, blackToTransparentThreshold }: LayerImageProps) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [readySrc, setReadySrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setProcessedSrc(null);
    setReadySrc(null);

    const useAsIs = () => {
      if (!cancelled) setReadySrc(src);
    };

    if (!convertBlackToTransparent) {
      useAsIs();
      return;
    }

    const threshold = blackToTransparentThreshold ?? PURE_BLACK_THRESHOLD;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          useAsIs();
          return;
        }
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, w, h);
        const d = data.data;
        const totalPixels = w * h;

        let transparentCount = 0;
        for (let i = 3; i < d.length; i += 4) {
          if (d[i] < 255) transparentCount++;
        }
        if (transparentCount > totalPixels * 0.003) {
          useAsIs();
          return;
        }

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          if (r <= threshold && g <= threshold && b <= threshold) {
            d[i + 3] = 0;
          }
        }
        ctx.putImageData(data, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        if (!cancelled) {
          setProcessedSrc(dataUrl);
          setReadySrc(dataUrl);
        }
      } catch {
        useAsIs();
      }
    };
    img.onerror = useAsIs;
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, convertBlackToTransparent, blackToTransparentThreshold]);

  const displaySrc = readySrc ?? processedSrc;
  if (!displaySrc) return null;

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "contain",
        objectPosition: "center",
        ...style,
        zIndex,
      }}
      draggable={false}
    />
  );
}
