import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  Award,
  Flame,
  Target,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { useFinPathStore } from "../../lib/store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";
import confetti from "canvas-confetti";
import type { Goal } from "../../lib/types";

interface GoalTemplate {
  name: string;
  icon: string;
  category: Goal["category"];
  targetAmount: number;
  timelineMonths: number;
  color: string;
}

interface GoalSetTemplate {
  id: string;
  label: string;
  goals: GoalTemplate[];
}

const GOAL_SET_TEMPLATES: GoalSetTemplate[] = [
  {
    id: "starter",
    label: "Starter Set",
    goals: [
      {
        name: "Emergency Fund",
        icon: "Shield",
        category: "savings",
        targetAmount: 300000,
        timelineMonths: 18,
        color: "var(--blue)",
      },
      {
        name: "Vacation",
        icon: "Plane",
        category: "travel",
        targetAmount: 100000,
        timelineMonths: 10,
        color: "var(--accent)",
      },
    ],
  },
  {
    id: "growth",
    label: "Growth Set",
    goals: [
      {
        name: "Investment",
        icon: "TrendingUp",
        category: "investment",
        targetAmount: 800000,
        timelineMonths: 36,
        color: "var(--blue)",
      },
      {
        name: "Upskill Course",
        icon: "GraduationCap",
        category: "education",
        targetAmount: 180000,
        timelineMonths: 14,
        color: "var(--amber)",
      },
    ],
  },
  {
    id: "family",
    label: "Family Set",
    goals: [
      {
        name: "Home Upgrade",
        icon: "Home",
        category: "home",
        targetAmount: 1200000,
        timelineMonths: 48,
        color: "var(--blue)",
      },
      {
        name: "Family Safety Fund",
        icon: "Heart",
        category: "family",
        targetAmount: 350000,
        timelineMonths: 20,
        color: "var(--accent)",
      },
    ],
  },
];

