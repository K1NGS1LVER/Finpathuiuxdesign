// ─── Layout: Sidebar + Header + Penny panel ───

function Sidebar({ state, set }) {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <aside
      style={{
        width: collapsed ? 76 : 232,
        height: "100vh",
        background: "var(--card)",
        backdropFilter: "blur(32px)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 400ms cubic-bezier(0.22, 1, 0.36, 1)",
        position: "relative",
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "24px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
        }}
      >
        <button
          onClick={() => set({ currentRoute: "landing" })}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: 0 }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 14px var(--accent-glow)",
              flexShrink: 0,
            }}
          />
          {!collapsed && (
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: "-0.02em",
              }}
            >
              finpath
            </span>
          )}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform:
              "translateY(-50%) " + (collapsed ? "rotate(180deg)" : ""),
            width: 24,
            height: 24,
            borderRadius: 12,
            background: "var(--surface-hover)",
            display: collapsed ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 300ms ease",
          }}
        >
          <Icon.Chevron size={14} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>

      <nav
        style={{
          flex: 1,
          padding: "0 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {ROUTES.map((r) => {
          const I = Icon[r.icon];
          const active = state.currentRoute === r.id;
          return (
            <button
              key={r.id}
              onClick={() => set({ currentRoute: r.id })}
              title={collapsed ? r.label : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: collapsed ? 0 : 12,
                padding: collapsed ? "12px" : "12px 16px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 16,
                position: "relative",
                overflow: "hidden",
                background: active ? "var(--accent-subtle)" : "transparent",
                color: active ? "var(--accent-text)" : "var(--secondary)",
                fontWeight: active ? 600 : 500,
                fontSize: 14,
                transition: "all 250ms ease",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  e.currentTarget.style.background = "var(--surface-hover)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              {active && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 24,
                    borderRadius: "0 4px 4px 0",
                    background: "var(--accent)",
                    boxShadow: "0 0 12px var(--accent-glow)",
                  }}
                />
              )}
              <I size={20} />
              {!collapsed && <span>{r.label}</span>}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 16 }}>
        <button
          onClick={() => set({ pennyOpen: true })}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: collapsed ? 0 : 8,
            padding: "14px 16px",
            borderRadius: 9999,
            background:
              "linear-gradient(135deg, var(--accent), var(--secondary-accent))",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            boxShadow: "0 8px 24px var(--accent-glow)",
            transition: "transform 300ms ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "translateY(-1px) scale(1.01)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          <Icon.Sparkles size={18} />
          {!collapsed && <span>Ask Penny</span>}
        </button>
      </div>
    </aside>
  );
}

function Header({ state, set }) {
  const route = ROUTES.find((r) => r.id === state.currentRoute);
  return (
    <header
      style={{
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        background: "var(--card)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          <p className="text-label" style={{ marginBottom: 2 }}>
            FinPath
          </p>
          <h1
            style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {route?.label || "Home"}
          </h1>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn-ghost" style={{ padding: "8px 14px" }}>
          <Icon.Search size={16} />
          <span style={{ color: "var(--tertiary)" }}>Search…</span>
        </button>
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--surface-hover)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Icon.Bell size={18} />
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 9,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent-glow)",
            }}
          />
        </button>
        <button
          onClick={() =>
            set({ theme: state.theme === "light" ? "dark" : "light" })
          }
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--surface-hover)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "rotate(180deg)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          {state.theme === "light" ? (
            <Icon.Moon size={18} />
          ) : (
            <Icon.Sun size={18} />
          )}
        </button>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, var(--accent), var(--secondary-accent))",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14,
            boxShadow: "0 4px 16px var(--accent-glow)",
          }}
        >
          AS
        </div>
      </div>
    </header>
  );
}

function PennyPanel({ state, set }) {
  const [messages, setMessages] = React.useState([
    {
      role: "assistant",
      text: "Hi Aanya — I noticed your emergency fund is at 62%. At your current pace you'll hit ₹3L in about 10 months. Want me to suggest a faster track?",
    },
  ]);
  const [input, setInput] = React.useState("");
  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: input },
      {
        role: "assistant",
        text: "Working on a tailored answer based on your current plan…",
      },
    ]);
    setInput("");
  };
  if (!state.pennyOpen) return null;
  return (
    <>
      <div
        onClick={() => set({ pennyOpen: false })}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(4px)",
          zIndex: 50,
          animation: "fadeSlide 200ms",
        }}
      />
      <aside
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: 420,
          background: "var(--card)",
          backdropFilter: "blur(40px)",
          borderLeft: "1px solid var(--border)",
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          animation: "fadeSlide 400ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            padding: 24,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, var(--accent), var(--secondary-accent))",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon.Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Penny</h3>
              <p style={{ fontSize: 12, color: "var(--tertiary)" }}>
                Your AI financial companion
              </p>
            </div>
          </div>
          <button
            onClick={() => set({ pennyOpen: false })}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--surface-hover)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon.X size={16} />
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                padding: "12px 16px",
                borderRadius:
                  m.role === "user"
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                background:
                  m.role === "user" ? "var(--accent)" : "var(--surface-hover)",
                color:
                  m.role === "user"
                    ? "var(--on-accent)"
                    : "var(--card-foreground)",
                fontSize: 14,
                lineHeight: 1.5,
                border:
                  m.role === "assistant" ? "1px solid var(--border)" : "none",
              }}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            {[
              "Boost my emergency fund",
              "How to clear card debt fast?",
              "Should I switch to new tax regime?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 9999,
                  fontSize: 12,
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                  color: "var(--secondary)",
                }}
              >
                {q}
              </button>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              padding: 6,
              borderRadius: 9999,
              background: "var(--surface-hover)",
              border: "1px solid var(--border)",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask anything about your finances…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                padding: "10px 12px",
                color: "var(--foreground)",
                fontSize: 14,
              }}
            />
            <button
              onClick={send}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "var(--accent)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon.Send size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

Object.assign(window, { Sidebar, Header, PennyPanel });
