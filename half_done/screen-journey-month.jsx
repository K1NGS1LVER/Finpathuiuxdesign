// ─── Journey + Month screens ───

function Journey({ state, set }) {
  const [selected, setSelected] = React.useState(state.goals[0]?.id);
  const goal = state.goals.find((g) => g.id === selected);

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
          <p className="text-label">Your Financial Roadmap</p>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginTop: 4,
            }}
          >
            Journey
          </h2>
        </div>
        <button className="btn-primary">
          <Icon.Plus size={16} /> Add Goal
        </button>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}
      >
        <div
          className="bento-card"
          style={{
            padding: 32,
            minHeight: 540,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, var(--border) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />
          {/* Income node */}
          <div
            style={{
              position: "absolute",
              left: 40,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <div
              style={{
                width: 130,
                height: 130,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--accent), var(--secondary-accent))",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 16px 40px var(--accent-glow)",
              }}
              className="pulse-ring"
            >
              <Icon.Wallet size={28} />
              <p
                style={{
                  fontSize: 10,
                  marginTop: 6,
                  opacity: 0.8,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Income
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 700,
                }}
                className="slashed-zero"
              >
                ₹{fmt(state.income.total)}
              </p>
            </div>
          </div>
          {/* Goals on right */}
          <div
            style={{
              position: "absolute",
              right: 40,
              top: 40,
              bottom: 40,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              justifyContent: "space-around",
            }}
          >
            {state.goals.map((g, i) => {
              const cat = CATEGORY_STYLE[g.category];
              const I = Icon[cat.icon];
              const progress = Math.round((g.current / g.target) * 100);
              const isSel = selected === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelected(g.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 16px",
                    borderRadius: 18,
                    background: isSel ? cat.subtle : "var(--card)",
                    border: `1.5px solid ${isSel ? cat.color : "var(--border)"}`,
                    minWidth: 280,
                    textAlign: "left",
                    transition: "all 250ms ease",
                    boxShadow: isSel
                      ? `0 8px 24px ${cat.color}33`
                      : "var(--shadow-sm)",
                    transform: isSel ? "translateX(-4px)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
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
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</p>
                    <p style={{ fontSize: 11, color: "var(--tertiary)" }}>
                      ₹{fmt(g.monthly)}/mo
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 18,
                        fontWeight: 700,
                        color: cat.text,
                      }}
                      className="slashed-zero"
                    >
                      {progress}%
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {/* SVG connectors */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              width: "100%",
              height: "100%",
            }}
          >
            {state.goals.map((g, i) => {
              const cat = CATEGORY_STYLE[g.category];
              const total = state.goals.length;
              const ys = `${40 + ((i + 0.5) * (100 - 8 * 2)) / total}%`;
              return (
                <path
                  key={g.id}
                  d={`M 170 50% C 350 50%, 360 ${ys}, 540 ${ys}`}
                  stroke={cat.color}
                  strokeWidth="2"
                  fill="none"
                  opacity={selected === g.id ? 0.8 : 0.25}
                  className="draw-line"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              );
            })}
          </svg>
        </div>

        {/* Selected goal panel */}
        {goal &&
          (() => {
            const cat = CATEGORY_STYLE[goal.category];
            const I = Icon[cat.icon];
            const progress = Math.round((goal.current / goal.target) * 100);
            return (
              <div className="bento-card" style={{ padding: 28 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: cat.subtle,
                      color: cat.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <I size={24} />
                  </div>
                  <div>
                    <p className="text-label">{goal.category}</p>
                    <h3
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {goal.name}
                    </h3>
                  </div>
                </div>

                <div
                  style={{
                    position: "relative",
                    padding: "20px 0",
                    textAlign: "center",
                  }}
                >
                  <svg
                    viewBox="0 0 200 100"
                    style={{
                      width: "100%",
                      maxWidth: 240,
                      margin: "0 auto",
                      display: "block",
                    }}
                  >
                    <path
                      d="M 20 90 A 80 80 0 0 1 180 90"
                      fill="none"
                      stroke="var(--surface-hover)"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 20 90 A 80 80 0 0 1 180 90"
                      fill="none"
                      stroke={cat.color}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="251.3"
                      strokeDashoffset={251.3 - (progress / 100) * 251.3}
                      style={{
                        transition:
                          "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)",
                        filter: `drop-shadow(0 0 8px ${cat.color})`,
                      }}
                    />
                  </svg>
                  <div style={{ marginTop: -20 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 44,
                        fontWeight: 700,
                        color: cat.text,
                        letterSpacing: "-0.02em",
                      }}
                      className="slashed-zero"
                    >
                      {progress}%
                    </p>
                    <p
                      style={{ fontSize: 12, color: "var(--tertiary)" }}
                      className="slashed-zero"
                    >
                      {fmtCompact(goal.current)} of {fmtCompact(goal.target)}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginTop: 16,
                  }}
                >
                  {[
                    ["Monthly", `₹${fmt(goal.monthly)}`],
                    ["Timeline", `${goal.months} mo`],
                    ["Remaining", fmtCompact(goal.target - goal.current)],
                    ["Priority", `#${goal.priority}`],
                  ].map(([l, v]) => (
                    <div
                      key={l}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: "var(--surface-hover)",
                      }}
                    >
                      <p style={{ fontSize: 11, color: "var(--tertiary)" }}>
                        {l}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 17,
                          fontWeight: 700,
                          marginTop: 2,
                        }}
                        className="slashed-zero"
                      >
                        {v}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => set({ pennyOpen: true })}
                  style={{
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 14,
                    width: "100%",
                    background: "var(--penny-accent-subtle)",
                    border: "1px solid var(--penny-insight-border)",
                    color: "var(--penny-accent)",
                    fontWeight: 600,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  <Icon.Sparkles size={16} /> Ask Penny about this goal
                </button>
              </div>
            );
          })()}
      </div>
    </div>
  );
}

function Month({ state, set }) {
  const totalAllocated = state.goals.reduce(
    (a, g) => a + (g.checked ? g.monthly : 0),
    0,
  );
  const totalNeeded = state.goals.reduce((a, g) => a + g.monthly, 0);
  const pct = Math.round((totalAllocated / totalNeeded) * 100);

  return (
    <div
      className="page-animate"
      style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}
    >
      <div style={{ marginBottom: 24 }}>
        <p className="text-label">May 2026 · 18 days left</p>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: 4,
          }}
        >
          This Month's Plan
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div className="bento-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div>
              <p className="text-label">Allocation Checklist</p>
              <p
                style={{ fontSize: 12, color: "var(--tertiary)", marginTop: 4 }}
              >
                {state.goals.filter((g) => g.checked).length} of{" "}
                {state.goals.length} complete
              </p>
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                fontWeight: 700,
              }}
              className="slashed-zero"
            >
              {pct}%
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {state.goals.map((g) => {
              const cat = CATEGORY_STYLE[g.category];
              const I = Icon[cat.icon];
              return (
                <button
                  key={g.id}
                  onClick={() =>
                    set((s) => ({
                      ...s,
                      goals: s.goals.map((x) =>
                        x.id === g.id
                          ? {
                              ...x,
                              checked: !x.checked,
                              current: x.checked
                                ? x.current - x.monthly
                                : Math.min(x.target, x.current + x.monthly),
                            }
                          : x,
                      ),
                    }))
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 14,
                    borderRadius: 14,
                    background: g.checked
                      ? "var(--green-subtle)"
                      : "var(--surface-tint)",
                    border: `1px solid ${g.checked ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                    textAlign: "left",
                    transition: "all 250ms ease",
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: g.checked ? "var(--green)" : "transparent",
                      border: g.checked ? "none" : "2px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      transition: "all 200ms ease",
                    }}
                  >
                    {g.checked && <Icon.Check size={14} strokeWidth={3} />}
                  </div>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: cat.subtle,
                      color: cat.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <I size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: g.checked ? "line-through" : "none",
                        opacity: g.checked ? 0.65 : 1,
                      }}
                    >
                      {g.name}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--tertiary)",
                        marginTop: 2,
                      }}
                    >
                      Priority #{g.priority}
                    </p>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 18,
                      fontWeight: 700,
                    }}
                    className="slashed-zero"
                  >
                    ₹{fmt(g.monthly)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="bento-card">
            <p className="text-label" style={{ marginBottom: 10 }}>
              This Month's Impact
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--secondary)",
                marginBottom: 16,
              }}
            >
              Completing all goals this month moves you
            </p>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 44,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--accent)",
              }}
              className="slashed-zero"
            >
              +8.3%
            </p>
            <p
              style={{ fontSize: 13, color: "var(--secondary)", marginTop: 4 }}
            >
              closer to all targets
            </p>
            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 12,
                background: "var(--accent-subtle)",
                border: "1px solid var(--accent-glow)",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--accent-text)",
                }}
              >
                Streak: 4 months · 🔥
              </p>
            </div>
          </div>

          <div className="bento-card penny-card">
            <div className="penny-blob" />
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <Icon.Sparkles
                  size={18}
                  style={{ color: "var(--penny-accent)" }}
                />
                <p style={{ fontSize: 13, fontWeight: 600 }}>Penny suggests</p>
              </div>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: "var(--secondary)",
                }}
              >
                You have ₹3,200 surplus left this month. Adding it to the credit
                card balance saves ₹960 in interest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Journey, Month });
