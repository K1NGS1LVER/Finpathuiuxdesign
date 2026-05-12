import { Plus, Sparkles, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useFinPathStore } from "@/lib/store";

interface GoalCategory {
  name: string;
  color: string;
  subtle: string;
  text: string;
  icon: string;
}

const GOAL_CATEGORIES: Record<string, GoalCategory> = {
  emergency: { name: "Emergency Fund", color: "var(--accent)", subtle: "var(--accent-subtle)", text: "var(--accent-text)", icon: "🛡️" },
  travel: { name: "Travel", color: "var(--secondary-accent)", subtle: "var(--secondary-accent-subtle)", text: "var(--secondary-accent-text)", icon: "✈️" },
  home: { name: "Home", color: "var(--tertiary-accent)", subtle: "var(--tertiary-accent-subtle)", text: "var(--tertiary-accent-text)", icon: "🏠" },
  car: { name: "Vehicle", color: "var(--amber)", subtle: "var(--amber-subtle)", text: "var(--amber-text)", icon: "🚗" },
  career: { name: "Education", color: "var(--accent)", subtle: "var(--accent-subtle)", text: "var(--accent-text)", icon: "📚" },
  debt: { name: "Debt Payoff", color: "var(--red)", subtle: "var(--red-subtle)", text: "var(--red-text)", icon: "💳" },
};

const fmt = (n: number) => n.toLocaleString("en-IN");
const fmtCompact = (n: number) => {
  if (n >= 100_000) {
    const lakh = n / 100_000;
    return `₹${lakh.toFixed(lakh >= 10 ? 0 : 1)}L`;
  }
  if (n >= 1_000) {
    const k = (n / 1_000).toFixed(n >= 10_000 ? 0 : 1);
    return `₹${k}K`;
  }
  return `₹${fmt(n)}`;
};

