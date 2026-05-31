import type { Goal, Milestone } from "@/lib/types";

/**
 * Cosmetic but stable sparks score awarded when a goal completes.
 * Formula: floor scales with target amount and rewards higher priority.
 */
export function computeSparks(amount: number, priority: number): number {
  return Math.round((amount / 1000) * (4 - Math.min(priority, 3)));
}

/** Pure deterministic 6-character base36 hash. */
export function hashId(input: string): string {
  const n = Array.from(input).reduce(
    (acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0,
    0x811c9dc5,
  );
  return n.toString(36).padStart(6, "0").slice(-6);
}

export interface MilestoneSeed {
  goalId: string;
  title: string;
  category: Goal["category"];
  completedAt: string;
  amount: number;
  priority: number;
}

/** Builds a hash-chained Milestone array; first block's prevHash is null. */
export function buildMilestoneChain(seeds: MilestoneSeed[]): Milestone[] {
  const chain: Milestone[] = [];
  let prevHash: string | null = null;

  for (const seed of seeds) {
    const id = hashId(seed.goalId + seed.completedAt);
    const hash = hashId(id);
    chain.push({
      id,
      goalId: seed.goalId,
      title: seed.title,
      category: seed.category,
      completedAt: seed.completedAt,
      amount: seed.amount,
      sparks: computeSparks(seed.amount, seed.priority),
      hash,
      prevHash,
    });
    prevHash = hash;
  }

  return chain;
}
