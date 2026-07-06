import { useReducedMotion } from "motion/react";

/**
 * `0` — a sentinel duration meaning "no animation". Use when callers want to
 * branch on reduced-motion without computing a value.
 */
export const INSTANT = 0;

/**
 * Returns the given animation `base` duration, or `0` when the user prefers
 * reduced motion. This is a hook (calls `useReducedMotion()` internally) so
 * it reacts to OS-level preference changes at runtime.
 */
export function useMotionDuration(base: number): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? INSTANT : base;
}

export { useReducedMotion };
