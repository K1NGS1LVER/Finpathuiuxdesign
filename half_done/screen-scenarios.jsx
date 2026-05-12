// ─── Scenarios — redesigned to feel airy and focused ───

function Scenarios({ state, set }) {
  const [income, setIncome] = React.useState(state.income.total);
  const [savings, setSavings] = React.useState(60000);
  const [risk, setRisk] = React.useState("balanced");
  const [horizon, setHorizon] = React.useState(10);
  const [returnRate, setReturnRate] = React.useState(12);
  const [showCompare, setShowCompare] = React.useState(true);

  // Project growth over horizon (compound monthly contributions)
  const project = (monthly, rate, years) => {
    const r = rate / 100 / 12,
      n = years * 12;
    const fv = monthly * ((Math.pow(1 + r, n) - 1) / r);
    return Math.round(fv);
  };

  // Baseline = state.savings / 12 monthly
  const baselineMonthly = Math.max(20000, Math.round(state.income.total * 0.2));
  const baseline = project(baselineMonthly, 9, horizon);
  const scenario = project(savings, returnRate, horizon);
  const diff = scenario - baseline;

  // Build curves
  const buildCurve = (monthly, rate) => {
    const r = rate / 100 / 12;
    const points = [];
    for (let m = 0; m <= horizon * 12; m += 6) {
      const fv = monthly * ((Math.pow(1 + r, m) - 1) / r);
      points.push(fv);
    }
    return points;
  };

  const curveS = buildCurve(savings, returnRate);
  const curveB = buildCurve(baselineMonthly, 9);
  const maxY = Math.max(...curveS, ...curveB);
  const W = 760,
    H = 280;
  const toPath = (pts) =>
    pts
      .map(
        (v, i) =>
          `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * W} ${H - (v / maxY) * (H - 20) - 10}`,
      )
      .join(" ");

  const riskCfg = {
    conservative: {
      rate: 7,
      label: "Conservative",
      desc: "Bonds, FDs, debt funds",
      color: "#3B82F6",
    },
    balanced: {
      rate: 10,
      label: "Balanced",
      desc: "Index + debt mix",
      color: "#22C55E",
    },
    aggressive: {
      rate: 14,
      label: "Aggressive",
      desc: "Equity-heavy, growth",
      color: "#F59E0B",
    },
  };

  React.useEffect(() => {
    setReturnRate(riskCfg[risk].rate);
  }, [risk]);

  // Quick presets
  const presets = [
    {
      name: "Plan A · Steady",
      monthly: 40000,
      rate: 9,
      years: 10,
      icon: "Wallet",
    },
    {
      name: "Plan B · Growth",
      monthly: 60000,
      rate: 12,
      years: 10,
      icon: "TrendUp",
    },
    {
      name: "Plan C · Aggressive",
      monthly: 80000,
      rate: 14,
      years: 15,
      icon: "Sparkles",
    },
  ];

  return (
    <div
      className="page-animate"
      style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}
    >
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <p className="text-label">What-if Engine</p>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginTop: 4,
            }}
          >
            Scenarios
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--secondary)",
              marginTop: 6,
              maxWidth: 560,
            }}
          >
            Model your future with confidence. Adjust the dials below — the
            projection updates in real time.
          </p>
        </div>
        <button onClick={() => setShowCompare(!showCompare)} className="pill">
          <Icon.GitCompare size={14} /> {showCompare ? "Hide" : "Show"} baseline
        </button>
      </div>

      {/* Hero KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div className="bento-card" style={{ padding: 24 }}>
          <p className="text-label">Projected in {horizon} yrs</p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginTop: 8,
              color: "var(--accent-text)",
            }}
            className="slashed-zero"
          >
            {fmtCompact(scenario)}
          </p>
          <p style={{ fontSize: 12, color: "var(--tertiary)", marginTop: 4 }}>
            At ₹{fmt(savings)}/mo · {returnRate}% return
          </p>
        </div>
        <div className="bento-card" style={{ padding: 24 }}>
          <p className="text-label">vs. Baseline</p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginTop: 8,
              color: diff >= 0 ? "var(--green-text)" : "var(--red-text)",
            }}
            className="slashed-zero"
          >
            {diff >= 0 ? "+" : ""}
            {fmtCompact(diff)}
          </p>
          <p style={{ fontSize: 12, color: "var(--tertiary)", marginTop: 4 }}>
            {diff >= 0 ? "Better than" : "Behind"} current trajectory
          </p>
        </div>
        <div className="bento-card" style={{ padding: 24 }}>
          <p className="text-label">Required Monthly</p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginTop: 8,
            }}
            className="slashed-zero"
          >
            ₹{fmt(savings)}
          </p>
          <p style={{ fontSize: 12, color: "var(--tertiary)", marginTop: 4 }}>
            {Math.round((savings / income) * 100)}% of monthly income
          </p>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 16 }}
      >
        {/* Chart */}
        <div className="bento-card" style={{ padding: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <div>
              <p className="text-label">Wealth Projection</p>
              <p
                style={{ fontSize: 12, color: "var(--tertiary)", marginTop: 4 }}
              >
                {horizon}-year compounded growth curve
              </p>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: "var(--accent)",
                  }}
                />
                Scenario
              </span>
              {showCompare && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 10,
                      height: 2,
                      background: "var(--tertiary)",
                      borderRadius: 1,
                    }}
                  />
                  Baseline
                </span>
              )}
            </div>
          </div>

          <svg
            viewBox={`0 0 ${W} ${H + 30}`}
            style={{ width: "100%", height: 320 }}
          >
            <defs>
              <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--accent)"
                  stopOpacity="0.32"
                />
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
                  {fmtCompact(maxY * p)}
                </text>
              </g>
            ))}
            {/* Area */}
            <path
              d={`${toPath(curveS)} L ${W} ${H - 10} L 0 ${H - 10} Z`}
              fill="url(#areaG)"
            />
            {/* Scenario line */}
            <path
              d={toPath(curveS)}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 4px 8px var(--accent-glow))" }}
              className="draw-line-long"
            />
            {/* Baseline */}
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
            {/* End point */}
            <circle
              cx={W}
              cy={H - (curveS[curveS.length - 1] / maxY) * (H - 20) - 10}
              r="6"
              fill="var(--accent)"
            />
            <circle
              cx={W}
              cy={H - (curveS[curveS.length - 1] / maxY) * (H - 20) - 10}
              r="12"
              fill="var(--accent)"
              opacity="0.2"
              className="pulse-ring"
            />
            {/* X labels */}
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
          </svg>
        </div>

        {/* Controls — clean, organized */}
        <div className="bento-card" style={{ padding: 24 }}>
          <p className="text-label" style={{ marginBottom: 18 }}>
            Tune Your Plan
          </p>

          <Knob label="Monthly Investment" value={`₹${fmt(savings)}`}>
            <input
              type="range"
              min="10000"
              max="200000"
              step="2500"
              value={savings}
              onChange={(e) => setSavings(+e.target.value)}
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

          <div style={{ marginTop: 20 }}>
            <p className="text-label" style={{ marginBottom: 10 }}>
              Risk Profile
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(riskCfg).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setRisk(k)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background:
                      risk === k
                        ? "var(--accent-subtle)"
                        : "var(--surface-hover)",
                    border: `1.5px solid ${risk === k ? v.color : "transparent"}`,
                    textAlign: "left",
                    transition: "all 200ms ease",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: v.color,
                      boxShadow: risk === k ? `0 0 8px ${v.color}` : "none",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{v.label}</p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--tertiary)",
                        marginTop: 1,
                      }}
                    >
                      {v.desc}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: v.color,
                    }}
                    className="slashed-zero"
                  >
                    {v.rate}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick scenarios */}
      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {presets.map((p, i) => {
          const I = Icon[p.icon];
          const fv = project(p.monthly, p.rate, p.years);
          const isActive =
            savings === p.monthly &&
            returnRate === p.rate &&
            horizon === p.years;
          return (
            <button
              key={i}
              onClick={() => {
                setSavings(p.monthly);
                setReturnRate(p.rate);
                setHorizon(p.years);
              }}
              className="card-hover"
              style={{
                padding: 18,
                borderRadius: 18,
                textAlign: "left",
                background: isActive ? "var(--accent-subtle)" : "var(--card)",
                border: `1.5px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                boxShadow: isActive
                  ? "0 8px 24px var(--accent-glow)"
                  : "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "var(--accent-subtle)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <I size={16} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
                className="slashed-zero"
              >
                {fmtCompact(fv)}
              </p>
              <p
                style={{ fontSize: 11, color: "var(--tertiary)", marginTop: 2 }}
              >
                ₹{fmt(p.monthly)}/mo · {p.rate}% · {p.years}y
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Knob({ label, value, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span className="text-label">{label}</span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--accent-text)",
          }}
          className="slashed-zero"
        >
          {value}
        </span>
      </div>
      {children}
    </div>
  );
}

Object.assign(window, { Scenarios });
