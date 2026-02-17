"use client";

import Image from "next/image";
import { useMemo } from "react";

type OptionWithLayers = {
  id: string;
  step_id: string;
  parent_option_id: string | null;
  image_url: string | null;
  preview_image_url: string | null;
  layer_image_url: string | null;
  layer_z_index: number;
};

const DEFAULT_Z_INDEX: Record<string, number> = {
  function: 0,
  size: 5,
  case: 10,
  dial: 20,
  hands: 30,
  strap: 40,
  extra: 50,
};

type WatchPreviewProps = {
  selections: Partial<Record<string, string>>;
  options: OptionWithLayers[];
  stepsForFunction: string[];
  functionId: string;
  stepIdsForFunction: string[];
  functionStepId: string | undefined;
  isExtraStepForGmtOrSub: boolean;
  extraStepImage: string | null;
  locale: string;
};

export function WatchPreview({
  selections,
  options,
  stepsForFunction,
  functionId,
  stepIdsForFunction,
  functionStepId,
  isExtraStepForGmtOrSub,
  extraStepImage,
  locale,
}: WatchPreviewProps) {
  const isFr = locale === "fr";

  const layers = useMemo(() => {
    const layerArray: { url: string; zIndex: number; key: string }[] = [];

    stepsForFunction.forEach((stepKey, idx) => {
      const selectedId = selections[stepKey];
      if (!selectedId) return;

      const stepId = stepKey === "function" ? functionStepId : stepIdsForFunction[idx - 1];
      if (!stepId) return;

      const opts = options.filter(
        (o) =>
          o.step_id === stepId &&
          (o.parent_option_id === null || o.parent_option_id === functionId)
      );
      const opt = opts.find((o) => o.id === selectedId) as OptionWithLayers | undefined;
      if (!opt) return;

      let layerUrl = opt.layer_image_url || opt.image_url || opt.preview_image_url;
      if (!layerUrl && stepKey === "extra" && isExtraStepForGmtOrSub && extraStepImage) {
        layerUrl = extraStepImage;
      }
      if (!layerUrl) return;

      const defaultZ = DEFAULT_Z_INDEX[stepKey] ?? 0;
      const zIndex = (opt.layer_z_index ?? 0) > 0 ? opt.layer_z_index : defaultZ;

      layerArray.push({
        url: layerUrl,
        zIndex,
        key: `${stepKey}-${selectedId}`,
      });
    });

    if (isExtraStepForGmtOrSub && extraStepImage && layerArray.length > 0) {
      layerArray.push({
        url: extraStepImage,
        zIndex: 55,
        key: "extra-gmt-sub",
      });
    }

    return layerArray.sort((a, b) => a.zIndex - b.zIndex);
  }, [
    selections,
    options,
    stepsForFunction,
    functionId,
    stepIdsForFunction,
    functionStepId,
    isExtraStepForGmtOrSub,
    extraStepImage,
  ]);

  if (layers.length === 0) {
    return (
      <span className="text-sm font-medium uppercase tracking-widest text-foreground/40">
        {isFr ? "Aperçu" : "Preview"}
      </span>
    );
  }

  return (
    <>
      {layers.map((layer) => (
        <Image
          key={layer.key}
          src={layer.url}
          alt=""
          fill
          className="object-contain object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
          unoptimized={layer.url.startsWith("http") && !layer.url.includes("supabase")}
          style={{ zIndex: layer.zIndex, position: "absolute" }}
        />
      ))}
    </>
  );
}
