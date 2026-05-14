import { useState, useEffect, useMemo, type ReactNode } from "react";
import { GitCompare, Wallet, TrendingUp, Sparkles, PiggyBank, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useFinPathStore } from "@/lib/store";
import { formatInr, formatInrCompact } from "@/lib/format";
import { pageContainer, pageSection } from "../components/motion-variants";

type RiskKey = "conservative" | "balanced" | "aggressive";

const PENNY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  TrendingUp, PiggyBank, Sparkles,
};

const riskCfg: Record<
  RiskKey,
  { rate: number; label: string; desc: string; colorVar: string }
> = {
  conservative: {
    rate: 7,
    label: "Conservative",
    desc: "Bonds, FDs, debt funds",
    colorVar: "var(--cobalt)",
  },
  balanced: {
    rate: 10,
    label: "Balanced",
    desc: "Index + debt mix",
    colorVar: "var(--green)",
  },
  aggressive: {
    rate: 14,
    label: "Aggressive",
    desc: "Equity-heavy, growth",
    colorVar: "var(--amber)",
  },
};

const presets = [
  { name: "Plan A · Steady", monthly: 40000, rate: 9, years: 10, Icon: Wallet },
  { name: "Plan B · Growth", monthly: 60000, rate: 12, years: 10, Icon: TrendingUp },
  { name: "Plan C · Aggressive", monthly: 80000, rate: 14, years: 15, Icon: Sparkles },
] as const;

function project(monthly: number, rate: number, years: number): number {
  const r = rate / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(monthly * n);
  return Math.round((monthly * (Math.pow(1 + r, n) - 1)) / r);
}

function buildCurvePoints(monthly: number, rate: number, horizon: number): number[] {
  const r = rate / 100 / 12;
  const points: number[] = [];
  for (let m = 0; m <= horizon * 12; m += 6) {
    if (r === 0) {
      points.push(monthly * m);
    } else {
      points.push((monthly * (Math.pow(1 + r, m) - 1)) / r);
    }
  }
  return points;
}

function Knob({
  label,
  value,
  inputId,
  children,
}: {
  label: string;
  value: string;
  inputId: string;
  children: ReactNode;
}) {
  return (
    <div className="knob">
      <div className="knob-header">
        <label htmlFor={inputId} className="text-label">{label}</label>
        <span className="knob-value slashed-zero">{value}</span>
      </div>
      {children}
    </div>
  );
}

