import { Target, TrendingUp, Shield, Sparkles, Calendar, Lightbulb } from "lucide-react";
import type { GoalSelection } from "./useOnboardingForm";

interface OnboardingStepGoalsProps {
  selectedGoals: Record<string, GoalSelection>;
  sortedSelectedGoals: [string, GoalSelection][];
  goalSelectionCaption: string;
  getPriorityGlow: (priority: number) => string;
  onToggleGoal: (goalName: string) => void;
  onUpdateGoalAmount: (goalName: string, amount: string) => void;
}

interface GoalOptionDef {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  colorText: string;
  colorSubtle: string;
}

const GOAL_OPTIONS: GoalOptionDef[] = [
  {
    name: "Dream Bike",
    icon: Target,
    color: "var(--accent)",
    colorText: "var(--accent-text)",
    colorSubtle: "var(--accent-subtle)",
  },
  {
    name: "Investment",
    icon: TrendingUp,
    color: "var(--tertiary-accent)",
    colorText: "var(--tertiary-accent-text)",
    colorSubtle: "var(--tertiary-accent-subtle)",
  },
  {
    name: "Emergency Fund",
    icon: Shield,
    color: "var(--tertiary-accent)",
    colorText: "var(--tertiary-accent-text)",
    colorSubtle: "var(--tertiary-accent-subtle)",
  },
  {
    name: "Wedding",
    icon: Sparkles,
    color: "var(--amber)",
    colorText: "var(--amber-text)",
    colorSubtle: "var(--amber-subtle)",
  },
  {
    name: "Vacation",
    icon: Calendar,
    color: "var(--accent)",
    colorText: "var(--accent-text)",
    colorSubtle: "var(--accent-subtle)",
  },
  {
    name: "Upskill Course",
    icon: Lightbulb,
    color: "var(--tertiary-accent)",
    colorText: "var(--tertiary-accent-text)",
    colorSubtle: "var(--tertiary-accent-subtle)",
  },
];

function GoalOptionCard({
  goal,
  isSelected,
  priority,
  targetAmount,
  onToggle,
  onUpdateAmount,
  getPriorityGlow,
}: {
  goal: GoalOptionDef;
  isSelected: boolean;
  priority: number;
  targetAmount: string;
  onToggle: () => void;
  onUpdateAmount: (amount: string) => void;
  getPriorityGlow: (p: number) => string;
}) {
  const Icon = goal.icon;

  return (
    <div
      className={`goal-option flex flex-col overflow-hidden rounded-xl md:rounded-2xl transition-all ${isSelected ? "selected" : ""}`}
      style={{
        background: "var(--card)",
        border: isSelected ? "2px solid var(--accent)" : "2px solid var(--border)",
        boxShadow: isSelected ? getPriorityGlow(priority) : "none",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="p-4 md:p-5 font-medium flex flex-col items-center gap-2.5 md:gap-3 text-[var(--card-foreground)] w-full h-full"
        style={{ fontFamily: "var(--font-body)" }}
        aria-pressed={isSelected}
        aria-label={`${goal.name}${isSelected ? ` — Priority ${priority}` : ""}`}
      >
        <div
          className="w-11 h-11 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-transform duration-300"
          style={{
            backgroundColor: goal.colorSubtle,
            color: goal.colorText,
          }}
        >
          <Icon size={20} className="icon-wireframe md:w-6 md:h-6" />
        </div>
        <span className="text-xs md:text-sm slashed-zero font-semibold">{goal.name}</span>
        {isSelected && (
          <span
            className="text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: "var(--surface-tint)",
              border: "1px solid var(--border)",
            }}
          >
            Priority P{priority}
          </span>
        )}
      </button>

      {isSelected && (
        <div className="px-4 pb-4 md:px-5 md:pb-5 w-full">
          <input
            type="text"
            value={targetAmount}
            onChange={(e) => onUpdateAmount(e.target.value)}
            placeholder="Target amount"
            className="w-full py-2.5 px-3 text-sm md:text-base font-bold text-center rounded-lg outline-none slashed-zero"
            style={{
              fontFamily: "var(--font-display)",
              background: "var(--surface-tint)",
              border: "2px solid var(--border)",
              color: "var(--card-foreground)",
            }}
            onClick={(e) => e.stopPropagation()}
            inputMode="numeric"
            aria-label={`Target amount for ${goal.name}`}
          />
        </div>
      )}
    </div>
  );
}

