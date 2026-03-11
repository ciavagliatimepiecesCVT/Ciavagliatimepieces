"use client";

import { useCallback, useEffect, useState } from "react";
import { optionAppliesToFunction } from "@/lib/configurator-constants";
import {
  getPublicConfiguratorData,
  getAdminProductConfiguratorConfig,
  setProductConfiguratorConfig,
} from "@/app/[locale]/account/admin/actions";
import type { PublicConfiguratorData } from "@/app/[locale]/account/admin/actions";

type Option = PublicConfiguratorData["options"][number];
type StepMeta = PublicConfiguratorData["stepsMeta"][number];

type Props = {
  productId: string;
  productName: string;
  locale: string;
  isFr: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function AdminConfiguratorPresetEditor({
  productId,
  productName,
  locale,
  isFr,
  onClose,
  onSaved,
}: Props) {
  const [configData, setConfigData] = useState<PublicConfiguratorData | null>(null);
  const [existingConfig, setExistingConfig] = useState<{
    steps?: string[];
    addonIds?: string[];
    dropdownSelections?: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFunctionId, setSelectedFunctionId] = useState<string>("");
  const [selectionsByStepKey, setSelectionsByStepKey] = useState<Record<string, string>>({});
  const [addonChecked, setAddonChecked] = useState<Record<string, boolean>>({});
  const [dropdownSelections, setDropdownSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const [data, preset] = await Promise.all([
          getPublicConfiguratorData(),
          getAdminProductConfiguratorConfig(productId),
        ]);
        if (cancelled) return;
        setConfigData(data ?? null);
        setExistingConfig(preset ?? null);
        if (data) {
          const funcId = data.functionOptions[0]?.id ?? "";
          setSelectedFunctionId(funcId);
          if (preset?.steps?.length) {
            setSelectedFunctionId(preset.steps[0] ?? funcId);
            const stepsMeta = data.stepsMeta ?? [];
            const functionStepsMap = data.functionStepsMap ?? {};
            const stepIdToMeta = new Map(stepsMeta.map((s) => [s.id, s]));
            const stepIds = functionStepsMap[preset.steps[0] ?? ""] ?? [];
            const stepKeys = stepIds
              .map((sid) => stepIdToMeta.get(sid)?.step_key)
              .filter((k): k is string => !!k);
            const stepsForPreset = ["function", ...stepKeys];
            const nextSelections: Record<string, string> = {};
            stepsForPreset.forEach((key, i) => {
              const val = preset.steps?.[i] && typeof preset.steps[i] === "string" ? preset.steps[i] : "";
              if (val && key !== "function") nextSelections[key] = val;
            });
            setSelectionsByStepKey(nextSelections);
            const addons: Record<string, boolean> = {};
            (preset.addonIds ?? []).forEach((id) => {
              if (typeof id === "string") addons[id] = true;
            });
            setAddonChecked(addons);
            setDropdownSelections(
              preset.dropdownSelections && typeof preset.dropdownSelections === "object"
                ? preset.dropdownSelections
                : {}
            );
          } else {
            setSelectionsByStepKey({});
            setAddonChecked({});
            setDropdownSelections({});
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const stepsMeta = configData?.stepsMeta ?? [];
  const functionOptions = configData?.functionOptions ?? [];
  const functionStepsMap = configData?.functionStepsMap ?? {};
  const options = configData?.options ?? [];
  const addons = configData?.addons ?? [];
  const stepIdToMeta = new Map(stepsMeta.map((s) => [s.id, s]));

  const stepIdsForFunction = functionStepsMap[selectedFunctionId] ?? [];
  const stepKeysInOrder = stepIdsForFunction
    .map((sid) => stepIdToMeta.get(sid)?.step_key)
    .filter((k): k is string => !!k);

  const buildConfig = useCallback(() => {
    const steps = [
      selectedFunctionId,
      ...stepKeysInOrder.map((k) => selectionsByStepKey[k] ?? "").filter(Boolean),
    ];
    if (!steps[0]) return null;
    return {
      steps,
      addonIds: addons.filter((a) => addonChecked[a.id]).map((a) => a.id),
      dropdownSelections: Object.keys(dropdownSelections).length ? dropdownSelections : undefined,
    };
  }, [selectedFunctionId, stepKeysInOrder, selectionsByStepKey, addons, addonChecked, dropdownSelections]);

  const handleSave = async () => {
    const config = buildConfig();
    setError(null);
    setSaving(true);
    try {
      await setProductConfiguratorConfig(productId, config);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm(isFr ? "Supprimer le préréglage configurateur pour ce produit ?" : "Remove configurator preset for this product?"))
      return;
    setError(null);
    setSaving(true);
    try {
      await setProductConfiguratorConfig(productId, null);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
        <div className="rounded-2xl border border-white/20 bg-[var(--logo-green)] p-8 text-white shadow-xl">
          <p>{isFr ? "Chargement..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!configData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
        <div className="rounded-2xl border border-white/20 bg-[var(--logo-green)] p-8 text-white shadow-xl">
          <p>{isFr ? "Le configurateur n'est pas configuré." : "Configurator is not set up."}</p>
          <button type="button" onClick={onClose} className="mt-4 rounded-full border border-white/40 px-4 py-2 text-sm">
            {isFr ? "Fermer" : "Close"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={isFr ? "Préréglage configurateur" : "Configurator preset"}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/20 bg-[var(--logo-green)] p-6 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">
            {isFr ? "Préréglage configurateur" : "Configurator preset"} — {productName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label={isFr ? "Fermer" : "Close"}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-sm text-white/70">
          {isFr
            ? "Définissez les options pré-sélectionnées lorsque le client clique sur « Modifier » sur la page produit. Il arrivera à la dernière étape du configurateur avec ces choix."
            : "Set the pre-selected options when the customer clicks « Edit now » on the product page. They will land on the configurator final step with these choices."}
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</p>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-white/70">
              {isFr ? "Fonction (type de montre)" : "Function (watch type)"}
            </label>
            <select
              value={selectedFunctionId}
              onChange={(e) => {
                setSelectedFunctionId(e.target.value);
                setSelectionsByStepKey({});
                setDropdownSelections({});
              }}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-[var(--logo-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--logo-gold)]"
            >
              {functionOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {isFr ? opt.label_fr : opt.label_en}
                </option>
              ))}
            </select>
          </div>

          {stepKeysInOrder.map((stepKey) => {
            const stepId = stepIdsForFunction[stepKeysInOrder.indexOf(stepKey)];
            const stepMeta = stepsMeta.find((s) => s.step_key === stepKey) as StepMeta | undefined;
            const stepLabel = stepMeta ? (isFr ? stepMeta.label_fr : stepMeta.label_en) : stepKey;
            const opts = options.filter(
              (o) => o.step_id === stepId && optionAppliesToFunction(o, selectedFunctionId)
            ) as Option[];
            const selectedOptId = selectionsByStepKey[stepKey] ?? "";
            const selectedOpt = opts.find((o) => o.id === selectedOptId);
            const dropdownItems = selectedOpt && "dropdownItems" in selectedOpt ? selectedOpt.dropdownItems : undefined;

            return (
              <div key={stepKey}>
                <label className="text-xs uppercase tracking-wider text-white/70">{stepLabel}</label>
                <div className="mt-1 flex flex-col gap-1">
                  <select
                    value={selectedOptId}
                    onChange={(e) => {
                      const v = e.target.value || "";
                      setSelectionsByStepKey((prev) => ({ ...prev, [stepKey]: v }));
                      if (!v) setDropdownSelections((prev) => {
                        const next = { ...prev };
                        delete next[selectedOptId];
                        return next;
                      });
                    }}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-[var(--logo-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--logo-gold)]"
                  >
                    <option value="">—</option>
                    {opts.map((o) => (
                      <option key={o.id} value={o.id}>
                        {isFr ? o.label_fr : o.label_en}
                      </option>
                    ))}
                  </select>
                  {dropdownItems?.length ? (
                    <select
                      value={dropdownSelections[selectedOptId] ?? dropdownItems[0]?.id ?? ""}
                      onChange={(e) =>
                        setDropdownSelections((prev) => ({
                          ...prev,
                          [selectedOptId]: e.target.value,
                        }))
                      }
                      className="ml-4 w-full max-w-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-[var(--logo-gold)] focus:outline-none"
                    >
                      {dropdownItems.map((d) => (
                        <option key={d.id} value={d.id}>
                          {isFr ? d.label_fr : d.label_en}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              </div>
            );
          })}

          {addons.length > 0 && (
            <div>
              <label className="text-xs uppercase tracking-wider text-white/70">
                {isFr ? "Add-ons configurateur" : "Configurator add-ons"}
              </label>
              <div className="mt-2 flex flex-wrap gap-3">
                {addons.map((addon) => (
                  <label key={addon.id} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addonChecked[addon.id] ?? false}
                      onChange={(e) =>
                        setAddonChecked((prev) => ({ ...prev, [addon.id]: e.target.checked }))
                      }
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-sm">{isFr ? addon.label_fr : addon.label_en}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedFunctionId}
            className="rounded-full bg-[var(--logo-gold)] px-6 py-2 text-sm font-medium uppercase tracking-wider text-[var(--logo-green)] transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (isFr ? "Enregistrement…" : "Saving…") : isFr ? "Enregistrer" : "Save"}
          </button>
          {existingConfig && (
            <button
              type="button"
              onClick={handleClear}
              disabled={saving}
              className="rounded-full border border-white/40 px-6 py-2 text-sm uppercase tracking-wider text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              {isFr ? "Supprimer le préréglage" : "Clear preset"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/40 px-6 py-2 text-sm uppercase tracking-wider text-white transition hover:bg-white/10"
          >
            {isFr ? "Annuler" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
