/**
 * Configurator: steps and options per function.
 * Some functions have different steps (e.g. Size, Extra) and different options.
 * Matches WatchCraft-style flow: Function → (Size?) → Case → Dial → Hands → Strap → (Extra?).
 */

export type OptionItem = { id: string; label: string; letter: string; price: number };

export type FunctionOption = { id: string; label: string; letter: string; price: number };

export type StepId = "function" | "size" | "case" | "dial" | "hands" | "strap" | "extra";

export type OptionsByStep = {
  size?: OptionItem[];
  cases: OptionItem[];
  dials: OptionItem[];
  hands: OptionItem[];
  straps: OptionItem[];
  extras?: OptionItem[];
};

/** Step metadata (all possible steps). */
export const STEP_META: Record<StepId, { labelEn: string; labelFr: string; optional?: boolean }> = {
  function: { labelEn: "Function", labelFr: "Fonction" },
  size: { labelEn: "Size", labelFr: "Taille" },
  case: { labelEn: "Case", labelFr: "Boîtier" },
  dial: { labelEn: "Dial", labelFr: "Cadran" },
  hands: { labelEn: "Hands", labelFr: "Aiguilles" },
  strap: { labelEn: "Strap", labelFr: "Bracelet" },
  extra: { labelEn: "Extra", labelFr: "Extra", optional: true },
};

/** All 8 function types. */
export const CONFIGURATOR_FUNCTIONS: FunctionOption[] = [
  { id: "oak", label: "Oak", letter: "O", price: 0 },
  { id: "naut", label: "Naut", letter: "N", price: 0 },
  { id: "skeleton", label: "Skeleton", letter: "S", price: 0 },
  { id: "classic-date", label: "Classic Date", letter: "C", price: 0 },
  { id: "chronograph", label: "Chronograph", letter: "C", price: 0 },
  { id: "day-date", label: "Day-Date", letter: "D", price: 0 },
  { id: "submariner", label: "Submariner", letter: "S", price: 0 },
  { id: "gmt", label: "GMT", letter: "G", price: 0 },
];

/** Size options (used when function has Size step). */
const SIZES: OptionItem[] = [
  { id: "36mm", label: "36mm", letter: "3", price: 0 },
  { id: "40mm", label: "40mm", letter: "4", price: 0 },
];

/** Default case options (can be overridden per function). */
const DEFAULT_CASES: OptionItem[] = [
  { id: "yellow-gold", label: "Yellow Gold", letter: "Y", price: 1500 },
  { id: "black", label: "Black", letter: "B", price: 900 },
  { id: "rose-gold", label: "Rose Gold", letter: "R", price: 1500 },
  { id: "stainless-steel", label: "Stainless Steel", letter: "S", price: 800 },
];

/** Optional Frosted Finish add-on — available for all case materials (stainless steel, yellow gold, rose gold, black). */
export const FROSTED_FINISH = {
  id: "frosted-finish",
  labelEn: "Frosted Finish",
  labelFr: "Fini givré",
  price: 200,
} as const;

/** Skeleton-only: Exhibition Back (special case option). */
const SKELETON_CASES: OptionItem[] = [
  ...DEFAULT_CASES,
  { id: "exhibition-back", label: "Exhibition Back", letter: "E", price: 400 },
];

/** Default dial options. */
const DEFAULT_DIALS: OptionItem[] = [
  { id: "arctic-white", label: "Arctic White", letter: "A", price: 150 },
  { id: "onyx-black", label: "Onyx Black", letter: "O", price: 160 },
  { id: "midnight-blue", label: "Midnight Blue", letter: "M", price: 180 },
  { id: "champagne", label: "Champagne Gold", letter: "C", price: 220 },
];

/** Default hands options. */
const DEFAULT_HANDS: OptionItem[] = [
  { id: "sword-black", label: "Sword Black", letter: "S", price: 95 },
  { id: "dauphine-silver", label: "Dauphine Silver", letter: "D", price: 85 },
  { id: "cathedral-rose", label: "Cathedral Rose", letter: "C", price: 110 },
];

