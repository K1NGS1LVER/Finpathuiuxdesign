import { useState, useEffect, type ReactNode } from "react";
import { GitCompare, Wallet, TrendingUp, Sparkles } from "lucide-react";
import { useFinPathStore } from "@/lib/store";
import { formatInr, formatInrCompact } from "@/lib/format";

type RiskKey = "conservative" | "balanced" | "aggressive";

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

function Knob({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="knob">
      <div className="knob-header">
        <span className="text-label">{label}</span>
        <span className="knob-value slashed-zero">{value}</span>
      </div>
      {children}
    </div>
  );
}

export default function Scenarios() {
  const income = useFinPathStore((s) => s.income);

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

  const project = (monthly: number, rate: number, years: number): number => {
    const r = rate / 100 / 12;
    const n = years * 12;
    return Math.round((monthly * (Math.pow(1 + r, n) - 1)) / r);
  };

  const baselineMonthly = Math.max(20000, Math.round(income.total * 0.2));
  const scenarioTotal = project(monthlySavings, returnRate, horizon);
  const baselineTotal = project(baselineMonthly, 9, horizon);
  const diff = scenarioTotal - baselineTotal;

  const buildCurve = (monthly: number, rate: number): number[] => {
    const r = rate / 100 / 12;
    const points: number[] = [];
    for (let m = 0; m <= horizon * 12; m += 6) {
      points.push((monthly * (Math.pow(1 + r, m) - 1)) / r);
    }
    return points;
  };

  const curveS = buildCurve(monthlySavings, returnRate);
  const curveB = buildCurve(baselineMonthly, 9);
  const maxY = Math.max(...curveS, ...curveB, 1);
  const W = 760;
  const H = 280;

  const toPath = (pts: number[]): string =>
    pts
      .map(
        (v, i) =>
          `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * W} ${H - (v / maxY) * (H - 20) - 10}`,
      )
      .join(" ");

  const endY = H - (curveS[curveS.length - 1] / maxY) * (H - 20) - 10;

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

  return (
    <div className="page-animate scenarios-page">
      {/* Header */}
      <div className="scenarios-header">
        <div>
          <p className="text-label">What-if Engine</p>
          <h2 className="scenarios-title">Scenarios</h2>
          <p className="scenarios-subtitle">
            Model your future with confidence. Adjust the dials below — the
            projection updates in real time.
          </p>
        </div>
        <button onClick={() => setShowCompare((v) => !v)} className="pill">
          <GitCompare size={14} className="icon-wireframe" />
          {showCompare ? "Hide" : "Show"} baseline
        </button>
      </div>

      {/* KPI row */}
      <div className="scenarios-kpi-grid">
        <div className="bento-card" style={{ padding: "var(--space-3)" }}>
          <p className="text-label">Projected in {horizon} yrs</p>
          <p className="kpi-value slashed-zero">{formatInrCompact(scenarioTotal)}</p>
          <p className="kpi-meta">
            At {formatInr(monthlySavings)}/mo · {returnRate}% return
          </p>
        </div>

        <div className="bento-card" style={{ padding: "var(--space-3)" }}>
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

        <div className="bento-card" style={{ padding: "var(--space-3)" }}>
          <p className="text-label">Required Monthly</p>
          <p className="kpi-value slashed-zero">{formatInr(monthlySavings)}</p>
          <p className="kpi-meta">
            {income.total > 0
              ? Math.round((monthlySavings / income.total) * 100)
              : 0}
            % of monthly income
          </p>
        </div>
      </div>

      {/* Chart + Controls */}
      <div className="scenarios-main-grid">
        {/* Chart */}
        <div className="bento-card" style={{ padding: "var(--space-3)" }}>
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

          <div style={{ position: 'relative' }}>
            <svg
              viewBox={`0 0 ${W} ${H + 30}`}
              className="scenarios-svg"
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
              d={`${toPath(curveS)} L ${W} ${H - 10} L 0 ${H - 10} Z`}
              fill="url(#scenAreaGrad)"
            />
            <path
              d={toPath(curveS)}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
              className="draw-line-long chart-scenario-line"
            />
            {showCompare && (
              <path
                d={toPath(curveB)}
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
              <div style={{
                position: 'absolute',
                left: `${Math.min(85, Math.max(10, (svgTooltip.svgX / W) * 100))}%`,
                top: `${Math.min(80, Math.max(5, (svgTooltip.svgY / (H + 30)) * 100))}%`,
                transform: 'translate(-50%, -110%)',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontFamily: 'var(--font-body)',
                color: 'var(--card-foreground)',
                padding: '10px 14px',
                pointerEvents: 'none',
                zIndex: 10,
                minWidth: 140,
              }}>
                <p style={{ fontSize: 11, color: 'var(--tertiary)', marginBottom: 4 }}>{svgTooltip.yearLabel}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Scenario: {formatInrCompact(svgTooltip.scenarioVal)}</p>
                {showCompare && (
                  <p style={{ fontSize: 12, color: 'var(--tertiary)', marginTop: 2 }}>Baseline: {formatInrCompact(svgTooltip.baseVal)}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bento-card" style={{ padding: "var(--space-3)" }}>
          <p className="text-label controls-panel-header">Tune Your Plan</p>

          <Knob label="Monthly Investment" value={formatInr(monthlySavings)}>
            <input
              type="range"
              min="10000"
              max="200000"
              step="2500"
              value={monthlySavings}
              onChange={(e) => setMonthlySavings(+e.target.value)}
              className="range"
            />
          </Knob>

          <Knob label="Time Horizon" value={`${horizon} years`}>
            <input
              type="range"
              min="3"
              max="30"
              value={horizon}
              onChange={(e) => setHorizon(+e.target.value)}
              className="range"
            />
          </Knob>

          <div className="risk-section">
            <p className="text-label risk-section-heading">Risk Profile</p>
            <div className="risk-list">
              {(
                Object.entries(riskCfg) as [
                  RiskKey,
                  (typeof riskCfg)[RiskKey],
                ][]
              ).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setRisk(k)}
                  className={`risk-btn${risk === k ? " active" : ""}`}
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
                  <div style={{ flex: 1 }}>
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
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick preset scenarios */}
      <div className="scenarios-presets-grid">
        {presets.map((p, i) => {
          const fv = project(p.monthly, p.rate, p.years);
          const isActive =
            monthlySavings === p.monthly &&
            returnRate === p.rate &&
            horizon === p.years;
          return (
            <button
              key={i}
              onClick={() => {
                setMonthlySavings(p.monthly);
                setReturnRate(p.rate);
                setHorizon(p.years);
              }}
              className={`preset-btn card-hover${isActive ? " active" : ""}`}
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
          );
        })}
      </div>
    </div>
  );
}
