// ─── Dashboard screen ───

function Dashboard({ state, set }) {
  const totalExp = Object.values(state.expenses).reduce((a, b) => a + b, 0);
  const totalDebt = state.debts.reduce((a, d) => a + d.emi, 0);
  const surplus = state.income.total - totalExp - totalDebt;
  const health = calcHealth(state);
  const animIncome = useCountUp(state.income.total);
  const animSurplus = useCountUp(surplus);
  const animSavings = useCountUp(state.savings);
  const r = 78,
    c = 2 * Math.PI * r;
  const [healthAnim, setHealthAnim] = React.useState(0);
  React.useEffect(() => {
    setTimeout(() => setHealthAnim(health), 300);
  }, [health]);

  const activeGoals = state.goals
    .filter((g) => g.current < g.target)
    .slice(0, 3);
  const nextGoal = state.goals.find((g) => !g.checked);

  const healthLabel =
    health >= 80
      ? { t: "Excellent financial health", c: "var(--tertiary-accent-text)" }
      : health >= 60
        ? { t: "Strong position — keep going", c: "var(--accent-text)" }
        : health >= 40
          ? { t: "Steady foundation", c: "var(--secondary)" }
          : { t: "Let's build momentum", c: "var(--amber-text)" };

  const insights = [
    {
      icon: "PiggyBank",
      text: `You're saving ${Math.round((surplus / state.income.total) * 100)}% of income — try moving ₹5,000 from lifestyle to hit 25%.`,
    },
    {
      icon: "Alert",
      text: `Credit card APR is 36%. Switching to avalanche could save ₹18,400 in interest.`,
    },
    {
      icon: "Sparkles",
      text: `"Japan Trip" is on pace — only ₹1.88L left at ₹14K/mo.`,
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
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p className="text-label">Good evening, Aanya</p>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginTop: 4,
            }}
          >
            Financial Overview
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["This month", "Quarter", "YTD"].map((p, i) => (
            <button key={p} className={`pill ${i === 0 ? "active" : ""}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 16,
        }}
      >
        {/* Active Goals */}
        <div className="bento-card" style={{ gridColumn: "span 8" }}>
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              top: -100,
              right: -50,
              background: "var(--accent)",
              opacity: 0.04,
              filter: "blur(80px)",
              borderRadius: "50%",
            }}
          />
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 20,
              }}
            >
              <div>
                <p className="text-label">Active Goals</p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--tertiary)",
                    marginTop: 4,
                  }}
                >
                  2 on track · 1 completed this year
                </p>
              </div>
              <button
                onClick={() => set({ currentRoute: "journey" })}
                className="pill"
              >
                View All
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activeGoals.map((g, i) => {
                const cat = CATEGORY_STYLE[g.category];
                const I = Icon[cat.icon];
                const progress = Math.round((g.current / g.target) * 100);
                return (
                  <div
                    key={g.id}
                    className="card-hover"
                    onClick={() => set({ currentRoute: "journey" })}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "10px 12px",
                      borderRadius: 14,
                      transition: "background 200ms",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: cat.subtle,
                        color: cat.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <I size={18} />
                    </div>
                    <div style={{ minWidth: 130, flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {g.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--tertiary)",
                          marginTop: 2,
                        }}
                      >
                        ₹{fmt(g.monthly)}/mo · {g.months} mo left
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        position: "relative",
                        height: 8,
                        background: "var(--surface-hover)",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundImage:
                            "repeating-linear-gradient(45deg, var(--border) 0 1px, transparent 1px 5px)",
                          opacity: 0.5,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: `${progress}%`,
                          background: `linear-gradient(90deg, ${cat.color}, ${cat.color})`,
                          borderRadius: 999,
                          boxShadow: `0 0 12px ${cat.color}`,
                          transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        minWidth: 44,
                        textAlign: "right",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 16,
                        color: cat.text,
                      }}
                      className="slashed-zero"
                    >
                      {progress}%
                    </div>
                    <div
                      style={{
                        minWidth: 110,
                        textAlign: "right",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      className="slashed-zero"
                    >
                      <span>{fmtCompact(g.current)}</span>
                      <span style={{ color: "var(--tertiary)" }}>
                        {" "}
                        / {fmtCompact(g.target)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Next Step */}
        <div
          className="bento-card"
          style={{
            gridColumn: "span 4",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <p className="text-label" style={{ marginBottom: 16 }}>
            Your Next Step
          </p>
          {nextGoal &&
            (() => {
              const cat = CATEGORY_STYLE[nextGoal.category];
              const I = Icon[cat.icon];
              return (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: cat.subtle,
                        color: cat.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <I size={16} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>
                      {nextGoal.name}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--tertiary)",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                    }}
                  >
                    Recommended this month
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 32,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                    }}
                    className="slashed-zero"
                  >
                    ₹{fmt(nextGoal.monthly)}
                    <span
                      style={{
                        fontSize: 14,
                        color: "var(--tertiary)",
                        fontWeight: 500,
                      }}
                    >
                      /mo
                    </span>
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--tertiary)",
                      marginTop: 4,
                      marginBottom: 18,
                    }}
                  >
                    {fmtCompact(nextGoal.target - nextGoal.current)} left to
                    save
                  </p>
                  <button
                    onClick={() =>
                      set((s) => ({
                        ...s,
                        goals: s.goals.map((g) =>
                          g.id === nextGoal.id
                            ? {
                                ...g,
                                current: Math.min(
                                  g.target,
                                  g.current + g.monthly,
                                ),
                                checked: true,
                              }
                            : g,
                        ),
                      }))
                    }
                    className="btn-primary"
                    style={{ marginTop: "auto", justifyContent: "center" }}
                  >
                    <Icon.Check size={16} /> Done for this month
                  </button>
                </>
              );
            })()}
        </div>

        {/* Health + Metrics */}
        <div
          className="bento-card"
          style={{ gridColumn: "span 7", display: "flex", gap: 24 }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
              padding: "8px 0",
            }}
          >
            {[
              ["Monthly Income", animIncome, "var(--card-foreground)"],
              [
                "Monthly Surplus",
                animSurplus,
                surplus > 0 ? "var(--green-text)" : "var(--red-text)",
                surplus > 0 ? "+" : "",
              ],
              ["Total Savings", animSavings, "var(--card-foreground)"],
            ].map(([l, v, c, prefix]) => (
              <div key={l}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  {l}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: c,
                  }}
                  className="slashed-zero"
                >
                  {prefix || ""}₹{fmt(v)}
                </p>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <p className="text-label">Health Meter</p>
            <div style={{ position: "relative", width: 188, height: 188 }}>
              <svg
                viewBox="0 0 200 200"
                style={{
                  transform: "rotate(-90deg)",
                  width: "100%",
                  height: "100%",
                }}
              >
                <circle
                  cx="100"
                  cy="100"
                  r={r}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="14"
                  strokeDasharray="6 6"
                />
                <circle
                  cx="100"
                  cy="100"
                  r={r}
                  fill="none"
                  stroke="url(#hg)"
                  strokeWidth="14"
                  strokeDasharray={c}
                  strokeDashoffset={c - (healthAnim / 100) * c}
                  strokeLinecap="round"
                  style={{
                    transition:
                      "stroke-dashoffset 1500ms cubic-bezier(0.22,1,0.36,1)",
                    filter: "drop-shadow(0 0 8px var(--accent-glow))",
                  }}
                />
                <defs>
                  <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--secondary-accent)" />
                  </linearGradient>
                </defs>
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 42,
                    fontWeight: 700,
                  }}
                  className="slashed-zero"
                >
                  {healthAnim}
                </div>
                <div className="text-label">Score</div>
              </div>
            </div>
            <p style={{ fontSize: 12, fontWeight: 500, color: healthLabel.c }}>
              {healthLabel.t}
            </p>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bento-card" style={{ gridColumn: "span 5" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div>
              <p className="text-label">Recent Activity</p>
              <p
                style={{ fontSize: 12, color: "var(--tertiary)", marginTop: 4 }}
              >
                This month's allocations
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {state.goals.slice(0, 5).map((g) => {
              const cat = CATEGORY_STYLE[g.category];
              return (
                <div
                  key={g.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: cat.color,
                      }}
                    />
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 500 }}>
                        {g.name}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--tertiary)" }}>
                        {g.checked ? "Allocated" : "Pending"}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                    className="slashed-zero"
                  >
                    ₹{fmt(g.monthly)}
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--tertiary)",
                        fontWeight: 500,
                      }}
                    >
                      /mo
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Penny insights */}
        <div
          className="bento-card penny-card"
          style={{
            gridColumn: "span 12",
            border: "1px solid var(--penny-insight-border)",
          }}
        >
          <div className="penny-blob" />
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "var(--penny-accent-subtle)",
                color: "var(--penny-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon.Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>
                Penny's Insights
              </h3>
              <p style={{ fontSize: 12, color: "var(--tertiary)" }}>
                Personalized for your current plan
              </p>
            </div>
            <button
              onClick={() => set({ pennyOpen: true })}
              className="pill"
              style={{ marginLeft: "auto" }}
            >
              Ask follow-up <Icon.ArrowR size={12} />
            </button>
          </div>
          <div
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {insights.map((t, i) => {
              const I = Icon[t.icon];
              return (
                <div
                  key={i}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    background: "var(--surface-hover)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      background: "var(--penny-accent-subtle)",
                      color: "var(--penny-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <I size={14} />
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>{t.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
