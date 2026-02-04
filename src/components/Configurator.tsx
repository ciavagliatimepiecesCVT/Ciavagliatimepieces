"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { getPublicConfiguratorData } from "@/app/[locale]/account/admin/actions";

// Use site theme from globals.css: --accent, --foreground, --background

type StepMeta = { id: string; step_key: string | null; label_en: string; label_fr: string; optional: boolean };

export default function Configurator({ locale }: { locale: string }) {
  const isFr = locale === "fr";
  const [configData, setConfigData] = useState<Awaited<ReturnType<typeof getPublicConfiguratorData>>>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [stepIndex, setStepIndex] = useState(0);
  const [selections, setSelections] = useState<Partial<Record<string, string>>>({});
  const [addonChecked, setAddonChecked] = useState<Record<string, boolean>>({});
  const [totalExpanded, setTotalExpanded] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPublicConfiguratorData().then((data) => {
      if (!cancelled) {
        setConfigData(data);
        setDataLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stepsMeta = configData?.stepsMeta ?? [];
  const functionOptions = configData?.functionOptions ?? [];
  const functionStepsMap = configData?.functionStepsMap ?? {};
  const options = configData?.options ?? [];
  const addons = configData?.addons ?? [];

  const functionStep = useMemo(() => stepsMeta.find((s) => s.step_key === "function"), [stepsMeta]);
  const stepIdToMeta = useMemo(() => new Map(stepsMeta.map((s) => [s.id, s])), [stepsMeta]);

  const functionId = selections.function ?? functionOptions[0]?.id ?? "";
  const stepIdsForFunction = functionStepsMap[functionId] ?? [];
  const stepsForFunction = useMemo(() => {
    const keys = stepIdsForFunction
      .map((sid) => stepIdToMeta.get(sid)?.step_key)
      .filter((k): k is string => !!k);
    return ["function", ...keys];
  }, [stepIdsForFunction, stepIdToMeta]);

  const currentStepKey = stepsForFunction[stepIndex] ?? "function";
  const currentStepMeta = stepsForFunction[stepIndex] === "function"
    ? functionStep
    : stepIdsForFunction[stepIndex - 1]
      ? stepIdToMeta.get(stepIdsForFunction[stepIndex - 1])
      : null;
  const currentStepId = currentStepKey === "function" ? functionStep?.id : stepIdsForFunction[stepIndex - 1];

  const optionsForCurrentStep = useMemo(() => {
    if (!currentStepId) return [];
    return options.filter(
      (o) =>
        o.step_id === currentStepId &&
        (o.parent_option_id === null || o.parent_option_id === functionId)
    );
  }, [options, currentStepId, functionId]);

  const selectedId = selections[currentStepKey] ?? null;
  const isLastStep = stepIndex === stepsForFunction.length - 1;
  const isOptionalStep = currentStepMeta?.optional ?? false;

  const setSelection = useCallback(
    (optionId: string | null) => {
      if (optionId === null) {
        setSelections((prev) => {
          const next = { ...prev };
          delete next[currentStepKey];
          return next;
        });
        return;
      }
      setSelections((prev) => {
        const next = { ...prev, [currentStepKey]: optionId };
        if (currentStepKey === "function") {
          setAddonChecked({});
          return { function: optionId };
        }
        return next;
      });
      if (currentStepKey === "function") {
        setStepIndex(0);
      }
    },
    [currentStepKey]
  );

  const total = useMemo(() => {
    let t = 0;
    stepsForFunction.forEach((stepKey) => {
      const id = selections[stepKey];
      if (!id) return;
      const stepId = stepKey === "function" ? functionStep?.id : stepIdsForFunction[stepsForFunction.indexOf(stepKey) - 1];
      if (!stepId) return;
      const opts = options.filter(
        (o) =>
          o.step_id === stepId &&
          (o.parent_option_id === null || o.parent_option_id === functionId)
      );
      const o = opts.find((x) => x.id === id);
      if (o) t += o.price;
    });
    addons.forEach((addon) => {
      if (addonChecked[addon.id]) t += addon.price;
    });
    return t;
  }, [stepsForFunction, selections, functionId, functionStep?.id, stepIdsForFunction, options, addons, addonChecked]);

  const canContinue = useCallback(
    () => isOptionalStep || !!selectedId,
    [isOptionalStep, selectedId]
  );

  const handleContinue = () => {
    if (stepIndex < stepsForFunction.length - 1) setStepIndex((s) => s + 1);
    else handleReviewOrder();
  };

  const stepsPayload = useMemo(() => {
    const funcId = selections.function;
    if (!funcId) return [];
    return [
      funcId,
      ...stepIdsForFunction.map((_, i) => selections[stepsForFunction[i + 1]] ?? ""),
    ];
  }, [selections, stepsForFunction, stepIdsForFunction]);

  const addonIdsPayload = useMemo(
    () => addons.filter((a) => addonChecked[a.id]).map((a) => a.id),
    [addons, addonChecked]
  );

  const handleReviewOrder = async () => {
    setCheckoutError(null);
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      const extras = stepsForFunction.includes("extra") && selections.extra ? [selections.extra] : [];
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          type: "custom",
          userId: user?.id ?? null,
          configuration: {
            steps: stepsPayload,
            extras,
            addonIds: addonIdsPayload,
            price: total,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data?.error ?? (isFr ? "Échec du passage en caisse." : "Checkout failed. Please try again."));
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(isFr ? "Réponse inattendue. Réessayez." : "Unexpected response. Please try again.");
      }
    } catch {
      setCheckoutError(isFr ? "Erreur réseau. Vérifiez votre connexion et réessayez." : "Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setStepIndex(0);
    setSelections({});
    setAddonChecked({});
  };

  const totalLineItems = useMemo(() => {
    const lines: { label: string; price: number }[] = [];
    stepsForFunction.forEach((stepKey) => {
      const id = selections[stepKey];
      if (!id) return;
      const stepId = stepKey === "function" ? functionStep?.id : stepIdsForFunction[stepsForFunction.indexOf(stepKey) - 1];
      if (!stepId) return;
      const meta = stepIdToMeta.get(stepId);
      const stepLabel = meta ? (isFr ? meta.label_fr : meta.label_en) : stepKey;
      const opts = options.filter(
        (o) =>
          o.step_id === stepId &&
          (o.parent_option_id === null || o.parent_option_id === functionId)
      );
      const o = opts.find((x) => x.id === id);
      if (o) lines.push({ label: `${stepLabel}: ${isFr ? o.label_fr : o.label_en}`, price: o.price });
    });
    addons.forEach((addon) => {
      if (addonChecked[addon.id]) {
        const label = isFr ? addon.label_fr : addon.label_en;
        lines.push({ label, price: addon.price });
      }
    });
    return lines;
  }, [stepsForFunction, selections, functionId, functionStep?.id, stepIdsForFunction, options, addons, addonChecked, isFr, stepIdToMeta]);

  const caseAddons = useMemo(() => {
    const caseStepId = stepsMeta.find((s) => s.step_key === "case")?.id;
    if (!caseStepId) return [];
    return addons.filter((a) => a.step_id === caseStepId);
  }, [addons, stepsMeta]);

  const showFrostedForSelectedCase = useMemo(() => {
    const caseOptionId = selections.case;
    if (!caseOptionId) return [];
    return caseAddons.filter((addon) => addon.option_ids.includes(caseOptionId));
  }, [selections.case, caseAddons]);

  if (dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-foreground/70">{isFr ? "Chargement du configurateur..." : "Loading configurator..."}</p>
      </div>
    );
  }

  if (!configData || !functionStep || functionOptions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] px-6">
        <p className="text-center text-foreground/80">
          {isFr ? "Le configurateur n’est pas encore configuré. Un administrateur peut définir les fonctions, étapes et options." : "The configurator is not set up yet. An admin can configure functions, steps and options."}
        </p>
        <Link href={`/${locale}`} className="text-sm font-medium text-[var(--accent)] underline hover:text-[var(--accent-strong)]">
          {isFr ? "Retour à l’accueil" : "Back to home"}
        </Link>
      </div>
    );
  }

  const stepLabel = (stepKey: string) => {
    if (stepKey === "function") return functionStep ? (isFr ? functionStep.label_fr : functionStep.label_en) : stepKey;
    const stepId = stepIdsForFunction[stepsForFunction.indexOf(stepKey) - 1];
    const meta = stepId ? stepIdToMeta.get(stepId) : null;
    return meta ? (isFr ? meta.label_fr : meta.label_en) : stepKey;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-foreground">
      <header className="flex items-center justify-end border-b border-foreground/10 bg-white/80 px-6 py-4 shadow-[0_1px_0_rgba(15,20,23,0.06)]">
        <button
          type="button"
          onClick={handleStartOver}
          className="flex items-center gap-2 text-sm text-foreground/70 transition hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isFr ? "Recommencer" : "Start Over"}
        </button>
      </header>

      <div className="border-b border-foreground/10 bg-white/60 px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 md:gap-4">
          {stepsForFunction.map((stepKey, i) => {
            const hasSelection = stepKey === "function" ? !!selections.function : !!selections[stepKey];
            const isOptional = stepKey === "function" ? false : (stepIdToMeta.get(stepIdsForFunction[i - 1])?.optional ?? false);
            const isCompleted = stepIndex > i || (stepIndex === i && (hasSelection || isOptional));
            const isActive = stepIndex === i;
            return (
              <div key={stepKey} className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border-2 transition ${
                    isCompleted || isActive
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-foreground/25 bg-foreground/5 text-foreground/60"
                  }`}
                >
                  {isCompleted && stepIndex > i ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-semibold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs font-medium uppercase tracking-wider ${
                    isActive ? "text-[var(--accent)]" : isCompleted && stepIndex > i ? "text-foreground/70" : "text-foreground/50"
                  }`}
                >
                  {stepLabel(stepKey)}
                </span>
                {isActive && <div className="h-0.5 w-8 bg-[var(--accent)]" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row lg:gap-12">
        <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-[var(--radius-xl)] border border-foreground/10 bg-white/70 shadow-[var(--shadow)] lg:min-h-[420px]">
          <span className="text-sm font-medium uppercase tracking-widest text-foreground/40">
            {isFr ? "Aperçu" : "Preview"}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold text-foreground">
            {isFr ? "Choisissez" : "Select Your"} {currentStepMeta ? (isFr ? currentStepMeta.label_fr : currentStepMeta.label_en) : currentStepKey}
          </h2>
          <p className="mt-1 text-sm text-foreground/60">
            {optionsForCurrentStep.length} {isFr ? "options disponibles" : "options available"}
            {isOptionalStep ? ` • ${isFr ? "Optionnel" : "Optional"}` : ""}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {optionsForCurrentStep.map((opt) => {
              const selected = selectedId === opt.id;
              const label = isFr ? opt.label_fr : opt.label_en;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelection(opt.id)}
                  className={`flex flex-col items-center rounded-xl border-2 p-4 text-left transition ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/30"
                      : "border-foreground/20 bg-white/80 shadow-[0_24px_90px_rgba(15,20,23,0.08)] hover:border-foreground/35"
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold ${
                        selected ? "bg-[var(--accent)] text-white" : "bg-foreground/10 text-foreground/90"
                      }`}
                    >
                      {opt.letter}
                    </div>
                    {selected && (
                      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]">
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="mt-2 block w-full truncate text-center text-sm font-medium text-foreground">{label}</span>
                  <span className="text-sm font-medium text-[var(--accent)]">
                    ${Number(opt.price).toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          {currentStepKey === "case" && showFrostedForSelectedCase.length > 0 && (
            <div className="mt-8 space-y-4">
              {showFrostedForSelectedCase.map((addon) => (
                <div key={addon.id} className="rounded-xl border border-foreground/15 bg-white/80 p-4 shadow-[0_24px_90px_rgba(15,20,23,0.06)]">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!addonChecked[addon.id]}
                      onChange={(e) => setAddonChecked((prev) => ({ ...prev, [addon.id]: e.target.checked }))}
                      className="mt-1 h-5 w-5 rounded border-foreground/30 text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <div>
                      <span className="font-medium text-foreground">
                        {isFr ? addon.label_fr : addon.label_en} ({isFr ? "Optionnel" : "Optional"})
                      </span>
                      <p className="mt-1 text-sm text-foreground/60">
                        {isFr
                          ? "Disponible pour les boîtiers sélectionnés."
                          : "Available for selected case options."}
                      </p>
                      <span className="mt-1 block text-sm font-medium text-[var(--accent)]">
                        +${addon.price.toLocaleString()}
                      </span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {checkoutError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {checkoutError}
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
              disabled={stepIndex === 0}
              className="rounded-lg border border-foreground/25 bg-transparent px-5 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← {isFr ? "Retour" : "Back"}
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue() || loading}
              className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastStep ? (isFr ? "Vérifier la commande →" : "Review Order →") : `${isFr ? "Continuer" : "Continue"} →`}
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-6 z-10 w-[min(20rem,calc(100vw-3rem))]">
        <button
          type="button"
          onClick={() => setTotalExpanded((e) => !e)}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-foreground/20 bg-white/95 px-4 py-3 shadow-[var(--shadow)] transition hover:border-foreground/30"
          aria-expanded={totalExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/15">
              <svg className="h-4 w-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground/70">TOTAL</p>
              <p className="text-xl font-bold text-foreground">${total.toLocaleString()}</p>
            </div>
          </div>
          <svg
            className={`h-5 w-5 shrink-0 text-foreground/70 transition-transform ${totalExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {totalExpanded && (
          <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-foreground/20 bg-white/95 p-3 shadow-[var(--shadow)]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
              {isFr ? "Détail" : "Breakdown"}
            </p>
            {totalLineItems.length === 0 ? (
              <p className="text-sm text-foreground/50">{isFr ? "Aucune sélection." : "No selections yet."}</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {totalLineItems.map((item, idx) => (
                  <li key={idx} className="flex justify-between gap-2 border-b border-foreground/10 pb-1.5 last:border-0">
                    <span className="truncate text-foreground/90">{item.label}</span>
                    <span className="shrink-0 font-medium text-foreground">${item.price.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex justify-between border-t border-foreground/20 pt-2 text-sm font-bold text-foreground">
              <span>{isFr ? "Total" : "Total"}</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