export default function Progress() {
  const income = useFinPathStore((s) => s.income);
  const expenses = useFinPathStore((s) => s.expenses);
  const debts = useFinPathStore((s) => s.debts);
  const goals = useFinPathStore((s) => s.goals);
  const plan = useFinPathStore((s) => s.plan);
  const healthScore = useFinPathStore((s) => s.healthScore);
  const savings = useFinPathStore((s) => s.savings);
  const investments = useFinPathStore((s) => s.investments);
  const addGoal = useFinPathStore((s) => s.addGoal);
  const updateGoal = useFinPathStore((s) => s.updateGoal);
  const removeGoal = useFinPathStore((s) => s.removeGoal);

  const surplus = income.total - expenses.total - debts.totalMonthly;
  const activeGoals = useMemo(
    () =>
      goals
        .filter((g) => g.status !== "complete")
        .slice()
        .sort((a, b) => a.priority - b.priority),
    [goals],
  );
  const month0 = plan?.months?.[0];
  const reservedSurplus = month0?.reservedSurplus ?? 0;
  const pendingSurplus = month0?.pendingSurplus ?? 0;
  const totalGoalValue = useMemo(
    () => goals.reduce((sum, goal) => sum + Math.max(0, goal.currentAmount), 0),
    [goals],
  );
  const allocatedToGoals = month0
    ? Object.values(month0.goalAllocations).reduce(
        (sum, amount) => sum + Math.max(0, amount || 0),
        0,
      )
    : activeGoals.reduce(
        (sum, goal) => sum + Math.max(0, goal.monthlyAllocation || 0),
        0,
      );
  const freeSurplus = Math.max(
    0,
    surplus - allocatedToGoals - reservedSurplus - pendingSurplus,
  );
  const currentNetWorth = savings + investments + totalGoalValue;

  // Generate a past-to-future net worth timeline from current state and plan.
  const netWorthData = useMemo(() => {
    const monthsBack = 12;
    const currentDate = new Date();
    const monthlyProgress = Math.max(
      1000,
      allocatedToGoals + reservedSurplus + freeSurplus,
    );
    const startingNetWorth = Math.max(
      0,
      currentNetWorth - monthlyProgress * monthsBack,
    );

    const history = Array.from({ length: monthsBack }, (_, index) => {
      const monthsAgo = monthsBack - index;
      const d = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - monthsAgo,
        1,
      );
      const progressRatio = (index + 1) / monthsBack;
      return {
        month: d.toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        }),
        netWorth: Math.round(
          startingNetWorth +
            (currentNetWorth - startingNetWorth) * progressRatio,
        ),
      };
    });

    const currentPoint = {
      month: currentDate.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      }),
      netWorth: Math.round(currentNetWorth),
    };

    if (!plan?.months.length) {
      const projection = [];
      let netWorth = currentNetWorth;
      for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() + i);
        netWorth += freeSurplus;
        projection.push({
          month: d.toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          }),
          netWorth: Math.round(netWorth),
        });
      }
      return [...history, currentPoint, ...projection];
    }

    const projection = plan.months.map((m) => ({
      month: m.date,
      netWorth: m.netWorth,
    }));

    return [...history, currentPoint, ...projection];
  }, [
    allocatedToGoals,
    currentNetWorth,
    freeSurplus,
    plan,
    reservedSurplus,
  ]);

  // Streak counter (simulated based on consecutive goal allocations)
  const streakDays = useMemo(() => {
    const completedGoals = goals.filter((g) => g.status === "complete").length;
    return Math.min(30, 7 + completedGoals * 5);
  }, [goals]);

  // Badges
  const badges = useMemo(() => {
    const list = [];
    if (income.total > 0)
      list.push({
        name: "First Step",
        icon: "🚀",
        desc: "Completed onboarding",
        earned: true,
      });
    if (healthScore && healthScore.overall >= 50)
      list.push({
        name: "Healthy Start",
        icon: "💪",
        desc: "Health score above 50",
        earned: true,
      });
    if (goals.length >= 2)
      list.push({
        name: "Goal Setter",
        icon: "🎯",
        desc: "Set 2+ financial goals",
        earned: true,
      });
    if (freeSurplus > 0)
      list.push({
        name: "In the Green",
        icon: "💚",
        desc: "Positive monthly surplus",
        earned: true,
      });
    list.push({
      name: "Debt Crusher",
      icon: "⚡",
      desc: "Pay off first debt",
      earned: debts.items.some((d) => d.remainingMonths <= 0),
    });
    list.push({
      name: "Goal Achiever",
      icon: "🏆",
      desc: "Complete first goal",
      earned: goals.some((g) => g.status === "complete"),
    });
    list.push({
      name: "Streak Master",
      icon: "🔥",
      desc: "30-day check-in streak",
      earned: streakDays >= 30,
    });
    list.push({
      name: "Wealth Builder",
      icon: "💎",
      desc: "Net worth above ₹5L",
      earned: currentNetWorth >= 500000,
    });
    return list;
  }, [
    income,
    healthScore,
    goals,
    freeSurplus,
    debts,
    currentNetWorth,
    streakDays,
  ]);

  // Monthly check-in state
  const [checkedIn, setCheckedIn] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalMonths, setNewGoalMonths] = useState("12");
  const [goalDrafts, setGoalDrafts] = useState<
    Record<
      string,
      { targetAmount: string; timelineMonths: string; priority: string }
    >
  >({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const nextDrafts: Record<
      string,
      { targetAmount: string; timelineMonths: string; priority: string }
    > = {};

    for (const goal of activeGoals) {
      nextDrafts[goal.id] = {
        targetAmount: String(goal.targetAmount),
        timelineMonths: String(goal.timelineMonths),
        priority: String(goal.priority),
      };
    }

    setGoalDrafts(nextDrafts);
  }, [activeGoals]);

  const handleCheckIn = () => {
    setCheckedIn(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const applyGoalSet = (template: GoalSetTemplate) => {
    const existingNames = new Set(
      goals.map((goal) => goal.name.trim().toLowerCase()),
    );
    let added = 0;
    const startPriority = activeGoals.length;

    template.goals.forEach((goalTemplate, index) => {
      if (existingNames.has(goalTemplate.name.trim().toLowerCase())) return;

      addGoal({
        id: `goal-${Date.now()}-${template.id}-${index}`,
        name: goalTemplate.name,
        icon: goalTemplate.icon,
        category: goalTemplate.category,
        targetAmount: goalTemplate.targetAmount,
        currentAmount: 0,
        timelineMonths: goalTemplate.timelineMonths,
        priority: startPriority + index + 1,
        status: "not-started",
        monthlyAllocation: 0,
        color: goalTemplate.color,
      });
      added += 1;
    });

    setNotice(
      added > 0
        ? `${template.label} added (${added} goal${added > 1 ? "s" : ""}).`
        : `${template.label} is already in your goals.`,
    );
  };

  const addCustomProgressGoal = () => {
    const name = newGoalName.trim();
    const targetAmount = parseInt(newGoalTarget, 10) || 0;
    const timelineMonths = parseInt(newGoalMonths, 10) || 12;

    if (!name || targetAmount <= 0) return;

    addGoal({
      id: `goal-${Date.now()}-custom`,
      name,
      icon: "Target",
      category: "custom",
      targetAmount,
      currentAmount: 0,
      timelineMonths,
      priority: activeGoals.length + 1,
      status: "not-started",
      monthlyAllocation: 0,
      color: "var(--accent)",
    });

    setNewGoalName("");
    setNewGoalTarget("");
    setNewGoalMonths("12");
    setNotice(`Added custom goal: ${name}.`);
  };

  const applyGoalDraft = (goal: Goal) => {
    const draft = goalDrafts[goal.id];
    if (!draft) return;

    const nextTargetAmount = parseInt(draft.targetAmount, 10);
    const nextTimelineMonths = parseInt(draft.timelineMonths, 10);
    const nextPriority = parseInt(draft.priority, 10);

    const updates: Partial<Goal> = {};

    if (
      Number.isFinite(nextTargetAmount) &&
      nextTargetAmount > 0 &&
      nextTargetAmount !== goal.targetAmount
    ) {
      updates.targetAmount = nextTargetAmount;
    }

    if (
      Number.isFinite(nextTimelineMonths) &&
      nextTimelineMonths > 0 &&
      nextTimelineMonths !== goal.timelineMonths
    ) {
      updates.timelineMonths = nextTimelineMonths;
    }

    if (
      Number.isFinite(nextPriority) &&
      nextPriority > 0 &&
      nextPriority !== goal.priority
    ) {
      updates.priority = nextPriority;
    }

    if (Object.keys(updates).length > 0) {
      updateGoal(goal.id, updates);
      setNotice(`Updated ${goal.name}.`);
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  // Custom tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <p
            className="font-bold text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {label}
          </p>
          <p className="text-[var(--accent-text)] font-semibold slashed-zero">
            {fmt(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 relative">
      {/* Decorative */}
      <div
        className="absolute -top-20 right-0 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ backgroundColor: "var(--accent)" }}
      />

      {/* Header */}
      <div className="relative z-10">
        <h1
          className="text-2xl md:text-3xl font-bold mb-2 text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Progress Tracking
        </h1>
        <p
          className="text-sm md:text-base text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Your financial journey at a glance
        </p>
        {(reservedSurplus > 0 || pendingSurplus > 0) && (
          <p
            className="text-xs md:text-sm mt-2"
            style={{
              color: "var(--secondary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {pendingSurplus > 0
              ? `₹${pendingSurplus.toLocaleString("en-IN")}/mo is waiting for your reinvest decision.`
              : `₹${reservedSurplus.toLocaleString("en-IN")}/mo is being kept as net worth surplus.`}
          </p>
        )}
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 relative z-10">
        <div className="bento-card p-5 flex flex-col items-center text-center">
          <Flame size={24} className="mb-2" style={{ color: "var(--amber)" }} />
          <div
            className="text-3xl font-bold slashed-zero text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {streakDays}
          </div>
          <div className="text-xs font-medium text-[var(--secondary)] mt-1">
            Day Streak
          </div>
        </div>
        <div className="bento-card p-5 flex flex-col items-center text-center">
          <Target size={24} className="mb-2" style={{ color: "var(--accent)" }} />
          <div
            className="text-3xl font-bold slashed-zero text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {goals.filter((g) => g.status === "complete").length}/{goals.length}
          </div>
          <div className="text-xs font-medium text-[var(--secondary)] mt-1">
            Goals Done
          </div>
        </div>
        <div className="bento-card p-5 flex flex-col items-center text-center">
          <TrendingUp
            size={24}
            className="mb-2"
            style={{ color: "var(--blue)" }}
          />
          <div
            className="text-2xl font-bold slashed-zero text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {fmt(currentNetWorth)}
          </div>
          <div className="text-xs font-medium text-[var(--secondary)] mt-1">
            Net Worth
          </div>
        </div>
        <div className="bento-card p-5 flex flex-col items-center text-center">
          <Award
            size={24}
            className="mb-2"
            style={{ color: "var(--blue)" }}
          />
          <div
            className="text-3xl font-bold slashed-zero text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {badges.filter((b) => b.earned).length}
          </div>
          <div className="text-xs font-medium text-[var(--secondary)] mt-1">
            Badges Earned
          </div>
        </div>
      </div>

      {/* Net Worth Chart */}
      <div className="bento-card p-6 md:p-8 relative z-10">
        <h3
          className="text-xl font-bold mb-6 text-[var(--card-foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Net Worth Timeline
        </h3>
        <div className="h-[320px] md:h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              key={`${netWorthData.length}-${Math.round(currentNetWorth)}`}
              data={netWorthData}
              margin={{ top: 8, right: 12, bottom: 8, left: 0 }}
            >
              <defs>
                <linearGradient
                  id="netWorthGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.3}
              />
              <XAxis
                dataKey="month"
                stroke="var(--secondary)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
                tickFormatter={(value) => String(value).replace(" ", "\n")}
              />
              <YAxis
                stroke="var(--secondary)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="var(--accent)"
                strokeWidth={3}
                fill="url(#netWorthGradient)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "var(--accent)",
                  stroke: "var(--card)",
                  strokeWidth: 3,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
        <div className="bento-card p-6 md:p-8 space-y-4">
          <h3
            className="text-xl font-bold text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Goal Setting + Custom Goal
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {GOAL_SET_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => applyGoalSet(template)}
                className="py-2 px-3 rounded-xl text-sm font-semibold"
                style={{
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                  color: "var(--card-foreground)",
                }}
              >
                {template.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
              placeholder="Custom goal name"
              className="w-full px-3 py-2 rounded-xl outline-none text-[var(--card-foreground)]"
              style={{
                background: "var(--surface-tint)",
                border: "1px solid var(--border)",
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newGoalTarget}
                onChange={(e) =>
                  setNewGoalTarget(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="Target amount"
                className="w-full px-3 py-2 rounded-xl outline-none text-[var(--card-foreground)]"
                style={{
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                }}
              />
              <input
                type="text"
                value={newGoalMonths}
                onChange={(e) =>
                  setNewGoalMonths(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="Months"
                className="w-full px-3 py-2 rounded-xl outline-none text-[var(--card-foreground)]"
                style={{
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
            <button
              onClick={addCustomProgressGoal}
              className="w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--accent)", color: "var(--on-accent)" }}
            >
              <Plus size={16} />
              Add Goal
            </button>
          </div>
        </div>

        <div className="bento-card p-6 md:p-8">
          <h3
            className="text-xl font-bold mb-4 text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Live Global Goals Editor
          </h3>
          {activeGoals.length === 0 ? (
            <div className="text-sm text-[var(--secondary)]">
              No active goals. Add goals from the panel.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {activeGoals.map((goal) => {
                const draft = goalDrafts[goal.id] || {
                  targetAmount: String(goal.targetAmount),
                  timelineMonths: String(goal.timelineMonths),
                  priority: String(goal.priority),
                };

                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-xl"
                    style={{
                      background: "var(--surface-tint)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-[var(--card-foreground)]">
                        {goal.name}
                      </div>
                      <button
                        onClick={() => removeGoal(goal.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "var(--red)",
                        }}
                        aria-label={`Remove ${goal.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={draft.targetAmount}
                        onChange={(e) =>
                          setGoalDrafts((prev) => ({
                            ...prev,
                            [goal.id]: {
                              ...draft,
                              targetAmount: e.target.value.replace(
                                /[^0-9]/g,
                                "",
                              ),
                            },
                          }))
                        }
                        onBlur={() => applyGoalDraft(goal)}
                        placeholder="Target amount"
                        className="px-3 py-2 rounded-lg outline-none text-[var(--card-foreground)]"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                        }}
                      />
                      <input
                        type="text"
                        value={draft.timelineMonths}
                        onChange={(e) =>
                          setGoalDrafts((prev) => ({
                            ...prev,
                            [goal.id]: {
                              ...draft,
                              timelineMonths: e.target.value.replace(
                                /[^0-9]/g,
                                "",
                              ),
                            },
                          }))
                        }
                        onBlur={() => applyGoalDraft(goal)}
                        placeholder="Timeline months"
                        className="px-3 py-2 rounded-lg outline-none text-[var(--card-foreground)]"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                        }}
                      />
                      <select
                        value={draft.priority}
                        onChange={(e) => {
                          const nextPriority = e.target.value;
                          setGoalDrafts((prev) => ({
                            ...prev,
                            [goal.id]: {
                              ...draft,
                              priority: nextPriority,
                            },
                          }));
                          updateGoal(goal.id, {
                            priority: parseInt(nextPriority, 10),
                          });
                        }}
                        className="px-3 py-2 rounded-lg outline-none text-[var(--card-foreground)]"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {Array.from(
                          { length: Math.max(activeGoals.length, 1) },
                          (_, i) => i + 1,
                        ).map((value) => (
                          <option
                            key={`${goal.id}-p-${value}`}
                            value={value}
                          >{`Priority ${value}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {notice && (
        <div className="bento-card p-4 relative z-10 text-sm text-[var(--secondary)]">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
        {/* Monthly Check-in */}
        <div className="bento-card p-6 md:p-8">
          <h3
            className="text-xl font-bold mb-4 text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Monthly Check-in
          </h3>
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress =
                goal.targetAmount > 0
                  ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                  : 0;
              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--card-foreground)]">
                      {goal.name}
                    </span>
                    <span
                      className="text-xs font-bold slashed-zero"
                      style={{
                        color:
                          goal.status === "complete"
                            ? "var(--accent-text)"
                            : "var(--secondary)",
                      }}
                    >
                      {progress}%
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--progress-inactive)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor:
                          goal.status === "complete"
                            ? "var(--accent)"
                            : "var(--blue)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {!checkedIn ? (
            <button
              onClick={handleCheckIn}
              className="w-full mt-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--on-accent)",
                fontFamily: "var(--font-body)",
                boxShadow: "0 8px 24px rgba(232, 52, 28, )",
              }}
            >
              <CheckCircle2 size={18} />
              Complete Monthly Check-in
            </button>
          ) : (
            <div
              className="mt-6 py-3 rounded-xl font-bold text-center"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--on-accent)",
                fontFamily: "var(--font-body)",
                opacity: 0.7,
              }}
            >
              ✅ Checked in for this month!
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="bento-card p-6 md:p-8">
          <h3
            className="text-xl font-bold mb-4 text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Badges
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge, i) => (
              <div
                key={i}
                className="p-4 rounded-xl flex flex-col items-center text-center transition-all"
                style={{
                  background: badge.earned
                    ? "var(--surface-tint)"
                    : "var(--surface-hover)",
                  border: badge.earned
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border)",
                  opacity: badge.earned ? 1 : 0.4,
                }}
              >
                <div className="text-2xl mb-2">{badge.icon}</div>
                <div
                  className="text-xs font-bold text-[var(--card-foreground)] mb-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {badge.name}
                </div>
                <div className="text-[10px] text-[var(--secondary)]">
                  {badge.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health Score Breakdown */}
      {healthScore && (
        <div className="bento-card p-6 md:p-8 relative z-10">
          <h3
            className="text-xl font-bold mb-6 text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Health Score Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Income Stability",
                score: healthScore.incomeStability,
                max: 25,
                color: "var(--accent)",
              },
              {
                label: "Debt Load",
                score: healthScore.debtLoad,
                max: 25,
                color: "var(--blue)",
              },
              {
                label: "Savings Rate",
                score: healthScore.savingsRate,
                max: 25,
                color: "var(--blue)",
              },
              {
                label: "Emergency Fund",
                score: healthScore.emergencyFund,
                max: 25,
                color: "var(--amber)",
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div
                  className="text-3xl font-bold slashed-zero text-[var(--card-foreground)] mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.score}
                </div>
                <div className="text-xs text-[var(--secondary)] mb-3">
                  {item.label}
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden mx-auto max-w-[100px]"
                  style={{ backgroundColor: "var(--progress-inactive)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(item.score / item.max) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {healthScore.actions.length > 0 && (
            <div
              className="mt-6 p-4 rounded-xl space-y-2"
              style={{
                background: "var(--surface-tint)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="text-xs font-semibold text-[var(--accent-text)] uppercase tracking-wider mb-2">
                Penny's Top Actions
              </div>
              {healthScore.actions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm text-[var(--card-foreground)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="text-[var(--accent)] mt-0.5">•</span>
                  {action}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