export default function Scenarios({ onPennyClick }: { onPennyClick?: () => void }) {
  const income = useFinPathStore((s) => s.income);
  const goals = useFinPathStore((s) => s.goals);
  const plan = useFinPathStore((s) => s.plan);

  const [monthlySavings, setMonthlySavings] = useState(60000);
  const [risk, setRisk] = useState<RiskKey>("balanced");
  const [horizon, setHorizon] = useState(10);
  const [returnRate, setReturnRate] = useState(10);
  const [showCompare, setShowCompare] = useState(true);
  const [svgTooltip, setSvgTooltip] = useState<{
    svgX: number; svgY: number; scenarioVal: number; baseVal: number; yearLabel: string;
  } | null>(null);

  useEffect(() => {
    setReturnRate(riskCfg[risk].rate);
  }, [risk]);

  const baselineMonthly = Math.max(20000, Math.round(income.total * 0.2));
  const scenarioTotal = project(monthlySavings, returnRate, horizon);
  const baselineTotal = project(baselineMonthly, 9, horizon);
  const diff = scenarioTotal - baselineTotal;

  const { curveS, curveB, maxY, toPathFn, endY } = useMemo(() => {
    const s = buildCurvePoints(monthlySavings, returnRate, horizon);
    const b = buildCurvePoints(baselineMonthly, 9, horizon);
    const my = Math.max(...s, ...b, 1);
    const W = 760;
    const H = 280;
    const tp = (pts: number[]): string =>
      pts
        .map(
          (v, i) =>
            `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * W} ${H - (v / my) * (H - 20) - 10}`,
        )
        .join(" ");
    const ey = H - (s[s.length - 1] / my) * (H - 20) - 10;
    return { curveS: s, curveB: b, maxY: my, toPathFn: tp, endY: ey };
  }, [monthlySavings, returnRate, horizon, baselineMonthly]);

  const W = 760;
  const H = 280;

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (curveS.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.max(0, Math.min(curveS.length - 1, Math.round((svgX / W) * (curveS.length - 1))));
    setSvgTooltip({
      svgX: (idx / (curveS.length - 1)) * W,
      svgY: H - (curveS[idx] / maxY) * (H - 20) - 10,
      scenarioVal: curveS[idx],
      baseVal: curveB[idx],
      yearLabel: `Year ${Math.round((idx / (curveS.length - 1)) * horizon)}`,
    });
  };

  const pennyInsights = useMemo(() => {
    const tips: Array<{ icon: string; text: string }> = [];

    const savingsPct = income.total > 0 ? Math.round((monthlySavings / income.total) * 100) : 0;
    const baselinePct = 20;
    if (savingsPct >= baselinePct) {
      tips.push({
        icon: 'PiggyBank',
        text: `You're investing ${savingsPct}% of income — that's ${savingsPct - baselinePct}% above the recommended 20% baseline. Higher contributions accelerate your goals significantly.`,
      });
    } else {
      tips.push({
        icon: 'PiggyBank',
        text: `You're investing ${savingsPct}% of income — below the recommended 20% baseline. Increasing by even ${formatInr(Math.max(1000, baselineMonthly - monthlySavings))}/mo could add ${formatInrCompact(Math.abs(diff))} over ${horizon} years.`,
      });
    }

    const conservativeTotal = project(monthlySavings, riskCfg.conservative.rate, horizon);
    const aggressiveTotal = project(monthlySavings, riskCfg.aggressive.rate, horizon);
    const riskDelta = aggressiveTotal - conservativeTotal;
    if (Math.abs(riskDelta) > 0 && risk !== 'aggressive') {
      tips.push({
        icon: 'TrendingUp',
        text: `Switching from ${riskCfg[risk].label} to Aggressive could yield +${formatInrCompact(riskDelta)} more over ${horizon} years — but with higher volatility.`,
      });
    } else if (risk === 'aggressive') {
      tips.push({
        icon: 'TrendingUp',
        text: `You're at the highest risk profile. Your aggressive allocation could yield ${formatInrCompact(scenarioTotal)} over ${horizon} years, but expect higher drawdowns.`,
      });
    }

    const activeGoals = goals.filter(g => g.status !== 'complete');
    if (activeGoals.length > 0 && plan?.months?.length) {
      const nearestGoal = activeGoals.sort((a, b) => a.priority - b.priority)[0];
      const goalMonth = plan.months.findIndex(m => m.netWorth >= scenarioTotal);
      if (goalMonth >= 0) {
        const d = new Date();
        d.setMonth(d.getMonth() + goalMonth);
        tips.push({
          icon: 'Sparkles',
          text: `At this rate, you'd reach your scenario's ${formatInrCompact(scenarioTotal)} target by ${d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} — helping fund "${nearestGoal.name}".`,
        });
      }
    }

    if (tips.length === 0) {
      tips.push({
        icon: 'Sparkles',
        text: `Your scenario projects ${formatInrCompact(scenarioTotal)} over ${horizon} years at ${returnRate}% return. Adjust the dials to explore alternatives.`,
      });
    }

    return tips;
  }, [monthlySavings, income.total, risk, returnRate, horizon, diff, baselineMonthly, scenarioTotal, goals, plan]);

  return (
    <motion.div className="scenarios-page" variants={pageContainer} initial="hidden" animate="visible">
      <motion.div className="scenarios-header" variants={pageSection}>
        <div>
          <p className="text-label">What-if Engine</p>
          <h2 className="scenarios-title slashed-zero">Scenarios</h2>
          <p className="scenarios-subtitle">
            Model your future with confidence. Adjust the dials below — the
            projection updates in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCompare((v) => !v)}
          className="pill"
          aria-pressed={showCompare}
          aria-label="Toggle baseline comparison"
        >
          <GitCompare size={14} className="icon-wireframe" />
          {showCompare ? "Hide" : "Show"} baseline
        </button>
      </motion.div>

      <motion.div className="scenarios-kpi-grid" variants={pageSection}>
        <div className="bento-card bento-card-sm">
          <p className="text-label">Projected in {horizon} yrs</p>
          <p className="kpi-value slashed-zero">{formatInrCompact(scenarioTotal)}</p>
          <p className="kpi-meta">
            At {formatInr(monthlySavings)}/mo · {returnRate}% return
          </p>
        </div>

        <div className="bento-card bento-card-sm">
          <p className="text-label">vs. Baseline</p>
          <p
            className={`kpi-value slashed-zero ${diff >= 0 ? "kpi-value--positive" : "kpi-value--negative"}`}
          >
            {diff >= 0 ? "+" : ""}
            {formatInrCompact(diff)}
          </p>
          <p className="kpi-meta">
            {diff >= 0 ? "Better than" : "Behind"} current trajectory
          </p>
        </div>

        <div className="bento-card bento-card-sm">
          <p className="text-label">Required Monthly</p>
          <p className="kpi-value slashed-zero">{formatInr(monthlySavings)}</p>
          <p className="kpi-meta">
            {income.total > 0
              ? Math.round((monthlySavings / income.total) * 100)
              : 0}
            % of monthly income
          </p>
        </div>
      </motion.div>

      <motion.div className="scenarios-main-grid" variants={pageSection}>
        <div className="bento-card">
          <div className="chart-header">
            <div>
              <p className="text-label">Wealth Projection</p>
              <p className="chart-subtitle">
                {horizon}-year compounded growth curve
              </p>
            </div>
            <div className="chart-legend">
              <span className="chart-legend-item">
                <span className="legend-dot" />
                Scenario
              </span>
              {showCompare && (
                <span className="chart-legend-item">
                  <span className="legend-dash" />
                  Baseline
                </span>
              )}
            </div>
          </div>

          <div className="relative">
            <svg
              viewBox={`0 0 ${W} ${H + 30}`}
              className="scenarios-svg"
              role="img"
              aria-label={`Wealth projection chart: ${horizon}-year compounded growth from ${formatInr(monthlySavings)} per month at ${returnRate}% return`}
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={() => setSvgTooltip(null)}
            >
            <defs>
              <linearGradient id="scenAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75, 1].map((p, i) => (
              <g key={i}>
                <line
                  x1="0"
                  y1={H - p * (H - 20) - 10}
                  x2={W}
                  y2={H - p * (H - 20) - 10}
                  stroke="var(--border)"
                  strokeDasharray="3 4"
                  opacity="0.6"
                />
                <text
                  x={W + 8}
                  y={H - p * (H - 20) - 7}
                  fontSize="10"
                  fill="var(--tertiary)"
                  fontFamily="var(--font-display)"
                >
                  {formatInrCompact(maxY * p)}
                </text>
              </g>
            ))}

            <path
              d={`${toPathFn(curveS)} L ${W} ${H - 10} L 0 ${H - 10} Z`}
              fill="url(#scenAreaGrad)"
            />
            <path
              d={toPathFn(curveS)}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
              className="draw-line-long chart-scenario-line"
            />
            {showCompare && (
              <path
                d={toPathFn(curveB)}
                fill="none"
                stroke="var(--tertiary)"
                strokeWidth="2"
                strokeDasharray="6 6"
                strokeLinecap="round"
                opacity="0.6"
              />
            )}

            <circle cx={W} cy={endY} r="6" fill="var(--accent)" />
            <circle
              cx={W}
              cy={endY}
              r="12"
              fill="var(--accent)"
              opacity="0.2"
              className="pulse-ring"
            />

            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
              <text
                key={i}
                x={p * W}
                y={H + 20}
                fontSize="10"
                fill="var(--tertiary)"
                fontFamily="var(--font-display)"
                textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}
              >
                {Math.round(p * horizon)}y
              </text>
            ))}
              {svgTooltip && (
                <line
                  x1={svgTooltip.svgX} y1={0}
                  x2={svgTooltip.svgX} y2={H}
                  stroke="var(--border)" strokeDasharray="4 2" opacity="0.7"
                />
              )}
            </svg>
            {svgTooltip && (
              <div
                className="chart-tooltip"
                aria-live="polite"
                style={{
                  left: `${Math.min(85, Math.max(10, (svgTooltip.svgX / W) * 100))}%`,
                  top: `${Math.min(80, Math.max(5, (svgTooltip.svgY / (H + 30)) * 100))}%`,
                }}
              >
                <p className="chart-tooltip-label">{svgTooltip.yearLabel}</p>
                <p className="chart-tooltip-value">Scenario: {formatInrCompact(svgTooltip.scenarioVal)}</p>
                {showCompare && (
                  <p className="chart-tooltip-sub">Baseline: {formatInrCompact(svgTooltip.baseVal)}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bento-card">
          <p className="text-label controls-panel-header">Tune Your Plan</p>

          <Knob label="Monthly Investment" value={formatInr(monthlySavings)} inputId="knob-monthly-investment">
            <input
              id="knob-monthly-investment"
              type="range"
              min="10000"
              max="200000"
              step="2500"
              value={monthlySavings}
              onChange={(e) => setMonthlySavings(+e.target.value)}
              className="range"
              aria-label="Monthly investment"
              aria-valuetext={formatInr(monthlySavings)}
            />
          </Knob>

          <Knob label="Time Horizon" value={`${horizon} years`} inputId="knob-time-horizon">
            <input
              id="knob-time-horizon"
              type="range"
              min="3"
              max="30"
              value={horizon}
              onChange={(e) => setHorizon(+e.target.value)}
              className="range"
              aria-label="Time horizon in years"
              aria-valuetext={`${horizon} years`}
            />
          </Knob>

          <div className="risk-section">
            <p className="text-label risk-section-heading">Risk Profile</p>
            <ul role="list" className="risk-list">
              {(
                Object.entries(riskCfg) as [
                  RiskKey,
                  (typeof riskCfg)[RiskKey],
                ][]
              ).map(([k, v]) => (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => setRisk(k)}
                    className={`risk-btn${risk === k ? " active" : ""}`}
                    aria-pressed={risk === k}
                    aria-label={v.label}
                    style={{
                      border: `1.5px solid ${risk === k ? v.colorVar : "transparent"}`,
                    }}
                  >
                    <span
                      className="risk-dot"
                      style={{
                        background: v.colorVar,
                        boxShadow: risk === k ? `0 0 8px ${v.colorVar}` : "none",
                      }}
                    />
                    <div className="flex-1">
                      <p className="risk-label">{v.label}</p>
                      <p className="risk-desc">{v.desc}</p>
                    </div>
                    <span
                      className="risk-rate slashed-zero"
                      style={{ color: v.colorVar }}
                    >
                      {v.rate}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      <motion.ul role="list" className="scenarios-presets-grid" variants={pageSection}>
        {presets.map((p, i) => {
          const fv = project(p.monthly, p.rate, p.years);
          const isActive =
            monthlySavings === p.monthly &&
            returnRate === p.rate &&
            horizon === p.years;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  setMonthlySavings(p.monthly);
                  setReturnRate(p.rate);
                  setHorizon(p.years);
                }}
                className={`preset-btn card-hover${isActive ? " active" : ""}`}
                aria-pressed={isActive}
              >
                <div className="preset-btn-header">
                  <div className="preset-icon">
                    <p.Icon size={16} className="icon-wireframe" />
                  </div>
                  <span className="preset-name">{p.name}</span>
                </div>
                <p className="preset-fv slashed-zero">{formatInrCompact(fv)}</p>
                <p className="preset-meta">
                  {formatInr(p.monthly)}/mo · {p.rate}% · {p.years}y
                </p>
              </button>
            </li>
          );
        })}
      </motion.ul>

      {pennyInsights.length > 0 && (
        <motion.div className="bento-card penny-card" style={{ marginTop: 'var(--space-2)' }} variants={pageSection}>
          <div className="penny-blob" />
          <div className="penny-insights-header">
            <div className="penny-insights-icon">
              <Sparkles size={18} className="icon-wireframe" />
            </div>
            <div>
              <h3 className="penny-insights-title">Penny's Insights</h3>
              <p className="penny-insights-sub">Personalized for your scenario</p>
            </div>
            <button type="button" className="pill ml-auto" aria-label="Ask Penny a follow-up question" onClick={onPennyClick}>
              Ask follow-up <ArrowRight size={14} className="icon-wireframe" />
            </button>
          </div>
          <div className="penny-insights-grid">
            {pennyInsights.map((tip, i) => {
              const TIcon = PENNY_ICONS[tip.icon] || Sparkles;
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
      )}
    </motion.div>
  );
}
