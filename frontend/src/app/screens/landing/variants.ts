// ============================================================
// Landing page shared motion variants (extracted from Landing.tsx).
// ============================================================

export const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
};

export const STAGGER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
