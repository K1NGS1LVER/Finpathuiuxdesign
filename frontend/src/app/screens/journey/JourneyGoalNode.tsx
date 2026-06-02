import { memo, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Goal } from '@/lib/types';
import { getGoalIcon } from "./icon-map";
import { DRAG_CLICK_THRESHOLD } from "./constants";

const nodeVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 22 } },
  visibleStatic: { opacity: 1, scale: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.18 } },
};

export function getStatusColor(status: string) {
  switch (status) {
    case "complete":
      return "var(--accent)";
    case "in-progress":
      return "var(--amber)";
    default:
      return "var(--tertiary-accent)";
  }
}

function getStatusGlow(status: string) {
  switch (status) {
    case "complete":
      return "var(--accent-glow)";
    case "in-progress":
      return "var(--amber-subtle)";
    default:
      return "var(--tertiary-accent-glow)";
  }
}

interface JourneyGoalNodeProps {
  goal: Goal;
  index: number;
  x: number;
  y: number;
  isDragging: boolean;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent, nodeId: string) => void;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
}

function JourneyGoalNode({
  goal,
  index,
  x,
  y,
  isDragging,
  onPointerDown,
  onClick,
  formatCurrency,
}: JourneyGoalNodeProps) {
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const rippleCounter = useRef(0);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const progress =
    goal.targetAmount > 0
      ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
      : 0;
  const statusColor = getStatusColor(goal.status);
  const statusGlow = getStatusGlow(goal.status);
  const isActiveGoal = goal.status !== "complete";
  const Icon = getGoalIcon(goal.icon);

  const handleRipple = (e: React.PointerEvent) => {
    if (!isActiveGoal) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: ++rippleCounter.current });
  };

  return (
    <motion.div
      data-goal-id={goal.id}
      className="absolute cursor-pointer pointer-events-auto"
      style={{ left: x, top: y, width: 132 }}
      variants={nodeVariants}
      initial="hidden"
      animate={isActiveGoal ? "visible" : "visibleStatic"}
      exit="exit"
      whileHover={isDragging || !isActiveGoal ? undefined : { scale: 1.05 }}
      whileTap={isDragging || !isActiveGoal ? undefined : { scale: 0.93, transition: { type: "spring", stiffness: 400, damping: 20 } }}
      onPointerDown={handleRipple}
      onMouseDown={(e) => {
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        onPointerDown(e, goal.id);
      }}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        onPointerDown(e, goal.id);
      }}
      onClick={(e) => {
        if (dragStartPos.current) {
          const moved = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);
          dragStartPos.current = null;
          if (moved > DRAG_CLICK_THRESHOLD) return;
        }
        onClick();
      }}
      onTouchEnd={(e) => {
        if (dragStartPos.current && e.changedTouches.length > 0) {
          const t = e.changedTouches[0];
          const moved = Math.hypot(t.clientX - dragStartPos.current.x, t.clientY - dragStartPos.current.y);
          dragStartPos.current = null;
          if (moved <= DRAG_CLICK_THRESHOLD) onClick();
        }
      }}
    >
      {/* Float wrapper — CSS animation, paused while dragging */}
      <div
        className="node-float"
        style={{
          animationDelay: `${index * 0.35}s`,
          animationDuration: `${3.5 + index * 0.4}s`,
          animationPlayState: isDragging || !isActiveGoal ? "paused" : "running",
        }}
      >
        <div
          className="p-3 rounded-2xl bento-card"
          style={{
            border: `2px solid ${statusColor}`,
            boxShadow: isActiveGoal
              ? "var(--shadow-md)"
              : `0 0 20px ${statusGlow}, var(--shadow-md)`,
            position: "relative",
            overflow: "hidden",
            minHeight: 168,
          }}
        >
          {/* Ripple */}
          {ripple && (
            <motion.div
              key={ripple.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                translateX: "-50%",
                translateY: "-50%",
                background: `radial-gradient(circle, ${statusColor}28, transparent 70%)`,
                zIndex: 0,
              }}
              initial={{ width: 0, height: 0, opacity: 0.8 }}
              animate={{ width: 200, height: 200, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              onAnimationComplete={() => setRipple(null)}
            />
          )}

          {/* Content — above ripple */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
              style={{
                background: "color-mix(in srgb, var(--surface-hover) 80%, transparent)",
                color: statusColor,
              }}
            >
              <Icon size={18} className="icon-wireframe" />
            </div>
            <div
              className="font-semibold mb-1 text-[var(--card-foreground)] font-body-family"
              style={{ fontSize: 'var(--text-sm)', lineHeight: 1.2 }}
            >
              {goal.name}
            </div>
            {isActiveGoal && (
              <div
                className="font-medium mb-1 text-accent-color"
                style={{ fontSize: 'var(--text-2xs)', letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                Priority P{goal.priority}
              </div>
            )}
            <div
              className="font-bold mb-2 text-[var(--card-foreground)] font-display-family"
              style={{ fontSize: 'var(--text-lg)' }}
            >
              {formatCurrency(goal.targetAmount)}
            </div>
            <div
              className="text-xs mb-1.5 text-[var(--secondary)] font-body-family"
              style={{ fontSize: 'var(--text-2xs)' }}
            >
              {progress}% complete
            </div>
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--progress-inactive)" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${progress}%`, backgroundColor: statusColor }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function areEqual(prev: JourneyGoalNodeProps, next: JourneyGoalNodeProps) {
  if (prev.isDragging !== next.isDragging) return false;
  if (prev.index !== next.index) return false;
  if (prev.x !== next.x) return false;
  if (prev.y !== next.y) return false;
  // Pointer/click handlers are stable refs from the canvas/goals hooks.
  // We intentionally ignore identity so hover state changes in the parent
  // don't cascade re-renders through every node.
  const a = prev.goal;
  const b = next.goal;
  return (
    a.id === b.id &&
    a.status === b.status &&
    a.currentAmount === b.currentAmount &&
    a.targetAmount === b.targetAmount &&
    a.color === b.color &&
    a.priority === b.priority &&
    a.icon === b.icon &&
    a.name === b.name
  );
}

export default memo(JourneyGoalNode, areEqual);
