import {
  TrendingUp,
  Wallet,
  Target,
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useFinPathStore } from "../../lib/store";

interface DashboardProps {
  onPennyClick: () => void;
}

export default function Dashboard({ onPennyClick }: DashboardProps) {
  const navigate = useNavigate();
  const [health, setHealth] = useState(0);

  const income = useFinPathStore((s) => s.income);
  const expenses = useFinPathStore((s) => s.expenses);
  const debts = useFinPathStore((s) => s.debts);
  const storeGoals = useFinPathStore((s) => s.goals);
  const savings = useFinPathStore((s) => s.savings);
  const healthScore = useFinPathStore((s) => s.healthScore);
  const plan = useFinPathStore((s) => s.plan);
  const monthlySurplusReserve = useFinPathStore((s) => s.monthlySurplusReserve);
  const pendingGoalDecisions = useFinPathStore((s) => s.pendingGoalDecisions);

  useEffect(() => {
    // Animate to real health score
    const score = healthScore?.overall ?? 0;
    const timer = setTimeout(() => setHealth(score), 300);
    return () => clearTimeout(timer);
  }, [healthScore]);

  const surplus = income.total - expenses.total - debts.totalMonthly;
  const pendingFreedAmount = pendingGoalDecisions.reduce(
    (sum, decision) => sum + Math.max(0, decision.freedMonthlyAmount),
    0,
  );
  const month0 = plan?.months?.[0];
  const allocatedToGoals = month0
    ? Object.values(month0.goalAllocations).reduce(
        (sum, amount) => sum + Math.max(0, amount || 0),
        0,
      )
    : Math.max(
        0,
        storeGoals
          .filter(
            (goal) => goal.status !== "complete" && goal.category !== "debt",
          )
          .reduce(
            (sum, goal) => sum + Math.max(0, goal.monthlyAllocation || 0),
            0,
          ),
      );
  const reservedSurplus = month0?.reservedSurplus ?? monthlySurplusReserve;
  const pendingSurplus = month0?.pendingSurplus ?? pendingFreedAmount;
  const freeSurplus = Math.max(
    0,
    surplus - allocatedToGoals - reservedSurplus - pendingSurplus,
  );
  const fmt = (n: number) => n.toLocaleString("en-IN");

  const primaryMetrics = [
    {
      label: "Monthly Income",
      value: fmt(income.total),
      sublabel: "All sources",
      change: "+0%",
      positive: true,
    },
    {
      label: "Monthly Surplus",
      value: fmt(freeSurplus),
      sublabel:
        pendingSurplus > 0
          ? `${fmt(pendingSurplus)} awaiting decision`
          : `After goals ${fmt(allocatedToGoals)} and reserve ${fmt(reservedSurplus)}`,
      change:
        freeSurplus >= 0
          ? "+" + Math.round((freeSurplus / (income.total || 1)) * 100) + "%"
          : Math.round((freeSurplus / (income.total || 1)) * 100) + "%",
      positive: freeSurplus >= 0,
    },
  ];

  const activeGoals = storeGoals.filter((g) => g.status !== "complete");
  const doneGoals = storeGoals.filter((g) => g.status === "complete");
  const debtGoal = activeGoals.find((g) => g.category === "debt");
  const prioritizedActiveGoals = activeGoals
    .slice()
    .sort((a, b) => a.priority - b.priority);

  const secondaryMetrics = [
    {
      label: "Monthly Income",
      value: fmt(income.total),
      change: "+0%",
      icon: TrendingUp,
    },
    {
      label: "Total Savings",
      value: fmt(savings),
      change: "+0%",
      icon: Wallet,
    },
    {
      label: "Active Goals",
      value: String(activeGoals.length),
      change: doneGoals.length > 0 ? `${doneGoals.length} done` : "none done",
      icon: Target,
    },
    {
      label: "Expenses",
      value: fmt(expenses.total),
      change: "-0%",
      icon: Calendar,
    },
    {
      label: "Reserve / Month",
      value: fmt(reservedSurplus + pendingSurplus),
      change:
        pendingSurplus > 0
          ? "decision pending"
          : reservedSurplus > 0
            ? "surplus mode"
            : "reinvest mode",
      icon: Wallet,
    },
  ];

  const visibleProgressGoals = [
    ...(debtGoal ? [debtGoal] : []),
    ...prioritizedActiveGoals.filter((g) => g.id !== debtGoal?.id),
  ].slice(0, 3);

  const goals = visibleProgressGoals.map((g) => ({
    name: g.name,
    current: g.currentAmount,
    target: g.targetAmount,
    progress:
      g.targetAmount > 0
        ? Math.round((g.currentAmount / g.targetAmount) * 100)
        : 0,
  }));

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (health / 100) * circumference;

  return (
    <div className="max-w-[1400px] mx-auto relative text-[var(--foreground)]">
      <style>{`
        @keyframes dash {
          from { stroke-dashoffset: ${circumference}; }
          to { stroke-dashoffset: ${offset}; }
        }
      `}</style>

      {/* Ambient Blobs - Static instead of animating infinitely */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="data-blob w-[500px] h-[500px] top-20 right-1/4 rounded-full bg-[var(--violet)] opacity-10 mix-blend-screen" />
        <div className="data-blob w-[400px] h-[400px] bottom-40 left-1/4 rounded-full bg-[var(--lime)] opacity-10 mix-blend-screen" />
        <div className="data-blob w-[300px] h-[300px] top-1/2 right-1/3 rounded-full bg-[var(--blue)] opacity-10 mix-blend-screen" />
      </div>

      {/* Header - Minimal */}
      <div className="mb-6 md:mb-8 relative z-10">
        <h1 className="text-display slashed-zero text-[var(--foreground)]">
          Dashboard
        </h1>
      </div>

      {/* Bento Grid - Asymmetric Layout */}
      <div className="grid grid-cols-12 gap-4 md:gap-4 relative z-10">
        {/* Hero Cards */}
        {primaryMetrics.map((metric, i) => (
          <div
            key={i}
            className="col-span-12 md:col-span-6 lg:col-span-6 bento-card flex flex-col justify-between min-h-[160px]"
          >
            {/* Small Label */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-label text-[var(--secondary)]">
                {metric.label}
              </span>
              <span
                className="pill-button text-xs font-semibold"
                style={{
                  background: metric.positive ? "var(--lime)" : "var(--red)",
                  color: "#050F1C",
                }}
              >
                {metric.change}
              </span>
            </div>

            {/* Giant Number */}
            <div className="mt-auto">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-medium text-[var(--secondary)]">
                  ₹
                </span>
                <h2 className="text-display slashed-zero text-[var(--card-foreground)]">
                  {metric.value}
                </h2>
              </div>
              <p className="text-sm text-[var(--tertiary)]">
                {metric.sublabel}
              </p>
            </div>

            {/* Background Blob inside card */}
            <div
              className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full pointer-events-none opacity-20 blur-2xl"
              style={{
                backgroundColor: metric.positive
                  ? "var(--lime)"
                  : "var(--violet)",
              }}
            />
          </div>
        ))}

        {/* Secondary Metrics Grid (8 columns) */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {secondaryMetrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div
                key={i}
                className="bento-card p-4 md:p-5 flex flex-row items-center justify-between min-h-[80px]"
              >
                {/* Left side: Icon and Label */}
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-[var(--card-foreground)] flex-shrink-0"
                    style={{ background: "var(--surface-hover)" }}
                  >
                    <Icon size={18} className="icon-wireframe" />
                  </div>
                  <span className="text-sm md:text-base font-medium text-[var(--secondary)] leading-tight truncate">
                    {metric.label}
                  </span>
                </div>

                {/* Right side: Values */}
                <div className="flex flex-col items-end flex-shrink-0 pl-2">
                  <div className="flex items-baseline gap-1 mb-1">
                    {metric.label !== "Active Goals" && (
                      <span className="text-xs font-medium text-[var(--secondary)]">
                        ₹
                      </span>
                    )}
                    <h3
                      className="text-lg md:text-xl lg:text-xl font-bold slashed-zero text-[var(--card-foreground)] tracking-tight"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {metric.value}
                    </h3>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    {metric.change.startsWith("+") ? (
                      <ArrowUpRight
                        size={12}
                        style={{ color: "var(--lime-text)" }}
                      />
                    ) : metric.change.startsWith("-") ? (
                      <ArrowDownRight
                        size={12}
                        style={{ color: "var(--red-text)" }}
                      />
                    ) : null}
                    <span className="text-xs font-semibold slashed-zero text-[var(--card-foreground)]">
                      {metric.change}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Health Score Ring (4 columns) */}
        <div className="col-span-12 lg:col-span-4 bento-card flex flex-col items-center justify-center min-h-[220px]">
          <span className="text-label text-[var(--secondary)] mb-4">
            Financial Health
          </span>

          <div className="relative w-32 h-32 mb-2">
            <svg
              className="transform -rotate-90 w-full h-full"
              viewBox="0 0 160 160"
            >
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth="12"
                strokeDasharray="6 6"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--lime)"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
                strokeLinecap="round"
                style={{
                  animation: "dash 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
                  filter: "drop-shadow(0 0 4px rgba(176, 255, 9, 0.3))",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className="text-3xl font-bold slashed-zero text-[var(--card-foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {health}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--tertiary)] font-semibold mt-1">
                Score
              </div>
            </div>
          </div>
          <p className="text-xs text-[var(--secondary)] text-center font-medium mt-2">
            Great progress this month
          </p>
        </div>

        {/* Goals Progress (Full Width) */}
        <div className="col-span-12 bento-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading slashed-zero text-[var(--card-foreground)]">
              Active Goals
            </h3>
            <button
              onClick={() => navigate("/journey")}
              className="pill-button text-xs font-semibold px-4 py-2"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {goals.map((goal, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shadow-sm"
                      style={{
                        backgroundColor:
                          i === 0
                            ? "var(--lime)"
                            : i === 1
                              ? "var(--violet)"
                              : "var(--blue)",
                      }}
                    />
                    <span className="text-sm font-semibold text-[var(--card-foreground)]">
                      {goal.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold slashed-zero text-[var(--card-foreground)]">
                    {goal.progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div
                  className="h-4 rounded-full overflow-hidden relative"
                  style={{ background: "var(--progress-inactive)" }}
                >
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${goal.progress}%`,
                      backgroundColor:
                        i === 0
                          ? "var(--lime)"
                          : i === 1
                            ? "var(--violet)"
                            : "var(--blue)",
                    }}
                  />
                  <div className="absolute inset-0 hatching-pattern mix-blend-overlay" />
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-medium text-[var(--secondary)] slashed-zero">
                    ₹{(goal.current / 1000).toFixed(0)}K
                  </span>
                  <span className="text-xs font-medium text-[var(--tertiary)] slashed-zero">
                    / ₹{(goal.target / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 md:col-span-6 bento-card">
          <h3 className="text-heading mb-4 slashed-zero text-[var(--card-foreground)]">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/journey")}
              className="pill-button py-4 text-sm font-semibold"
            >
              + Add Goal
            </button>
            <button
              onClick={() => navigate("/month")}
              className="pill-button py-4 text-sm font-semibold"
            >
              Monthly Plan
            </button>
            <button
              onClick={onPennyClick}
              className="pill-button py-4 text-sm font-semibold active shadow-lg"
            >
              <Zap size={14} className="inline mr-2" />
              Ask Penny
            </button>
            <button
              onClick={() => navigate("/progress")}
              className="pill-button py-4 text-sm font-semibold"
            >
              View Progress
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 md:col-span-6 bento-card">
          <h3 className="text-heading mb-4 slashed-zero text-[var(--card-foreground)]">
            Recent Activity
          </h3>
          <div className="space-y-1">
            {prioritizedActiveGoals.slice(0, 3).map((goal, i) => {
              const monthly =
                goal.monthlyAllocation ||
                Math.round(
                  (goal.targetAmount - goal.currentAmount) /
                    Math.max(1, goal.timelineMonths),
                );
              return (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-3 rounded-lg transition-colors cursor-default hover:bg-[var(--surface-hover)]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--card-foreground)]">
                      {goal.name} allocation
                    </p>
                    <p className="text-xs text-[var(--tertiary)] font-medium mt-1">
                      {goal.status === "complete"
                        ? "Completed"
                        : `${goal.timelineMonths} months left`}
                    </p>
                  </div>
                  <span
                    className="text-lg font-bold slashed-zero text-[var(--card-foreground)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    ₹{monthly.toLocaleString("en-IN")}/mo
                  </span>
                </div>
              );
            })}
            {prioritizedActiveGoals.length === 0 && (
              <div
                className="p-4 text-center text-sm text-[var(--secondary)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                No goals set yet. Add one from Journey!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
