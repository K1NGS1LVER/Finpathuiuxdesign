// ─── Landing page ───

function Landing({ onEnter }) {
  const [hovering, setHovering] = React.useState(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "18px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "color-mix(in oklab, var(--background) 85%, transparent)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background:
                "linear-gradient(135deg, var(--accent), var(--secondary-accent))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <Icon.Compass size={18} />
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            FinPath
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 28,
            fontSize: 13.5,
            color: "var(--secondary)",
          }}
        >
          {["Product", "Features", "Pricing", "Resources"].map((x) => (
            <a key={x} href="#" style={{ color: "inherit" }}>
              {x}
            </a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onEnter} className="pill">
            Sign in
          </button>
          <button onClick={onEnter} className="btn-primary">
            Get started <Icon.ArrowR size={14} />
          </button>
        </div>
      </nav>

      <section
        style={{
          position: "relative",
          padding: "100px 40px 80px",
          textAlign: "center",
          maxWidth: 1100,
          margin: "0 auto",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 500,
            background:
              "radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 99,
              background: "var(--accent-subtle)",
              color: "var(--accent-text)",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 24,
              border: "1px solid var(--accent-glow)",
            }}
          >
            <Icon.Sparkles size={12} /> Introducing Penny — AI for your finances
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(48px, 7vw, 84px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 0.98,
              marginBottom: 24,
            }}
          >
            The clearest path from{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--secondary-accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              income to outcome.
            </span>
          </h1>
          <p
            style={{
              fontSize: 19,
              color: "var(--secondary)",
              maxWidth: 640,
              margin: "0 auto 36px",
              lineHeight: 1.55,
            }}
          >
            FinPath turns your goals into a clear, monthly plan. Track what to
            save, when to invest, and how to retire on your terms — all in one
            place.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={onEnter}
              className="btn-primary"
              style={{ padding: "14px 26px", fontSize: 15 }}
            >
              Open dashboard <Icon.ArrowR size={16} />
            </button>
            <button
              className="pill"
              style={{ padding: "14px 22px", fontSize: 14 }}
            >
              <Icon.Play size={14} /> Watch demo
            </button>
          </div>
        </div>
      </section>

      {/* Product preview */}
      <section
        style={{ padding: "0 40px 80px", maxWidth: 1280, margin: "0 auto" }}
      >
        <div
          style={{
            position: "relative",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 40px 100px -20px rgba(0,0,0,0.25)",
            border: "1px solid var(--border)",
            background: "var(--card)",
          }}
        >
          <div
            style={{
              height: 36,
              background: "var(--surface-hover)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              paddingLeft: 14,
              gap: 6,
            }}
          >
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <span
                key={c}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: c,
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 12,
              padding: 24,
            }}
          >
            <div
              style={{
                gridColumn: "span 4",
                height: 220,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, var(--accent-subtle), transparent)",
                border: "1px solid var(--border)",
                padding: 18,
              }}
            >
              <p className="text-label">Health Meter</p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 56,
                  fontWeight: 700,
                  color: "var(--accent-text)",
                  letterSpacing: "-0.03em",
                  marginTop: 20,
                }}
                className="slashed-zero"
              >
                76
              </p>
              <p style={{ fontSize: 13, color: "var(--secondary)" }}>
                Strong financial position
              </p>
            </div>
            <div
              style={{
                gridColumn: "span 4",
                height: 220,
                borderRadius: 14,
                background: "var(--surface-hover)",
                padding: 18,
              }}
            >
              <p className="text-label">Active goals</p>
              {["Emergency Fund", "Japan Trip", "Home Down Payment"].map(
                (g, i) => (
                  <div key={g} style={{ marginTop: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                      }}
                    >
                      <span>{g}</span>
                      <span className="slashed-zero">{[80, 57, 30][i]}%</span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        marginTop: 4,
                        background: "var(--surface-tint)",
                        borderRadius: 99,
                      }}
                    >
                      <div
                        style={{
                          width: `${[80, 57, 30][i]}%`,
                          height: "100%",
                          background: ["#22C55E", "#06B6D4", "#A855F7"][i],
                          borderRadius: 99,
                        }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
            <div
              style={{
                gridColumn: "span 4",
                height: 220,
                borderRadius: 14,
                background: "var(--penny-accent-subtle)",
                border: "1px solid var(--penny-insight-border)",
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Icon.Sparkles
                  size={16}
                  style={{ color: "var(--penny-accent)" }}
                />
                <p style={{ fontSize: 13, fontWeight: 700 }}>Penny</p>
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--secondary)",
                  lineHeight: 1.55,
                }}
              >
                You're saving 26% of income — try shifting ₹5,000 from lifestyle
                to hit 30% and reach your Japan trip 2 months earlier.
              </p>
            </div>
            <div
              style={{
                gridColumn: "span 12",
                height: 180,
                borderRadius: 14,
                background: "var(--surface-hover)",
                padding: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p className="text-label">6-month trajectory</p>
              <svg viewBox="0 0 600 100" style={{ width: "78%", height: 130 }}>
                <defs>
                  <linearGradient id="ll" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--accent)"
                      stopOpacity="0.3"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--accent)"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 80 C 100 75, 200 60, 300 50 S 500 25, 600 15 L 600 100 L 0 100 Z"
                  fill="url(#ll)"
                />
                <path
                  d="M 0 80 C 100 75, 200 60, 300 50 S 500 25, 600 15"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{ padding: "60px 40px 100px", maxWidth: 1100, margin: "0 auto" }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            textAlign: "center",
            marginBottom: 56,
          }}
        >
          Everything in one place.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {[
            {
              icon: "Goal",
              title: "Goal-led planning",
              desc: "Set ambitions, get monthly numbers. No spreadsheets.",
            },
            {
              icon: "TrendUp",
              title: "What-if engine",
              desc: "Model 10 years ahead, in real time, with one slider.",
            },
            {
              icon: "Sparkles",
              title: "Penny copilot",
              desc: "Ask anything. Get specific, personalized answers.",
            },
            {
              icon: "PieChart",
              title: "Cashflow clarity",
              desc: "Every rupee traced from paycheck to outcome.",
            },
            {
              icon: "Shield",
              title: "Debt strategy",
              desc: "Avalanche or snowball — see what saves you most.",
            },
            {
              icon: "Receipt",
              title: "Tax optimizer",
              desc: "Old vs new regime, deduction tracking, end-to-end.",
            },
          ].map((f, i) => {
            const I = Icon[f.icon] || Icon.Sparkles;
            return (
              <div
                key={i}
                onMouseEnter={() => setHovering(i)}
                onMouseLeave={() => setHovering(null)}
                style={{
                  padding: 24,
                  borderRadius: 18,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  transition: "all 250ms ease",
                  transform: hovering === i ? "translateY(-4px)" : "none",
                  boxShadow:
                    hovering === i
                      ? "0 20px 50px var(--shadow-color)"
                      : "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "var(--accent-subtle)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  <I size={20} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: 13.5,
                    color: "var(--secondary)",
                    lineHeight: 1.55,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ padding: "0 40px 100px", textAlign: "center" }}>
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: 48,
            borderRadius: 28,
            background:
              "linear-gradient(135deg, var(--accent), var(--secondary-accent))",
            color: "#fff",
            boxShadow: "0 30px 80px var(--accent-glow)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 14,
            }}
          >
            Your plan starts today.
          </h2>
          <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 24 }}>
            Free, forever. No credit card needed.
          </p>
          <button
            onClick={onEnter}
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              background: "#fff",
              color: "var(--accent-text)",
              fontWeight: 600,
              fontSize: 15,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Open FinPath <Icon.ArrowR size={16} />
          </button>
        </div>
      </section>

      <footer
        style={{
          padding: "30px 40px",
          borderTop: "1px solid var(--border)",
          color: "var(--tertiary)",
          fontSize: 12,
          textAlign: "center",
        }}
      >
        FinPath · Built for Adobe internship · 2026
      </footer>
    </div>
  );
}

Object.assign(window, { Landing });
