/**
 * Configurator steps and options. Each function (watch type) has its own
 * case options; dial, hands, strap, and extra options can vary by function.
 * Matches the flow from the reference configurator.
 */

export type OptionItem = { id: string; label: string; letter: string; price: number };

export type FunctionOption = { id: string; label: string; letter: string; price: number };

export type OptionsByStep = {
  cases: OptionItem[];
  dials: OptionItem[];
  hands: OptionItem[];
  straps: OptionItem[];
  extras: OptionItem[];
};

/** All 8 function types (step 1). */
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

/** Case options can differ per function. Here we use the same set for all; override per function if needed. */
const DEFAULT_CASES: OptionItem[] = [
  { id: "yellow-gold", label: "Yellow Gold", letter: "Y", price: 1500 },
  { id: "black", label: "Black", letter: "B", price: 900 },
  { id: "rose-gold", label: "Rose Gold", letter: "R", price: 1500 },
  { id: "stainless-steel", label: "Stainless Steel", letter: "S", price: 800 },
];

const DEFAULT_DIALS: OptionItem[] = [
  { id: "arctic-white", label: "Arctic White", letter: "A", price: 150 },
  { id: "onyx-black", label: "Onyx Black", letter: "O", price: 160 },
  { id: "midnight-blue", label: "Midnight Blue", letter: "M", price: 180 },
  { id: "champagne", label: "Champagne Gold", letter: "C", price: 220 },
];

const DEFAULT_HANDS: OptionItem[] = [
  { id: "sword-black", label: "Sword Black", letter: "S", price: 95 },
  { id: "dauphine-silver", label: "Dauphine Silver", letter: "D", price: 85 },
  { id: "cathedral-rose", label: "Cathedral Rose", letter: "C", price: 110 },
];

const DEFAULT_STRAPS: OptionItem[] = [
  { id: "steel-bracelet", label: "Steel Bracelet", letter: "S", price: 280 },
  { id: "italian-leather-black", label: "Italian Leather Black", letter: "I", price: 120 },
  { id: "italian-leather-brown", label: "Italian Leather Brown", letter: "I", price: 120 },
  { id: "rubber-sport", label: "Rubber Sport", letter: "R", price: 75 },
];

const DEFAULT_EXTRAS: OptionItem[] = [
  { id: "custom-rotor-1", label: "Custom Rotor (Engraved)", letter: "C", price: 500 },
  { id: "custom-rotor-2", label: "Custom Rotor (Gold)", letter: "C", price: 750 },
  { id: "custom-rotor-3", label: "Custom Rotor (Skeleton)", letter: "C", price: 600 },
];

/** Options for each step, keyed by function id. Case (and others) can vary per function. */
export const OPTIONS_BY_FUNCTION: Record<string, OptionsByStep> = {};

CONFIGURATOR_FUNCTIONS.forEach((fn) => {
  OPTIONS_BY_FUNCTION[fn.id] = {
    cases: [...DEFAULT_CASES],
    dials: [...DEFAULT_DIALS],
    hands: [...DEFAULT_HANDS],
    straps: [...DEFAULT_STRAPS],
    extras: [...DEFAULT_EXTRAS],
  };
});

/** Step ids and labels. */
export const CONFIGURATOR_STEPS = [
  { id: "function", labelEn: "Function", labelFr: "Fonction" },
  { id: "case", labelEn: "Case", labelFr: "Boîtier" },
  { id: "dial", labelEn: "Dial", labelFr: "Cadran" },
  { id: "hands", labelEn: "Hands", labelFr: "Aiguilles" },
  { id: "strap", labelEn: "Strap", labelFr: "Bracelet" },
  { id: "extra", labelEn: "Extra", labelFr: "Extra" },
] as const;

export type StepId = (typeof CONFIGURATOR_STEPS)[number]["id"];
