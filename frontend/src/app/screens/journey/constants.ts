// Grid layout for goal nodes
export const GOAL_COL0_X = 350;
export const GOAL_COL_GAP = 210;
export const GOAL_ROW0_Y = 60;
export const GOAL_ROW_GAP = 260; // > tallest card so same-column slots never overlap
export const NODE_WIDTH = 132;
export const NODE_HEIGHT = 168;
export const NODE_CENTER_X = NODE_WIDTH / 2;
export const NODE_CENTER_Y = NODE_HEIGHT / 2;
/** @deprecated use NODE_CENTER_X / NODE_CENTER_Y */
export const NODE_CENTER = NODE_CENTER_X;
export const INCOME_NODE_POS = { x: 80, y: 180 } as const;

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
