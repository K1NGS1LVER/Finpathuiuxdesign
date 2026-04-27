import { useState, useMemo, useEffect } from "react";
import { TrendingUp, Home, GraduationCap, Baby, Sparkles } from "lucide-react";
import { useFinPathStore } from "../../lib/store";
import { generatePlan as buildPlan } from "../../lib/plan-engine";

const SCENARIO_OPTIONS = [
  {
    id: "salary",
    label: "Salary Change",
    icon: TrendingUp,
    color: "var(--lime)",
  },
  { id: "property", label: "Buy Property", icon: Home, color: "var(--violet)" },
  {
    id: "education",
    label: "Higher Education",
    icon: GraduationCap,
    color: "var(--blue)",
  },
  { id: "family", label: "Start Family", icon: Baby, color: "var(--amber)" },
] as const;

type ScenarioId = (typeof SCENARIO_OPTIONS)[number]["id"];

export default function Scenarios() {
  const income = useFinPathStore((s) => s.income);
  const expenses = useFinPathStore((s) => s.expenses);
  const debts = useFinPathStore((s) => s.debts);
  const goals = useFinPathStore((s) => s.goals);
  const savings = useFinPathStore((s) => s.savings);
  const investments = useFinPathStore((s) => s.investments);
  const strategy = useFinPathStore((s) => s.strategy);
  const monthlySurplusReserve = useFinPathStore((s) => s.monthlySurplusReserve);
  const pendingGoalDecisions = useFinPathStore((s) => s.pendingGoalDecisions);
  const plan = useFinPathStore((s) => s.plan);
  const setStrategy = useFinPathStore((s) => s.setStrategy);
  const updateSettings = useFinPathStore((s) => s.updateSettings);
  const addLumpsum = useFinPathStore((s) => s.addLumpsum);

  const [scenario, setScenario] = useState<ScenarioId>("salary");

  // Independent values for each scenario allowing accurate ranges and negative values.
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

  // Dynamic impact calculation from real store data.
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

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 relative">
      <div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ backgroundColor: "var(--violet)" }}
      />
      <div className="relative z-10">
        <h1
          className="text-2xl md:text-3xl font-bold mb-2 text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Scenario Explorer
        </h1>
        <p
          className="text-sm md:text-base text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Edit assumptions and see every page update in sync
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {SCENARIO_OPTIONS.map((s) => {
          const Icon = s.icon;
          const active = scenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={`p-3 md:p-5 rounded-xl text-left transition-all hover:scale-105 ${!active ? "bento-card" : ""}`}
              style={{
                backgroundColor: active ? `${s.color}20` : undefined,
                border: `2px solid ${active ? s.color : "var(--border)"}`,
                color: active ? "var(--foreground)" : "var(--card-foreground)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${s.color}20`, color: s.color }}
              >
                <Icon size={24} />
              </div>
              <div
                className="font-bold text-xs md:text-base"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {s.label}
              </div>
            </button>
          );
        })}
      </div>

      <div className="bento-card p-4 md:p-8 relative z-10">
        <h3
          className="font-bold mb-6 text-[var(--card-foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Adjust Parameters
        </h3>
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium text-[var(--card-foreground)]">
              {scenario === "salary" && "Salary Change"}
              {scenario === "property" && "Property Value"}
              {scenario === "education" && "Course Fee"}
              {scenario === "family" && "Monthly Child Expenses"}
            </span>
            <span
              className="text-2xl font-bold slashed-zero"
              style={{
                fontFamily: "var(--font-display)",
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
      </div>

      <div className="bento-card p-6 md:p-8 space-y-4 relative z-10">
        <h3
          className="text-xl font-bold text-[var(--card-foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Live Global Controls
        </h3>

        <div>
          <div className="text-xs uppercase tracking-wider mb-2 text-[var(--secondary)]">
            Strategy
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStrategy("avalanche")}
              className="py-3 rounded-xl font-semibold transition-all"
              style={{
                background:
                  strategy === "avalanche"
                    ? "rgba(176, 255, 9, 0.12)"
                    : "var(--surface-tint)",
                border: `1px solid ${strategy === "avalanche" ? "var(--lime)" : "var(--border)"}`,
                color: "var(--card-foreground)",
              }}
            >
              Avalanche
            </button>
            <button
              onClick={() => setStrategy("snowball")}
              className="py-3 rounded-xl font-semibold transition-all"
              style={{
                background:
                  strategy === "snowball"
                    ? "rgba(73, 91, 255, 0.12)"
                    : "var(--surface-tint)",
                border: `1px solid ${strategy === "snowball" ? "var(--blue)" : "var(--border)"}`,
                color: "var(--card-foreground)",
              }}
            >
              Snowball
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-[var(--secondary)]">
              Set Monthly Salary
            </label>
            <input
              type="text"
              value={salaryInput}
              onChange={(e) =>
                setSalaryInput(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="w-full px-3 py-2 rounded-xl outline-none text-[var(--card-foreground)]"
              style={{
                background: "var(--surface-tint)",
                border: "1px solid var(--border)",
              }}
            />
            <button
              onClick={applySalary}
              className="w-full py-2 rounded-lg font-semibold"
              style={{ background: "var(--lime)", color: "#050F1C" }}
            >
              Apply Salary
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[var(--secondary)]">
              Apply Salary Hike %
            </label>
            <input
              type="text"
              value={salaryHikeInput}
              onChange={(e) =>
                setSalaryHikeInput(e.target.value.replace(/[^0-9-]/g, ""))
              }
              placeholder="e.g. 12 or -5"
              className="w-full px-3 py-2 rounded-xl outline-none text-[var(--card-foreground)]"
              style={{
                background: "var(--surface-tint)",
                border: "1px solid var(--border)",
              }}
            />
            <button
              onClick={applySalaryHike}
              className="w-full py-2 rounded-lg font-semibold"
              style={{ background: "var(--blue)", color: "#fff" }}
            >
              Apply Hike
            </button>
          </div>
        </div>
      </div>

      <div className="bento-card p-6 md:p-8 relative z-10">
        <h3
          className="text-xl font-bold mb-4 text-[var(--card-foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Lumpsum Course Simulator
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={simGoalId}
            onChange={(e) => setSimGoalId(e.target.value)}
            className="px-3 py-2 rounded-lg outline-none text-[var(--card-foreground)]"
            style={{
              background: "var(--surface-tint)",
              border: "1px solid var(--border)",
            }}
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
            className="px-3 py-2 rounded-lg outline-none text-[var(--card-foreground)]"
            style={{
              background: "var(--surface-tint)",
              border: "1px solid var(--border)",
            }}
          />
          <button
            onClick={applyScenarioLumpsum}
            disabled={!simGoalId || simLumpsumValue <= 0}
            className="py-2 rounded-lg font-semibold disabled:opacity-50"
            style={{ background: "var(--lime)", color: "#050F1C" }}
          >
            Apply Lumpsum
          </button>
        </div>

        <div
          className="mt-4 p-4 rounded-xl"
          style={{
            background: "var(--surface-tint)",
            border: "1px solid var(--border)",
          }}
        >
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

      <div className="relative z-10">
        <h3
          className="font-bold mb-4 text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Impact Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {impacts.map((impact, i) => (
            <div key={i} className="p-6 bento-card">
              <div
                className="text-sm mb-4 font-medium text-[var(--secondary)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {impact.label}
              </div>
              <div className="flex items-end justify-between mb-4 gap-4">
                <div className="flex-1">
                  <div
                    className="text-xs mb-1 text-[var(--secondary)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Current
                  </div>
                  <div
                    className="text-xl font-bold slashed-zero text-[var(--card-foreground)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {impact.current}
                  </div>
                </div>
                <div className="text-3xl opacity-20 px-2 text-[var(--card-foreground)]">
                  →
                </div>
                <div className="text-right flex-1">
                  <div
                    className="text-xs mb-1 text-[var(--secondary)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    After
                  </div>
                  <div
                    className="text-xl font-bold slashed-zero"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: current?.color,
                    }}
                  >
                    {impact.future}
                  </div>
                </div>
              </div>
              <div
                className="text-sm font-bold text-center py-2 rounded-lg slashed-zero"
                style={{
                  backgroundColor: impact.positive
                    ? "var(--lime)"
                    : "var(--red)",
                  color: "#050F1C",
                  fontFamily: "var(--font-body)",
                }}
              >
                {impact.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="p-6 md:p-8 rounded-2xl flex items-start gap-4 relative overflow-hidden z-10 bento-card border border-[var(--violet)]"
        style={{
          background: "var(--surface-tint)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[450px] md:h-[450px] bg-[var(--violet)] opacity-30 mix-blend-screen blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <Sparkles size={28} className="text-[var(--violet-text)]" />
        </div>
        <div className="relative z-10 text-[var(--card-foreground)]">
          <div
            className="text-sm font-semibold tracking-wider mb-1 text-[var(--violet-text)] uppercase"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Penny's Insight
          </div>
          <div
            className="text-lg md:text-xl font-medium"
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
            <div className="mt-3 text-sm" style={{ color: "var(--secondary)" }}>
              {notice}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
