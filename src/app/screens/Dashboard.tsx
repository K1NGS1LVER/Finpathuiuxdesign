import {
  TrendingUp,
  Target,
  Sparkles,
  AlertTriangle,
  PiggyBank,
  Lightbulb,
  Check,
  Circle,
} from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { useFinPathStore } from "@/lib/store";

interface DashboardProps {
  onPennyClick: () => void;
}

const GOAL_ACCENTS = [
  {
    bg: "var(--accent)",
    subtle: "var(--accent-subtle)",
    glow: "var(--accent-glow)",
    text: "var(--accent-text)",
  },
  {
    bg: "var(--secondary-accent)",
    subtle: "var(--secondary-accent-subtle)",
    glow: "var(--secondary-accent-glow)",
    text: "var(--secondary-accent-text)",
  },
  {
    bg: "var(--tertiary-accent)",
    subtle: "var(--tertiary-accent-subtle)",
    glow: "var(--tertiary-accent-glow)",
    text: "var(--tertiary-accent-text)",
  },
];

// ── Animated counter hook ──
function useCountUp(target: number, duration = 800, start = true) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  const startTime = useRef<number>(0);
  const startValue = useRef(0);

  useEffect(() => {
    if (!start) {
      setValue(target);
      return;
    }
    startValue.current = value;
    startTime.current = 0;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(
        startValue.current + (target - startValue.current) * eased,
      );
      setValue(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, start]);

  return value;
}

// ── Formatters ──
function fmtInr(n: number): string {
  return n.toLocaleString("en-IN");
}

/** Compact lakh format: 120000 → "₹1.2L", handles k below 1L */
function fmtCompact(n: number): string {
  if (n >= 100_000) {
    const lakh = n / 100_000;
    return `₹${lakh.toFixed(lakh >= 10 ? 0 : 1)}L`;
  }
  if (n >= 1_000) {
    const k = (n / 1_000).toFixed(n >= 10_000 ? 0 : 1);
    return `₹${k}K`;
  }
  return `₹${fmtInr(n)}`;
}

// ── Format INR as "₹X / ₹Y" with lakh compact on final ──
function fmtAmountPair(current: number, target: number): string {
  if (target >= 100_000) {
    // When target is in lakhs, show both compact
    return `${fmtCompact(current)} / ${fmtCompact(target)}`;
  }
  // Otherwise show current detail + target detail with commas
  return `₹${fmtInr(current)} / ₹${fmtInr(target)}`;
}

// ── Goal status logic ──
function getGoalStatus(
  goal: {
    targetAmount: number;
    currentAmount: number;
    timelineMonths: number;
  },
  planCompletionDate?: string | null,
) {
  if (goal.targetAmount <= 0)
    return { color: "var(--tertiary)", pulse: false, label: "not started" };
  const progress = goal.currentAmount / goal.targetAmount;
  const elapsedEstimate =
    progress > 0
      ? (1 - progress) / (progress / Math.max(1, goal.timelineMonths))
      : goal.timelineMonths;
  const onTrack =
    planCompletionDate ||
    progress >= 1 ||
    (elapsedEstimate <= goal.timelineMonths && progress > 0.05);
  if (progress >= 1)
    return { color: "var(--green)", pulse: false, label: "complete" };
  if (onTrack) return { color: "var(--green)", pulse: true, label: "on track" };
  if (progress > 0)
    return { color: "var(--amber)", pulse: false, label: "at risk" };
  return { color: "var(--tertiary)", pulse: false, label: "not started" };
}