export default function Journey() {
  const navigate = useNavigate();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const income = useFinPathStore((s) => s.income);
  const goals = useFinPathStore((s) => s.goals) || [];
  const updateGoal = useFinPathStore((s) => s.updateGoal);
  const addGoal = useFinPathStore((s) => s.addGoal);

  const activeGoals = goals.filter((g) => g.status !== "complete");
  const selectedGoal = goals.find((g) => g.id === selectedGoalId) || activeGoals[0] || null;

  const goalCategories = useMemo(
    () =>
      goals.map((goal, idx) => {
        const baseColors = [
          { color: "var(--accent)", subtle: "var(--accent-subtle)", text: "var(--accent-text)" },
          { color: "var(--secondary-accent)", subtle: "var(--secondary-accent-subtle)", text: "var(--secondary-accent-text)" },
          { color: "var(--tertiary-accent)", subtle: "var(--tertiary-accent-subtle)", text: "var(--tertiary-accent-text)" },
          { color: "var(--amber)", subtle: "var(--amber-subtle)", text: "var(--amber-text)" },
          { color: "var(--red)", subtle: "var(--red-subtle)", text: "var(--red-text)" },
        ];
        const color = baseColors[idx % baseColors.length];
        return { ...goal, ...color };
      }),
    [goals]
  );

  return (
    <div className="max-w-[1400px] mx-auto relative text-[var(--foreground)] page-animate">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex items-end justify-between">
        <div>
          <p className="text-label text-tertiary">Your Financial Roadmap</p>
          <h1 className="text-title text-card-foreground tracking-[0.15em] mt-1">Journey</h1>
        </div>
        <button
          onClick={() => navigate("/journey")}
          className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          style={{
            background: "var(--accent)",
            color: "var(--on-accent)",
            boxShadow: "0 4px 16px var(--accent-glow)",
          }}
        >
          <Plus size={16} />
          Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        /* Empty State */
        <div className="bento-card flex flex-col items-center justify-center py-20 relative">
          <div
            className="absolute pointer-events-none rounded-full opacity-10"
            style={{
              width: 300,
              height: 300,
              background: "var(--accent)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "var(--accent-subtle)",
              boxShadow: "0 0 32px var(--accent-glow)",
            }}
          >
            <AlertTriangle size={32} className="icon-wireframe" style={{ color: "var(--accent)" }} />
          </div>
          <h2 className="text-display text-card-foreground mb-2 text-center">No goals yet</h2>
          <p className="text-secondary text-center max-w-md mb-6">
            Set your first goal to map your financial journey and track progress.
          </p>
          <button
            onClick={() => navigate("/journey")}
            className="px-6 py-3 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              background: "var(--accent)",
              color: "var(--on-accent)",
              boxShadow: "0 4px 20px var(--accent-glow)",
            }}
          >
            + Add Your First Goal
          </button>
        </div>
      ) : (
        /* Main Journey Grid */
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Canvas with Income + Goals + SVG Connectors */}
          <div className="col-span-12 lg:col-span-8 bento-card relative overflow-hidden p-8 min-h-[540px]">
            {/* Dot grid background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                opacity: 0.5,
              }}
            />

            {/* Income Node (left) */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
              <div
                className="w-32 h-32 rounded-full flex flex-col items-center justify-center text-white relative"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--secondary-accent))",
                  boxShadow: "0 16px 40px var(--accent-glow)",
                  animation: "pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              >
                <span style={{ fontSize: 28 }}>💰</span>
                <p style={{ fontSize: 10, marginTop: 6, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Income</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginTop: 2 }} className="slashed-zero">
                  ₹{fmt(income.total)}
                </p>
              </div>
            </div>

            {/* Goal Cards (right column) */}
            <div className="absolute right-8 top-8 bottom-8 flex flex-col gap-3 justify-center max-w-[280px]">
              {goalCategories.map((goal, idx) => {
                const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                const isSelected = selectedGoalId === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoalId(goal.id)}
                    className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all duration-250"
                    style={{
                      background: isSelected ? goal.subtle : "var(--card)",
                      border: `1.5px solid ${isSelected ? goal.color : "var(--border)"}`,
                      boxShadow: isSelected ? `0 8px 24px ${goal.color}33` : "var(--shadow-sm)",
                      transform: isSelected ? "translateX(-4px)" : "none",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{
                        background: goal.subtle,
                        color: goal.color,
                      }}
                    >
                      {GOAL_CATEGORIES[goal.category]?.icon || "🎯"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-card-foreground">{goal.name}</p>
                      <p className="text-xs text-tertiary mt-0.5">₹{fmt(goal.monthlyAllocation || Math.round(goal.targetAmount / Math.max(1, goal.timelineMonths)))}/mo</p>
                    </div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: goal.text }} className="slashed-zero text-right flex-shrink-0">
                      {progress}%
                    </p>
                  </button>
                );
              })}
            </div>

            {/* SVG Bezier Curves */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
              {goalCategories.map((goal, idx) => {
                const total = goalCategories.length;
                const yPercent = 50 + ((idx + 0.5 - total / 2) * (100 - 16)) / total;
                const isSelected = selectedGoalId === goal.id;
                return (
                  <path
                    key={goal.id}
                    d={`M 160 50% C 350 50%, 360 ${yPercent}%, 540 ${yPercent}%`}
                    stroke={goal.color}
                    strokeWidth="2"
                    fill="none"
                    opacity={isSelected ? 0.8 : 0.25}
                    style={{
                      transition: "opacity 250ms ease",
                      animation: `draw-line 1.2s ease-out forwards`,
                      animationDelay: `${idx * 80}ms`,
                    }}
                  />
                );
              })}
            </svg>
          </div>

          {/* Right: Goal Detail Panel */}
          {selectedGoal && (
            <div className="col-span-12 lg:col-span-4 bento-card p-7 relative overflow-hidden">
              <div
                className="absolute pointer-events-none rounded-full opacity-5"
                style={{
                  width: 200,
                  height: 200,
                  background: "var(--secondary-accent)",
                  filter: "blur(60px)",
                  top: "-20%",
                  right: "-20%",
                }}
              />

              <div className="relative z-10">
                {/* Goal Header */}
                <div className="flex items-start gap-3 mb-6">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      background: selectedGoal.subtle,
                      color: selectedGoal.color,
                    }}
                  >
                    {GOAL_CATEGORIES[selectedGoal.category]?.icon || "🎯"}
                  </div>
                  <div>
                    <p className="text-label text-tertiary">{selectedGoal.category || "Goal"}</p>
                    <h3 className="text-heading text-card-foreground font-bold" style={{ fontFamily: "var(--font-display)" }}>
                      {selectedGoal.name}
                    </h3>
                  </div>
                </div>

                {/* Progress Gauge (Semicircle) */}
                <div className="text-center py-6 mb-6">
                  <svg viewBox="0 0 200 100" className="w-full max-w-[240px] mx-auto mb-2" style={{ display: "block" }}>
                    <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="var(--surface-hover)" strokeWidth="12" strokeLinecap="round" />
                    <path
                      d="M 20 90 A 80 80 0 0 1 180 90"
                      fill="none"
                      stroke={selectedGoal.color}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="251.3"
                      strokeDashoffset={251.3 - ((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100 / 100) * 251.3}
                      style={{
                        transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)",
                        filter: `drop-shadow(0 0 8px ${selectedGoal.color})`,
                      }}
                    />
                  </svg>
                  <div style={{ marginTop: -10 }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 700, color: selectedGoal.text }} className="slashed-zero">
                      {Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)}%
                    </p>
                    <p style={{ fontSize: 12, color: "var(--tertiary)" }} className="slashed-zero">
                      {fmtCompact(selectedGoal.currentAmount)} of {fmtCompact(selectedGoal.targetAmount)}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {[
                    ["Monthly", `₹${fmt(selectedGoal.monthlyAllocation || Math.round(selectedGoal.targetAmount / Math.max(1, selectedGoal.timelineMonths)))}`],
                    ["Timeline", `${selectedGoal.timelineMonths} mo`],
                    ["Remaining", fmtCompact(Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount))],
                    ["Priority", `#${selectedGoal.priority}`],
                  ].map(([label, value]) => (
                    <div key={label} className="p-3 rounded-xl" style={{ background: "var(--surface-hover)" }}>
                      <p style={{ fontSize: 11, color: "var(--tertiary)" }}>{label}</p>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--card-foreground)", marginTop: 2 }} className="slashed-zero">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Penny Button */}
                <button
                  className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "var(--penny-accent-subtle)",
                    border: "1px solid var(--penny-insight-border)",
                    color: "var(--penny-accent)",
                  }}
                >
                  <Sparkles size={16} />
                  Ask Penny about this goal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
