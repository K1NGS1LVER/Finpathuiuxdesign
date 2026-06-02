import type { Options } from "canvas-confetti";

let modulePromise: Promise<typeof import("canvas-confetti")> | null = null;

/** Warms the canvas-confetti chunk so timed beats land on schedule. */
export function prefetchConfetti(): void {
  if (modulePromise) return;
  modulePromise = import("canvas-confetti");
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Restrained confetti — caps particle count, spread, ticks. Centered bursts pushed up.
 * No-op under reduced motion. Lazy-loads the canvas-confetti chunk on first call.
 */
export async function fireConfetti(opts: Options = {}): Promise<void> {
  if (prefersReducedMotion()) return;
  prefetchConfetti();
  const mod = await modulePromise!;
  const safeOrigin = opts.origin ?? { x: 0.5, y: 0.35 };
  const origin =
    safeOrigin.y !== undefined && safeOrigin.y >= 0.45 && safeOrigin.y <= 0.55
      ? { ...safeOrigin, y: 0.35 } // push center-ish bursts up so they don't fill the screen
      : safeOrigin;
  mod.default({
    particleCount: Math.min(opts.particleCount ?? 40, 60),
    spread: Math.min(opts.spread ?? 55, 70),
    ticks: Math.min(opts.ticks ?? 90, 110),
    startVelocity: opts.startVelocity ?? 22,
    gravity: opts.gravity ?? 1.1,
    scalar: opts.scalar ?? 0.85,
    colors: opts.colors,
    origin,
  });
}