export default function Dashboard({ onPennyClick }: DashboardProps) {
  const navigate = useNavigate();
  const [health, setHealth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [animReady, setAnimReady] = useState(false);

  const income = useFinPathStore((s) => s.income);
  const expenses = useFinPathStore((s) => s.expenses);
  const debts = useFinPathStore((s) => s.debts);
  const storeGoals = useFinPathStore((s) => s.goals) || [];
  const savings = useFinPathStore((s) => s.savings);
  const healthScore = useFinPathStore((s) => s.healthScore);
  const plan = useFinPathStore((s) => s.plan);
  const updateGoal = useFinPathStore((s) => s.updateGoal);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const score = healthScore?.overall ?? 0;
    const timer = setTimeout(() => {
      setHealth(score);
      setAnimReady(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [healthScore, isLoading]);

  const surplus = income.total - expenses.total - debts.totalMonthly;
  const fmt = (n: number) => n.toLocaleString("en-IN");

  // Animated values
  const animIncome = useCountUp(income.total, 900, animReady);
  const animExpenses = useCountUp(expenses.total, 900, animReady);
  const animSavings = useCountUp(savings, 900, animReady);

  // ── Contextual health label ──
  const healthLabel = useMemo(() => {
    const score = healthScore?.overall ?? 0;
    if (score >= 81)
      return {
        text: "Excellent financial health",
        color: "var(--tertiary-accent-text)",
      };
    if (score >= 61)
      return { text: "Strong position!", color: "var(--accent-text)" };
    if (score >= 41)
      return {
        text: "Steady foundation — keep going",
        color: "var(--secondary)",
      };
    return { text: "Let's build momentum", color: "var(--amber-text)" };
  }, [healthScore]);

  // ── Penny Insights ──
  const pennyInsights = useMemo(() => {
    const tips: { text: string; icon: typeof Sparkles }[] = [];
    const savingsRate = income.total > 0 ? (surplus / income.total) * 100 : 0;
    const dti =
      income.total > 0 ? (debts.totalMonthly / income.total) * 100 : 0;

    if (dti > 40) {
      tips.push({
        text:
          "Your debt payments eat " +
          Math.round(dti) +
          "% of your income. Consider consolidating or negotiating lower EMIs.",
        icon: AlertTriangle,
      });
    } else if (dti > 20) {
      tips.push({
        text:
          "Debt takes " +
          Math.round(dti) +
          "% of income. Try the snowball method for quick wins or avalanche to save on interest.",
        icon: AlertTriangle,
      });
    }

    if (savingsRate < 10 && income.total > 0) {
      const targetSave = Math.round(income.total * 0.2);
      tips.push({
        text:
          "You're saving under 10% of income. Try moving ₹" +
          fmt(Math.round(targetSave - Math.max(0, surplus))) +
          " from non-essentials to hit 20%.",
        icon: PiggyBank,
      });
    } else if (savingsRate >= 30) {
      tips.push({
        text:
          "You're saving " +
          Math.round(savingsRate) +
          "% of income — excellent! Consider accelerating your top goal or investing the extra.",
        icon: TrendingUp,
      });
    }

    const essentialRatio =
      income.total > 0
        ? ((expenses.rent +
            expenses.food +
            expenses.transport +
            expenses.utilities) /
            income.total) *
          100
        : 0;
    if (essentialRatio > 60) {
      tips.push({
        text:
          "Essentials consume " +
          Math.round(essentialRatio) +
          "% of your income. Even a 5% cut frees ₹" +
          fmt(Math.round(income.total * 0.05)) +
          "/mo.",
        icon: Lightbulb,
      });
    }

    const activeGoals = storeGoals.filter((g) => g.status !== "complete");
    const closestGoal = activeGoals.sort((a, b) => {
      const aRemain = a.targetAmount - a.currentAmount;
      const bRemain = b.targetAmount - b.currentAmount;
      return aRemain - bRemain;
    })[0];
    if (closestGoal) {
      const remaining = closestGoal.targetAmount - closestGoal.currentAmount;
      const monthly =
        closestGoal.monthlyAllocation ||
        Math.round(remaining / Math.max(1, closestGoal.timelineMonths));
      if (remaining > 0 && remaining < monthly * 3) {
        tips.push({
          text:
            '"' +
            closestGoal.name +
            '" is almost done — only ₹' +
            fmt(remaining) +
            " left! A lumpsum could finish it this month.",
          icon: Sparkles,
        });
      }
    }

    if (tips.length === 0) {
      tips.push({
        text: "Your finances look solid! Keep checking in monthly to stay on track.",
        icon: Lightbulb,
      });
    }

    return tips.slice(0, 3);
  }, [income, expenses, debts, surplus, storeGoals]);

  // ── Active goals ──
  const activeGoals = storeGoals.filter((g) => g.status !== "complete");
  const doneGoals = storeGoals.filter((g) => g.status === "complete");
  const prioritizedActiveGoals = activeGoals
    .slice()
    .sort((a, b) => a.priority - b.priority);
  /** Find the first active goal not yet checked this month */
  const firstUncheckedIdx = prioritizedActiveGoals.findIndex(
    (g) => !g.checkedThisMonth,
  );
  /** Batch start: if all checked, show last batch; otherwise start at first unchecked */
  const batchStart =
    firstUncheckedIdx === -1
      ? Math.max(0, prioritizedActiveGoals.length - 3)
      : firstUncheckedIdx;
  const topGoals = prioritizedActiveGoals.slice(batchStart, batchStart + 3);

  // ── Next Step task — highest-priority active goal not yet checked this month ──
  const nextStepGoal = useMemo(() => {
    return prioritizedActiveGoals.find((g) => !g.checkedThisMonth) || null;
  }, [prioritizedActiveGoals]);

  // All active goals are checked off this month
  const allGoalsChecked =
    prioritizedActiveGoals.length > 0 && !nextStepGoal;

  // Compute the recommended monthly contribution for the next step goal
  const nextStepAmount = useMemo(() => {
    if (!nextStepGoal) return "";
    const monthly =
      nextStepGoal.monthlyAllocation ||
      Math.round(
        (nextStepGoal.targetAmount - nextStepGoal.currentAmount) /
          Math.max(1, nextStepGoal.timelineMonths),
      );
    return fmt(monthly);
  }, [nextStepGoal]);

  // Handle checking off the next step goal for this month
  const handleNextStepDone = () => {
    if (!nextStepGoal) return;
    const monthlyAmount =
      nextStepGoal.monthlyAllocation ||
      Math.round(
        (nextStepGoal.targetAmount - nextStepGoal.currentAmount) /
          Math.max(1, nextStepGoal.timelineMonths),
      );
    const newAmount = Math.min(
      nextStepGoal.targetAmount,
      nextStepGoal.currentAmount + monthlyAmount,
    );
    updateGoal(nextStepGoal.id, {
      currentAmount: newAmount,
      checkedThisMonth: true,
      status:
        newAmount >= nextStepGoal.targetAmount
          ? "complete"
          : newAmount > 0
            ? "in-progress"
            : "not-started",
    });
  };

  // ── Health ring ──
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (health / 100) * circumference;

  // ── Loading Skeleton ──
  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto relative text-[var(--foreground)]">
        <div className="mb-6 md:mb-8 relative z-10">
          <div className="skeleton w-32 h-5" />
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-4 relative z-10">
          {/* Active Goals Skeleton — 2/3 width */}
          <div className="col-span-12 lg:col-span-8 bento-card min-h-[160px]">
            <div className="skeleton w-24 h-4 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton w-28 h-4" />
                  <div className="skeleton flex-1 h-4 rounded-full" />
                  <div className="skeleton w-12 h-4" />
                  <div className="skeleton w-20 h-4" />
                </div>
              ))}
            </div>
          </div>

          {/* Next Step Skeleton — 1/3 width */}
          <div className="col-span-12 lg:col-span-4 bento-card min-h-[160px]">
            <div className="skeleton w-20 h-4 mb-4" />
            <div className="skeleton w-32 h-5 mb-3" />
            <div className="skeleton w-24 h-4 mb-2" />
            <div className="skeleton w-full h-10 mt-4 rounded-full" />
          </div>

          {/* Recent Activities + Health Skeleton */}
          <div className="col-span-12 md:col-span-6 bento-card min-h-[260px]">
            <div className="skeleton w-28 h-4 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="skeleton w-32 h-4" />
                  <div className="skeleton w-16 h-4" />
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-12 md:col-span-6 bento-card min-h-[260px]">
            <div className="flex items-start gap-6 h-full">
              <div className="flex-1 space-y-4 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="skeleton w-20 h-3 mb-1" />
                    <div className="skeleton w-24 h-6" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="skeleton w-28 h-28 rounded-full" />
                <div className="skeleton w-12 h-5 mt-3" />
              </div>
            </div>
          </div>

          {/* Penny Insights Skeleton */}
          <div className="col-span-12 penny-insight-card min-h-[160px]">
            <div className="skeleton w-32 h-5 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton w-full h-12 rounded-xl" />
              ))}
            </div>
          </div>
      </div>
    </div>
  );
}

  // Handle missing plan state
  if (!plan || !plan.months || plan.months.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto relative text-[var(--foreground)] page-animate flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
          <AlertTriangle size={32} className="icon-wireframe" />
        </div>
        <h2 className="text-display mb-2 text-center" style={{ color: 'var(--card-foreground)' }}>No financial plan found</h2>
        <p className="text-secondary mb-8 text-center max-w-md font-body">
          It looks like your financial plan hasn't been generated yet. Add your income and goals to unlock your personalized dashboard.
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
          Get Started
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto relative text-[var(--foreground)] page-animate">
      {/* ── Header Row ── */}
      <div className="mb-6 md:mb-8 relative z-10 flex items-center gap-3 flex-wrap">
        {/* ─────────────────────────────── */}
        {/* ── PAGE TITLE (aligned left) ── */}
        {/* ─────────────────────────────── */}
        <h1 className="text-title text-secondary tracking-[0.15em] mb-1 ">
          Financial Overview
        </h1>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-12 gap-4 md:gap-4 relative z-10">
        {/* ═══ Active Goals — 2/3 width on lg ═══ */}
        <div className="col-span-12 lg:col-span-8 bento-card relative overflow-hidden">
          {/* Subtle background blob */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 300,
              height: 300,
              top: "-40%",
              right: "-10%",
              background: "var(--accent)",
              opacity: 0.03,
              filter: "blur(80px)",
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-label text-[var(--tertiary)]">
                  Active Goals
                </h3>
                <p className="text-xs text-[var(--tertiary)] mt-0.5">
                  {topGoals.length > 0
                    ? `${
                        topGoals.filter((g) => {
                          const status = getGoalStatus(
                            g,
                            plan?.goalCompletionDates?.[g.id] ?? null,
                          );
                          return status.label === "on track";
                        }).length
                      } on track · ${doneGoals.length} completed`
                    : "Set your first financial goal"}
                </p>
              </div>
              <button
                onClick={() => navigate("/journey")}
                className="pill-button text-xs font-semibold px-4 py-2"
              >
                View All
              </button>
            </div>

            {topGoals.length > 0 ? (
              <div className="space-y-4">
                {topGoals.map((goal, i) => {
                  const accent = GOAL_ACCENTS[i];
                  const progress =
                    goal.targetAmount > 0
                      ? Math.round(
                          (goal.currentAmount / goal.targetAmount) * 100,
                        )
                      : 0;
                  const completionDate =
                    plan?.goalCompletionDates?.[goal.id] ?? null;
                  const monthly =
                    goal.monthlyAllocation ||
                    Math.round(
                      (goal.targetAmount - goal.currentAmount) /
                        Math.max(1, goal.timelineMonths),
                    );
                  const status = getGoalStatus(goal, completionDate);
                  const glowIntensity = 0.2 + (progress / 100) * 0.6;
                  const checkedThisMonth = goal.checkedThisMonth ?? false;

                  return (
                    <div
                      key={goal.id}
                      className="group cursor-pointer"
                      onClick={() => navigate("/journey")}
                      style={{
                        animationDelay: `${i * 120}ms`,
                        animation: animReady
                          ? "scenarioFadeSlide 500ms cubic-bezier(0.22, 1, 0.36, 1) forwards"
                          : "none",
                        opacity: animReady ? undefined : 1,
                      }}
                    >
                      {/* Goal row: name + uniform progress bar + % + amount + monthly + check */}
                      <div className="flex items-center gap-3">
                        {/* Monthly check indicator (✓ if done this month) */}
                        <div className="flex-shrink-0 w-4 flex items-center justify-center">
                          {checkedThisMonth && (
                            <Check
                              size={14}
                              className="icon-wireframe"
                              style={{ color: "var(--green)", strokeWidth: 2.5 }}
                            />
                          )}
                        </div>

                        {/* Goal name */}
                        <span
                          className="text-sm font-medium w-24 flex-shrink-0 truncate"
                          style={{ color: "var(--secondary)" }}
                        >
                          {goal.name}
                        </span>

                        {/* Uniform-width progress bar area */}
                        <div className="flex-1 min-w-0">
                          <div
                            className="relative h-4 rounded-full overflow-hidden"
                            style={{
                              background: "var(--surface-hover)",
                            }}
                          >
                            {/* Cross-hatch pattern on the unfilled portion */}
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, var(--border), var(--border) 1.5px, transparent 1.5px, transparent 5px)",
                                opacity: 0.5,
                              }}
                            />
                            {/* Filled portion */}
                            <div
                              className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${Math.min(progress, 100)}%`,
                                background: `linear-gradient(to right, ${accent.bg}, ${accent.glow})`,
                                boxShadow: `0 0 ${12 * glowIntensity}px ${accent.glow}`,
                                opacity: glowIntensity + 0.2,
                              }}
                            />
                          </div>
                        </div>

                        {/* Progress % */}
                        <span
                          className="text-base font-bold slashed-zero flex-shrink-0 w-10 text-right"
                          style={{
                            color:
                              progress >= 1 ? "var(--green-text)" : accent.text,
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {progress}%
                        </span>

                        {/* Amount pair — compact lakh format */}
                        <span className="text-xs font-semibold slashed-zero flex-shrink-0 text-right min-w-[90px]">
                          <span style={{ color: "var(--card-foreground)" }}>
                            {fmtCompact(goal.currentAmount)}
                          </span>
                          <span style={{ color: "var(--tertiary)" }}>
                            {" "}
                            /{" "}
                          </span>
                          <span style={{ color: "var(--card-foreground)" }}>
                            {fmtCompact(goal.targetAmount)}
                          </span>
                        </span>

                        {/* Monthly allocation — always visible */}
                        <span
                          className="text-xs font-semibold slashed-zero flex-shrink-0 text-right min-w-[64px]"
                          style={{ color: accent.text }}
                        >
                          ₹{fmt(monthly)}/mo
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty state — hero moment */
              <div className="flex flex-col items-center justify-center py-10 relative">
                <div
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    width: 200,
                    height: 200,
                    background: "var(--accent)",
                    opacity: 0.06,
                    filter: "blur(60px)",
                  }}
                />
                <div
                  className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: "var(--accent-subtle)",
                    boxShadow: "0 0 32px var(--accent-glow)",
                  }}
                >
                  <Target
                    size={28}
                    className="icon-wireframe"
                    style={{ color: "var(--accent)" }}
                  />
                </div>
                <p
                  className="text-display mb-1 text-center"
                  style={{ color: "var(--card-foreground)" }}
                >
                  Your financial journey starts here
                </p>
                <p
                  className="text-sm mb-5 text-center"
                  style={{ color: "var(--tertiary)" }}
                >
                  Set your first goal to unlock progress tracking, insights, and
                  a personalized plan.
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
            )}
          </div>
        </div>

        {/* ═══ Next Step Card — 1/3 width on lg ═══ */}
        <div className="col-span-12 lg:col-span-4 bento-card relative overflow-hidden">
          {/* Subtle background glow */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 180,
              height: 180,
              top: "-30%",
              right: "-10%",
              background: "var(--secondary-accent)",
              opacity: 0.04,
              filter: "blur(60px)",
            }}
          />

          <div className="relative z-10 h-full flex flex-col">
            <div className="mb-4">
              <h3 className="text-label text-[var(--tertiary)]">
                Your Next Step
              </h3>
            </div>

            {nextStepGoal ? (
              /* State 1: Has a goal to check off */
              <>
                {/* Goal name + icon */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "var(--accent-subtle)",
                      color: "var(--accent)",
                    }}
                  >
                    <Target size={16} />
                  </div>
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--card-foreground)" }}
                  >
                    {nextStepGoal.name}
                  </p>
                </div>

                {/* Monthly contribution info */}
                <div className="mb-1">
                  <p className="text-xs" style={{ color: "var(--tertiary)" }}>
                    Recommended monthly
                  </p>
                  <p
                    className="text-xl font-bold slashed-zero"
                    style={{
                      color: "var(--card-foreground)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    ₹{nextStepAmount || "—"}/mo
                  </p>
                </div>

                {/* Brief context — remaining amount */}
                <p
                  className="text-xs mt-1 mb-4"
                  style={{ color: "var(--tertiary)" }}
                >
                  {nextStepGoal.currentAmount > 0
                    ? `${fmtCompact(
                        nextStepGoal.targetAmount -
                          nextStepGoal.currentAmount,
                      )} left to save`
                    : `${fmtCompact(nextStepGoal.targetAmount)} total needed`}
                </p>

                {/* Check-off button */}
                <button
                  onClick={handleNextStepDone}
                  className="w-full py-3 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    boxShadow: "0 4px 16px var(--accent-glow)",
                  }}
                >
                  <Check size={16} className="icon-wireframe" />
                  Done for this month
                </button>
              </>
            ) : allGoalsChecked ? (
              /* State 2: All goals checked off — calm state */
              <div className="flex flex-col items-center justify-center flex-1 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{
                    background: "var(--green-subtle)",
                    color: "var(--green)",
                  }}
                >
                  <Check size={24} className="icon-wireframe" />
                </div>
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--card-foreground)" }}
                >
                  All goals checked off!
                </p>
                <p className="text-xs" style={{ color: "var(--tertiary)" }}>
                  Great progress this month — come back next month to keep
                  building.
                </p>
              </div>
            ) : (
              /* State 3: No active goals at all */
              <div className="flex flex-col items-center justify-center flex-1 text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: "var(--accent-subtle)",
                    color: "var(--accent)",
                  }}
                >
                  <Target size={24} className="icon-wireframe" />
                </div>
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--card-foreground)" }}
                >
                  Set your first goal
                </p>
                <p className="text-xs mb-4" style={{ color: "var(--tertiary)" }}>
                  Goals keep you focused — create one to start tracking.
                </p>
                <button
                  onClick={() => navigate("/journey")}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    boxShadow: "0 4px 16px var(--accent-glow)",
                  }}
                >
                  + Add a Goal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Recent Activities (1/3) ═══ */}
        <div className="col-span-12 md:col-span-6 bento-card">
          <div className="mb-4">
            <h3 className="text-label text-[var(--tertiary)]">
              Recent Activity
            </h3>
            <p className="text-xs text-[var(--tertiary)] mt-0.5">
              This month's allocations
            </p>
          </div>
          <div className="space-y-1">
            {prioritizedActiveGoals.slice(0, 5).map((goal) => {
              const monthly =
                goal.monthlyAllocation ||
                Math.round(
                  (goal.targetAmount - goal.currentAmount) /
                    Math.max(1, goal.timelineMonths),
                );
              return (
                <div
                  key={goal.id}
                  className="flex items-center justify-between py-2.5 px-2 rounded-lg transition-colors cursor-default hover:bg-[var(--surface-hover)]"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--card-foreground)" }}
                    >
                      {goal.name}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--tertiary)" }}
                    >
                      {goal.status === "complete"
                        ? "Completed"
                        : `${goal.timelineMonths} months left`}
                    </p>
                  </div>
                  <span
                    className="text-base font-bold slashed-zero flex-shrink-0"
                    style={{
                      color: "var(--card-foreground)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    ₹{fmt(monthly)}/mo
                  </span>
                </div>
              );
            })}
            {prioritizedActiveGoals.length === 0 && (
              <div className="py-6 text-center">
                <p className="text-sm" style={{ color: "var(--tertiary)" }}>
                  No goals yet.
                </p>
                <button
                  onClick={() => navigate("/journey")}
                  className="text-xs font-semibold mt-2 hover:underline"
                  style={{ color: "var(--accent-text)" }}
                >
                  Add one from Journey →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Health Score + Metrics (2/3) ═══ */}
        <div className="col-span-12 md:col-span-6 bento-card">
          <div className="flex items-initial gap-6 h-full">
            {/* Left: Metrics stacked */}
            <div className="flex-1 max-w-[55%] flex flex-col justify-between py-3">
              <div>
                <p
                  className="text-xs font-medium mb-0.5"
                  style={{ color: "var(--tertiary)" }}
                >
                  Monthly Expenses
                </p>
                <p
                  className="text-xl font-bold slashed-zero"
                  style={{
                    color: "var(--card-foreground)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  ₹{fmt(animExpenses)}
                </p>
              </div>
              <div>
                <p
                  className="text-xs font-medium mb-0.5"
                  style={{ color: "var(--tertiary)" }}
                >
                  Monthly Surplus
                </p>
                <p
                  className="text-xl font-bold slashed-zero"
                  style={{
                    color:
                      surplus > 0
                        ? "var(--green-text)"
                        : surplus < 0
                          ? "var(--red-text)"
                          : "var(--card-foreground)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {surplus > 0 ? "+" : ""}₹{fmt(Math.abs(surplus))}
                </p>
              </div>
              <div>
                <p
                  className="text-xs font-medium mb-0.5"
                  style={{ color: "var(--tertiary)" }}
                >
                  Total Savings
                </p>
                <p
                  className="text-xl font-bold slashed-zero"
                  style={{
                    color: "var(--card-foreground)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  ₹{fmt(animSavings)}
                </p>
              </div>
            </div>

            {/* Right: Health Ring */}
            <div className="flex flex-col items-center justify-between flex-shrink-0 py-1">
              {/* Caption */}
              <p
                className="text-[10px] uppercase tracking-[0.12em] font-semibold text-center"
                style={{ color: "var(--tertiary)" }}
              >
                Health Meter
              </p>

              <div className="relative w-44 h-44">
                <svg
                  className="transform -rotate-90 w-full h-full"
                  viewBox="0 0 190 190"
                >
                  <circle
                    cx="95"
                    cy="95"
                    r={radius}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="13"
                    strokeDasharray="6 6"
                  />
                  <circle
                    cx="95"
                    cy="95"
                    r={radius}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="13"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    className="transition-[stroke-dashoffset] duration-1500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                      strokeDashoffset: offset,
                      filter: "drop-shadow(0 0 8px var(--accent-glow))",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className="text-4xl font-bold slashed-zero"
                    style={{
                      color: "var(--card-foreground)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {health}
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-wider font-semibold mt-0.5"
                    style={{ color: "var(--tertiary)" }}
                  >
                    Score
                  </div>
                </div>
              </div>
              <p
                className="text-xs font-medium text-center"
                style={{ color: healthLabel.color }}
              >
                {healthLabel.text}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ Penny's Insights ═══ */}
        <div className="col-span-12 penny-insight-card">
          <div className="penny-insight-blob" />
          <div className="relative z-10 flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "var(--penny-accent-subtle)",
                color: "var(--penny-accent)",
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h3
                className="text-heading slashed-zero"
                style={{ color: "var(--card-foreground)" }}
              >
                Penny's Insights
              </h3>
              <p className="text-xs" style={{ color: "var(--tertiary)" }}>
                Personalized tips for your financial health
              </p>
            </div>
          </div>
          <div className="relative z-10 space-y-3">
            {pennyInsights.map((tip, i) => {
              const Icon = tip.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl text-sm"
                  style={{
                    background: "var(--surface-hover)",
                    border: "1px solid var(--border)",
                    color: "var(--card-foreground)",
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: "var(--penny-accent-subtle)",
                      color: "var(--penny-accent)",
                    }}
                  >
                    <Icon size={13} />
                  </div>
                  <span className="font-body">{tip.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}