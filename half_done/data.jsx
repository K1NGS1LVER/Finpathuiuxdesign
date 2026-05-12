// ─── Seed state + helpers ───

window.SEED = {
  income: { salary: 195000, bonus: 18000, other: 7000, total: 220000 },
  expenses: {
    rent: 42000,
    food: 18000,
    transport: 6500,
    lifestyle: 22000,
    subscriptions: 3200,
  },
  savings: 420000,
  goals: [
    {
      id: "emer",
      name: "Emergency Fund",
      category: "Safety",
      monthly: 25000,
      target: 600000,
      current: 420000,
      months: 8,
      priority: 1,
      checked: true,
    },
    {
      id: "japan",
      name: "Japan Trip",
      category: "Travel",
      monthly: 14000,
      target: 280000,
      current: 92000,
      months: 14,
      priority: 2,
      checked: true,
    },
    {
      id: "home",
      name: "Home Down Payment",
      category: "Home",
      monthly: 35000,
      target: 2500000,
      current: 580000,
      months: 36,
      priority: 3,
      checked: false,
    },
    {
      id: "car",
      name: "EV Car",
      category: "Vehicle",
      monthly: 12000,
      target: 1500000,
      current: 180000,
      months: 60,
      priority: 4,
      checked: false,
    },
    {
      id: "edu",
      name: "MBA Fund",
      category: "Education",
      monthly: 18000,
      target: 1800000,
      current: 145000,
      months: 84,
      priority: 5,
      checked: false,
    },
  ],
  debts: [
    {
      id: "cc",
      name: "HDFC Credit Card",
      apr: 36,
      balance: 84000,
      original: 180000,
      emi: 8500,
    },
    {
      id: "loan",
      name: "Personal Loan",
      apr: 14,
      balance: 240000,
      original: 400000,
      emi: 12500,
    },
    {
      id: "edu",
      name: "Education Loan",
      apr: 9,
      balance: 580000,
      original: 900000,
      emi: 14200,
    },
  ],
};

window.TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  density: "comfortable",
  accentHue: "220",
  sidebarStyle: "full",
} /*EDITMODE-END*/;

window.CATEGORY_STYLE = {
  Safety: {
    color: "#22C55E",
    text: "var(--green-text)",
    subtle: "var(--green-subtle)",
    icon: "Shield",
  },
  Travel: {
    color: "#06B6D4",
    text: "#0E7490",
    subtle: "rgba(6,182,212,0.12)",
    icon: "Plane",
  },
  Home: {
    color: "#A855F7",
    text: "#7E22CE",
    subtle: "rgba(168,85,247,0.12)",
    icon: "House",
  },
  Vehicle: {
    color: "#F59E0B",
    text: "var(--amber-text)",
    subtle: "var(--amber-subtle)",
    icon: "Car",
  },
  Education: {
    color: "#3B82F6",
    text: "#1D4ED8",
    subtle: "rgba(59,130,246,0.12)",
    icon: "GraduationCap",
  },
};

window.fmt = (n) => Math.round(n).toLocaleString("en-IN");
window.fmtCompact = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

window.calcHealth = (s) => {
  const exp = Object.values(s.expenses).reduce((a, b) => a + b, 0);
  const debt = s.debts.reduce((a, d) => a + d.emi, 0);
  const sav = s.income.total - exp - debt;
  const rate = sav / s.income.total;
  const emergencyOk = s.savings >= 6 * exp ? 1 : s.savings / (6 * exp);
  const debtOk = 1 - Math.min(1, debt / s.income.total);
  return Math.round(rate * 40 + emergencyOk * 30 + debtOk * 30);
};

window.useCountUp = (target) => {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const t0 = performance.now();
    const dur = 900;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(target * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return Math.round(v);
};
