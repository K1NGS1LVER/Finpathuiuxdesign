import { useState, useEffect, useRef } from "react";
import { X, CheckCircle, Trash2, Trophy, Pencil } from "lucide-react";
import type { Goal } from '@/lib/types';
import { getGoalIcon } from "./icon-map";
import { useFinPathStore } from "@/lib/store";

function monthsToYYYYMM(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function yyyymmToMonths(value: string): number {
  const [y, m] = value.split("-").map(Number);
  const target = new Date(y, (m ?? 1) - 1, 1);
  const now = new Date();
  const diff =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  return Math.max(1, diff);
}

function GoalRing({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setAnimated(pct), 300);
    return () => clearTimeout(id);
  }, [pct]);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle cx={size / 2} cy={size / 2} r={r} className="journey-goal-ring-track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="journey-goal-ring-fill"
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={circ - (animated / 100) * circ}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          className="slashed-zero tabular-nums"
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--card-foreground)",
          }}
        >
          {animated}%
        </span>
      </div>
    </div>
  );
}

function getStatusMeta(status: string): { bg: string; border: string; text: string; dot: string; label: string } {
  if (status === "complete")
    return {
      bg: "var(--green-subtle)",
      border: "color-mix(in srgb, var(--green) 27%, transparent)",
      text: "var(--green-text)",
      dot: "var(--green)",
      label: "Goal completed!",
    };
  if (status === "in-progress")
    return {
      bg: "var(--amber-subtle)",
      border: "color-mix(in srgb, var(--amber) 27%, transparent)",
      text: "var(--amber-text)",
      dot: "var(--amber)",
      label: "In progress",
    };
  return {
    bg: "var(--tertiary-accent-subtle)",
    border: "color-mix(in srgb, var(--tertiary-accent) 27%, transparent)",
    text: "var(--tertiary-accent-text)",
    dot: "var(--tertiary-accent)",
    label: "Not started yet",
  };
}

interface JourneyGoalDetailPanelProps {
  goal: Goal | null;
  onClose: () => void;
  onComplete: (goalId: string) => void;
  onCompleteMonth: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onPriorityChange: (goalId: string, newPriority: number) => void;
  activeGoalsCount: number;
}

