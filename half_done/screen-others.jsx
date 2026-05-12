// ─── Progress, Cashflow (Sankey), Debt, Tax ───

function Progress({ state }) {
  const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  const data = [
    { m: "Dec", v: 240000 },
    { m: "Jan", v: 268000 },
    { m: "Feb", v: 295000 },
    { m: "Mar", v: 318000 },
    { m: "Apr", v: 342000 },
    { m: "May", v: state.savings },
  ];
  const max = Math.max(...data.map((d) => d.v));
  const W = 700,
    H = 220;
  const points = data.map((d, i) => [
    (i / (data.length - 1)) * W,
    H - (d.v / max) * (H - 30) - 10,
  ]);
  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;

  return (
    <div
      className="page-animate"
      style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}
    >
      <div style={{ marginBottom: 24 }}>
        <p className="text-label">Last 6 months</p>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: 4,
          }}
        >
          Progress
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          ["Net Worth Δ", "+₹1.65L", "+24%", "var(--green-text)"],
          ["Avg Monthly Save", "₹56K", "+8%", "var(--accent-text)"],
          ["Goals Hit", "4/6", "67%", "var(--accent-text)"],
          ["Streak", "4 mo", "🔥", "var(--amber-text)"],
        ].map(([l, v, d, c]) => (
          <div key={l} className="bento-card" style={{ padding: 20 }}>
            <p className="text-label">{l}</p>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginTop: 8,
                color: c,
              }}
              className="slashed-zero"
            >
              {v}
            </p>
            <p style={{ fontSize: 12, color: "var(--tertiary)", marginTop: 4 }}>
              {d}
            </p>
          </div>
        ))}
      </div>

      <div className="bento-card" style={{ padding: 28 }}>
        <div style={{ marginBottom: 16 }}>
          <p className="text-label">Total Savings Trajectory</p>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H + 30}`}
          style={{ width: "100%", height: 260 }}
        >
          <defs>
            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={p}
              x1="0"
              y1={H - p * (H - 30) - 10}
              x2={W}
              y2={H - p * (H - 30) - 10}
              stroke="var(--border)"
              strokeDasharray="3 4"
              opacity="0.5"
            />
          ))}
          <path d={areaPath} fill="url(#pg)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            className="draw-line-long"
            style={{ filter: "drop-shadow(0 4px 8px var(--accent-glow))" }}
          />
          {points.map(([x, y], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="5"
                fill="var(--card)"
                stroke="var(--accent)"
                strokeWidth="2.5"
              />
              <text
                x={x}
                y={H + 22}
                fontSize="11"
                fill="var(--tertiary)"
                textAnchor="middle"
                fontFamily="var(--font-display)"
              >
                {data[i].m}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 16,
        }}
      >
        <div className="bento-card">
          <p className="text-label" style={{ marginBottom: 14 }}>
            Milestones Unlocked
          </p>
          {[
            ["First ₹1L saved", "Dec 2025", true],
            ["Emergency fund 50% complete", "Mar 2026", true],
            ["4-month allocation streak", "May 2026", true],
            ["Emergency fund 100%", "~Aug 2026", false],
            ["First ₹5L net worth", "~Nov 2026", false],
          ].map(([t, d, done], i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: i < 4 ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: done
                    ? "var(--green-subtle)"
                    : "var(--surface-hover)",
                  color: done ? "var(--green-text)" : "var(--tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {done ? (
                  <Icon.Check size={14} strokeWidth={3} />
                ) : (
                  <Icon.Clock size={14} />
                )}
              </div>
              <p style={{ fontSize: 13.5, fontWeight: 500, flex: 1 }}>{t}</p>
              <p style={{ fontSize: 11, color: "var(--tertiary)" }}>{d}</p>
            </div>
          ))}
        </div>
        <div className="bento-card penny-card">
          <div className="penny-blob" />
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <Icon.Sparkles
                size={18}
                style={{ color: "var(--penny-accent)" }}
              />
              <p style={{ fontSize: 14, fontWeight: 700 }}>Quarterly Review</p>
            </div>
            <p
              style={{
                fontSize: 13.5,
                lineHeight: 1.6,
                color: "var(--secondary)",
              }}
            >
              Your savings rate climbed from 18% to 26% this quarter — a
              meaningful jump. The trajectory suggests crossing ₹5L net worth by
              November if you hold this pace.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("openPenny"))}
              className="pill"
              style={{ marginTop: 14 }}
            >
              Discuss with Penny <Icon.ArrowR size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cashflow({ state }) {
  const inc = state.income.total;
  const exp = state.expenses;
  const totalExp = Object.values(exp).reduce((a, b) => a + b, 0);
  const surplus = inc - totalExp;
  const goalAlloc = state.goals.reduce((a, g) => a + g.monthly, 0);
  const slack = Math.max(0, surplus - goalAlloc);

  // Sankey-style with column layout
  return (
    <div
      className="page-animate"
      style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}
    >
      <div style={{ marginBottom: 24 }}>
        <p className="text-label">Money Flow · May 2026</p>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: 4,
          }}
        >
          Cashflow
        </h2>
      </div>

      <div className="bento-card" style={{ padding: 28, marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr 1fr",
            gap: 24,
            alignItems: "stretch",
            minHeight: 380,
          }}
        >
          <FlowCol
            title="Income"
            total={inc}
            items={[
              { label: "Salary", v: state.income.salary, c: "#22C55E" },
              { label: "Bonus", v: state.income.bonus, c: "#16A34A" },
              { label: "Other", v: state.income.other, c: "#15803D" },
            ]}
            accent="var(--green)"
          />
          <FlowCol
            title="Expenses"
            total={totalExp + goalAlloc}
            items={[
              { label: "Rent", v: exp.rent, c: "#EF4444" },
              { label: "Food", v: exp.food, c: "#F87171" },
              { label: "Transport", v: exp.transport, c: "#FCA5A5" },
              { label: "Lifestyle", v: exp.lifestyle, c: "#F59E0B" },
              { label: "Subscriptions", v: exp.subscriptions, c: "#FB923C" },
              { label: "Goal allocations", v: goalAlloc, c: "var(--accent)" },
            ]}
            accent="var(--red)"
            center
          />
          <FlowCol
            title="Outcome"
            total={inc - totalExp - goalAlloc + goalAlloc}
            items={[
              { label: "Saved & invested", v: goalAlloc, c: "var(--accent)" },
              { label: "Unallocated slack", v: slack, c: "#06B6D4" },
            ]}
            accent="var(--accent)"
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {[
          [
            "Savings Rate",
            `${Math.round((surplus / inc) * 100)}%`,
            "of monthly income",
          ],
          [
            "Goal Coverage",
            `${Math.round((goalAlloc / surplus) * 100)}%`,
            "of surplus committed",
          ],
          ["Unallocated", `₹${fmt(slack)}`, "free cash this month"],
        ].map(([l, v, d]) => (
          <div key={l} className="bento-card" style={{ padding: 20 }}>
            <p className="text-label">{l}</p>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 700,
                marginTop: 6,
              }}
              className="slashed-zero"
            >
              {v}
            </p>
            <p style={{ fontSize: 12, color: "var(--tertiary)", marginTop: 4 }}>
              {d}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowCol({ title, total, items, accent, center }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          marginBottom: 12,
          padding: "10px 14px",
          borderRadius: 12,
          background: "var(--surface-hover)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="text-label">{title}</p>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
            color: accent,
          }}
          className="slashed-zero"
        >
          ₹{fmt(total)}
        </p>
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}
      >
        {items.map((it, i) => {
          const pct = (it.v / total) * 100;
          return (
            <div
              key={i}
              style={{
                position: "relative",
                height: Math.max(36, pct * 3.4),
                borderRadius: 12,
                background: "var(--surface-tint)",
                border: "1px solid var(--border)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: it.c,
                }}
              />
              <div>
                <p style={{ fontSize: 12.5, fontWeight: 600 }}>{it.label}</p>
                <p style={{ fontSize: 10, color: "var(--tertiary)" }}>
                  {pct.toFixed(0)}%
                </p>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 15,
                  fontWeight: 700,
                }}
                className="slashed-zero"
              >
                ₹{fmt(it.v)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Debt({ state }) {
  const total = state.debts.reduce((a, d) => a + d.balance, 0);
  const totalEmi = state.debts.reduce((a, d) => a + d.emi, 0);
  const [strategy, setStrategy] = React.useState("avalanche");

  const sorted = [...state.debts].sort((a, b) =>
    strategy === "avalanche" ? b.apr - a.apr : a.balance - b.balance,
  );

  return (
    <div
      className="page-animate"
      style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}
    >
      <div style={{ marginBottom: 24 }}>
        <p className="text-label">Liabilities</p>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: 4,
          }}
        >
          Debt
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          ["Total Outstanding", `₹${fmtCompact(total)}`, "var(--red-text)"],
          ["Monthly EMI", `₹${fmt(totalEmi)}`, "var(--card-foreground)"],
          ["Avg Interest", "18.4%", "var(--amber-text)"],
        ].map(([l, v, c]) => (
          <div key={l} className="bento-card" style={{ padding: 20 }}>
            <p className="text-label">{l}</p>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 30,
                fontWeight: 700,
                color: c,
                marginTop: 8,
              }}
              className="slashed-zero"
            >
              {v}
            </p>
          </div>
        ))}
      </div>

      <div className="bento-card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <p className="text-label">Payoff Strategy</p>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setStrategy("avalanche")}
              className={`pill ${strategy === "avalanche" ? "active" : ""}`}
            >
              Avalanche (highest APR first)
            </button>
            <button
              onClick={() => setStrategy("snowball")}
              className={`pill ${strategy === "snowball" ? "active" : ""}`}
            >
              Snowball (smallest first)
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((d, i) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: 16,
                borderRadius: 14,
                background: "var(--surface-hover)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background:
                    i === 0 ? "var(--red-subtle)" : "var(--surface-tint)",
                  color: i === 0 ? "var(--red-text)" : "var(--tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</p>
                <p style={{ fontSize: 11, color: "var(--tertiary)" }}>
                  {d.apr}% APR · ₹{fmt(d.emi)}/mo
                </p>
              </div>
              <div
                style={{
                  width: 200,
                  height: 8,
                  background: "var(--surface-tint)",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(d.balance / d.original) * 100}%`,
                    background: d.apr > 25 ? "var(--red)" : "var(--amber)",
                    borderRadius: 999,
                    transition: "width 1s ease",
                  }}
                />
              </div>
              <div
                style={{
                  minWidth: 110,
                  textAlign: "right",
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                  fontWeight: 700,
                }}
                className="slashed-zero"
              >
                ₹{fmtCompact(d.balance)}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 12,
            background: "var(--penny-accent-subtle)",
            border: "1px solid var(--penny-insight-border)",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Icon.Sparkles
            size={16}
            style={{
              color: "var(--penny-accent)",
              flexShrink: 0,
              marginTop: 2,
            }}
          />
          <p
            style={{ fontSize: 13, lineHeight: 1.5, color: "var(--secondary)" }}
          >
            The <b>{strategy}</b> method clears your highest-cost debt fastest,
            saving roughly{" "}
            <b>₹{strategy === "avalanche" ? "18,400" : "12,200"}</b> in interest
            vs. minimum payments. Estimated debt-free in{" "}
            <b>{strategy === "avalanche" ? "22" : "26"} months</b>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Tax({ state }) {
  const annual = state.income.total * 12;
  const oldRegime = annual * 0.18;
  const newRegime = annual * 0.155;
  const saved = oldRegime - newRegime;
  return (
    <div
      className="page-animate"
      style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}
    >
      <div style={{ marginBottom: 24 }}>
        <p className="text-label">FY 2026-27</p>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: 4,
          }}
        >
          Tax Planning
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          className="bento-card"
          style={{ padding: 24, border: "1.5px solid var(--border)" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <p className="text-label">Old Regime</p>
            <span className="pill">With deductions</span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
            className="slashed-zero"
          >
            ₹{fmtCompact(oldRegime)}
          </p>
          <p style={{ fontSize: 12, color: "var(--tertiary)", marginTop: 4 }}>
            Effective: 18.0%
          </p>
        </div>
        <div
          className="bento-card"
          style={{
            padding: 24,
            border: "1.5px solid var(--accent)",
            background: "var(--accent-subtle)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <p className="text-label">
              New Regime{" "}
              <span style={{ color: "var(--accent-text)" }}>· Recommended</span>
            </p>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 99,
                background: "var(--accent)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Save ₹{fmtCompact(saved)}
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--accent-text)",
            }}
            className="slashed-zero"
          >
            ₹{fmtCompact(newRegime)}
          </p>
          <p style={{ fontSize: 12, color: "var(--tertiary)", marginTop: 4 }}>
            Effective: 15.5%
          </p>
        </div>
      </div>

      <div className="bento-card">
        <p className="text-label" style={{ marginBottom: 14 }}>
          Deduction Opportunities
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["80C — ELSS, PPF, EPF", "₹1,50,000", "₹95,000 used", 63],
            ["80D — Health Insurance", "₹25,000", "₹18,000 used", 72],
            ["80CCD(1B) — NPS Tier I", "₹50,000", "Not used", 0],
            ["HRA Exemption", "Up to ₹2.4L", "₹2,10,000 claimed", 87],
          ].map(([t, max, used, pct], i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: 14,
                borderRadius: 12,
                background: "var(--surface-hover)",
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{t}</p>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--tertiary)",
                    marginTop: 2,
                  }}
                >
                  Limit {max}
                </p>
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--secondary)",
                  minWidth: 130,
                }}
              >
                {used}
              </p>
              <div
                style={{
                  width: 120,
                  height: 8,
                  background: "var(--surface-tint)",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background:
                      pct > 70
                        ? "var(--green)"
                        : pct > 30
                          ? "var(--amber)"
                          : "var(--red)",
                    borderRadius: 999,
                  }}
                />
              </div>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                  fontWeight: 700,
                  minWidth: 40,
                  textAlign: "right",
                }}
                className="slashed-zero"
              >
                {pct}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Progress, Cashflow, Debt, Tax });
