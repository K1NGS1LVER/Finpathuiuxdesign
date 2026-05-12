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
import { useFinPathStore } from "@/lib/store";

// ── Icon registry ──
const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Bike, Home, Plane, BookOpen, Users, TrendingUp, Target,
  PiggyBank, AlertTriangle, Sparkles, Check, ArrowRight,
};

// ── Category → token mapping (all values are CSS vars from theme.css) ──
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

// ── Animated count-up ──
function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setValue(target), 300);
    return () => clearTimeout(timer);
  }, [target]);
  return value;
}

function fmt(n: number): string {
  return n.toLocaleString("en-IN");
}

function fmtCompact(n: number): string {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(n >= 1_000_000 ? 0 : 1)}L`;
  if (n >= 1_000)   return `₹${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `₹${fmt(n)}`;
}

export default function Dashboard({ onPennyClick }: { onPennyClick: () => void }) {
  const navigate    = useNavigate();
  const income      = useFinPathStore((s) => s.income);
  const expenses    = useFinPathStore((s) => s.expenses);
  const debts       = useFinPathStore((s) => s.debts);
  const goals       = useFinPathStore((s) => s.goals) || [];
  const savings     = useFinPathStore((s) => s.savings);
  const healthScore = useFinPathStore((s) => s.healthScore);
  const updateGoal  = useFinPathStore((s) => s.updateGoal);

  const [period, setPeriod] = useState<"This month" | "Quarter" | "YTD">("This month");

  const totalDebt = debts.totalMonthly || 0;
  const surplus   = income.total - expenses.total - totalDebt;
  const health    = healthScore?.overall ?? 0;

  const now = new Date();
  const periodMonths = period === "This month" ? 1 : period === "Quarter" ? 3 : now.getMonth() + 1;

  const animIncome  = useCountUp(income.total * periodMonths);
  const animSurplus = useCountUp(surplus * periodMonths);
  const animSavings = useCountUp(savings + (periodMonths > 1 ? surplus * (periodMonths - 1) : 0));

  const [healthAnim, setHealthAnim] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setHealthAnim(health), 300);
    return () => clearTimeout(t);
  }, [health]);

  const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount).slice(0, 3);
  const nextGoal    = goals.find((g) => !g.checkedThisMonth && g.status !== "complete");

  // Badge logic (moved from Progress)
  const streakDays = Math.min(30, 7 + goals.filter((g) => g.status === "complete").length * 5);
  const investments = useFinPathStore((s) => s.investments);
  const currentNetWorth = savings + investments + goals.reduce((sum, g) => sum + Math.max(0, g.currentAmount), 0);

  const badges = [
    { name: "First Step", icon: Rocket as LucideIcon, color: "var(--accent)", desc: "Completed onboarding", earned: income.total > 0 },
    { name: "Healthy Start", icon: Dumbbell as LucideIcon, color: "var(--tertiary-accent)", desc: "Health score above 50", earned: healthScore && healthScore.overall >= 50 },
    { name: "Goal Setter", icon: Crosshair as LucideIcon, color: "var(--accent)", desc: "Set 2+ financial goals", earned: goals.length >= 2 },
    { name: "In the Green", icon: Leaf as LucideIcon, color: "var(--tertiary-accent)", desc: "Positive monthly surplus", earned: surplus > 0 },
    { name: "Debt Crusher", icon: Zap as LucideIcon, color: "var(--amber)", desc: "Pay off first debt", earned: debts.items.some((d) => d.remainingMonths <= 0) },
    { name: "Goal Achiever", icon: Trophy as LucideIcon, color: "var(--amber)", desc: "Complete first goal", earned: goals.some((g) => g.status === "complete") },
    { name: "Streak Master", icon: Flame as LucideIcon, color: "var(--red)", desc: "30-day check-in streak", earned: streakDays >= 30 },
    { name: "Wealth Builder", icon: Gem as LucideIcon, color: "var(--tertiary-accent)", desc: "Net worth above ₹5L", earned: currentNetWorth >= 500000 },
  ];

  const healthLabel =
    health >= 80 ? { t: "Excellent financial health",   c: "var(--tertiary-accent-text)" } :
    health >= 60 ? { t: "Strong position — keep going", c: "var(--accent-text)" }          :
    health >= 40 ? { t: "Steady foundation",            c: "var(--secondary)" }            :
                   { t: "Let's build momentum",         c: "var(--amber-text)" };

  const insights = [
    { icon: "PiggyBank",     text: `You're saving ${income.total > 0 ? Math.round((surplus / income.total) * 100) : 0}% of income — try moving ₹5,000 from lifestyle to hit 25%.` },
    { icon: "AlertTriangle", text: `Debt takes ${income.total > 0 ? Math.round((totalDebt / income.total) * 100) : 0}% of income. Switching to avalanche could save ₹18,400 in interest.` },
    { icon: "Sparkles",      text: `You have ${activeGoals.length} active goal${activeGoals.length !== 1 ? "s" : ""} on track for this month.` },
  ];

  // Health ring geometry
  const r = 78;
  const circum = 2 * Math.PI * r;

  const subScores = [
    { label: "Savings Rate",     score: healthScore?.savingsRate     ?? 0 },
    { label: "Debt Load",        score: healthScore?.debtLoad        ?? 0 },
    { label: "Emergency Fund",   score: healthScore?.emergencyFund   ?? 0 },
    { label: "Income Stability", score: healthScore?.incomeStability ?? 0 },
  ];

  return (
    <div className="page-animate dashboard-page">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <p className="text-label">Financial Overview</p>
          <h2 className="slashed-zero dashboard-title">Dashboard</h2>
        </div>
        <div className="dashboard-period-pills">
          {(["This month", "Quarter", "YTD"] as const).map((p) => (
            <button key={p} className={`pill${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>

      {/* ── Bento grid ── */}
      <div className="dashboard-grid">

        {/* ─ Active Goals (8 cols) ─ */}
        <div className="bento-card" style={{ gridColumn: "span 8" }}>
          <div style={{ position: "relative" }}>
            <div className="goals-header">
              <div>
                <p className="text-label">Active Goals</p>
                <p className="goals-subtitle">
                  {activeGoals.length} on track · {goals.filter((g) => g.status === "complete").length} completed
                </p>
              </div>
              <button className="pill" onClick={() => navigate("/journey")}>View All</button>
            </div>

            <div className="goals-list">
              {activeGoals.map((g) => {
                const cat      = CATEGORY_STYLE[g.category] || CATEGORY_STYLE.default;
                const GIcon    = ICONS[cat.icon] || Target;
                const progress = Math.round((g.currentAmount / g.targetAmount) * 100);
                const monthly  = g.monthlyAllocation || Math.round((g.targetAmount - g.currentAmount) / Math.max(1, g.timelineMonths));
                return (
                  <div
                    key={g.id}
                    className="card-hover goal-row"
                    onClick={() => navigate("/journey")}
                  >
                    <div className="goal-icon" style={{ background: cat.subtle, color: cat.color }}>
                      <GIcon size={18} />
                    </div>

                    <div className="goal-name-col">
                      <p className="goal-name">{g.name}</p>
                      <p className="goal-sub">₹{fmt(monthly)}/mo · {g.timelineMonths} mo left</p>
                    </div>

                    <div className="goal-bar">
                      <div className="goal-bar-hatch" />
                      <div className="goal-bar-fill" style={{ width: `${progress}%`, background: cat.color, boxShadow: `0 0 10px ${cat.color}` }} />
                    </div>

                    <p className="slashed-zero goal-pct">{progress}%</p>

                    <p className="slashed-zero goal-amounts">
                      <span className="goal-amounts-current">{fmtCompact(g.currentAmount)}</span>
                      <span className="goal-amounts-target"> / {fmtCompact(g.targetAmount)}</span>
                    </p>
                  </div>
                );
              })}

              {activeGoals.length === 0 && (
                <div className="goals-empty">
                  <div className="goals-empty-icon">
                    <Target size={24} />
                  </div>
                  <p className="goals-empty-text">No active goals</p>
                  <button className="pill active" onClick={() => navigate("/journey")}>+ Add a goal</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─ Next Step (4 cols) ─ */}
        <div className="bento-card" style={{ gridColumn: "span 4", display: "flex", flexDirection: "column" }}>
          <p className="text-label" style={{ marginBottom: "var(--space-2)" }}>Your Next Step</p>

          {nextGoal ? (() => {
            const cat     = CATEGORY_STYLE[nextGoal.category] || CATEGORY_STYLE.default;
            const NIcon   = ICONS[cat.icon] || Target;
            const monthly = nextGoal.monthlyAllocation || Math.round((nextGoal.targetAmount - nextGoal.currentAmount) / Math.max(1, nextGoal.timelineMonths));
            return (
              <>
                <div className="next-step-header">
                  <div className="next-step-icon" style={{ background: cat.subtle, color: cat.color }}>
                    <NIcon size={16} />
                  </div>
                  <span className="next-step-name">{nextGoal.name}</span>
                </div>

                <p className="text-label" style={{ marginBottom: 4 }}>Recommended this month</p>

                <p className="slashed-zero next-step-amount">
                  ₹{fmt(monthly)}
                  <span className="next-step-period">/mo</span>
                </p>

                <p className="next-step-remaining">
                  {fmtCompact(nextGoal.targetAmount - nextGoal.currentAmount)} left to save
                </p>

                <button
                  className="btn-primary"
                  style={{ marginTop: "auto", justifyContent: "center", width: "100%", borderRadius: "var(--radius-full)" }}
                  onClick={() => {
                    const m = nextGoal.monthlyAllocation || Math.round((nextGoal.targetAmount - nextGoal.currentAmount) / Math.max(1, nextGoal.timelineMonths));
                    const newAmt = Math.min(nextGoal.targetAmount, nextGoal.currentAmount + m);
                    updateGoal(nextGoal.id, { currentAmount: newAmt, checkedThisMonth: true, status: newAmt >= nextGoal.targetAmount ? "complete" : "in-progress" });
                  }}
                >
                  <Check size={16} /> Done for this month
                </button>
              </>
            );
          })() : (
            <div className="next-step-empty">
              <div className="next-step-empty-icon">
                <Check size={20} />
              </div>
              <p className="next-step-empty-title">All caught up!</p>
              <p className="next-step-empty-sub">Check back next month.</p>
            </div>
          )}
        </div>

        {/* ─ Health + Metrics (7 cols) ─ */}
        <div className="bento-card" style={{ gridColumn: "span 7", display: "flex", gap: "var(--space-3)" }}>

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
                  {prefix}₹{fmt(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Health ring column */}
          <div className="health-ring-col">
            <p className="text-label">Health Meter</p>
            <div className="health-ring-wrap">
              <svg viewBox="0 0 200 200" className="health-ring-svg">
                <defs>
                  <linearGradient id="health-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"   stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--secondary-accent)" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r={r} fill="none" stroke="var(--border)" strokeWidth="14" strokeDasharray="6 6" />
                <circle cx="100" cy="100" r={r} fill="none" stroke="url(#health-grad)" strokeWidth="14"
                  strokeDasharray={circum}
                  strokeDashoffset={circum - (healthAnim / 100) * circum}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1500ms cubic-bezier(0.22,1,0.36,1)", filter: "drop-shadow(0 0 8px var(--accent-glow))" }}
                />
              </svg>
              <div className="health-score-overlay">
                <span className="slashed-zero health-score-num">{healthAnim}</span>
                <span className="text-label">Score</span>
              </div>
            </div>
            <p className="health-label" style={{ color: healthLabel.c }}>{healthLabel.t}</p>

            <div className="sub-score-list">
              {subScores.map((s) => (
                <div key={s.label} className="sub-score-item">
                  <div className="sub-score-header">
                    <span className="sub-score-label">{s.label}</span>
                    <span className="sub-score-value">{s.score}/25</span>
                  </div>
                  <div className="sub-score-bar">
                    <div className="sub-score-fill" style={{ width: `${(s.score / 25) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─ Recent Activity (5 cols) ─ */}
        <div className="bento-card" style={{ gridColumn: "span 5" }}>
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
                    ₹{fmt(monthly)}<span className="activity-period">/mo</span>
                  </span>
                </div>
              );
            })}
            {goals.length === 0 && (
              <p className="activity-empty">No goals yet.</p>
            )}
          </div>
        </div>

        {/* ─ Achievements (12 cols) ─ */}
        <div className="bento-card p-6 md:p-8" style={{ gridColumn: "span 12" }}>
          <h3 className="text-xl font-bold mb-4 text-[var(--card-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
            Achievements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {badges.map((badge, i) => (
              <div
                key={i}
                className="p-4 rounded-xl flex flex-col items-center text-center transition-all"
                style={{
                  background: badge.earned ? "var(--surface-tint)" : "var(--surface-hover)",
                  border: badge.earned ? "1px solid var(--accent)" : "1px solid var(--border)",
                  opacity: badge.earned ? 1 : 0.4,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: badge.earned ? "var(--surface-tint)" : "var(--surface-hover)", border: "1px solid var(--border)" }}
                >
                  <badge.icon size={20} style={{ color: badge.earned ? badge.color : "var(--secondary)" }} />
                </div>
                <div className="text-xs font-bold text-[var(--card-foreground)] mb-1" style={{ fontFamily: "var(--font-body)" }}>{badge.name}</div>
                <div className="text-[10px] text-[var(--secondary)]">{badge.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─ Penny Insights (12 cols) ─ */}
        <div className="bento-card penny-card" style={{ gridColumn: "span 12" }}>
          <div className="penny-blob" />

          <div className="penny-insights-header">
            <div className="penny-insights-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="penny-insights-title">Penny's Insights</h3>
              <p className="penny-insights-sub">Personalized for your current plan</p>
            </div>
            <button className="pill" style={{ marginLeft: "auto" }} onClick={onPennyClick}>
              Ask follow-up <ArrowRight size={12} />
            </button>
          </div>

          <div className="penny-insights-grid">
            {insights.map((tip, i) => {
              const TIcon = ICONS[tip.icon] || Sparkles;
              return (
                <div key={i} className="penny-tile">
                  <div className="penny-tile-icon">
                    <TIcon size={14} />
                  </div>
                  <p className="penny-tile-text">{tip.text}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