function SelectedOrderChips({
  sortedGoals,
  getPriorityGlow,
}: {
  sortedGoals: [string, GoalSelection][];
  getPriorityGlow: (p: number) => string;
}) {
  if (sortedGoals.length === 0) return null;

  return (
    <div
      className="p-4 rounded-xl md:rounded-2xl"
      style={{
        background: "var(--surface-tint)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="text-[11px] md:text-xs font-semibold mb-2.5" style={{ color: "var(--secondary)" }}>
        Selected order
      </div>
      <div className="flex flex-wrap gap-2">
        {sortedGoals.map(([name, data]) => (
          <span
            key={`rank-${name}`}
            className="px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--card-foreground)",
              boxShadow: getPriorityGlow(data.priority),
            }}
          >
            P{data.priority} · {name}
          </span>
        ))}
      </div>
      <div className="text-[10px] mt-2.5" style={{ color: "var(--secondary)" }}>
        Glow intensity legend: P1 strong, P2 medium, P3 soft.
      </div>
    </div>
  );
}

function CustomGoalRow({
  isSelected,
  priority,
  targetAmount,
  onToggle,
  onUpdateAmount,
  getPriorityGlow,
}: {
  isSelected: boolean;
  priority: number;
  targetAmount: string;
  onToggle: () => void;
  onUpdateAmount: (amount: string) => void;
  getPriorityGlow: (p: number) => string;
}) {
  return (
    <div
      className={`goal-option w-full rounded-xl md:rounded-2xl overflow-hidden transition-all flex flex-col ${isSelected ? "selected" : ""}`}
      style={{
        background: "var(--card)",
        border: isSelected ? "2px solid var(--accent)" : "2px solid var(--border)",
        boxShadow: isSelected ? getPriorityGlow(priority) : "none",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 md:p-5 font-medium flex items-center justify-center gap-3 text-[var(--card-foreground)]"
        style={{ fontFamily: "var(--font-body)" }}
        aria-pressed={isSelected}
        aria-label={`Custom goal${isSelected ? ` — Priority ${priority}` : ""}`}
      >
        <div
          className="w-11 h-11 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-transform duration-300"
          style={{
            backgroundColor: "var(--accent-glow)",
            color: "var(--accent-text)",
          }}
        >
          <Target size={20} className="icon-wireframe md:w-6 md:h-6" />
        </div>
        <span className="text-sm md:text-base slashed-zero font-semibold">Custom Goal</span>
        {isSelected && (
          <span
            className="text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: "var(--surface-tint)",
              border: "1px solid var(--border)",
            }}
          >
            Priority P{priority}
          </span>
        )}
      </button>

      {isSelected && (
        <div className="px-4 pb-4 md:px-5 md:pb-5 w-full flex gap-2.5">
          <input
            type="text"
            value={targetAmount}
            onChange={(e) => onUpdateAmount(e.target.value)}
            placeholder="Target Amount"
            className="flex-1 px-4 py-2.5 text-sm md:text-base font-bold text-center rounded-lg outline-none slashed-zero"
            style={{
              fontFamily: "var(--font-display)",
              background: "var(--surface-tint)",
              border: "2px solid var(--border)",
              color: "var(--card-foreground)",
            }}
            inputMode="numeric"
            aria-label="Custom goal target amount"
          />
        </div>
      )}
    </div>
  );
}

export default function OnboardingStepGoals({
  selectedGoals,
  sortedSelectedGoals,
  goalSelectionCaption,
  getPriorityGlow,
  onToggleGoal,
  onUpdateGoalAmount,
}: OnboardingStepGoalsProps) {
  return (
    <div className="space-y-4 md:space-y-5">
      <div
        className="p-4 rounded-xl md:rounded-2xl text-xs md:text-sm"
        style={{
          background: "var(--surface-tint)",
          border: "1px solid var(--border)",
          color: "var(--secondary)",
        }}
        aria-live="polite"
      >
        {goalSelectionCaption}
      </div>

      <SelectedOrderChips sortedGoals={sortedSelectedGoals} getPriorityGlow={getPriorityGlow} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4" role="group" aria-label="Goal options">
        {GOAL_OPTIONS.map((goal) => {
          const selectedData = selectedGoals[goal.name];
          const isSelected = !!selectedData;
          const priority = selectedData?.priority || 0;

          return (
            <GoalOptionCard
              key={goal.name}
              goal={goal}
              isSelected={isSelected}
              priority={priority}
              targetAmount={selectedData?.targetAmount || ""}
              onToggle={() => onToggleGoal(goal.name)}
              onUpdateAmount={(amount) => onUpdateGoalAmount(goal.name, amount)}
              getPriorityGlow={getPriorityGlow}
            />
          );
        })}
      </div>

      <CustomGoalRow
        isSelected={!!selectedGoals["Custom"]}
        priority={selectedGoals["Custom"]?.priority || 0}
        targetAmount={selectedGoals["Custom"]?.targetAmount || ""}
        onToggle={() => onToggleGoal("Custom")}
        onUpdateAmount={(amount) => onUpdateGoalAmount("Custom", amount)}
        getPriorityGlow={getPriorityGlow}
      />
    </div>
  );
}