/** Default strap options. */
const DEFAULT_STRAPS: OptionItem[] = [
  { id: "steel-bracelet", label: "Steel Bracelet", letter: "S", price: 280 },
  { id: "italian-leather-black", label: "Italian Leather Black", letter: "I", price: 120 },
  { id: "italian-leather-brown", label: "Italian Leather Brown", letter: "I", price: 120 },
  { id: "rubber-sport", label: "Rubber Sport", letter: "R", price: 75 },
];

/** Extra (optional) options. */
const EXTRAS: OptionItem[] = [
  { id: "custom-rotor-1", label: "Custom Rotor (Engraved)", letter: "C", price: 500 },
  { id: "custom-rotor-2", label: "Custom Rotor (Gold)", letter: "C", price: 750 },
  { id: "custom-rotor-3", label: "Custom Rotor (Skeleton)", letter: "C", price: 600 },
];

/**
 * Which steps each function has (after the Function step).
 * Not all functions have the same steps: only some have Size, only one has Extra,
 * and only Skeleton has the special case option (Exhibition Back).
 * Order: size? → case → dial → hands → strap → extra?
 */
export const STEPS_BY_FUNCTION: Record<string, StepId[]> = {
  oak: ["case", "dial", "hands", "strap", "extra"],
  "classic-date": ["size", "case", "dial", "hands", "strap"],
  naut: ["case", "dial", "hands", "strap"],
  skeleton: ["case", "dial", "hands", "strap"],
  chronograph: ["case", "dial", "hands", "strap"],
  "day-date": ["case", "dial", "hands", "strap"],
  submariner: ["case", "dial", "hands", "strap"],
  gmt: ["case", "dial", "hands", "strap"],
};

/** Options for each function. Override per function for different case/dial/hands/strap. */
export const OPTIONS_BY_FUNCTION: Record<string, OptionsByStep> = {};

function buildOptionsForFunction(opts: Partial<OptionsByStep> = {}): OptionsByStep {
  return {
    size: opts.size ?? [...SIZES],
    cases: opts.cases ?? [...DEFAULT_CASES],
    dials: opts.dials ?? [...DEFAULT_DIALS],
    hands: opts.hands ?? [...DEFAULT_HANDS],
    straps: opts.straps ?? [...DEFAULT_STRAPS],
    extras: opts.extras ?? [...EXTRAS],
  };
}

CONFIGURATOR_FUNCTIONS.forEach((fn) => {
  const steps = STEPS_BY_FUNCTION[fn.id];
  const hasSize = steps?.includes("size");
  const hasExtra = steps?.includes("extra");
  const isSkeleton = fn.id === "skeleton";
  OPTIONS_BY_FUNCTION[fn.id] = buildOptionsForFunction({
    size: hasSize ? SIZES : undefined,
    cases: isSkeleton ? SKELETON_CASES : DEFAULT_CASES,
    dials: DEFAULT_DIALS,
    hands: DEFAULT_HANDS,
    straps: DEFAULT_STRAPS,
    extras: hasExtra ? EXTRAS : undefined,
  });
});

/** Full step list for a function: [function, ...stepsAfterFunction]. */
export function getStepsForFunction(functionId: string): StepId[] {
  const after = STEPS_BY_FUNCTION[functionId] ?? ["case", "dial", "hands", "strap"];
  return ["function", ...after];
}

/** Get options for a step; function step uses CONFIGURATOR_FUNCTIONS. */
export function getOptionsForStep(functionId: string, stepId: StepId): OptionItem[] {
  if (stepId === "function") return CONFIGURATOR_FUNCTIONS;
  const opts = OPTIONS_BY_FUNCTION[functionId];
  if (!opts) return [];
  switch (stepId) {
    case "size":
      return opts.size ?? [];
    case "case":
      return opts.cases;
    case "dial":
      return opts.dials;
    case "hands":
      return opts.hands;
    case "strap":
      return opts.straps;
    case "extra":
      return opts.extras ?? [];
    default:
      return [];
  }
}

/** Whether a step is optional (e.g. Extra). */
export function isStepOptional(stepId: StepId): boolean {
  return STEP_META[stepId]?.optional === true;
}
