/**
 * Sparks-to-level curve for the achievement ledger badge.
 *
 * Floor is Level 1. Curve: `1 + floor(sqrt(total / 100))` so progression
 * slows as totals grow (100→L2, 400→L3, 900→L4, 1600→L5, 2500→L6+).
 */
export interface LevelInfo {
  level: number;
  label: string;
  nextThreshold: number;
  prevThreshold: number;
  toNext: number;
}

const LEVEL_NAMES = [
  'Spark Starter',
  'Budget Builder',
  'Goal Getter',
  'Wealth Weaver',
  'Finance Master',
];

function levelName(level: number): string {
  if (level <= 0) return LEVEL_NAMES[0];
  if (level <= LEVEL_NAMES.length) return LEVEL_NAMES[level - 1];
  return 'FinPath Legend';
}

export function computeLevel(totalSparks: number): LevelInfo {
  const safeTotal = Math.max(0, Math.floor(totalSparks));
  const level = 1 + Math.floor(Math.sqrt(safeTotal / 100));
  const nextThreshold = level * level * 100;
  const prevThreshold = (level - 1) * (level - 1) * 100;
  const toNext = Math.max(0, nextThreshold - safeTotal);
  return {
    level,
    label: levelName(level),
    nextThreshold,
    prevThreshold,
    toNext,
  };
}
