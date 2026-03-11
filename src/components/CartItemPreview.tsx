"use client";

import { useMemo } from "react";
import { WatchPreview } from "@/components/WatchPreview";
import type { PublicConfiguratorData } from "@/app/[locale]/account/admin/actions";
import { CONFIGURATOR_PREVIEW_SIZE_PX } from "@/lib/configurator-constants";

const PREVIEW_SIZE = 80;
/** Scale factor so layer offsets (stored for full-size 420px preview) map correctly to thumbnail. */
const OFFSET_SCALE = PREVIEW_SIZE / CONFIGURATOR_PREVIEW_SIZE_PX;

type Configuration = {
  steps?: unknown[];
  extras?: unknown[];
};

export function CartItemPreview({
  configuration,
  configData,
  locale,
}: {
  configuration: Configuration | undefined;
  configData: PublicConfiguratorData | null;
  locale: string;
}) {
  const { selections, stepsForFunction, stepIdsForFunction, functionStepId, layerOffsets, layerScales, functionId, isExtraStepForGmtOrSub } = useMemo(() => {
    if (!configData || !configuration || !Array.isArray(configuration.steps) || configuration.steps.length === 0) {
      return {
        selections: {} as Partial<Record<string, string>>,
        stepsForFunction: [] as string[],
        stepIdsForFunction: [] as string[],
        functionStepId: undefined as string | undefined,
        layerOffsets: undefined as Record<string, { x: number; y: number }> | undefined,
        layerScales: undefined as Record<string, number> | undefined,
        functionId: "",
        isExtraStepForGmtOrSub: false,
      };
    }
    const steps = configuration.steps as string[];
    const functionId = steps[0] ?? "";
    const stepsMeta = configData.stepsMeta ?? [];
    const functionStepsMap = configData.functionStepsMap ?? {};
    const stepIdToMeta = new Map(stepsMeta.map((s) => [s.id, s]));
    const stepIdsForFunction = functionStepsMap[functionId] ?? [];
    const stepsForFunction = ["function", ...stepIdsForFunction.map((sid) => stepIdToMeta.get(sid)?.step_key ?? "").filter(Boolean)] as string[];
    const functionStep = stepsMeta.find((s) => s.step_key === "function");
    const functionStepId = functionStep?.id;

    const selections: Partial<Record<string, string>> = { function: functionId };
    for (let i = 1; i < steps.length && i < stepsForFunction.length; i++) {
      const stepKey = stepsForFunction[i];
      if (stepKey && steps[i]) selections[stepKey] = steps[i];
    }
    const extras = Array.isArray(configuration.extras) ? configuration.extras : [];
    if (extras.length > 0 && stepsForFunction.includes("extra")) {
      selections.extra = typeof extras[0] === "string" ? extras[0] : String(extras[0]);
    }

    const rows = configData.layerTransformsByFunction?.[functionId] ?? [];
    const layerOffsets: Record<string, { x: number; y: number }> = {};
    const layerScales: Record<string, number> = {};
    rows.forEach((r: { option_id?: string | null; step_key: string; offset_x: number; offset_y: number; scale: number }) => {
      const key = r.option_id ? `${functionId}:${r.step_key}:${r.option_id}` : `${functionId}:${r.step_key}`;
      layerOffsets[key] = {
        x: Number(r.offset_x ?? 0) * OFFSET_SCALE,
        y: Number(r.offset_y ?? 0) * OFFSET_SCALE,
      };
      layerScales[key] = Number(r.scale ?? 1);
    });

    const isExtraStepForGmtOrSub =
      stepsForFunction.includes("extra") && (functionId === "gmt" || functionId === "submariner");

    return {
      selections,
      stepsForFunction,
      stepIdsForFunction,
      functionStepId,
      layerOffsets,
      layerScales,
      functionId,
      isExtraStepForGmtOrSub,
    };
  }, [configuration, configData]);

  const canRender = configData && functionId && stepsForFunction.length > 1;

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-white"
      style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
    >
      {canRender ? (
      <WatchPreview
        selections={selections}
        options={configData.options}
        stepsForFunction={stepsForFunction}
        functionId={functionId}
        stepIdsForFunction={stepIdsForFunction}
        functionStepId={functionStepId}
        isExtraStepForGmtOrSub={isExtraStepForGmtOrSub}
        extraStepImage="/images/configuratorextra.png"
        locale={locale}
        layerOffsets={layerOffsets}
        layerScales={layerScales}
      />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-foreground/5">
          <svg className="h-8 w-8 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )}
    </div>
  );
}
