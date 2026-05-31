import { useState, useMemo } from "react";
import {
  Sparkles,
  Check,
  Clock,
  ArrowRight,
  Flame,
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useFinPathStore } from '@/lib/store';
import { formatInr, formatInrCompact } from '@/lib/format';
import { pageContainer, pageSection } from "@/app/components/motion-variants";
import HealthScoreWidget from "@/app/components/HealthScoreWidget";
import MilestoneChain from "@/app/components/MilestoneChain";

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
  const ledgerMilestones = useFinPathStore((s) => s.milestones);
  const savings = useFinPathStore((s) => s.savings);
  const investments = useFinPathStore((s) => s.investments);
  const navigate = useNavigate();
  const isDay1 = goals.length === 0 && (savings + investments) === 0;

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

  const [nwTooltip, setNwTooltip] = useState<{
    x: number; y: number; label: string; value: number; projected: boolean;
  } | null>(null);

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
    <motion.div className="max-w-5xl mx-auto space-y-4 md:space-y-6 relative" variants={pageContainer} initial="hidden" animate="visible">
      <div
        className="absolute -top-20 right-0 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ backgroundColor: "var(--accent)" }}
      />

      {/* Header */}
      <motion.div className="mb-8 relative z-10" variants={pageSection}>
        <p className="text-label">Last 6 months</p>
        <h1 className="text-title text-secondary tracking-[0.15em] mb-1">Progress</h1>
        {(reservedSurplus > 0 || pendingSurplus > 0) && (
          <p className="text-xs md:text-sm mt-2" style={{ color: "var(--secondary)", fontFamily: "var(--font-body)" }}>
            {pendingSurplus > 0
              ? `${formatInr(pendingSurplus)}/mo is waiting for your reinvest decision.`
              : `${formatInr(reservedSurplus)}/mo is being kept as net worth surplus.`}
          </p>
        )}
      </motion.div>

      {isDay1 ? (
        <motion.div className="space-y-4 md:space-y-6 relative z-10" variants={pageSection}>
          <div className="bento-card p-6 md:p-8" style={{ position: "relative", overflow: "hidden" }}>
            <p className="text-label mb-4">Net Worth Trajectory</p>
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              style={{ width: "100%", height: 160, opacity: 0.15 }}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="nwGradGhost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`M0 ${SVG_H - 30} C ${SVG_W * 0.25} ${SVG_H - 60}, ${SVG_W * 0.5} ${SVG_H - 110}, ${SVG_W * 0.75} ${SVG_H - 140} S ${SVG_W} ${SVG_H - 180}, ${SVG_W} ${SVG_H - 200} L ${SVG_W} ${SVG_H} L 0 ${SVG_H} Z`}
                fill="url(#nwGradGhost)"
              />
              <path
                d={`M0 ${SVG_H - 30} C ${SVG_W * 0.25} ${SVG_H - 60}, ${SVG_W * 0.5} ${SVG_H - 110}, ${SVG_W * 0.75} ${SVG_H - 140} S ${SVG_W} ${SVG_H - 180}, ${SVG_W} ${SVG_H - 200}`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                paddingTop: 32,
              }}
            >
              <p
                className="font-body"
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--tertiary)",
                  textAlign: "center",
                  maxWidth: 320,
                }}
              >
                Your trajectory appears here once you have goals and a starting balance.
              </p>
            </div>
          </div>

          <div className="bento-card p-6 md:p-8">
            <p className="text-label">Your trajectory starts soon</p>
            <h3
              className="text-title"
              style={{
                color: "var(--card-foreground)",
                marginTop: "var(--space-1)",
              }}
            >
              Three steps to unlock Progress
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--secondary)",
                lineHeight: 1.6,
                marginTop: "var(--space-2)",
                marginBottom: "var(--space-5)",
              }}
            >
              Progress tracks net worth, savings rate, and milestones. Complete these to see your first chart.
            </p>

            <div>
              {([
                {
                  title: "Set up income and expenses",
                  done: income.total > 0,
                  cta: null as null | { label: string; onClick: () => void },
                },
                {
                  title: "Add your first goal",
                  done: goals.length > 0,
                  cta: { label: "Go to Journey", onClick: () => navigate("/journey") },
                },
                {
                  title: "Build a starting balance",
                  done: savings + investments > 0,
                  cta: { label: "Open Dashboard", onClick: () => navigate("/dashboard") },
                },
              ] as const).map((row, i, arr) => (
                <div
                  key={row.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: row.done ? "var(--green-subtle)" : "var(--surface-hover)",
                      color: row.done ? "var(--green-text)" : "var(--tertiary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {row.done ? <Check size={14} strokeWidth={3} /> : <Clock size={14} />}
                  </div>
                  <p
                    style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      flex: 1,
                      color: row.done ? "var(--secondary)" : "var(--card-foreground)",
                      textDecoration: row.done ? "line-through" : "none",
                      textDecorationColor: "var(--tertiary)",
                    }}
                  >
                    {row.title}
                  </p>
                  {!row.done && row.cta && (
                    <button
                      type="button"
                      onClick={row.cta.onClick}
                      className="pill"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      {row.cta.label} <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card penny-card p-6 md:p-8" style={{ position: "relative", overflow: "hidden" }}>
            <div className="penny-blob" />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Sparkles size={18} style={{ color: "var(--penny-accent)" }} />
                <p style={{ fontSize: 14, fontWeight: 700 }}>Penny is ready</p>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--secondary)" }}>
                Once you&rsquo;ve logged a month, I&rsquo;ll start drawing your trajectory and projecting milestones. Until then, ask me anything about your setup.
              </p>
              <button
                onClick={onPennyClick}
                className="pill"
                style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                Discuss with Penny <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
      {/* KPI Cards */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 relative z-10" variants={pageSection}>
        {([
          { label: "Net Worth Δ", value: formatInrCompact(netWorthDelta), delta: `+${netWorthDeltaPct}%`, color: "var(--green-text)" },
          { label: "Avg Monthly Save", value: formatInrCompact(Math.max(0, surplus)), delta: `${savingsRate}% rate`, color: "var(--accent-text)" },
          { label: "Goals Hit", value: `${completedGoals}/${goals.length}`, delta: goals.length > 0 ? `${Math.round((completedGoals / goals.length) * 100)}%` : "0%", color: "var(--accent-text)" },
          { label: "Streak", value: `${streakDays} days`, delta: <Flame size={14} style={{ display: "inline-block", color: "var(--amber-text)", marginBottom: 2 }} />, color: "var(--amber-text)" },
        ]).map(({ label, value, delta, color }) => (
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
      </motion.div>

      {/* SVG Net Worth Trajectory */}
      <motion.div className="bento-card p-6 md:p-8 relative z-10" variants={pageSection}>
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
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{formatInrCompact(nwTooltip.value)}</p>
            {nwTooltip.projected && (
              <p style={{ fontSize: 10, color: 'var(--tertiary)', marginTop: 2 }}>Projected</p>
            )}
          </div>
        )}
        </div>
      </motion.div>

      {/* Milestones + Penny Quarterly Review */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10" variants={pageSection}>
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
      </motion.div>

      {/* Health Score Strip */}
      {healthScore && (
        <motion.div className="bento-card p-4 md:p-5 relative z-10" variants={pageSection}>
          <HealthScoreWidget variant="strip" />
        </motion.div>
      )}

      {/* Achievement Ledger */}
      <motion.div className="bento-card p-6 md:p-8 relative z-10" variants={pageSection}>
        <MilestoneChain milestones={ledgerMilestones} />
      </motion.div>
        </>
      )}
    </motion.div>
  );
}
