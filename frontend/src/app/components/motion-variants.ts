import type { Variants } from "motion/react";

export const pageContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const pageSection: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Grid-card entrance — mirrors `pageSection`'s easing for consistency with
 * page-level transitions, but tuned for smaller card-grid cells.
 */
export const cardEntry: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Hover lift — spread into a `motion.div`'s `whileHover` prop:
 * `<motion.div whileHover={cardHover} />`.
 */
export const cardHover = {
  y: -4,
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
} as const;

/**
 * Returns a `transition`-compatible stagger config that caps the total
 * stagger duration across all children at `max` seconds. Use for lists
 * where the child count is unbounded (e.g. Celebrate's goal grid) so 10+
 * cards do not pile up >1s of entrance delay.
 *
 * Per-child delay = `Math.min(0.08, max / Math.max(count, 1))`.
 */
export function cappedStagger(
  count: number,
  max: number = 0.5
): { staggerChildren: number } {
  return { staggerChildren: Math.min(0.08, max / Math.max(count, 1)) };
}

/**
 * Re-usable transition config for number count-ups. Consumed by
 * framer-motion's `animate()` driving a `useMotionValue`.
 */
export const countUpTransition = {
  duration: 1.2,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};
