import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import { Target, Plus, Trash2, Coins, CheckCircle, Info } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { fireConfetti, prefetchConfetti } from "@/lib/confetti";
import { useFinPathStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cardEntry, cardHover } from "@/app/components/motion-variants";
import { formatInrCompact } from "@/lib/format";
import { useJourneyCanvas } from "./journey/useJourneyCanvas";
import { useJourneyGoals } from "./journey/useJourneyGoals";
import JourneyIncomeNode from "./journey/JourneyIncomeNode";
import JourneyGoalNode, { getStatusColor } from "./journey/JourneyGoalNode";
import JourneyAddGoalModal from "./journey/JourneyAddGoalModal";
import JourneyGoalDetailPanel from "./journey/JourneyGoalDetailPanel";
import JourneyIncomeDetailPanel from "./journey/JourneyIncomeDetailPanel";
import {
  COMPLETION_RING_DURATION,
  COMPLETION_RING_SIZE,
  CONFETTI_COLORS,
  CONFIRM_TIMEOUT_MS,
  NODE_CENTER_X,
  NODE_CENTER_Y,
  TRAVELING_DOT_OPACITY,
} from "./journey/constants";

function StatPill({
  icon: Icon,
  label,
  value,
  color,
  subtle,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number; style?: CSSProperties; className?: string }>;
  label: string;
  value: string | number;
  color: string;
  subtle: string;
}) {
  return (
    <div
      className="journey-stat-pill"
      style={{
        background: subtle,
        border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
      }}
    >
      <Icon size={12} strokeWidth={2} style={{ color }} />
      <span
        className="slashed-zero tabular-nums"
        style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color }}
      >
        {value}
      </span>
      <span style={{ fontSize: "var(--text-2xs)", color: "var(--tertiary)" }}>{label}</span>
    </div>
  );
}

function getDotProps(priority: number): { size: number; dur: number } {
  if (priority === 1) return { size: 6, dur: 1.8 };
  if (priority === 2) return { size: 5, dur: 2.8 };
  return { size: 4, dur: 4.2 };
}

function edgeEnd(from: { x: number; y: number }, to: { x: number; y: number }) {
  return {
    x1: from.x + NODE_CENTER_X,
    y1: from.y + NODE_CENTER_Y,
    x2: to.x + NODE_CENTER_X,
    y2: to.y + NODE_CENTER_Y,
  };
}

// Memoized traveling dot: animation keyframes only change when its endpoints actually move,
// not on every parent render (e.g. hover, panel open).
interface TravelingDotProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

const TravelingDot = memo(function TravelingDot({
  fromX,
  fromY,
  toX,
  toY,
  size,
  duration,
  delay,
  color,
}: TravelingDotProps) {
  const reduced = useReducedMotion();
  const half = size / 2;
  const xs = useMemo(() => [fromX - half, toX - half], [fromX, toX, half]);
  const ys = useMemo(() => [fromY - half, toY - half], [fromY, toY, half]);

  // Reduced motion: render a single static dot at the midpoint, no animation,
  // no trailers, no infinite repeat.
  if (reduced) {
    const midX = (fromX + toX) / 2 - half;
    const midY = (fromY + toY) / 2 - half;
    return (
      <div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          top: 0,
          left: 0,
          background: color,
          boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size}px ${color}`,
          opacity: TRAVELING_DOT_OPACITY,
          transform: `translate(${midX}px, ${midY}px)`,
        }}
      />
    );
  }

  return (
    <>
      {/* Leader dot */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          top: 0,
          left: 0,
          background: color,
          boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size}px ${color}`,
          opacity: TRAVELING_DOT_OPACITY,
        }}
        animate={{ x: xs, y: ys }}
        transition={{ duration, repeat: Infinity, ease: "linear", delay }}
      />
      {/* Trailing fade tail — 3 trailers each lagging 60ms behind the previous */}
      {[1, 2, 3].map((i) => {
        const trailSize = size * (1 - i * 0.18);
        const trailOpacity = TRAVELING_DOT_OPACITY * (1 - i * 0.28);
        return (
          <motion.div
            key={`trail-${i}`}
            className="absolute rounded-full"
            style={{
              width: trailSize,
              height: trailSize,
              top: 0,
              left: 0,
              background: color,
              boxShadow: `0 0 ${trailSize * 2}px ${color}, 0 0 ${trailSize}px ${color}`,
              opacity: trailOpacity,
            }}
            animate={{ x: xs, y: ys }}
            transition={{
              duration,
              repeat: Infinity,
              ease: "linear",
              delay: delay + i * 0.06,
            }}
          />
        );
      })}
    </>
  );
});

