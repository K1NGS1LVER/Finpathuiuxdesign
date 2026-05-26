import {
  TrendingUp,
  Target,
  Sparkles,
  AlertTriangle,
  PiggyBank,
  Check,
  ArrowRight,
  Bike,
  Home,
  Plane,
  BookOpen,
  Users,
  Rocket,
  Dumbbell,
  Crosshair,
  Leaf,
  Zap,
  Trophy,
  Flame,
  Gem,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useFinPathStore } from "@/lib/store";
import { formatInr, formatInrCompact } from "@/lib/format";
import { compareStrategies } from "@/lib/debt-strategies";
import confetti from "canvas-confetti";
import HealthScoreWidget from "@/app/components/HealthScoreWidget";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Bike, Home, Plane, BookOpen, Users, TrendingUp, Target,
  PiggyBank, AlertTriangle, Sparkles, Check, ArrowRight,
};

const CATEGORY_STYLE: Record<string, { icon: string; color: string; subtle: string; text: string }> = {
  bike:       { icon: "Bike",          color: "var(--accent)",           subtle: "var(--accent-subtle)",           text: "var(--accent-text)" },
  home:       { icon: "Home",          color: "var(--secondary-accent)", subtle: "var(--secondary-accent-subtle)", text: "var(--secondary-accent-text)" },
  travel:     { icon: "Plane",         color: "var(--tertiary-accent)",  subtle: "var(--tertiary-accent-subtle)",  text: "var(--tertiary-accent-text)" },
  debt:       { icon: "AlertTriangle", color: "var(--red)",              subtle: "var(--red-subtle)",              text: "var(--red-text)" },
  education:  { icon: "BookOpen",      color: "var(--cobalt)",           subtle: "var(--cobalt-subtle)",           text: "var(--cobalt-text)" },
  savings:    { icon: "PiggyBank",     color: "var(--green)",            subtle: "var(--green-subtle)",            text: "var(--green-text)" },
  family:     { icon: "Users",         color: "var(--secondary-accent)", subtle: "var(--secondary-accent-subtle)", text: "var(--secondary-accent-text)" },
  investment: { icon: "TrendingUp",    color: "var(--amber)",            subtle: "var(--amber-subtle)",            text: "var(--amber-text)" },
  custom:     { icon: "Target",        color: "var(--accent)",           subtle: "var(--accent-subtle)",           text: "var(--accent-text)" },
  default:    { icon: "Target",        color: "var(--accent)",           subtle: "var(--accent-subtle)",           text: "var(--accent-text)" },
};

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setValue(target), 300);
    return () => clearTimeout(timer);
  }, [target]);
  return value;
}

