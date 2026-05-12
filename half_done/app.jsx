// ─── App shell: routing, sidebar, theme + tweaks ───

const NAV = [
  { id: "dashboard", label: "Overview", icon: "Home" },
  { id: "journey", label: "Journey", icon: "Compass" },
  { id: "month", label: "Month", icon: "Calendar" },
  { id: "scenarios", label: "Scenarios", icon: "GitCompare" },
  { id: "progress", label: "Progress", icon: "TrendUp" },
  { id: "cashflow", label: "Cashflow", icon: "PieChart" },
  { id: "debt", label: "Debt", icon: "Shield" },
  { id: "tax", label: "Tax", icon: "Receipt" },
];

function App() {
  const [theme, setTheme] = React.useState("light");
  const [route, setRoute] = React.useState("landing");
  const [pennyOpen, setPennyOpen] = React.useState(false);
  const [state, setState] = React.useState(window.SEED);

  const t = useTweaks(window.TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  React.useEffect(() => {
    document.documentElement.dataset.density = t.density;
  }, [t.density]);
  React.useEffect(() => {
    document.documentElement.style.setProperty("--accent-h", t.accentHue);
  }, [t.accentHue]);

  React.useEffect(() => {
    const onOpen = () => setPennyOpen(true);
    window.addEventListener("openPenny", onOpen);
    return () => window.removeEventListener("openPenny", onOpen);
  }, []);

  const set = (next) =>
    setState((s) => (typeof next === "function" ? next(s) : { ...s, ...next }));
  const setRoot = (next) => {
    if (next.currentRoute) {
      setRoute(next.currentRoute);
      return;
    }
    if ("pennyOpen" in next) setPennyOpen(next.pennyOpen);
    set(next);
  };

  if (route === "landing")
    return (
      <>
        <Landing onEnter={() => setRoute("dashboard")} />
        <TweaksUI tweaks={t} />
      </>
    );

  const screenProps = { state, set: setRoot };
  const Screen =
    {
      dashboard: Dashboard,
      journey: Journey,
      month: Month,
      scenarios: Scenarios,
      progress: Progress,
      cashflow: Cashflow,
      debt: Debt,
      tax: Tax,
    }[route] || Dashboard;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <Sidebar
        route={route}
        setRoute={setRoute}
        theme={theme}
        setTheme={setTheme}
        setPennyOpen={setPennyOpen}
        sidebarStyle={t.sidebarStyle}
      />
      <main
        style={{ flex: 1, minWidth: 0, overflow: "auto" }}
        data-screen-label={route}
      >
        <Screen {...screenProps} />
      </main>
      <Penny
        open={pennyOpen}
        onClose={() => setPennyOpen(false)}
        state={state}
      />
      <PennyFAB onClick={() => setPennyOpen(true)} hidden={pennyOpen} />
      <TweaksUI tweaks={t} />
    </div>
  );
}

function Sidebar({
  route,
  setRoute,
  theme,
  setTheme,
  setPennyOpen,
  sidebarStyle,
}) {
  const compact = sidebarStyle === "compact";
  return (
    <aside
      style={{
        width: compact ? 72 : 232,
        flexShrink: 0,
        padding: compact ? "20px 12px" : "20px 16px",
        borderRight: "1px solid var(--border)",
        background: "var(--card)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "sticky",
        top: 0,
        height: "100vh",
        transition: "width 250ms ease",
      }}
    >
      <button
        onClick={() => setRoute("landing")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 10px",
          marginBottom: 16,
          justifyContent: compact ? "center" : "flex-start",
        }}
      >
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
            flexShrink: 0,
          }}
        >
          <Icon.Compass size={18} />
        </div>
        {!compact && (
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            FinPath
          </span>
        )}
      </button>

      {NAV.map((n) => {
        const I = Icon[n.icon] || Icon.Home;
        const active = route === n.id;
        return (
          <button
            key={n.id}
            onClick={() => setRoute(n.id)}
            title={compact ? n.label : ""}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: compact ? "10px" : "10px 12px",
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 500,
              color: active ? "var(--accent-text)" : "var(--secondary)",
              background: active ? "var(--accent-subtle)" : "transparent",
              transition: "all 150ms ease",
              justifyContent: compact ? "center" : "flex-start",
              borderLeft:
                active && !compact
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
            }}
          >
            <I size={17} />
            {!compact && <span>{n.label}</span>}
            {active && !compact && (
              <span
                style={{
                  marginLeft: "auto",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
            )}
          </button>
        );
      })}

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <button
          onClick={() => setPennyOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: compact ? "10px" : "10px 12px",
            borderRadius: 10,
            background: "var(--penny-accent-subtle)",
            color: "var(--penny-accent)",
            fontSize: 13,
            fontWeight: 600,
            border: "1px solid var(--penny-insight-border)",
            justifyContent: compact ? "center" : "flex-start",
          }}
        >
          <Icon.Sparkles size={16} />
          {!compact && <>Ask Penny</>}
        </button>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: compact ? "10px" : "10px 12px",
            borderRadius: 10,
            color: "var(--secondary)",
            fontSize: 13,
            justifyContent: compact ? "center" : "flex-start",
          }}
        >
          {theme === "light" ? <Icon.Moon size={16} /> : <Icon.Sun size={16} />}
          {!compact && <>{theme === "light" ? "Dark" : "Light"} mode</>}
        </button>
      </div>
    </aside>
  );
}

function PennyFAB({ onClick, hidden }) {
  if (hidden) return null;
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 80,
        width: 56,
        height: 56,
        borderRadius: 18,
        background:
          "linear-gradient(135deg, var(--penny-accent), var(--secondary-accent))",
        color: "#fff",
        boxShadow: "0 12px 30px var(--accent-glow)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 200ms ease",
      }}
      className="pulse-ring"
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <Icon.Sparkles size={22} />
    </button>
  );
}

// ── Tweaks UI ──
function TweaksUI({ tweaks: { t, setTweak } }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Visual Direction">
        <TweakRadio
          value={t.density}
          onChange={(v) => setTweak("density", v)}
          options={[
            { value: "comfortable", label: "Comfortable" },
            { value: "compact", label: "Compact" },
          ]}
        />
      </TweakSection>
      <TweakSection title="Accent Hue">
        <TweakColor
          value={t.accentHue}
          onChange={(v) => setTweak("accentHue", v)}
          options={["220", "262", "180", "150", "16"]}
        />
      </TweakSection>
      <TweakSection title="Sidebar">
        <TweakRadio
          value={t.sidebarStyle}
          onChange={(v) => setTweak("sidebarStyle", v)}
          options={[
            { value: "full", label: "Full" },
            { value: "compact", label: "Icons only" },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
