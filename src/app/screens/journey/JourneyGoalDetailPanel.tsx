import { X, Shield, TrendingUp, Calendar, Target, Sparkles, Bike, Plane, CreditCard, Home, Heart, GraduationCap, Wallet } from "lucide-react";
import type { Goal } from "../../../lib/types";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  Bike,
  Plane,
  CreditCard,
  Home,
  Heart,
  Target,
  TrendingUp,
  Shield,
  GraduationCap,
  Wallet,
};

function getIcon(name: string) {
  return ICON_MAP[name] || Target;
}

function getStatusColor(status: string) {
  switch (status) {
    case "complete":
      return "var(--accent)";
    case "in-progress":
      return "var(--amber)";
    default:
      return "var(--tertiary-accent)";
  }
}

interface JourneyGoalDetailPanelProps {
  goal: Goal | null;
  onClose: () => void;
  onComplete: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onPriorityChange: (goalId: string, newPriority: number) => void;
  activeGoalsCount: number;
}

export default function JourneyGoalDetailPanel({
  goal,
  onClose,
  onComplete,
  onDelete,
  onPriorityChange,
  activeGoalsCount,
}: JourneyGoalDetailPanelProps) {
  if (!goal) return null;

  const statusColor = getStatusColor(goal.status || "not-started");
  const Icon = getIcon(goal.icon);

  return (
    <div
      className="absolute top-0 right-0 h-full w-full md:w-[360px] p-4 md:p-6 space-y-5 shadow-2xl z-30 overflow-y-auto transform transition-transform duration-300"
      style={{
        background: "var(--surface-tint)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderLeft: "1px solid var(--border)",
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <h3
          className="text-xl font-bold text-[var(--card-foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Goal Details
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--card-foreground)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center text-center py-4">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
          style={{
            background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
            color: statusColor,
            boxShadow: `0 0 30px color-mix(in srgb, ${statusColor} 30%, transparent)`,
          }}
        >
          <Icon size={40} className="icon-wireframe" strokeWidth={1.5} />
        </div>
        <h2
          className="text-2xl font-bold mb-1 text-[var(--card-foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {goal.name || "Goal"}
        </h2>
        <div className="text-[13px] font-medium uppercase tracking-wider text-[var(--secondary)] mb-4">
          {(goal.status || "not-started").replace("-", " ")}
        </div>

        <div
          className="text-4xl font-extrabold slashed-zero tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: statusColor,
          }}
        >
          ₹{(goal.targetAmount || 0).toLocaleString("en-IN")}
        </div>
      </div>

      <div
        className="p-4 rounded-2xl"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[var(--secondary)]">
            Overall Progress
          </span>
          <span className="text-sm font-bold text-[var(--card-foreground)]">
            {(goal.targetAmount || 0) > 0
              ? Math.round(
                  ((goal.currentAmount || 0) /
                    (goal.targetAmount || 1)) *
                    100,
                )
              : 0}
            %
          </span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--progress-inactive)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${(goal.targetAmount || 0) > 0 ? Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100) : 0}%`,
              backgroundColor: statusColor,
              boxShadow: `0 0 10px ${statusColor}`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className="p-4 rounded-2xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
            style={{
              background: "var(--surface-hover)",
              color: "var(--accent)",
            }}
          >
            <Shield size={16} />
          </div>
          <div className="text-xs font-medium mb-1 text-[var(--secondary)]">
            Saved So Far
          </div>
          <div className="text-lg font-bold text-[var(--card-foreground)] slashed-zero">
            ₹{(goal.currentAmount || 0).toLocaleString("en-IN")}
          </div>
        </div>
        <div
          className="p-4 rounded-2xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
            style={{
              background: "var(--surface-hover)",
              color: "var(--tertiary-accent)",
            }}
          >
            <TrendingUp size={16} />
          </div>
          <div className="text-xs font-medium mb-1 text-[var(--secondary)]">
            Remaining
          </div>
          <div className="text-lg font-bold text-[var(--card-foreground)] slashed-zero">
            ₹
            {Math.max(
              0,
              (goal.targetAmount || 0) -
                (goal.currentAmount || 0),
            ).toLocaleString("en-IN")}
          </div>
        </div>
        <div
          className="p-4 rounded-2xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
            style={{
              background: "var(--surface-hover)",
              color: "var(--amber)",
            }}
          >
            <Calendar size={16} />
          </div>
          <div className="text-xs font-medium mb-1 text-[var(--secondary)]">
            Timeline
          </div>
          <div className="text-lg font-bold text-[var(--card-foreground)]">
            {goal.timelineMonths || 12} months
          </div>
        </div>
        <div
          className="p-4 rounded-2xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
            style={{
              background: "var(--surface-hover)",
              color: "var(--tertiary-accent)",
            }}
          >
            <Target size={16} />
          </div>
          <div className="text-xs font-medium mb-1 text-[var(--secondary)]">
            Monthly Req.
          </div>
          <div className="text-lg font-bold text-[var(--card-foreground)] slashed-zero">
            ₹
            {Math.round(
              Math.max(
                0,
                (goal.targetAmount || 0) -
                  (goal.currentAmount || 0),
              ) / Math.max(1, goal.timelineMonths || 12),
            ).toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {goal.status !== "complete" && (
        <div
          className="p-4 rounded-2xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-xs font-medium mb-2 text-[var(--secondary)]">
            Goal Priority
          </div>
          <select
            value={goal.priority}
            onChange={(e) =>
              onPriorityChange(goal.id, parseInt(e.target.value, 10))
            }
            className="w-full px-3 py-2 rounded-xl outline-none text-[var(--card-foreground)]"
            style={{
              background: "var(--surface-tint)",
              border: "1px solid var(--border)",
            }}
          >
            {Array.from(
              { length: Math.max(activeGoalsCount, 1) },
              (_, i) => i + 1,
            ).map((priority) => (
              <option
                key={`priority-${goal.id}-${priority}`}
                value={priority}
              >{`Priority ${priority}`}</option>
            ))}
          </select>
          <div
            className="text-[11px] mt-2"
            style={{ color: "var(--secondary)" }}
          >
            Brighter node glow means higher priority.
          </div>
        </div>
      )}

      <div className="space-y-3 pt-4 mt-auto">
        {goal.status !== "complete" && (
          <button
            onClick={() => onComplete(goal.id)}
            className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_var(--accent-glow)]"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--on-accent)",
              fontFamily: "var(--font-body)",
            }}
          >
            <Sparkles size={18} />
            Mark Complete
          </button>
        )}
        <button
          onClick={() => onDelete(goal.id)}
          className="w-full py-3 rounded-xl font-semibold transition-colors hover:bg-[var(--surface-hover)] text-sm"
          style={{ color: "var(--red)", fontFamily: "var(--font-body)" }}
        >
          Delete Goal
        </button>
      </div>
    </div>
  );
}