export default function Dashboard({ onPennyClick }: { onPennyClick: () => void }) {
  const navigate     = useNavigate();
  const income       = useFinPathStore((s) => s.income);
  const expenses     = useFinPathStore((s) => s.expenses);
  const debts        = useFinPathStore((s) => s.debts);
  const goals        = useFinPathStore((s) => s.goals) || [];
  const savings      = useFinPathStore((s) => s.savings);
  const healthScore  = useFinPathStore((s) => s.healthScore);
  const updateGoal   = useFinPathStore((s) => s.updateGoal);
  const investments  = useFinPathStore((s) => s.investments);

  const [period, setPeriod] = useState<"This month" | "Quarter" | "YTD">("This month");

  const totalDebt = debts.totalMonthly || 0;
  const surplus   = income.total - expenses.total - totalDebt;
  const health    = healthScore?.overall ?? 0;

  const now = new Date();
  const periodMonths = period === "This month" ? 1 : period === "Quarter" ? 3 : now.getMonth() + 1;

  const animIncome  = useCountUp(income.total * periodMonths);
  const animSurplus = useCountUp(surplus * periodMonths);
  const animSavings = useCountUp(savings + (periodMonths > 1 ? surplus * (periodMonths - 1) : 0));
  const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount).slice(0, 3);
  const nextGoal    = goals.find((g) => !g.checkedThisMonth && g.status !== "complete");

  const currentNetWorth = savings + investments + goals.reduce((sum, g) => sum + Math.max(0, g.currentAmount), 0);

  const debtComparison = debts.items.length > 0 ? compareStrategies(debts.items, 0) : null;
  const interestSaved = debtComparison?.interestSaved ?? 0;

  const badges = [
    { name: "First Step", icon: Rocket as LucideIcon, color: "var(--accent)", desc: "Completed onboarding", earned: income.total > 0 },
    { name: "Healthy Start", icon: Dumbbell as LucideIcon, color: "var(--tertiary-accent)", desc: "Health score above 50", earned: healthScore && healthScore.overall >= 50 },
    { name: "Goal Setter", icon: Crosshair as LucideIcon, color: "var(--accent)", desc: "Set 2+ financial goals", earned: goals.length >= 2 },
    { name: "In the Green", icon: Leaf as LucideIcon, color: "var(--tertiary-accent)", desc: "Positive monthly surplus", earned: surplus > 0 },
    { name: "Debt Crusher", icon: Zap as LucideIcon, color: "var(--amber)", desc: "Pay off first debt", earned: debts.items.some((d) => d.remainingMonths <= 0) },
    { name: "Goal Achiever", icon: Trophy as LucideIcon, color: "var(--amber)", desc: "Complete first goal", earned: goals.some((g) => g.status === "complete") },
    { name: "Streak Master", icon: Flame as LucideIcon, color: "var(--red)", desc: "All goals checked this month", earned: goals.length > 0 && goals.every((g) => g.checkedThisMonth || g.status === "complete") },
    { name: "Wealth Builder", icon: Gem as LucideIcon, color: "var(--tertiary-accent)", desc: "Net worth above ₹5L", earned: currentNetWorth >= 500000 },
  ];

  const debtPct = income.total > 0 ? Math.round((totalDebt / income.total) * 100) : 0;
  const debtInsight = interestSaved > 0
    ? `Debt takes ${debtPct}% of income. Switching to avalanche could save ${formatInr(interestSaved)} in interest.`
    : `Debt takes ${debtPct}% of income. Add interest rates to debt items to see strategy comparisons.`;
  const insights = [
    { icon: "PiggyBank",     text: `You're saving ${income.total > 0 ? Math.round((surplus / income.total) * 100) : 0}% of income — try moving ₹5,000 from lifestyle to hit 25%.` },
    { icon: "AlertTriangle", text: debtInsight },
    { icon: "Sparkles",      text: `You have ${activeGoals.length} active goal${activeGoals.length !== 1 ? "s" : ""} on track for this month.` },
  ];

  return (
    <div className="dashboard-page">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <p className="text-label">Financial Overview</p>
          <h2 className="slashed-zero dashboard-title">Dashboard</h2>
        </div>
        <div className="dashboard-period-pills">
          {(["This month", "Quarter", "YTD"] as const).map((p) => (
            <button
              key={p}
              className={`pill${period === p ? " active" : ""}`}
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              aria-label={`Show ${p} period`}
            >{p}</button>
          ))}
        </div>
      </div>

      {/* ── Bento grid ── */}
      <motion.div className="dashboard-grid" variants={gridVariants} initial="hidden" animate="visible">

        {/* ─ Active Goals (8 cols) ─ */}
        <motion.div className="bento-card col-span-8" variants={cardVariants}>
          <h3 className="sr-only">Active Goals</h3>
          <div className="relative">
            <div className="goals-header">
              <div>
                <p className="text-label">Active Goals</p>
                <p className="goals-subtitle">
                  {activeGoals.length} on track · {goals.filter((g) => g.status === "complete").length} completed
                </p>
              </div>
              <button className="pill" onClick={() => navigate("/journey")} aria-label="View all goals">View All</button>
            </div>

            <div className="goals-list">
              {activeGoals.map((g) => {
                const cat      = CATEGORY_STYLE[g.category] || CATEGORY_STYLE.default;
                const GIcon    = ICONS[cat.icon] || Target;
                const progress = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
                const monthly  = g.monthlyAllocation || Math.round((g.targetAmount - g.currentAmount) / Math.max(1, g.timelineMonths));
                return (
                  <div
                    key={g.id}
                    className="card-hover goal-row"
                    role="button"
                    tabIndex={0}
                    aria-label={`View goal: ${g.name}`}
                    onClick={() => navigate("/journey")}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate("/journey"); }}
                  >
                    <div className="goal-icon" style={{ background: cat.subtle, color: cat.color }}>
                      <GIcon size={18} className="icon-wireframe" />
                    </div>

                    <div className="goal-name-col">
                      <p className="goal-name">{g.name}</p>
                      <p className="goal-sub">{formatInr(monthly)}/mo · {g.timelineMonths} mo left</p>
                    </div>

                    <div className="goal-bar">
                      <div className="goal-bar-hatch" />
                      <div className="goal-bar-fill" style={{ width: `${progress}%`, background: cat.color, boxShadow: `0 0 10px ${cat.color}` }} />
                    </div>

                    <p className="slashed-zero goal-pct">{progress}%</p>

                    <p className="slashed-zero goal-amounts">
                      <span className="goal-amounts-current">{formatInrCompact(g.currentAmount)}</span>
                      <span className="goal-amounts-target"> / {formatInrCompact(g.targetAmount)}</span>
                    </p>
                  </div>
                );
              })}

              {activeGoals.length === 0 && (
                <div className="goals-empty">
                  <div className="goals-empty-icon">
                    <Target size={24} className="icon-wireframe" />
                  </div>
                  <p className="goals-empty-text">No active goals</p>
                  <button className="pill active" onClick={() => navigate("/journey")}>+ Add a goal</button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─ Next Step (4 cols) ─ */}
        <motion.div className="bento-card col-span-4 flex flex-col" variants={cardVariants}>
          <h3 className="sr-only">Your Next Step</h3>
          <p className="text-label mb-4">Your Next Step</p>

          {nextGoal ? (() => {
            const cat     = CATEGORY_STYLE[nextGoal.category] || CATEGORY_STYLE.default;
            const NIcon   = ICONS[cat.icon] || Target;
            const monthly = nextGoal.monthlyAllocation || Math.round((nextGoal.targetAmount - nextGoal.currentAmount) / Math.max(1, nextGoal.timelineMonths));
            return (
              <>
                <div className="next-step-header">
                  <div className="next-step-icon" style={{ background: cat.subtle, color: cat.color }}>
                    <NIcon size={18} className="icon-wireframe" />
                  </div>
                  <span className="next-step-name">{nextGoal.name}</span>
                </div>

                <p className="text-label mb-1">Recommended this month</p>

                <p className="slashed-zero next-step-amount">
                  {formatInr(monthly)}
                  <span className="next-step-period">/mo</span>
                </p>

                <p className="next-step-remaining">
                  {formatInrCompact(nextGoal.targetAmount - nextGoal.currentAmount)} left to save
                </p>

                <button
                  className="btn-primary mt-auto w-full justify-center"
                  style={{ borderRadius: 'var(--radius-full)' }}
                  aria-label={`Mark ${nextGoal.name} as done for this month`}
                  onClick={() => {
                    const m = nextGoal.monthlyAllocation || Math.round((nextGoal.targetAmount - nextGoal.currentAmount) / Math.max(1, nextGoal.timelineMonths));
                    const newAmt = Math.min(nextGoal.targetAmount, nextGoal.currentAmount + m);
                    const justCompleted = newAmt >= nextGoal.targetAmount;
                    updateGoal(nextGoal.id, { currentAmount: newAmt, checkedThisMonth: true, status: justCompleted ? "complete" : "in-progress" });
                    const styles = getComputedStyle(document.documentElement);
                    const accent = styles.getPropertyValue("--accent").trim() || "#495bff";
                    const secondary = styles.getPropertyValue("--secondary-accent").trim() || "#ac49ff";
                    const lime = styles.getPropertyValue("--tertiary-accent").trim() || "#b0ff09";
                    const green = styles.getPropertyValue("--green").trim() || "#22c55e";
                    if (justCompleted) {
                      const end = Date.now() + 2000;
                      const frame = () => {
                        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: [accent, secondary, accent] });
                        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: [accent, lime, green] });
                        if (Date.now() < end) requestAnimationFrame(frame);
                      };
                      frame();
                    } else {
                      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: [accent, secondary, lime] });
                    }
                  }}
                >
                  <Check size={14} className="icon-wireframe" /> Done for this month
                </button>
              </>
            );
          })() : (
            <div className="next-step-empty">
              <div className="next-step-empty-icon">
                <Check size={20} className="icon-wireframe" />
              </div>
              <p className="next-step-empty-title">All caught up!</p>
              <p className="next-step-empty-sub">Check back next month.</p>
            </div>
          )}
        </motion.div>

        {/* ─ Health + Metrics (7 cols) ─ */}
        <motion.div className="bento-card col-span-7 flex gap-6" variants={cardVariants}>
          <h3 className="sr-only">Health and Metrics</h3>

          {/* Metrics column */}
          <div className="metrics-col">
            {([
              [period === "This month" ? "Monthly Income"  : `${period} Income`,  animIncome,  "var(--card-foreground)", ""],
              [period === "This month" ? "Monthly Surplus" : `${period} Surplus`, animSurplus, surplus > 0 ? "var(--green-text)" : "var(--red-text)", surplus > 0 ? "+" : ""],
              ["Total Savings",   animSavings, "var(--card-foreground)", ""],
            ] as [string, number, string, string][]).map(([label, value, color, prefix]) => (
              <div key={label}>
                <p className="text-label metric-label">{label}</p>
                <p className="slashed-zero metric-value" style={{ color }}>
                  {prefix}{formatInr(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Health ring column */}
          <HealthScoreWidget variant="compact" />
        </motion.div>

        {/* ─ Recent Activity (5 cols) ─ */}
        <motion.div className="bento-card col-span-5" variants={cardVariants}>
          <h3 className="sr-only">Recent Activity</h3>
          <div className="activity-header">
            <p className="text-label">Recent Activity</p>
            <p className="activity-subtitle">{period === "This month" ? "This month's" : period === "Quarter" ? "Quarterly" : "YTD"} allocations</p>
          </div>

          <div className="activity-list">
            {goals.slice(0, 5).map((g) => {
              const cat     = CATEGORY_STYLE[g.category] || CATEGORY_STYLE.default;
              const monthly = g.monthlyAllocation || Math.round((g.targetAmount - g.currentAmount) / Math.max(1, g.timelineMonths));
              return (
                <div key={g.id} className="activity-row">
                  <div className="activity-left">
                    <div className="activity-dot" style={{ background: cat.color }} />
                    <div>
                      <p className="activity-name">{g.name}</p>
                      <p className="activity-status">{g.checkedThisMonth ? "Allocated" : "Pending"}</p>
                    </div>
                  </div>
                  <span className="slashed-zero activity-amount">
                    {formatInr(monthly)}<span className="activity-period">/mo</span>
                  </span>
                </div>
              );
            })}
            {goals.length === 0 && (
              <p className="activity-empty">No goals yet.</p>
            )}
          </div>
        </motion.div>

        {/* ─ Achievements (12 cols) ─ */}
        <motion.div className="bento-card col-span-12" variants={cardVariants}>
          <h3 className="text-heading slashed-zero text-[var(--card-foreground)] mb-4">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.name}
                className={`p-4 rounded-xl flex flex-col items-center text-center transition-all ${badge.earned ? "bg-[var(--surface-tint)] border border-[var(--accent)]" : "bg-[var(--surface-hover)] border border-[var(--border)] opacity-40"}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 bg-[var(--surface-tint)] border border-[var(--border)]"
                >
                  <badge.icon size={20} className="icon-wireframe" style={{ color: badge.earned ? badge.color : "var(--secondary)" }} />
                </div>
                <div className="text-xs font-bold text-[var(--card-foreground)] mb-1 font-body-family">{badge.name}</div>
                <div className="text-[var(--text-2xs)] text-[var(--secondary)]">{badge.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─ Penny Insights (12 cols) ─ */}
        <motion.div className="bento-card penny-card col-span-12" variants={cardVariants}>
          <div className="penny-blob" />

          <div className="penny-insights-header">
            <div className="penny-insights-icon">
              <Sparkles size={18} className="icon-wireframe" />
            </div>
            <div>
              <h3 className="penny-insights-title">Penny's Insights</h3>
              <p className="penny-insights-sub">Personalized for your current plan</p>
            </div>
            <button className="pill ml-auto" onClick={onPennyClick} aria-label="Ask Penny a follow-up question">
              Ask follow-up <ArrowRight size={14} className="icon-wireframe" />
            </button>
          </div>

          <div className="penny-insights-grid">
            {insights.map((tip, i) => {
              const TIcon = ICONS[tip.icon] || Sparkles;
              return (
                <div key={`insight-${i}`} className="penny-tile">
                  <div className="penny-tile-icon">
                    <TIcon size={14} className="icon-wireframe" />
                  </div>
                  <p className="penny-tile-text">{tip.text}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
