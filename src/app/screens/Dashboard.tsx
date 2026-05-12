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

  const totalDebt = debts.totalMonthly || 0;
  const surplus   = income.total - expenses.total - totalDebt;
  const health    = healthScore?.overall ?? 0;

  const animIncome  = useCountUp(income.total);
  const animSurplus = useCountUp(surplus);
  const animSavings = useCountUp(savings);

  const [healthAnim, setHealthAnim] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setHealthAnim(health), 300);
    return () => clearTimeout(t);
  }, [health]);

  const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount).slice(0, 3);
  const nextGoal    = goals.find((g) => !g.checkedThisMonth && g.status !== "complete");

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

  return (
    <div className="page-animate" style={{ padding: "var(--space-1) var(--space-2) var(--space-3)", maxWidth: 1400, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div className="flex items-baseline justify-between" style={{ marginBottom: "var(--space-3)" }}>
        <div>
          <p className="text-label">Financial Overview</p>
          <h2 className="slashed-zero" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-4xl)", fontWeight: "var(--font-weight-bold)", letterSpacing: "-0.03em", marginTop: 4, color: "var(--foreground)" }}>
            Dashboard
          </h2>
        </div>
      </div>

      {/* ── Bento grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "var(--space-2)" }}>

        {/* ─ Active Goals (8 cols) ─ */}
        <div className="bento-card" style={{ gridColumn: "span 8" }}>
          {/* decorative blob */}
          <div className="data-blob" style={{ width: 280, height: 280, top: -80, right: -40, background: "var(--accent)" }} />

          <div style={{ position: "relative" }}>
            <div className="flex justify-between items-start" style={{ marginBottom: "var(--space-2)" }}>
              <div>
                <p className="text-label">Active Goals</p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--tertiary)", marginTop: 4 }}>
                  {activeGoals.length} on track · {goals.filter((g) => g.status === "complete").length} completed
                </p>
              </div>
              <button className="pill" onClick={() => navigate("/journey")}>View All</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              {activeGoals.map((g) => {
                const cat     = CATEGORY_STYLE[g.category] || CATEGORY_STYLE.default;
                const GIcon   = ICONS[cat.icon] || Target;
                const progress = Math.round((g.currentAmount / g.targetAmount) * 100);
                const monthly  = g.monthlyAllocation || Math.round((g.targetAmount - g.currentAmount) / Math.max(1, g.timelineMonths));
                return (
                  <div
                    key={g.id}
                    className="card-hover flex items-center"
                    onClick={() => navigate("/journey")}
                    style={{ gap: "var(--space-2)", padding: "10px var(--space-2)", borderRadius: "var(--radius-md)" }}
                  >
                    {/* category icon */}
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: cat.subtle, color: cat.color }}>
                      <GIcon size={18} />
                    </div>

                    {/* name + sub */}
                    <div style={{ minWidth: 130, flexShrink: 0 }}>
                      <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--card-foreground)" }}>{g.name}</p>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--tertiary)", marginTop: 2 }}>₹{fmt(monthly)}/mo · {g.timelineMonths} mo left</p>
                    </div>

                    {/* progress bar */}
                    <div className="flex-1 relative rounded-full overflow-hidden" style={{ height: 8, background: "var(--surface-hover)" }}>
                      <div className="absolute inset-0 rounded-full" style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--border) 0 1px, transparent 1px 5px)", opacity: 0.5 }} />
                      <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${progress}%`, background: cat.color, boxShadow: `0 0 10px ${cat.color}`, transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)" }} />
                    </div>

                    {/* % */}
                    <p className="slashed-zero text-right flex-shrink-0" style={{ minWidth: 44, fontFamily: "var(--font-display)", fontWeight: "var(--font-weight-bold)", fontSize: "var(--text-base)", color: "var(--card-foreground)" }}>{progress}%</p>

                    {/* amount pair */}
                    <p className="slashed-zero text-right flex-shrink-0" style={{ display: "none", minWidth: 110, fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" }}>
                      <span style={{ color: "var(--card-foreground)" }}>{fmtCompact(g.currentAmount)}</span>
                      <span style={{ color: "var(--tertiary)" }}> / {fmtCompact(g.targetAmount)}</span>
                    </p>
                  </div>
                );
              })}

              {activeGoals.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center" style={{ padding: "var(--space-4) 0" }}>
                  <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", background: "var(--accent-subtle)", color: "var(--accent)", marginBottom: "var(--space-2)" }}>
                    <Target size={24} />
                  </div>
                  <p style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--card-foreground)", marginBottom: 6 }}>No active goals</p>
                  <button className="pill active" onClick={() => navigate("/journey")}>+ Add a goal</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─ Next Step (4 cols) ─ */}
        <div className="bento-card flex flex-col" style={{ gridColumn: "span 4" }}>
          <p className="text-label" style={{ marginBottom: "var(--space-2)" }}>Your Next Step</p>

          {nextGoal ? (() => {
            const cat     = CATEGORY_STYLE[nextGoal.category] || CATEGORY_STYLE.default;
            const NIcon   = ICONS[cat.icon] || Target;
            const monthly = nextGoal.monthlyAllocation || Math.round((nextGoal.targetAmount - nextGoal.currentAmount) / Math.max(1, nextGoal.timelineMonths));
            return (
              <>
                <div className="flex items-center" style={{ gap: "var(--space-1)", marginBottom: "var(--space-2)" }}>
                  <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", background: cat.subtle, color: cat.color }}>
                    <NIcon size={16} />
                  </div>
                  <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--card-foreground)" }}>{nextGoal.name}</span>
                </div>

                <p className="text-label" style={{ marginBottom: 4 }}>Recommended this month</p>

                <p className="slashed-zero" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: "var(--font-weight-bold)", letterSpacing: "-0.02em", color: "var(--card-foreground)" }}>
                  ₹{fmt(monthly)}
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--tertiary)", fontWeight: "var(--font-weight-medium)" }}>/mo</span>
                </p>

                <p style={{ fontSize: "var(--text-xs)", color: "var(--tertiary)", margin: "4px 0 var(--space-2)" }}>
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
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--green-subtle)", color: "var(--green)", marginBottom: "var(--space-1)" }}>
                <Check size={20} />
              </div>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--card-foreground)" }}>All caught up!</p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--tertiary)", marginTop: 4 }}>Check back next month.</p>
            </div>
          )}
        </div>

        {/* ─ Health + Metrics (7 cols) ─ */}
        <div className="bento-card flex" style={{ gridColumn: "span 7", gap: "var(--space-3)" }}>

          {/* Metrics column */}
          <div className="flex flex-col justify-around flex-1" style={{ padding: "var(--space-1) 0" }}>
            {([
              ["Monthly Income",  animIncome,  "var(--card-foreground)", ""],
              ["Monthly Surplus", animSurplus, surplus > 0 ? "var(--green-text)" : "var(--red-text)", surplus > 0 ? "+" : ""],
              ["Total Savings",   animSavings, "var(--card-foreground)", ""],
            ] as [string, number, string, string][]).map(([label, value, color, prefix]) => (
              <div key={label}>
                <p className="text-label" style={{ marginBottom: 4 }}>{label}</p>
                <p className="slashed-zero" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", letterSpacing: "-0.02em", color }}>
                  {prefix}₹{fmt(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Health ring column */}
          <div className="flex flex-col items-center justify-center flex-shrink-0" style={{ gap: "var(--space-1)" }}>
            <p className="text-label">Health Meter</p>
            <div style={{ position: "relative", width: 188, height: 188 }}>
              <svg viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
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
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="slashed-zero" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-4xl)", fontWeight: "var(--font-weight-bold)", color: "var(--card-foreground)" }}>{healthAnim}</span>
                <span className="text-label">Score</span>
              </div>
            </div>
            <p style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: healthLabel.c }}>{healthLabel.t}</p>
          </div>
        </div>

        {/* ─ Recent Activity (5 cols) ─ */}
        <div className="bento-card" style={{ gridColumn: "span 5" }}>
          <div style={{ marginBottom: "var(--space-2)" }}>
            <p className="text-label">Recent Activity</p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--tertiary)", marginTop: 4 }}>This month's allocations</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {goals.slice(0, 5).map((g) => {
              const cat     = CATEGORY_STYLE[g.category] || CATEGORY_STYLE.default;
              const monthly = g.monthlyAllocation || Math.round((g.targetAmount - g.currentAmount) / Math.max(1, g.timelineMonths));
              return (
                <div key={g.id} className="flex justify-between items-center" style={{ padding: "10px var(--space-2)", borderRadius: "var(--radius-sm)" }}>
                  <div className="flex items-center" style={{ gap: "var(--space-1)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--card-foreground)" }}>{g.name}</p>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--tertiary)" }}>{g.checkedThisMonth ? "Allocated" : "Pending"}</p>
                    </div>
                  </div>
                  <span className="slashed-zero" style={{ fontFamily: "var(--font-display)", fontWeight: "var(--font-weight-bold)", fontSize: "var(--text-base)", color: "var(--card-foreground)", flexShrink: 0 }}>
                    ₹{fmt(monthly)}<span style={{ fontSize: "var(--text-xs)", color: "var(--tertiary)", fontWeight: "var(--font-weight-regular)" }}>/mo</span>
                  </span>
                </div>
              );
            })}
            {goals.length === 0 && (
              <p style={{ fontSize: "var(--text-sm)", color: "var(--tertiary)", padding: "var(--space-3) 0", textAlign: "center" }}>No goals yet.</p>
            )}
          </div>
        </div>

        {/* ─ Penny Insights (12 cols) ─ */}
        <div className="bento-card penny-card" style={{ gridColumn: "span 12" }}>
          <div className="penny-blob" />

          <div className="relative flex items-center" style={{ gap: "var(--space-1)", marginBottom: "var(--space-2)" }}>
            <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: "var(--penny-accent-subtle)", color: "var(--penny-accent)", flexShrink: 0 }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--card-foreground)" }}>Penny's Insights</h3>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--tertiary)" }}>Personalized for your current plan</p>
            </div>
            <button className="pill" style={{ marginLeft: "auto" }} onClick={onPennyClick}>
              Ask follow-up <ArrowRight size={12} />
            </button>
          </div>

          <div className="relative" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-1)" }}>
            {insights.map((tip, i) => {
              const TIcon = ICONS[tip.icon] || Sparkles;
              return (
                <div key={i} className="flex" style={{ gap: "var(--space-1)", padding: "var(--space-2)", borderRadius: "var(--radius-md)", background: "var(--surface-hover)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-center flex-shrink-0" style={{ width: 24, height: 24, borderRadius: "var(--radius-xs)", background: "var(--penny-accent-subtle)", color: "var(--penny-accent)" }}>
                    <TIcon size={14} />
                  </div>
                  <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--card-foreground)" }}>{tip.text}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
