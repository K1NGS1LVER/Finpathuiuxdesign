import { useState, useMemo, useEffect } from "react";
import {
  ArrowRight,
  TrendingUp,
  Home,
  GraduationCap,
  Baby,
  Sparkles,
} from "lucide-react";
import { useFinPathStore } from "@/lib/store";
import { generatePlan as buildPlan } from "@/lib/plan-engine";

const SCENARIO_OPTIONS = [
  {
    id: "salary",
    label: "Salary Change",
    icon: TrendingUp,
    color: "var(--accent)",
    subtle: "var(--accent-subtle)",
  },
  {
    id: "property",
    label: "Buy Property",
    icon: Home,
    color: "var(--secondary-accent)",
    subtle: "var(--secondary-accent-subtle)",
  },
  {
    id: "education",
    label: "Higher Education",
    icon: GraduationCap,
    color: "var(--secondary-accent)",
    subtle: "var(--secondary-accent-subtle)",
  },
  {
    id: "family",
    label: "Start Family",
    icon: Baby,
    color: "var(--amber)",
    subtle: "var(--amber-subtle)",
  },
] as const;

type ScenarioId = (typeof SCENARIO_OPTIONS)[number]["id"];

export default function Scenarios() {
  const income = useFinPathStore((s) => s.income);
  const expenses = useFinPathStore((s) => s.expenses);
  const debts = useFinPathStore((s) => s.debts);
  const goals = useFinPathStore((s) => s.goals) || [];
  const savings = useFinPathStore((s) => s.savings);
  const investments = useFinPathStore((s) => s.investments);
  const strategy = useFinPathStore((s) => s.strategy);
  const monthlySurplusReserve = useFinPathStore((s) => s.monthlySurplusReserve);
  const pendingGoalDecisions = useFinPathStore((s) => s.pendingGoalDecisions);
  const plan = useFinPathStore((s) => s.plan);
  const updateSettings = useFinPathStore((s) => s.updateSettings);
  const addLumpsum = useFinPathStore((s) => s.addLumpsum);

  const [scenario, setScenario] = useState<ScenarioId>("salary");

  const [values, setValues] = useState({
    salary: 15,
    property: 150,
    education: 30,
    family: 15000,
  });

  const [salaryInput, setSalaryInput] = useState("");
  const [salaryHikeInput, setSalaryHikeInput] = useState("");
  const [simGoalId, setSimGoalId] = useState("");
  const [simLumpsumAmount, setSimLumpsumAmount] = useState("");
  const [notice, setNotice] = useState("");

  const activeGoals = useMemo(
    () =>
      goals
        .filter((goal) => goal.status !== "complete")
        .slice()
        .sort((a, b) => a.priority - b.priority),
    [goals],
  );

  useEffect(() => {
    setSalaryInput(String(income.salary || income.total || 0));
  }, [income.salary, income.total]);

  useEffect(() => {
    if (!simGoalId && activeGoals.length > 0) {
      setSimGoalId(activeGoals[0].id);
    }
    if (activeGoals.length === 0) {
      setSimGoalId("");
    }
  }, [activeGoals, simGoalId]);

  const current = SCENARIO_OPTIONS.find((s) => s.id === scenario);
  const currentVal = values[scenario];

  const getSliderConfig = () => {
    switch (scenario) {
      case "salary":
        return { min: -50, max: 100, step: 1 };
      case "property":
        return { min: 0, max: 500, step: 5 };
      case "education":
        return { min: 0, max: 100, step: 1 };
      case "family":
        return { min: 0, max: 100000, step: 1000 };
      default:
        return { min: 0, max: 100, step: 1 };
    }
  };

  const { min, max, step } = getSliderConfig();
  const progressPercent = ((currentVal - min) / (max - min)) * 100;

  const currentSurplus = income.total - expenses.total - debts.totalMonthly;
  const fmt = (n: number) =>
    `₹${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;

  const impacts = useMemo(() => {
    let newSurplus = currentSurplus;
    let additionalExpense = 0;

    if (scenario === "salary") {
      newSurplus =
        income.total * (1 + currentVal / 100) -
        expenses.total -
        debts.totalMonthly;
    } else if (scenario === "property") {
      additionalExpense = (currentVal * 100000 * 0.08) / 12;
      newSurplus = currentSurplus - additionalExpense;
    } else if (scenario === "education") {
      additionalExpense = (currentVal * 100000 * 0.09) / 12;
      newSurplus = currentSurplus - additionalExpense;
    } else if (scenario === "family") {
      newSurplus = currentSurplus - currentVal;
    }

    const savingsChange =
      currentSurplus > 0
        ? Math.round(((newSurplus - currentSurplus) / currentSurplus) * 100)
        : 0;
    const timelineChange =
      newSurplus > 0 && currentSurplus > 0
        ? Math.round((currentSurplus / newSurplus - 1) * 100)
        : 0;

    return [
      {
        label: "Monthly Savings",
        current: fmt(Math.max(0, currentSurplus)),
        future: fmt(Math.max(0, newSurplus)),
        change: `${savingsChange >= 0 ? "+" : ""}${savingsChange}%`,
        positive: newSurplus >= currentSurplus,
      },
      {
        label: "Goal Timeline",
        current: "Current",
        future:
          timelineChange > 0
            ? `+${timelineChange}% longer`
            : `${Math.abs(timelineChange)}% faster`,
        change: `${timelineChange >= 0 ? "+" : "-"}${Math.abs(timelineChange)}%`,
        positive: timelineChange <= 0,
      },
      {
        label: "Emergency Buffer",
        current: "3 months",
        future: newSurplus >= currentSurplus ? "5 months" : "2 months",
        change: newSurplus >= currentSurplus ? "+67%" : "-33%",
        positive: newSurplus >= currentSurplus,
      },
      {
        label: "Tax Liability",
        current: fmt(income.total * 12 * 0.05),
        future: fmt(
          (scenario === "salary"
            ? income.total * (1 + currentVal / 100)
            : income.total) *
            12 *
            0.05,
        ),
        change:
          scenario === "salary"
            ? `${currentVal >= 0 ? "+" : ""}${currentVal}%`
            : "+0%",
        positive: scenario === "salary" && currentVal < 0,
      },
    ];
  }, [scenario, currentVal, income, expenses, debts, currentSurplus]);

  const simLumpsumValue = parseInt(simLumpsumAmount, 10) || 0;

  const simulatedPlan = useMemo(() => {
    if (!simGoalId || simLumpsumValue <= 0) return null;

    const simulatedGoals = goals.map((goal) => {
      if (goal.id !== simGoalId) return goal;
      return {
        ...goal,
        currentAmount: Math.min(
          goal.targetAmount,
          goal.currentAmount + simLumpsumValue,
        ),
      };
    });

    return buildPlan({
      income,
      expenses,
      debts,
      goals: simulatedGoals,
      savings,
      investments,
      strategy,
      monthlySurplusReserve,
      pendingReallocationReserve: pendingGoalDecisions.reduce(
        (sum, decision) => sum + Math.max(0, decision.freedMonthlyAmount),
        0,
      ),
    });
  }, [
    simGoalId,
    simLumpsumValue,
    goals,
    income,
    expenses,
    debts,
    savings,
    investments,
    strategy,
    monthlySurplusReserve,
    pendingGoalDecisions,
  ]);

  const timelineMonthsSaved =
    plan && simulatedPlan ? plan.totalMonths - simulatedPlan.totalMonths : 0;

  const applySalary = () => {
    const monthlySalary = parseInt(salaryInput, 10) || 0;
    if (monthlySalary <= 0) return;

    updateSettings({ income: monthlySalary });
    setNotice(
      `Monthly salary set to ₹${monthlySalary.toLocaleString("en-IN")}.`,
    );
  };

  const applySalaryHike = () => {
    const hike = Number(salaryHikeInput);
    if (!Number.isFinite(hike) || hike === 0) return;

    updateSettings({ salaryHike: hike });
    setSalaryHikeInput("");
    setNotice(`Applied ${hike > 0 ? "+" : ""}${hike}% salary adjustment.`);
  };

  const applyScenarioLumpsum = () => {
    if (!simGoalId || simLumpsumValue <= 0) return;

    const goal = goals.find((g) => g.id === simGoalId);
    addLumpsum(simGoalId, simLumpsumValue);
    setSimLumpsumAmount("");
    if (goal) {
      setNotice(
        `Applied ₹${simLumpsumValue.toLocaleString("en-IN")} lumpsum to ${goal.name}.`,
      );
    } else {
      setNotice("Applied lumpsum amount.");
    }
  };

  const impactAnalysisSection = (
    <div className="relative z-10">
      <h3 className="font-bold mb-4 text-foreground font-display">
        Impact Analysis
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {impacts.map((impact, i) => (
          <div key={i} className="p-6 bento-card">
            {/* Header row: label + change value */}
            <div className="flex items-baseline justify-between mb-3">
              <div className="font-semibold text-card-foreground font-display text-lg">
                {impact.label}
              </div>
              <div
                className={`font-bold slashed-zero font-display text-xl ${impact.positive ? "text-green-text" : "text-red-text"}`}
              >
                {impact.change}
              </div>
            </div>
            {/* Before → After row */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs mb-0.5 text-tertiary font-body">
                  Before
                </div>
                <div className="text-lg font-bold slashed-zero text-card-foreground font-display">
                  {impact.current}
                </div>
              </div>
              <div className="text-card-foreground opacity-40 flex-shrink-0 px-2">
                <ArrowRight size={24} strokeWidth={2} />
              </div>
              <div className="flex-1 text-right">
                <div className="text-xs mb-0.5 text-tertiary font-body">
                  After
                </div>
                <div
                  className="text-lg font-bold slashed-zero font-display"
                  style={{
                    color: current?.color,
                  }}
                >
                  {impact.future}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 relative">
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none bg-tertiary-accent" />
      <div className="mb-6 md:mb-8 relative z-10">

        <h1 className="text-title text-secondary tracking-[0.15em] mb-1 ">Scenario Explorer</h1>
      </div>

      {/* Dropdown scenario selector */}
      <div className="max-w-md mb-4 md:mb-6">
        <label className="block text-secondary mb-2 font-medium font-body text-xs uppercase tracking-[0.07em]">
          Explore Scenario
        </label>
        <div className="relative">
          {/* Leading icon — centered vertically inside the select */}
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{
              color: current?.color ?? "var(--secondary)",
              transition: "color 300ms ease",
            }}
          >
            {(() => {
              const Icon = current?.icon;
              return Icon ? <Icon size={16} strokeWidth={2} /> : null;
            })()}
          </div>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value as ScenarioId)}
            className="w-full pl-10 pr-10 py-3 rounded-xl outline-none cursor-pointer font-semibold text-base appearance-none bg-card font-display transition-[border-color,color] duration-300"
            style={{
              border: `2px solid ${current?.color ?? "var(--border)"}`,
              color: current?.color ?? "var(--card-foreground)",
            }}
          >
            {SCENARIO_OPTIONS.map((s) => {
              return (
                <option
                  key={s.id}
                  value={s.id}
                  className="bg-background-solid text-card-foreground font-body"
                >
                  {s.label}
                </option>
              );
            })}
          </select>
          {/* Chevron */}
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              color: current?.color ?? "var(--secondary)",
              transition: "color 300ms ease, transform 300ms ease",
            }}
          >
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
              <path
                d="M1 1L7 7L13 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Right content area — animated on scenario change */}
      <div
        className="space-y-4 md:space-y-6"
        key={scenario}
        style={{
          animation: "scenarioFadeSlide 450ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Adjust Parameters */}
        <div className="bento-card p-4 md:p-8">
          <h3 className="font-bold mb-6 text-card-foreground font-display">
            Adjust Parameters
          </h3>
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium text-card-foreground">
              {scenario === "salary" && "Salary Change"}
              {scenario === "property" && "Property Value"}
              {scenario === "education" && "Course Fee"}
              {scenario === "family" && "Monthly Child Expenses"}
            </span>
            <span
              className="text-2xl font-bold slashed-zero font-display"
              style={{
                color: current?.color,
              }}
            >
              {scenario === "salary" &&
                `${currentVal >= 0 ? "+" : ""}${currentVal}%`}
              {scenario === "property" && `₹${currentVal}L`}
              {scenario === "education" && `₹${currentVal}L`}
              {scenario === "family" &&
                `₹${currentVal.toLocaleString("en-IN")}`}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentVal}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                [scenario]: Number(e.target.value),
              }))
            }
              className="w-full h-2 rounded-full appearance-none bg-[var(--progress-inactive)]"
            style={{
              background: `linear-gradient(to right, ${current?.color} 0%, ${current?.color} ${progressPercent}%, var(--progress-inactive) ${progressPercent}%, var(--progress-inactive) 100%)`,
            }}
          />
        </div>

        {/* Impact Analysis Section */}
        {impactAnalysisSection}

        {/* Income Controls */}
        <div className="bento-card p-6 md:p-8 space-y-4 relative z-10">
          <h3 className="text-xl font-bold text-card-foreground font-display">
            Income Controls
          </h3>
          <p className="text-sm text-secondary font-body">
            Adjust your monthly salary or apply a percentage hike to see how it
            affects your financial plan.
          </p>

          <div className="space-y-3">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-secondary mb-1.5 font-body">
                  {salaryHikeInput ? "Salary Hike %" : "Monthly Salary"}
                </label>
                <input
                  type="text"
                  value={salaryHikeInput || salaryInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (salaryHikeInput) {
                      setSalaryHikeInput(raw.replace(/[^0-9-]/g, ""));
                    } else {
                      setSalaryInput(raw.replace(/[^0-9]/g, ""));
                    }
                  }}
                  placeholder={
                    salaryHikeInput ? "e.g. 12 or -5" : "Enter amount"
                  }
                  className="w-full px-3 py-2.5 rounded-xl outline-none text-card-foreground bg-surface-tint border border-border font-body"
                />
              </div>
              <div className="w-36">
                <label className="block text-xs text-secondary mb-1.5 font-body">
                  Type
                </label>
                <select
                  value={salaryHikeInput ? "hike" : "salary"}
                  onChange={(e) => {
                    if (e.target.value === "hike") {
                      setSalaryInput("");
                    } else {
                      setSalaryHikeInput("");
                      setSalaryInput(
                        String(income.salary || income.total || 0),
                      );
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl outline-none cursor-pointer text-card-foreground bg-surface-tint border border-border font-body"
                >
                  <option value="salary">Set Salary</option>
                  <option value="hike">Salary Hike %</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => {
                if (salaryHikeInput) {
                  applySalaryHike();
                } else {
                  applySalary();
                }
              }}
              disabled={salaryHikeInput ? !salaryHikeInput : !salaryInput}
              className="w-full py-2.5 rounded-xl font-semibold transition-all disabled:opacity-40 bg-secondary-accent text-on-secondary-accent font-body"
            >
              Apply Change
            </button>
          </div>
        </div>

        {/* Lumpsum Simulator */}
        <div className="bento-card p-6 md:p-8 relative z-10">
          <h3 className="text-xl font-bold mb-4 text-card-foreground font-display">
            Lumpsum Course Simulator
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={simGoalId}
              onChange={(e) => setSimGoalId(e.target.value)}
              className="px-3 py-2 rounded-lg outline-none text-card-foreground bg-surface-tint border border-border"
              disabled={activeGoals.length === 0}
            >
              {activeGoals.length === 0 ? (
                <option value="">No active goals</option>
              ) : (
                activeGoals.map((goal) => (
                  <option
                    key={`sim-${goal.id}`}
                    value={goal.id}
                  >{`P${goal.priority} - ${goal.name}`}</option>
                ))
              )}
            </select>
            <input
              type="text"
              value={simLumpsumAmount}
              onChange={(e) =>
                setSimLumpsumAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="Lumpsum amount"
              className="px-3 py-2 rounded-lg outline-none text-card-foreground bg-surface-tint border border-border"
            />
            <button
              onClick={applyScenarioLumpsum}
              disabled={!simGoalId || simLumpsumValue <= 0}
              className="py-2 rounded-lg font-semibold disabled:opacity-50 bg-[var(--penny-accent)] text-on-accent"
            >
              Apply Lumpsum
            </button>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-surface-tint border border-border">
            <div className="text-sm text-[var(--secondary)] mb-1">
              Projected Timeline Impact
            </div>
            <div
              className="text-xl font-bold slashed-zero text-[var(--card-foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {simLumpsumValue <= 0
                ? "Enter an amount to simulate"
                : timelineMonthsSaved > 0
                  ? `${timelineMonthsSaved} month${timelineMonthsSaved > 1 ? "s" : ""} faster`
                  : timelineMonthsSaved < 0
                    ? `${Math.abs(timelineMonthsSaved)} month${Math.abs(timelineMonthsSaved) > 1 ? "s" : ""} longer`
                    : "No timeline change"}
            </div>
            <div className="text-xs mt-1 text-[var(--secondary)]">
              Based on your current profile, strategy, and active goals.
            </div>
          </div>
        </div>

        {/* Penny's Insight */}
        <div className="flex items-start gap-4 penny-insight-card">
          <div className="penny-insight-blob" />
          <div className="relative z-10 w-full">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "var(--penny-accent-subtle)",
                  color: "var(--penny-accent)",
                }}
              >
                <Sparkles size={16} />
              </div>
              <div
                className="text-sm font-semibold tracking-wider text-[var(--penny-accent)] uppercase"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Penny's Insight
              </div>
            </div>
            <div
              className="text-lg md:text-xl font-medium text-card-foreground"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {scenario === "salary" &&
                currentVal < 0 &&
                `A ${Math.abs(currentVal)}% pay cut means your timeline may stretch unless you rebalance goal priorities.`}
              {scenario === "salary" &&
                currentVal >= 0 &&
                `A ${currentVal}% raise can be redirected to P1 goals to accelerate your plan.`}
              {scenario === "property" &&
                "Large property commitments can still work if you protect emergency runway and keep lump-sum reserves."}
              {scenario === "education" &&
                "Education can be high ROI. Shorten timeline pressure by using phased goal targets and periodic lumpsums."}
              {scenario === "family" &&
                "Family expenses are manageable when your first-priority goals remain funded and strategy is reviewed monthly."}
            </div>
            {notice && (
              <div
                className="mt-3 text-sm"
                style={{ color: "var(--secondary)" }}
              >
                {notice}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
