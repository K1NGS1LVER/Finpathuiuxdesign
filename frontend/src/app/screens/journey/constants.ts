// Grid layout for goal nodes
export const GOAL_COL0_X = 350;
export const GOAL_COL_GAP = 250;
export const GOAL_ROW0_Y = 60;
export const GOAL_ROW_GAP = 320; // > tallest card so same-column slots never overlap
export const NODE_CENTER = 80; // half of 160px goal node width
export const INCOME_NODE_POS = { x: 80, y: 200 } as const;

// Interaction
export const DRAG_CLICK_THRESHOLD = 4; // px of pointer movement above which click is suppressed
export const CONFIRM_TIMEOUT_MS = 3000; // tap-twice destructive confirm window

// Zoom
export const ZOOM_SPEED = 0.001;
export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 3;

// Animation timings
export const COMPLETION_RING_SIZE = 240;
export const COMPLETION_RING_DURATION = 0.85;
export const COMPLETION_HOLD_MS = 900;
export const TRAVELING_DOT_OPACITY = 0.65;

// canvas-confetti doesn't resolve CSS vars — hex literals.
export const CONFETTI_COLORS = ["#7b8cff", "#b0ff09", "#c77dff", "#f59e0b"];

export const slotToPos = (slot: number) => ({
  x: GOAL_COL0_X + (slot % 2) * GOAL_COL_GAP,
  y: GOAL_ROW0_Y + Math.floor(slot / 2) * GOAL_ROW_GAP,
});