export default function Journey() {
  const income = useFinPathStore((s) => s.income);
  const updateGoal = useFinPathStore((s) => s.updateGoal);

  // Warm the confetti chunk during idle time after the canvas mounts so the
  // first goal-completion beat lands without a network round-trip.
  useEffect(() => {
    const warm = () => {
      prefetchConfetti();
    };
    type IdleScheduler = (cb: () => void) => number;
    type IdleCanceller = (id: number) => void;
    const ric = (window as unknown as { requestIdleCallback?: IdleScheduler }).requestIdleCallback;
    const cic = (window as unknown as { cancelIdleCallback?: IdleCanceller }).cancelIdleCallback;
    if (ric) {
      const id = ric(warm);
      return () => cic?.(id);
    }
    const id = window.setTimeout(warm, 0);
    return () => window.clearTimeout(id);
  }, []);

  const goals = useJourneyGoals();
  const canvas = useJourneyCanvas(goals.sortedGoals);
  const monthlyTotal = useMemo(
    () => goals.activeGoals.reduce((sum, g) => sum + g.monthlyAllocation, 0),
    [goals.activeGoals],
  );
  const [showIncomePanel, setShowIncomePanel] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    [],
  );

  // Fire visual side effects (confetti) here, not in the data hook.
  const handleCompleteGoal = (goalId: string) => {
    const el = canvas.canvasRef.current?.querySelector<HTMLElement>(`[data-goal-id="${goalId}"]`);
    const rect = el?.getBoundingClientRect();
    goals.handleComplete(goalId);
    const origin = rect
      ? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        }
      : { x: 0.5, y: 0.4 };
    void fireConfetti({
      particleCount: 55,
      spread: 50,
      startVelocity: 22,
      ticks: 80,
      origin,
      colors: CONFETTI_COLORS,
      scalar: 0.85,
      gravity: 1.2,
    });
  };

  const handleCompleteMonth = (goalId: string) => {
    const goal = goals.storeGoals.find((g) => g.id === goalId);
    if (!goal) return;
    const allocation =
      goal.monthlyAllocation ||
      Math.round(
        Math.max(0, goal.targetAmount - goal.currentAmount) /
          Math.max(1, goal.timelineMonths),
      );
    const newAmount = Math.min(goal.targetAmount, goal.currentAmount + allocation);
    const justCompleted = newAmount >= goal.targetAmount;
    updateGoal(goalId, {
      checkedThisMonth: true,
      currentAmount: newAmount,
      status: justCompleted ? "complete" : newAmount > 0 ? "in-progress" : "not-started",
    });
  };

  const handleRemoveCompletedClick = () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      confirmTimer.current = setTimeout(() => setConfirmRemove(false), CONFIRM_TIMEOUT_MS);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmRemove(false);
    goals.handleRemoveCompleted();
  };

  // Single transform applied via CSS: pan and zoom in one wrapper. Children use LOCAL coords.
  const worldTransform = `translate(${canvas.panOffset.x * canvas.zoom}px, ${canvas.panOffset.y * canvas.zoom}px) scale(${canvas.zoom})`;
  const svgWorldTransform = `translate(${canvas.panOffset.x * canvas.zoom} ${canvas.panOffset.y * canvas.zoom}) scale(${canvas.zoom})`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="journey-eyebrow">Financial Roadmap</p>
          <h2 className="journey-page-title slashed-zero">Goals</h2>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {goals.completedGoals.length > 0 && (
            <button
              onClick={handleRemoveCompletedClick}
              aria-label={
                confirmRemove
                  ? `Confirm remove ${goals.completedGoals.length} completed goals`
                  : `Remove ${goals.completedGoals.length} completed goals`
              }
              className="px-3 md:px-4 py-2 h-10 md:h-12 rounded-xl flex items-center gap-2 justify-center transition-all hover:scale-105"
              style={{
                background: "color-mix(in srgb, var(--surface-hover) 70%, transparent)",
                border: "1px solid var(--border)",
                color: confirmRemove ? "var(--red)" : "var(--secondary)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Trash2 size={16} className="md:w-[18px] md:h-[18px] icon-wireframe" />
              <span className="font-semibold text-xs md:text-sm hidden sm:inline font-body">
                {confirmRemove
                  ? `Confirm? (${goals.completedGoals.length})`
                  : `Clear (${goals.completedGoals.length})`}
              </span>
            </button>
          )}

          <button
            onClick={() => {
              goals.setAddGoalError("");
              goals.setShowAddModal(true);
            }}
            aria-label="Add goal"
            className="px-3 md:px-4 py-2 h-10 md:h-12 rounded-xl flex items-center gap-2 justify-center transition-transform hover:scale-105 shadow-lg bg-accent text-on-accent"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            <span className="font-semibold text-sm md:text-base hidden sm:inline font-body">Add Goal</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <StatPill
          icon={Target}
          value={goals.activeGoals.length}
          label={`active goal${goals.activeGoals.length !== 1 ? "s" : ""}`}
          color="var(--accent)"
          subtle="var(--accent-subtle)"
        />
        <StatPill
          icon={Coins}
          value={`${formatInrCompact(monthlyTotal)}/mo`}
          label="commitment"
          color="var(--secondary-accent)"
          subtle="var(--secondary-accent-subtle)"
        />
        {goals.completedGoals.length > 0 && (
          <StatPill
            icon={CheckCircle}
            value={goals.completedGoals.length}
            label="completed"
            color="var(--green)"
            subtle="var(--green-subtle)"
          />
        )}
        <div
          className="ml-auto flex items-center gap-1.5"
          style={{ fontSize: "var(--text-2xs)", color: "var(--tertiary)" }}
        >
          <Info size={11} className="icon-wireframe" style={{ color: "var(--tertiary)" }} />
          Click a node to view details
        </div>
      </div>

      <div className="h-[calc(100vh-240px)] flex flex-col md:flex-row gap-4">
        {goals.sortedGoals.length > 0 && (
        <div
          ref={canvas.canvasRef}
          className={`flex-1 rounded-2xl relative overflow-hidden bg-card border ${canvas.isPanning ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            borderColor: "var(--canvas-border)",
            backgroundColor: "var(--card)",
            // Dot grid as CSS radial-gradient — single repaint per zoom change,
            // no SVG <pattern> recalculation on every pan tick.
            backgroundImage: "radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)",
            backgroundSize: `${20 * canvas.zoom}px ${20 * canvas.zoom}px`,
            backgroundPosition: `${canvas.panOffset.x * canvas.zoom}px ${canvas.panOffset.y * canvas.zoom}px`,
          }}
          onMouseDown={canvas.handleCanvasPointerDown}
          onMouseMove={canvas.handlePointerMove}
          onMouseUp={canvas.handlePointerUp}
          onMouseLeave={canvas.handlePointerUp}
          onTouchStart={canvas.handleCanvasPointerDown}
          onTouchMove={canvas.handlePointerMove}
          onTouchEnd={canvas.handlePointerUp}
        >
          {/* SVG edges (world-transformed). Dot grid moved to the wrapper's background-image. */}
          <svg className="canvas-bg absolute inset-0 w-full h-full pointer-events-none">
            <g transform={svgWorldTransform}>
              {goals.sortedGoals.map((goal) => {
                const goalPos = canvas.getNodePos(goal.id);
                const { x1, y1, x2, y2 } = edgeEnd(canvas.incomePos, goalPos);
                return (
                  <line
                    key={`conn-${goal.id}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className={goal.status === "complete" ? "stroke-accent" : "stroke-secondary"}
                    strokeWidth="3"
                    strokeDasharray={goal.status === "complete" ? "0" : "8,4"}
                    opacity={goal.status === "complete" ? 0.8 : 0.4}
                  />
                );
              })}
            </g>
          </svg>

          {/* Single world-transformed wrapper holding dots, rings, and node cards. */}
          <div
            style={{
              transform: worldTransform,
              transformOrigin: "0 0",
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            {/* Traveling dots */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
              {goals.sortedGoals.map((goal, i) => {
                if (goal.status === "complete") return null;
                const goalPos = canvas.getNodePos(goal.id);
                const { x1, y1, x2, y2 } = edgeEnd(canvas.incomePos, goalPos);
                const { size, dur } = getDotProps(goal.priority);
                return (
                  <TravelingDot
                    key={`dot-${goal.id}`}
                    fromX={x1}
                    fromY={y1}
                    toX={x2}
                    toY={y2}
                    size={size}
                    duration={dur}
                    delay={i * 0.5}
                    color={getStatusColor(goal.status)}
                  />
                );
              })}
            </div>

            {/* Completion rings */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
              <AnimatePresence>
                {goals.completingIds.map((id) => {
                  const pos = canvas.getNodePos(id);
                  return (
                    <motion.div
                      key={id}
                      className="absolute rounded-full"
                      style={{
                        left: pos.x + NODE_CENTER_X,
                        top: pos.y + NODE_CENTER_Y,
                        translateX: "-50%",
                        translateY: "-50%",
                        border: "1.5px solid var(--accent)",
                        boxShadow: "0 0 16px var(--accent-glow)",
                        background: "transparent",
                      }}
                      initial={{ width: 0, height: 0, opacity: 0.9 }}
                      animate={{
                        width: COMPLETION_RING_SIZE,
                        height: COMPLETION_RING_SIZE,
                        opacity: 0,
                      }}
                      transition={{
                        duration: COMPLETION_RING_DURATION,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Node cards */}
            <div className="absolute inset-0" style={{ zIndex: 3, pointerEvents: "none" }}>
              <JourneyIncomeNode
                x={canvas.incomePos.x}
                y={canvas.incomePos.y}
                dragging={canvas.dragging === "income"}
                income={income}
                formatCurrency={formatInrCompact}
                onPointerDown={canvas.handlePointerDown}
                onClick={() => {
                  goals.setSelectedGoalId(null);
                  setShowIncomePanel(true);
                }}
              />

              <AnimatePresence>
                {goals.sortedGoals.map((goal, i) => {
                  const pos = canvas.getNodePos(goal.id);
                  return (
                    <JourneyGoalNode
                      key={goal.id}
                      goal={goal}
                      index={i}
                      x={pos.x}
                      y={pos.y}
                      isDragging={canvas.dragging === goal.id}
                      onPointerDown={canvas.handlePointerDown}
                      onClick={() => {
                        setShowIncomePanel(false);
                        goals.setSelectedGoalId(goal.id);
                      }}
                      formatCurrency={formatInrCompact}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="journey-canvas-hint">
            <Info size={11} className="icon-wireframe" />
            Scroll to zoom · Drag to pan · Click node to view
          </div>
        </div>
        )}
        {goals.sortedGoals.length === 0 && (
          <motion.div
            className="flex-1 rounded-2xl flex items-center justify-center p-6 border"
            style={{ borderColor: "var(--canvas-border)", backgroundColor: "var(--card)" }}
            variants={cardEntry}
            initial="initial"
            animate="animate"
          >
            <div
              className="flex flex-col items-center text-center"
              style={{ maxWidth: 440 }}
            >
              <div
                aria-hidden="true"
                style={{ position: "relative", width: 240, height: 96, marginBottom: "var(--space-4)" }}
              >
                <svg
                  width="240"
                  height="96"
                  style={{ position: "absolute", inset: 0 }}
                >
                  <line x1="36" y1="48" x2="92" y2="20" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="36" y1="48" x2="120" y2="48" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="36" y1="48" x2="92" y2="76" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 4" />
                </svg>
                <div
                  className="skeleton"
                  style={{
                    position: "absolute",
                    left: 4,
                    top: 28,
                    width: 64,
                    height: 40,
                    borderRadius: "var(--radius-base)",
                  }}
                />
                {[
                  { left: 80, top: 4, delay: 0 },
                  { left: 116, top: 32, delay: 0.4 },
                  { left: 80, top: 60, delay: 0.8 },
                ].map((p, i) => (
                  <motion.div
                    key={i}
                    className="skeleton"
                    style={{
                      position: "absolute",
                      left: p.left,
                      top: p.top,
                      width: 56,
                      height: 32,
                      borderRadius: "var(--radius-base)",
                    }}
                    animate={{ opacity: [0.4, 0.65, 0.4] }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: p.delay,
                    }}
                  />
                ))}
              </div>

              <Target
                size={24}
                className="icon-wireframe"
                style={{ color: "var(--secondary)", opacity: 0.5, marginBottom: "var(--space-2)" }}
              />
              <p className="text-label" style={{ color: "var(--tertiary)", marginBottom: "var(--space-2)" }}>
                Your map is empty
              </p>
              <h3
                className="text-display"
                style={{ color: "var(--card-foreground)", marginBottom: "var(--space-3)" }}
              >
                Plant your first goal
              </h3>
              <p
                className="font-body"
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--secondary)",
                  lineHeight: 1.6,
                  marginBottom: "var(--space-5)",
                }}
              >
                Every goal you add becomes a node on your map, fed by the income you already track. Start with something close &mdash; a phone, a trip, an emergency cushion.
              </p>
              <motion.button
                type="button"
                onClick={() => {
                  goals.setAddGoalError("");
                  goals.setShowAddModal(true);
                }}
                aria-label="Add your first goal"
                className="px-5 py-3 rounded-xl flex items-center gap-2 justify-center shadow-lg bg-accent text-on-accent"
                whileHover={cardHover}
              >
                <Plus size={18} />
                <span className="font-semibold text-sm font-body">Add your first goal</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        <JourneyAddGoalModal
          show={goals.showAddModal}
          onClose={goals.closeAddModal}
          storeGoals={goals.storeGoals}
          activeGoals={goals.activeGoals}
          monthlySurplus={goals.monthlySurplus}
          existingMonthlyNeed={goals.existingMonthlyNeed}
          budgetRemaining={goals.budgetRemaining}
          addGoalError={goals.addGoalError}
          setAddGoalError={goals.setAddGoalError}
          customName={goals.customName}
          setCustomName={goals.setCustomName}
          customTarget={goals.customTarget}
          setCustomTarget={goals.setCustomTarget}
          customMonths={goals.customMonths}
          setCustomMonths={goals.setCustomMonths}
          onAddPreset={goals.handleAddPreset}
          onAddCustom={goals.handleAddCustom}
        />

        {showIncomePanel && (
          <JourneyIncomeDetailPanel
            income={income}
            onClose={() => setShowIncomePanel(false)}
            formatCurrency={formatInrCompact}
          />
        )}

        <JourneyGoalDetailPanel
          goal={goals.selectedGoal}
          onClose={() => goals.setSelectedGoalId(null)}
          onComplete={handleCompleteGoal}
          onCompleteMonth={handleCompleteMonth}
          onDelete={goals.handleDelete}
          onPriorityChange={goals.handlePriorityChange}
          activeGoalsCount={goals.activeGoals.length}
        />
      </div>
    </div>
  );
}