export default function JourneyGoalDetailPanel({
  goal,
  onClose,
  onComplete,
  onCompleteMonth,
  onDelete,
  onPriorityChange,
  activeGoalsCount,
}: JourneyGoalDetailPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmCompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftTarget, setDraftTarget] = useState(0);
  const [draftMonths, setDraftMonths] = useState(0);

  const updateGoal = useFinPathStore((s) => s.updateGoal);

  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      if (confirmCompleteTimer.current) clearTimeout(confirmCompleteTimer.current);
    },
    [],
  );

  if (!goal) return null;

  const pct =
    (goal.targetAmount || 0) > 0
      ? Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100)
      : 0;
  const isComplete = goal.status === "complete";
  const statusColor = isComplete
    ? "var(--accent)"
    : goal.status === "in-progress"
      ? "var(--amber)"
      : "var(--tertiary-accent)";
  const statusMeta = getStatusMeta(goal.status || "not-started");
  const Icon = getGoalIcon(goal.icon);

  const monthlyReq = Math.round(
    Math.max(0, (goal.targetAmount || 0) - (goal.currentAmount || 0)) /
      Math.max(1, goal.timelineMonths || 12),
  );

  const stats = [
    {
      label: "Saved",
      value: `₹${(goal.currentAmount || 0).toLocaleString("en-IN")}`,
      color: "var(--card-foreground)",
    },
    {
      label: "Remaining",
      value: `₹${Math.max(0, (goal.targetAmount || 0) - (goal.currentAmount || 0)).toLocaleString("en-IN")}`,
      color: statusColor,
    },
    ...(!isComplete
      ? [
          {
            label: "Monthly",
            value: `₹${monthlyReq.toLocaleString("en-IN")}/mo`,
            color: "var(--accent-text)",
          },
          {
            label: "Timeline",
            value: `${goal.timelineMonths || 12} months`,
            color: "var(--card-foreground)",
          },
        ]
      : []),
  ];

  const draftMonthly = Math.round(
    Math.max(0, draftTarget - (goal.currentAmount || 0)) / Math.max(1, draftMonths)
  );

  const draftValidationError: string | null =
    draftTarget <= 0
      ? "Enter a target amount"
      : draftTarget <= (goal.currentAmount || 0)
      ? `Target must exceed amount already saved (₹${(goal.currentAmount || 0).toLocaleString("en-IN")})`
      : draftMonths < 1
      ? "At least 1 month required"
      : null;

  const isDraftValid = draftValidationError === null;

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmDelete(false);
    onDelete(goal.id);
  };

  const handleCompleteClick = () => {
    if (!confirmComplete) {
      setConfirmComplete(true);
      confirmCompleteTimer.current = setTimeout(() => setConfirmComplete(false), 3000);
      return;
    }
    if (confirmCompleteTimer.current) clearTimeout(confirmCompleteTimer.current);
    setConfirmComplete(false);
    onComplete(goal.id);
  };

  const handleEditClick = () => {
    setDraftTarget(goal.targetAmount);
    setDraftMonths(goal.timelineMonths || 12);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div
      className="absolute top-0 right-0 h-full w-full md:w-[300px] shadow-2xl z-30 overflow-hidden journey-detail-panel"
      style={{ display: "flex", flexDirection: "column" }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
              color: statusColor,
            }}
          >
            <Icon size={16} className="icon-wireframe" />
          </div>
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--card-foreground)",
            }}
          >
            {goal.name || "Goal"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tertiary)", padding: 4 }}
        >
          <X size={16} className="icon-wireframe" />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {!isEditing && (
          <>
            {/* Ring + target amount */}
            <div className="flex items-center gap-4" style={{ marginBottom: 20 }}>
              <GoalRing pct={pct} color={statusColor} size={80} />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "var(--text-2xs)",
                    color: "var(--tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 2,
                  }}
                >
                  Target
                </p>
                <p
                  className="slashed-zero tabular-nums"
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--card-foreground)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  ₹{(goal.targetAmount || 0).toLocaleString("en-IN")}
                </p>
                <div
                  style={{
                    height: 5,
                    borderRadius: "var(--radius-full)",
                    background: "var(--progress-inactive)",
                    overflow: "hidden",
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: statusColor,
                      borderRadius: "var(--radius-full)",
                      transition: "width 1200ms ease",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}
            >
              {stats.map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-base)",
                    background: "var(--surface-tint)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "var(--text-2xs)",
                      color: "var(--tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 4,
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    className="slashed-zero tabular-nums"
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-weight-bold)",
                      color: s.color,
                    }}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Priority buttons (active goals only) */}
            {!isComplete && (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: "var(--text-2xs)",
                    color: "var(--tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  Priority
                </p>
                <div style={{ display: "flex", gap: 6 }}>
                  {Array.from({ length: Math.max(activeGoalsCount, 1) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={`priority-${goal.id}-${p}`}
                      onClick={() => onPriorityChange(goal.id, p)}
                      className={`journey-priority-btn${goal.priority === p ? " active" : ""}`}
                    >
                      P{p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Edit goal — view mode only */}
            {!isComplete && !isEditing && (
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={handleEditClick}
                  className="w-full flex items-center justify-center gap-1.5"
                  style={{
                    padding: "9px",
                    borderRadius: "var(--radius-base)",
                    background: "var(--surface-tint)",
                    border: "1px solid var(--border)",
                    color: "var(--accent)",
                    fontWeight: "var(--font-weight-semibold)",
                    fontSize: "var(--text-xs)",
                    cursor: "pointer",
                    fontFamily: "var(--font-display)",
                    transition: "all 200ms ease",
                  }}
                >
                  <Pencil size={12} className="icon-wireframe" />
                  Edit Goal
                </button>
              </div>
            )}

            {/* Status badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: "var(--radius-base)",
                background: statusMeta.bg,
                border: `1px solid ${statusMeta.border}`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: statusMeta.dot,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: statusMeta.text,
                }}
              >
                {statusMeta.label}
              </span>
            </div>
          </>
        )}
        {isEditing && (
          <>
            {/* Ring + Target Amount input */}
            <div className="flex items-center gap-4" style={{ marginBottom: 20 }}>
              <GoalRing pct={pct} color={statusColor} size={80} />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "var(--text-2xs)",
                    color: "var(--tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  Target Amount (₹)
                </p>
                <input
                  type="number"
                  min={1}
                  value={draftTarget}
                  onChange={(e) => setDraftTarget(Math.max(0, Number(e.target.value)))}
                  className="slashed-zero tabular-nums w-full"
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--card-foreground)",
                    background: "var(--surface-tint)",
                    border: "1px solid var(--accent)",
                    borderRadius: "var(--radius-sm)",
                    padding: "6px 10px",
                    outline: "none",
                    letterSpacing: "-0.02em",
                  }}
                />
              </div>
            </div>

            {/* Timeline — months + date picker, linked */}
            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontSize: "var(--text-2xs)",
                  color: "var(--tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                Timeline
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <p style={{ fontSize: "var(--text-2xs)", color: "var(--tertiary)", marginBottom: 4 }}>
                    Months
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={draftMonths}
                    onChange={(e) => setDraftMonths(Math.max(1, Number(e.target.value)))}
                    className="w-full tabular-nums"
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-weight-bold)",
                      color: "var(--card-foreground)",
                      background: "var(--surface-tint)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "7px 10px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <p style={{ fontSize: "var(--text-2xs)", color: "var(--tertiary)", marginBottom: 4 }}>
                    Target Date
                  </p>
                  <input
                    type="month"
                    min={monthsToYYYYMM(1)}
                    value={monthsToYYYYMM(draftMonths)}
                    onChange={(e) => setDraftMonths(yyyymmToMonths(e.target.value))}
                    className="w-full"
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--card-foreground)",
                      background: "var(--surface-tint)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "7px 8px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <p style={{ fontSize: "var(--text-2xs)", color: "var(--tertiary)", marginTop: 6, fontStyle: "italic" }}>
                ↔ changing either updates the other
              </p>
            </div>

            {/* Live monthly recompute */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-base)",
                  background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                }}
              >
                <p
                  style={{
                    fontSize: "var(--text-2xs)",
                    color: "var(--accent-text)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}
                >
                  New Monthly Needed
                </p>
                <p
                  className="slashed-zero tabular-nums"
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--accent)",
                  }}
                >
                  ₹{draftMonthly.toLocaleString("en-IN")}/mo
                </p>
                <p style={{ fontSize: "var(--text-2xs)", color: "var(--tertiary)", marginTop: 2 }}>
                  updates as you type
                </p>
              </div>
            </div>

            {/* Validation error */}
            {draftValidationError && (
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--red)",
                  marginBottom: 12,
                }}
              >
                {draftValidationError}
              </p>
            )}
          </>
        )}
      </div>

      {/* New lifecycle actions */}
      {!isComplete && (
        <div
          className="flex-shrink-0"
          style={{
            padding: "12px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            onClick={() => !goal.checkedThisMonth && onCompleteMonth(goal.id)}
            disabled={goal.checkedThisMonth === true}
            aria-label={goal.checkedThisMonth ? "Goal already marked complete this month" : "Mark this month's contribution as complete"}
            className="w-full flex items-center justify-center gap-1.5 btn-complete-goal button-press"
            style={{
              padding: "11px",
              borderRadius: "var(--radius-base)",
              fontFamily: "var(--font-display)",
            }}
          >
            <CheckCircle size={16} className="icon-wireframe" />
            {goal.checkedThisMonth ? "✓ Done this month" : "Complete for the Month"}
          </button>
          <button
            onClick={handleCompleteClick}
            className="w-full flex items-center justify-center gap-1.5 button-press"
            style={{
              padding: "11px",
              borderRadius: "var(--radius-base)",
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-semibold)",
              cursor: "pointer",
              transition: "all 200ms ease",
              background: confirmComplete ? "var(--green-subtle)" : "transparent",
              border: `1px solid ${confirmComplete ? "color-mix(in srgb, var(--green) 33%, transparent)" : "color-mix(in srgb, var(--accent) 40%, transparent)"}`,
              color: confirmComplete ? "var(--green-text)" : "var(--accent)",
            }}
          >
            <Trophy size={16} className="icon-wireframe" />
            {confirmComplete ? "Confirm complete?" : "Complete Goal"}
          </button>
        </div>
      )}

      {/* Footer actions */}
      <div
        className="flex-shrink-0"
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <button
          onClick={handleDeleteClick}
          className="w-full flex items-center justify-center gap-1.5"
          style={{
            padding: "9px",
            borderRadius: "var(--radius-base)",
            background: confirmDelete ? "var(--red-subtle)" : "var(--surface-tint)",
            border: `1px solid ${confirmDelete ? "color-mix(in srgb, var(--red) 33%, transparent)" : "var(--border)"}`,
            color: confirmDelete ? "var(--red)" : "var(--tertiary)",
            fontWeight: "var(--font-weight-medium)",
            fontSize: "var(--text-xs)",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            transition: "all 200ms ease",
          }}
        >
          <Trash2 size={12} className="icon-wireframe" />
          {confirmDelete ? "Confirm delete?" : "Delete goal"}
        </button>
      </div>
    </div>
  );
}
