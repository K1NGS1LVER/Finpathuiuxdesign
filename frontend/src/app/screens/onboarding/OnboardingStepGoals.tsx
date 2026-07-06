import { Target, TrendingUp, Shield, Sparkles, Calendar, Lightbulb, Plus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GoalSelection } from "./useOnboardingForm";

interface OnboardingStepGoalsProps {
  selectedGoals: Record<string, GoalSelection>;
  sortedSelectedGoals: [string, GoalSelection][];
  customGoals: [string, GoalSelection][];
  goalSelectionCaption: string;
  getPriorityGlow: (priority: number) => string;
  onToggleGoal: (goalName: string) => void;
  onUpdateGoalAmount: (goalName: string, amount: string) => void;
  onAddCustomGoal: () => void;
  onUpdateGoalName: (key: string, name: string) => void;
  onRemoveCustomGoal: (key: string) => void;
}

interface GoalOptionDef {
  name: string;
  icon: LucideIcon;
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
        className="p-4 md:p-5 font-medium flex flex-col items-center gap-2.5 md:gap-3 text-[var(--card-foreground)] w-full h-full font-body-family"
        aria-pressed={isSelected}
        aria-label={`${goal.name}${isSelected ? ` — Priority ${priority}` : ""}`}
      >
        {/* Icon bg/color: goal.colorSubtle / goal.colorText are CSS var strings (runtime from data) — kept inline */}
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
          <span className="text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full priority-chip">
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
            className="w-full py-2.5 px-3 text-sm md:text-base font-bold text-center rounded-lg outline-none slashed-zero breakdown-input"
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
    <div className="p-4 rounded-xl md:rounded-2xl stat-card">
      <div className="text-[11px] md:text-xs font-semibold mb-2.5 text-secondary-color">
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
            P{data.priority} · {name.startsWith("custom-") ? (data.customName || "Custom Goal") : name}
          </span>
        ))}
      </div>
      <div className="text-[10px] mt-2.5 text-secondary-color">
        Glow intensity legend: P1 strong, P2 medium, P3 soft.
      </div>
    </div>
  );
}

function CustomGoalRow({
  goalKey,
  customName,
  targetAmount,
  priority,
  onUpdateName,
  onUpdateAmount,
  onRemove,
  getPriorityGlow,
}: {
  goalKey: string;
  customName: string;
  targetAmount: string;
  priority: number;
  onUpdateName: (name: string) => void;
  onUpdateAmount: (amount: string) => void;
  onRemove: () => void;
  getPriorityGlow: (p: number) => string;
}) {
  return (
    <div
      className="goal-option selected w-full rounded-xl md:rounded-2xl overflow-hidden transition-all flex flex-col"
      style={{
        background: "var(--card)",
        border: "2px solid var(--accent)",
        boxShadow: getPriorityGlow(priority),
      }}
    >
      <div className="p-4 md:p-5 flex items-center gap-3">
        <div
          className="w-11 h-11 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: "var(--accent-glow)",
            color: "var(--accent-text)",
          }}
        >
          <Target size={20} className="icon-wireframe md:w-6 md:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={customName}
            onChange={(e) => onUpdateName(e.target.value)}
            placeholder="Goal name"
            className="w-full py-2 px-3 text-sm md:text-base font-semibold rounded-lg outline-none breakdown-input"
            aria-label="Custom goal name"
            maxLength={40}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full priority-chip">
            P{priority}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: "var(--surface-tint)", color: "var(--secondary)" }}
            aria-label={`Remove ${customName || "custom goal"}`}
          >
            <X size={14} className="icon-wireframe" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 md:px-5 md:pb-5 w-full">
        <input
          type="text"
          value={targetAmount}
          onChange={(e) => onUpdateAmount(e.target.value)}
          placeholder="Target amount (₹)"
          className="w-full py-2.5 px-3 text-sm md:text-base font-bold text-center rounded-lg outline-none slashed-zero breakdown-input"
          inputMode="numeric"
          aria-label={`Target amount for ${customName || "custom goal"}`}
        />
      </div>
    </div>
  );
}

export default function OnboardingStepGoals({
  selectedGoals,
  sortedSelectedGoals,
  customGoals,
  goalSelectionCaption,
  getPriorityGlow,
  onToggleGoal,
  onUpdateGoalAmount,
  onAddCustomGoal,
  onUpdateGoalName,
  onRemoveCustomGoal,
}: OnboardingStepGoalsProps) {
  const totalSelected = Object.keys(selectedGoals).length;

  return (
    <div className="space-y-4 md:space-y-5">
      <div
        className="p-4 rounded-xl md:rounded-2xl text-xs md:text-sm info-banner"
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

      {customGoals.map(([key, data]) => (
        <CustomGoalRow
          key={key}
          goalKey={key}
          customName={data.customName || ""}
          targetAmount={data.targetAmount}
          priority={data.priority}
          onUpdateName={(name) => onUpdateGoalName(key, name)}
          onUpdateAmount={(amount) => onUpdateGoalAmount(key, amount)}
          onRemove={() => onRemoveCustomGoal(key)}
          getPriorityGlow={getPriorityGlow}
        />
      ))}

      {totalSelected < 3 && (
        <button
          type="button"
          onClick={onAddCustomGoal}
          className="w-full py-3.5 rounded-xl md:rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: "var(--card)",
            border: "2px dashed var(--border)",
            color: "var(--accent)",
          }}
        >
          <Plus size={16} className="icon-wireframe" />
          Add Custom Goal
        </button>
      )}
    </div>
  );
}
