import { useState, useMemo } from "react";
import {
  CheckCircle2,
  Sparkles,
  Check,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useFinPathStore } from '@/lib/store';
import confetti from "canvas-confetti";

type ChartPoint = { label: string; value: number; projected?: boolean };

const SVG_W = 700;
const SVG_H = 220;

export default function Progress({ onPennyClick }: { onPennyClick?: () => void }) {
  const income = useFinPathStore((s) => s.income);
  const expenses = useFinPathStore((s) => s.expenses);
  const debts = useFinPathStore((s) => s.debts);
  const goals = useFinPathStore((s) => s.goals) || [];
  const plan = useFinPathStore((s) => s.plan);
  const healthScore = useFinPathStore((s) => s.healthScore);
  const savings = useFinPathStore((s) => s.savings);
  const investments = useFinPathStore((s) => s.investments);

  const surplus = income.total - expenses.total - debts.totalMonthly;
  const activeGoals = useMemo(
    () => goals.filter((g) => g.status !== "complete").slice().sort((a, b) => a.priority - b.priority),
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
    ? Object.values(month0.goalAllocations).reduce((sum, amount) => sum + Math.max(0, amount || 0), 0)
    : activeGoals.reduce((sum, goal) => sum + Math.max(0, goal.monthlyAllocation || 0), 0);
  const freeSurplus = Math.max(0, surplus - allocatedToGoals - reservedSurplus - pendingSurplus);
  const currentNetWorth = savings + investments + totalGoalValue;

  // KPI derived values
  const prevNetWorth = Math.round(currentNetWorth * 0.92);
  const netWorthDelta = currentNetWorth - prevNetWorth;
  const netWorthDeltaPct = Math.round((netWorthDelta / Math.max(1, prevNetWorth)) * 100);
  const completedGoals = goals.filter((g) => g.status === "complete").length;
  const savingsRate = Math.round(((income.total - expenses.total - debts.totalMonthly) / Math.max(1, income.total)) * 100);

  const streakDays = useMemo(() => {
    const completedCount = goals.filter((g) => g.status === "complete").length;
    return Math.min(30, 7 + completedCount * 5);
  }, [goals]);

  // Chart data: 5 history + current + up to 6 projected
  const chartData = useMemo((): ChartPoint[] => {
    const monthlyGrowth = Math.max(1000, allocatedToGoals + reservedSurplus + freeSurplus);
    const startNW = Math.max(0, currentNetWorth - monthlyGrowth * 5);
    const now = new Date();

    const history: ChartPoint[] = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const ratio = (i + 1) / 5;
      return {
        label: d.toLocaleDateString("en-IN", { month: "short" }),
        value: Math.round(startNW + (currentNetWorth - startNW) * ratio),
      };
    });

    const current: ChartPoint = {
      label: now.toLocaleDateString("en-IN", { month: "short" }),
      value: Math.round(currentNetWorth),
    };

    const projection: ChartPoint[] = plan?.months?.length
      ? plan.months.slice(0, 6).map((m) => ({
          label: (m.date || "").split(" ")[0] || "",
          value: m.netWorth,
          projected: true,
        }))
      : Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() + i + 1);
          return {
            label: d.toLocaleDateString("en-IN", { month: "short" }),
            value: Math.round(currentNetWorth + freeSurplus * (i + 1)),
            projected: true,
          };
        });

    return [...history, current, ...projection];
  }, [allocatedToGoals, currentNetWorth, freeSurplus, plan, reservedSurplus]);

  // SVG chart geometry
  const chart = useMemo(() => {
    const maxV = Math.max(...chartData.map((d) => d.value), 1);
    const toX = (i: number) => chartData.length > 1 ? (i / (chartData.length - 1)) * SVG_W : SVG_W / 2;
    const toY = (v: number) => SVG_H - (v / maxV) * (SVG_H - 30) - 10;
    const pts = chartData.map((d, i): [number, number] => [toX(i), toY(d.value)]);
    const histCount = chartData.filter((d) => !d.projected).length;

    const solidPath = pts
      .slice(0, histCount)
      .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");

    const dashedPath = histCount < pts.length
      ? pts
          .slice(histCount - 1)
          .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
          .join(" ")
      : "";

    const [lx, ly] = pts[histCount - 1] || pts[pts.length - 1] || [SVG_W, SVG_H];
    const areaPath = `${solidPath} L ${lx.toFixed(1)} ${SVG_H} L 0 ${SVG_H} Z`;

    return { pts, solidPath, dashedPath, areaPath, histCount };
  }, [chartData]);


  // Dynamic milestones
  const milestones = useMemo(() => {
    const emergencyFull = expenses.total * 6;
    const emergencyHalf = expenses.total * 3;
    const firstGoalDone = goals.some((g) => g.status === "complete");
    const monthsTo5L = plan?.months?.findIndex((m) => m.netWorth >= 500000) ?? -1;
    const monthsToEmFull = plan?.months?.findIndex((m) => m.netWorth >= emergencyFull) ?? -1;

    const estDate = (months: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() + Math.max(1, months));
      return `~${d.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`;
    };

    return [
      {
        title: "First ₹1L saved",
        done: (savings + investments) >= 100000,
        date: (savings + investments) >= 100000 ? "Achieved" : estDate(Math.ceil((100000 - savings - investments) / Math.max(1, surplus))),
      },
      {
        title: "Emergency fund 50%",
        done: savings >= emergencyHalf,
        date: savings >= emergencyHalf ? "Achieved" : estDate(Math.ceil((emergencyHalf - savings) / Math.max(1, surplus * 0.4))),
      },
      {
        title: "Emergency fund complete",
        done: savings >= emergencyFull,
        date: savings >= emergencyFull ? "Achieved" : (monthsToEmFull >= 0 ? estDate(monthsToEmFull) : estDate(Math.ceil((emergencyFull - savings) / Math.max(1, surplus * 0.4)))),
      },
      {
        title: `${Math.max(streakDays, 4)}-month allocation streak`,
        done: streakDays >= 4,
        date: streakDays >= 4 ? "Achieved" : estDate(4 - Math.floor(streakDays / 5)),
      },
      {
        title: "First ₹5L net worth",
        done: currentNetWorth >= 500000,
        date: currentNetWorth >= 500000 ? "Achieved" : (monthsTo5L >= 0 ? estDate(monthsTo5L) : estDate(Math.ceil((500000 - currentNetWorth) / Math.max(1, surplus)))),
      },
      {
        title: "First goal completed",
        done: firstGoalDone,
        date: firstGoalDone ? "Achieved" : (activeGoals.length > 0 ? estDate(Math.min(...activeGoals.map((g) => g.timelineMonths))) : "—"),
      },
    ];
  }, [savings, investments, expenses.total, goals, activeGoals, currentNetWorth, plan, surplus, streakDays]);

  // Penny quarterly review text
  const pennyText = useMemo(() => {
    const nextPending = milestones.find((m) => !m.done);
    if (savingsRate <= 0) return "Start building your savings rate to unlock your financial trajectory.";
    if (nextPending) {
      return `Your savings rate is ${savingsRate}% this quarter. Trajectory suggests reaching "${nextPending.title}" by ${nextPending.date.replace("~", "")}.`;
    }
    return `Your savings rate is ${savingsRate}%. All major milestones achieved — you're ahead of the curve.`;
  }, [savingsRate, milestones]);

  const [checkedIn, setCheckedIn] = useState(false);
  const [nwTooltip, setNwTooltip] = useState<{
    x: number; y: number; label: string; value: number; projected: boolean;
  } | null>(null);

  const handleCheckIn = () => {
    setCheckedIn(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const fmtCompact = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : fmt(n);

  const handleNWMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (chart.pts.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const idx = chart.pts.reduce((best, [px], i) =>
      Math.abs(px - svgX) < Math.abs(chart.pts[best][0] - svgX) ? i : best, 0);
    const [x, y] = chart.pts[idx];
    const pt = chartData[idx];
    setNwTooltip({ x, y, label: pt.label, value: pt.value, projected: !!pt.projected });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 relative">
      <div
        className="absolute -top-20 right-0 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ backgroundColor: "var(--accent)" }}
      />

      {/* Header */}
      <div className="mb-8 relative z-10">
        <p className="text-label">Last 6 months</p>
        <h1 className="text-title text-secondary tracking-[0.15em] mb-1">Progress</h1>
        {(reservedSurplus > 0 || pendingSurplus > 0) && (
          <p className="text-xs md:text-sm mt-2" style={{ color: "var(--secondary)", fontFamily: "var(--font-body)" }}>
            {pendingSurplus > 0
              ? `₹${pendingSurplus.toLocaleString("en-IN")}/mo is waiting for your reinvest decision.`
              : `₹${reservedSurplus.toLocaleString("en-IN")}/mo is being kept as net worth surplus.`}
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 relative z-10">
        {([
          { label: "Net Worth Δ", value: fmtCompact(netWorthDelta), delta: `+${netWorthDeltaPct}%`, color: "var(--green-text)" },
          { label: "Avg Monthly Save", value: fmtCompact(Math.max(0, surplus)), delta: `${savingsRate}% rate`, color: "var(--accent-text)" },
          { label: "Goals Hit", value: `${completedGoals}/${goals.length}`, delta: goals.length > 0 ? `${Math.round((completedGoals / goals.length) * 100)}%` : "0%", color: "var(--accent-text)" },
          { label: "Streak", value: `${streakDays} days`, delta: "🔥", color: "var(--amber-text)" },
        ] as const).map(({ label, value, delta, color }) => (
          <div key={label} className="bento-card p-5">
            <p className="text-label">{label}</p>
            <p
              className="slashed-zero mt-2"
              style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color, letterSpacing: "-0.02em" }}
            >
              {value}
            </p>
            <p className="mt-1" style={{ fontSize: 12, color: "var(--tertiary)" }}>{delta}</p>
          </div>
        ))}
      </div>

      {/* SVG Net Worth Trajectory */}
      <div className="bento-card p-6 md:p-8 relative z-10">
        <p className="text-label mb-4">Net Worth Trajectory</p>
        <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H + 30}`} style={{ width: "100%", height: 260 }} onMouseMove={handleNWMouseMove} onMouseLeave={() => setNwTooltip(null)}>
          <defs>
            <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={p}
              x1="0"
              y1={SVG_H - p * (SVG_H - 30) - 10}
              x2={SVG_W}
              y2={SVG_H - p * (SVG_H - 30) - 10}
              stroke="var(--border)"
              strokeDasharray="3 4"
              opacity="0.5"
            />
          ))}
          <path d={chart.areaPath} fill="url(#nwGrad)" />
          <path
            d={chart.solidPath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            className="draw-line-long"
            style={{ filter: "drop-shadow(0 4px 8px var(--accent-glow))" }}
          />
          {chart.dashedPath && (
            <path
              d={chart.dashedPath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="6 4"
              opacity="0.45"
            />
          )}
          {chart.pts.map(([x, y], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="var(--card)"
                stroke="var(--accent)"
                strokeWidth="2"
                opacity={i >= chart.histCount ? 0.4 : 1}
              />
              <text
                x={x}
                y={SVG_H + 22}
                fontSize="11"
                fill="var(--tertiary)"
                textAnchor="middle"
                fontFamily="var(--font-display)"
              >
                {chartData[i]?.label ?? ""}
              </text>
            </g>
          ))}
          {/* Current endpoint glow */}
          {chart.pts[chart.histCount - 1] && (() => {
            const [ex, ey] = chart.pts[chart.histCount - 1];
            return (
              <>
                <circle cx={ex} cy={ey} r="10" fill="var(--accent)" opacity="0.15" />
                <circle cx={ex} cy={ey} r="6" fill="var(--accent)" stroke="var(--card)" strokeWidth="2.5" />
              </>
            );
          })()}
          {nwTooltip && (
            <line
              x1={nwTooltip.x} y1={0}
              x2={nwTooltip.x} y2={SVG_H}
              stroke="var(--border)" strokeDasharray="4 2" opacity="0.7"
            />
          )}
        </svg>
        {nwTooltip && (
          <div style={{
            position: 'absolute',
            left: `${Math.min(85, Math.max(10, (nwTooltip.x / SVG_W) * 100))}%`,
            top: `${Math.min(80, Math.max(5, (nwTooltip.y / (SVG_H + 30)) * 100))}%`,
            transform: 'translate(-50%, -110%)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            fontFamily: 'var(--font-body)',
            color: 'var(--card-foreground)',
            padding: '10px 14px',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: 130,
          }}>
            <p style={{ fontSize: 11, color: 'var(--tertiary)', marginBottom: 4 }}>{nwTooltip.label}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{fmtCompact(nwTooltip.value)}</p>
            {nwTooltip.projected && (
              <p style={{ fontSize: 10, color: 'var(--tertiary)', marginTop: 2 }}>Projected</p>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Monthly Check-in */}
      <div className="bento-card p-6 md:p-8 relative z-10">
        <h3 className="text-xl font-bold mb-4 text-[var(--card-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
          Monthly Check-in
        </h3>
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
            return (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--card-foreground)]">{goal.name}</span>
                  <span className="text-xs font-bold slashed-zero" style={{ color: goal.status === "complete" ? "var(--accent-text)" : "var(--secondary)" }}>
                    {progress}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--progress-inactive)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: goal.status === "complete" ? "var(--accent)" : "var(--tertiary-accent)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {!checkedIn ? (
          <button
            onClick={handleCheckIn}
            className="w-full mt-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 button-press"
            style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)", fontFamily: "var(--font-body)", boxShadow: "0 8px 24px var(--accent-glow)" }}
          >
            <CheckCircle2 size={18} />
            Complete Monthly Check-in
          </button>
        ) : (
          <div className="mt-6 py-3 rounded-xl font-bold text-center" style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)", fontFamily: "var(--font-body)", opacity: 0.7 }}>
            Checked in for this month!
          </div>
        )}
      </div>

      {/* Milestones + Penny Quarterly Review */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
        <div className="bento-card p-6 md:p-8">
          <p className="text-label mb-4">Milestones Unlocked</p>
          <div>
            {milestones.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: i < milestones.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: m.done ? "var(--green-subtle)" : "var(--surface-hover)",
                    color: m.done ? "var(--green-text)" : "var(--tertiary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {m.done ? <Check size={14} strokeWidth={3} /> : <Clock size={14} />}
                </div>
                <p style={{ fontSize: 13.5, fontWeight: 500, flex: 1, color: "var(--card-foreground)" }}>{m.title}</p>
                <p style={{ fontSize: 11, color: "var(--tertiary)" }}>{m.date}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-card penny-card p-6 md:p-8" style={{ position: "relative", overflow: "hidden" }}>
          <div className="penny-blob" />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Sparkles size={18} style={{ color: "var(--penny-accent)" }} />
              <p style={{ fontSize: 14, fontWeight: 700 }}>Quarterly Review</p>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--secondary)" }}>{pennyText}</p>
            <button
              onClick={onPennyClick}
              className="pill"
              style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              Discuss with Penny <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Health Score Strip */}
      {healthScore && (
        <div className="bento-card p-6 md:p-8 relative z-10">
          <h3 className="text-xl font-bold mb-4 text-[var(--card-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
            Health Score
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(
              [
                { label: "Income Stability", score: healthScore.incomeStability },
                { label: "Debt Load", score: healthScore.debtLoad },
                { label: "Savings Rate", score: healthScore.savingsRate },
                { label: "Emergency Fund", score: healthScore.emergencyFund },
              ] as const
            ).map(({ label, score }) => {
              const color = score >= 20 ? "var(--green-text)" : score >= 12 ? "var(--accent-text)" : "var(--amber-text)";
              return (
                <div
                  key={label}
                  className="px-4 py-3 rounded-xl text-center"
                  style={{ background: "var(--surface-tint)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="text-2xl font-bold slashed-zero"
                    style={{ fontFamily: "var(--font-display)", color }}
                  >
                    {score}
                    <span style={{ fontSize: 13, color: "var(--tertiary)", fontWeight: 400 }}>/25</span>
                  </div>
                  <div className="text-xs text-[var(--secondary)] mt-1">{label}</div>
                </div>
              );
            })}
          </div>
          {healthScore.actions.length > 0 && (
            <div className="mt-4 penny-card bento-card">
              <div className="penny-insight-blob" />
              <div className="relative z-10 flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--penny-accent-subtle)", color: "var(--penny-accent)" }}
                >
                  <Sparkles size={16} />
                </div>
                <div className="text-xs font-semibold text-[var(--penny-accent)] uppercase tracking-wider">
                  Penny's Top Actions
                </div>
              </div>
              <div className="relative z-10 space-y-2">
                {healthScore.actions.slice(0, 3).map((action, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl text-sm text-card-foreground"
                    style={{ background: "var(--surface-hover)", border: "1px solid var(--border)", fontFamily: "var(--font-body)" }}
                  >
                    <span className="text-[var(--penny-accent)] mt-0.5 font-bold">{i + 1}.</span>
                    {action}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
