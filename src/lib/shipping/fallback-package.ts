/**
 * When product dimensions/weight are missing, FlagShip still needs numbers.
 * Adjust these defaults to match your typical watch box + packing materials.
 */
export const FALLBACK_PACKAGE_IMPERIAL = {
  length: 12,
  width: 10,
  height: 6,
  weight: 2,
} as const;
