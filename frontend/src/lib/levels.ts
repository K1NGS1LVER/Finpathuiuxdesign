/**
 * Sparks-to-level curve for the achievement ledger badge.
 *
 * Floor is Level 1 — "Level 0 Saver" reads as a bug. A user with 0 sparks
 * shows as Level 1. The curve is `1 + floor(sqrt(total / 100))` so progression
 * slows as totals grow (100 sparks → L2, 400 → L3, 900 → L4, 1600 → L5).
 */
export interface LevelInfo {
  level: number;
  label: string;
  nextThreshold: number;
  toNext: number;
}

export function computeLevel(totalSparks: number): LevelInfo {
  const safeTotal = Math.max(0, Math.floor(totalSparks));
  const level = 1 + Math.floor(Math.sqrt(safeTotal / 100));
  const nextThreshold = level * level * 100;
  const toNext = Math.max(0, nextThreshold - safeTotal);
  return {
    level,
    label: `Level ${level} Saver`,
    nextThreshold,
    toNext,
  };
}
