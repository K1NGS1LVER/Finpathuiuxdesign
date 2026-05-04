import { Target, Bike, Plane, CreditCard, Home, Heart, TrendingUp, Shield, GraduationCap, Wallet } from "lucide-react";
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

function getPriorityGlow(priority: number) {
  if (priority <= 1) return "0 0 40px var(--accent-glow)";
  if (priority === 2) return "0 0 26px var(--accent-glow)";
  return "0 0 16px var(--accent-glow)";
}

interface JourneyGoalNodeProps {
  goal: Goal;
  x: number;
  y: number;
  isDragging: boolean;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent, nodeId: string) => void;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
}

export default function JourneyGoalNode({
  goal,
  x,
  y,
  isDragging,
  onPointerDown,
  onClick,
  formatCurrency,
}: JourneyGoalNodeProps) {
  const progress =
    goal.targetAmount > 0
      ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
      : 0;
  const statusColor = getStatusColor(goal.status);
  const statusGlow = getStatusGlow(goal.status);
  const isActiveGoal = goal.status !== "complete";
  const Icon = getIcon(goal.icon);

  return (
    <div
      className="absolute cursor-pointer hover:scale-105 pointer-events-auto"
      style={{
        left: x,
        top: y,
        width: 160,
        transition: isDragging ? "none" : "transform 0.2s ease",
      }}
      onMouseDown={(e) => onPointerDown(e, goal.id)}
      onTouchStart={(e) => onPointerDown(e, goal.id)}
      onClick={() => {
        if (!isDragging) onClick();
      }}
    >
      <div
        className="p-4 rounded-2xl bento-card"
        style={{
          border: `2px solid ${statusColor}`,
          boxShadow: isActiveGoal
            ? `${getPriorityGlow(goal.priority)}, var(--shadow-md)`
            : `0 0 20px ${statusGlow}, var(--shadow-md)`,
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
          style={{
            background:
              "color-mix(in srgb, var(--surface-hover) 80%, transparent)",
            color: statusColor,
          }}
        >
          <Icon size={24} className="icon-wireframe" />
        </div>
        <div
          className="font-bold mb-1 text-[var(--card-foreground)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {goal.name}
        </div>
        {isActiveGoal && (
          <div
            className="text-[10px] font-bold mb-1"
            style={{ color: "var(--accent-text)" }}
          >
            Priority P{goal.priority}
          </div>
        )}
        <div
          className="text-2xl font-bold mb-2 text-[var(--card-foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {formatCurrency(goal.targetAmount)}
        </div>
        <div
          className="text-xs mb-2 text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {progress}% complete
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--progress-inactive)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}