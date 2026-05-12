// ─── FinPath mock store ─── single source of truth for the prototype

const initialGoals = [
  {
    id: "g1",
    name: "Emergency Fund",
    category: "emergency",
    target: 300000,
    current: 186000,
    monthly: 12000,
    months: 10,
    priority: 1,
    checked: true,
  },
  {
    id: "g2",
    name: "Home Downpayment",
    category: "home",
    target: 2500000,
    current: 740000,
    monthly: 35000,
    months: 50,
    priority: 2,
    checked: false,
  },
  {
    id: "g3",
    name: "Japan Trip",
    category: "travel",
    target: 280000,
    current: 92000,
    monthly: 14000,
    months: 14,
    priority: 3,
    checked: false,
  },
  {
    id: "g4",
    name: "New Car",
    category: "car",
    target: 1200000,
    current: 320000,
    monthly: 22000,
    months: 40,
    priority: 4,
    checked: false,
  },
  {
    id: "g5",
    name: "Upskill — MBA prep",
    category: "career",
    target: 180000,
    current: 60000,
    monthly: 8000,
    months: 15,
    priority: 5,
    checked: false,
  },
];

const initialDebts = [
  {
    id: "d1",
    name: "Credit Card",
    balance: 86000,
    apr: 36,
    emi: 8500,
    type: "card",
  },
  {
    id: "d2",
    name: "Personal Loan",
    balance: 240000,
    apr: 14,
    emi: 11500,
    type: "personal",
  },
  {
    id: "d3",
    name: "Education Loan",
    balance: 580000,
    apr: 9.5,
    emi: 7800,
    type: "education",
  },
];

const initialExpenses = {
  rent: 28000,
  food: 14000,
  transport: 6500,
  utilities: 4500,
  lifestyle: 9000,
  subscriptions: 2200,
  other: 5000,
};

function useStore() {
  const [state, setState] = React.useState(() => {
    try {
      const stored = localStorage.getItem("finpath-proto-v3");
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      income: { salary: 142000, freelance: 18000, total: 160000 },
      expenses: initialExpenses,
      goals: initialGoals,
      debts: initialDebts,
      strategy: "avalanche",
      savings: 386000,
      currentRoute: "dashboard",
      theme: "light",
      variant: "default",
      pennyOpen: false,
    };
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("finpath-proto-v3", JSON.stringify(state));
    } catch {}
  }, [state]);

  const set = (patch) =>
    setState((s) =>
      typeof patch === "function" ? patch(s) : { ...s, ...patch },
    );
  return [state, set];
}

const ROUTES = [
  { id: "dashboard", label: "Overview", icon: "Dashboard" },
  { id: "journey", label: "Journey", icon: "GitBranch" },
  { id: "month", label: "Month", icon: "Calendar" },
  { id: "scenarios", label: "Scenarios", icon: "Layers" },
  { id: "progress", label: "Progress", icon: "Bar" },
  { id: "cashflow", label: "Cashflow", icon: "ArrowLR" },
  { id: "debt", label: "Debt", icon: "Card" },
];

// Health score calculation
function calcHealth(s) {
  const surplus =
    s.income.total -
    Object.values(s.expenses).reduce((a, b) => a + b, 0) -
    s.debts.reduce((a, d) => a + d.emi, 0);
  const savingsRate = (surplus / s.income.total) * 100;
  const dti = (s.debts.reduce((a, d) => a + d.emi, 0) / s.income.total) * 100;
  const goalProgress =
    s.goals.reduce((a, g) => a + Math.min(1, g.current / g.target), 0) /
    s.goals.length;
  const ef = Math.min(
    1,
    (s.goals.find((g) => g.category === "emergency")?.current || 0) / 250000,
  );
  const score = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        savingsRate * 1.4 + (45 - dti) * 0.8 + goalProgress * 35 + ef * 25,
      ),
    ),
  );
  return Math.max(0, Math.min(100, score));
}

Object.assign(window, { useStore, ROUTES, calcHealth });
