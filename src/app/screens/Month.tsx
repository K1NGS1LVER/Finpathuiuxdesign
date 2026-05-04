import { Check, Circle, AlertTriangle, Wallet } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useFinPathStore } from '@/lib/store';

interface MonthTask {
  id: string;
  text: string;
  done: boolean;
  isGoal: boolean;
  goalId?: string;
  amount?: number;
  prefix?: string;
  suffix?: string;
}

export default function Month() {
  const income = useFinPathStore((s) => s.income);
  const expenses = useFinPathStore((s) => s.expenses);
  const debts = useFinPathStore((s) => s.debts);
  const goals = useFinPathStore((s) => s.goals);
  const plan = useFinPathStore((s) => s.plan);
  const strategy = useFinPathStore((s) => s.strategy);
  const setStrategy = useFinPathStore((s) => s.setStrategy);
  const updateGoal = useFinPathStore((s) => s.updateGoal);
  const addLumpsum = useFinPathStore((s) => s.addLumpsum);
  const monthlySurplusReserve = useFinPathStore((s) => s.monthlySurplusReserve);

  const activeGoals = useMemo(
    () =>
      goals
        .filter((goal) => goal.status !== "complete")
        .slice()
        .sort((a, b) => a.priority - b.priority),
    [goals],
  );

  const [lumpsumGoalId, setLumpsumGoalId] = useState("");
  const [lumpsumAmount, setLumpsumAmount] = useState("");
  const [lumpsumNotice, setLumpsumNotice] = useState("");
  const debtGoal = activeGoals.find((goal) => goal.category === "debt");

  // Generate tasks from real goals
  const initialTasks = useMemo<MonthTask[]>(() => {
    const taskList: MonthTask[] = [];

    if (expenses.rent > 0) {
      taskList.push({
        id: `rent`,
        text: `Pay rent ₹${expenses.rent.toLocaleString("en-IN")} by 5th`,
        done: false,
        isGoal: false,
      });
    }

    if (debts.totalMonthly > 0 && debtGoal) {
      taskList.push({
        id: "debt-payment",
        text: `Pay INR ${debts.totalMonthly.toLocaleString("en-IN")} toward debt`,
        done: !!debtGoal.checkedThisMonth,
        isGoal: true,
        goalId: debtGoal.id,
        amount: debts.totalMonthly,
        prefix: "Pay ₹",
        suffix: "toward debt"
      });
    }

    for (const goal of activeGoals
      .filter((g) => g.category !== "debt")
      .slice(0, 2)) {
      const monthly =
        goal.monthlyAllocation ||
        Math.round(
          (goal.targetAmount - goal.currentAmount) /
            Math.max(1, goal.timelineMonths),
        );
      if (monthly > 0) {
        taskList.push({
          id: goal.id,
          text: `Add ₹${(monthly / 1000).toFixed(0)}K to ${goal.name} savings`,
          done: !!goal.checkedThisMonth,
          isGoal: true,
          goalId: goal.id,
          amount: monthly,
          prefix: "Add ₹",
          suffix: `to ${goal.name} savings`
        });
      }
    }

    taskList.push({
      id: "review",
      text: "Review subscription services",
      done: false,
      isGoal: false,
    });
    taskList.push({
      id: "track",
      text: "Track all expenses this week",
      done: false,
      isGoal: false,
    });

    return taskList;
  }, [expenses, activeGoals, debts.totalMonthly, debtGoal]);

  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    setTasks((prev) => {
      // If task structure completely changed, adopt new tasks
      if (prev.length !== initialTasks.length || !prev.every((pt, i) => pt.id === initialTasks[i].id)) {
        return initialTasks;
      }
      // Otherwise synchronize done state but keep user's unsubmitted custom amounts
      return prev.map((pt, i) => ({
        ...initialTasks[i],
        amount: pt.amount,
      }));
    });
  }, [initialTasks]);

  const updateTaskAmount = (id: string, newAmount: number) => {
    setTasks((prev) => 
      prev.map((t) => (t.id === id ? { ...t, amount: newAmount } : t))
    );
  };

  useEffect(() => {
    if (!lumpsumGoalId && activeGoals.length > 0) {
      setLumpsumGoalId(activeGoals[0].id);
    }
    if (activeGoals.length === 0) {
      setLumpsumGoalId("");
    }
  }, [activeGoals, lumpsumGoalId]);

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    if (task.isGoal && task.goalId && task.amount !== undefined) {
      const goal = goals.find((g) => g.id === task.goalId);
      if (goal) {
        const newDoneState = !task.done;
        let newAmount = goal.currentAmount;

        if (newDoneState) {
          newAmount = Math.min(
            goal.targetAmount,
            goal.currentAmount + task.amount,
          );
        } else {
          newAmount = Math.max(0, goal.currentAmount - task.amount);
        }

        updateGoal(goal.id, {
          currentAmount: newAmount,
          checkedThisMonth: newDoneState,
          status:
            newAmount >= goal.targetAmount
              ? "complete"
              : newAmount > 0
                ? "in-progress"
                : "not-started",
        });
      }
    }

    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const applyLumpsum = () => {
    const amount = parseInt(lumpsumAmount, 10) || 0;
    if (!lumpsumGoalId || amount <= 0) return;

    const goal = goals.find((g) => g.id === lumpsumGoalId);
    addLumpsum(lumpsumGoalId, amount);
    setLumpsumAmount("");
    setLumpsumNotice(
      goal
        ? `Added ₹${amount.toLocaleString("en-IN")} to ${goal.name}`
        : "Lumpsum applied",
    );
  };

  const surplus = income.total - expenses.total - debts.totalMonthly;
  const reservedSurplus = plan?.months?.[0]?.reservedSurplus || 0;
  const pendingSurplus = plan?.months?.[0]?.pendingSurplus || 0;
  const goalSavingsTarget = activeGoals
    .filter((goal) => goal.category !== "debt")
    .reduce(
    (sum, goal) => sum + Math.max(0, goal.monthlyAllocation || 0),
    0,
    );
  const savingsTarget = Math.max(0, goalSavingsTarget + reservedSurplus);
  const wantsTarget = Math.round(expenses.entertainment + expenses.other);

  const budget = [
    {
      category: "Essentials",
      planned: Math.round(
        expenses.rent + expenses.food + expenses.transport + expenses.utilities,
      ),
      actual: Math.round(
        (expenses.rent +
          expenses.food +
          expenses.transport +
          expenses.utilities) *
          0.95,
      ),
      color: "var(--blue)",
    },
    {
      category: "Savings",
      planned: goalSavingsTarget,
      actual: goalSavingsTarget,
      color: "var(--accent)",
    },
    ...(reservedSurplus > 0 ? [{
      category: "Surplus Reserve",
      planned: reservedSurplus,
      actual: reservedSurplus,
      color: "var(--tertiary-accent)",
    }] : []),
    {
      category: "Wants",
      planned: wantsTarget,
      actual: Math.round(wantsTarget * 1.1),
      color: "var(--blue)",
    },
    {
      category: "Debt",
      planned: debts.totalMonthly,
      actual: debts.totalMonthly,
      color: "var(--red)",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 relative">
      <div
        className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ backgroundColor: "var(--accent)" }}
      />
      <div className="relative z-10">
        <h1
          className="text-2xl md:text-3xl font-bold mb-2 text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {new Date().toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}{" "}
          Plan
        </h1>
        <p
          className="text-sm md:text-base text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Your mission this month
        </p>
      </div>

      {/* Debt over income warning */}
      {debts.totalMonthly > surplus && surplus >= 0 && (
        <div
          className="flex items-start gap-2 p-4 rounded-xl text-xs md:text-sm relative z-10"
          style={{
            background: "var(--red-subtle)",
            color: "var(--red-text)",
            border: "1px solid var(--red)",
            fontFamily: "var(--font-body)",
          }}
        >
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Debt payments exceed your surplus</div>
            <span>Your monthly debt/EMI of ₹{debts.totalMonthly.toLocaleString("en-IN")} is more than your surplus of ₹{Math.max(0, income.total - expenses.total).toLocaleString("en-IN")}. Consider negotiating lower payments or consolidating debt.</span>
          </div>
        </div>
      )}

      {/* Surplus Reserve callout */}
      {monthlySurplusReserve > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl text-xs md:text-sm relative z-10"
          style={{
            background: "var(--surface-tint)",
            border: "1px solid var(--border)",
            color: "var(--secondary)",
            fontFamily: "var(--font-body)",
          }}
        >
          <Wallet size={16} style={{ color: "var(--accent)" }} className="flex-shrink-0" />
          <span>₹{monthlySurplusReserve.toLocaleString("en-IN")}/mo is reserved as your surplus — not allocated to any goal.</span>
        </div>
      )}

      <div
        className="p-6 md:p-8 relative overflow-hidden z-10 bento-card border border-[var(--accent)]"
        style={{
          background: "var(--surface-tint)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        }}
      >
        {/* Centered Prominent Lime Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-[var(--accent)] opacity-20 dark:opacity-40 dark:mix-blend-screen blur-[80px] md:blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div
            className="text-xs md:text-sm font-semibold tracking-wider mb-2 text-[var(--accent-text)] uppercase"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Mission
          </div>
          <h2
            className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 slashed-zero text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Save ₹{Math.round(savingsTarget / 1000)}K
            {debts.totalMonthly > 0
              ? ` & pay ₹${Math.round(debts.totalMonthly / 1000)}K debt`
              : ""}
          </h2>
          <div className="flex items-center gap-6 md:gap-8">
            <div>
              <div
                className="text-xs md:text-sm font-medium mb-1 text-[var(--secondary)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Goals + Surplus Reserve
              </div>
              <div
                className="text-xl md:text-3xl font-bold slashed-zero text-[var(--card-foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ₹{savingsTarget.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div
                className="text-xs md:text-sm font-medium mb-1 text-[var(--secondary)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Debt Payments
              </div>
              <div
                className="text-xl md:text-3xl font-bold slashed-zero text-[var(--card-foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ₹{debts.totalMonthly.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
          {pendingSurplus > 0 && (
            <div
              className="mt-4 text-xs md:text-sm"
              style={{
                color: "var(--secondary)",
                fontFamily: "var(--font-body)",
              }}
            >
              ₹{pendingSurplus.toLocaleString("en-IN")} is waiting for your
              reinvest/surplus decision.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
        <div className="bento-card p-6 md:p-8">
          <h3
            className="text-xl font-bold mb-4 text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Investment Strategy
          </h3>
          <p
            className="text-sm mb-4 text-[var(--secondary)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Switch between avalanche and snowball any month. Changes apply
            across all pages.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStrategy("avalanche")}
              className="py-3 px-4 rounded-xl font-semibold transition-all"
              style={{
                background:
                  strategy === "avalanche"
                    ? "rgba(232, 52, 28, )"
                    : "var(--surface-tint)",
                border: `1px solid ${strategy === "avalanche" ? "var(--accent)" : "var(--border)"}`,
                boxShadow:
                  strategy === "avalanche"
                    ? "0 0 20px rgba(232, 52, 28, )"
                    : "none",
                color: "var(--card-foreground)",
              }}
            >
              Avalanche
            </button>
            <button
              onClick={() => setStrategy("snowball")}
              className="py-3 px-4 rounded-xl font-semibold transition-all"
              style={{
                background:
                  strategy === "snowball"
                    ? "rgba(73, 91, 255, 0.12)"
                    : "var(--surface-tint)",
                border: `1px solid ${strategy === "snowball" ? "var(--blue)" : "var(--border)"}`,
                boxShadow:
                  strategy === "snowball"
                    ? "0 0 20px rgba(73, 91, 255, 0.2)"
                    : "none",
                color: "var(--card-foreground)",
              }}
            >
              Snowball
            </button>
          </div>
        </div>

        <div className="bento-card p-6 md:p-8">
          <h3
            className="text-xl font-bold mb-4 text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Lumpsum Fast-Track
          </h3>
          <p
            className="text-sm mb-4 text-[var(--secondary)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Add a one-time amount to accelerate a goal.
          </p>
          <div className="space-y-3">
            <select
              value={lumpsumGoalId}
              onChange={(e) => setLumpsumGoalId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none text-[var(--card-foreground)]"
              style={{
                background: "var(--surface-tint)",
                border: "1px solid var(--border)",
              }}
              disabled={activeGoals.length === 0}
            >
              {activeGoals.length === 0 ? (
                <option value="">No active goals available</option>
              ) : (
                activeGoals.map((goal) => (
                  <option
                    key={goal.id}
                    value={goal.id}
                  >{`P${goal.priority} - ${goal.name}`}</option>
                ))
              )}
            </select>
            <input
              type="text"
              value={lumpsumAmount}
              onChange={(e) =>
                setLumpsumAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="Lumpsum amount (₹)"
              className="w-full px-4 py-3 rounded-xl outline-none text-[var(--card-foreground)]"
              style={{
                background: "var(--surface-tint)",
                border: "1px solid var(--border)",
              }}
            />
            <button
              onClick={applyLumpsum}
              disabled={!lumpsumGoalId || !lumpsumAmount}
              className="w-full py-3 rounded-xl font-bold transition-all disabled:opacity-50"
              style={{
                background: "var(--accent)",
                color: "var(--on-accent)",
                fontFamily: "var(--font-body)",
              }}
            >
              Apply Lumpsum
            </button>
            {lumpsumNotice && (
              <div
                className="text-xs rounded-lg px-3 py-2"
                style={{
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                  color: "var(--secondary)",
                }}
              >
                {lumpsumNotice}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
        <div className="bento-card p-6 md:p-8 flex flex-col h-full">
          <h3
            className="text-xl lg:text-2xl font-bold mb-4 slashed-zero text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Action Checklist
          </h3>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all focus-within:bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)]"
              >
                <div
                  onClick={() => toggleTask(task.id)}
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
                  style={{
                    backgroundColor: task.done ? "var(--accent)" : "transparent",
                    border: task.done ? "none" : "2px solid var(--border)",
                    color: task.done ? "var(--on-accent)" : "var(--secondary)",
                  }}
                >
                  {task.done ? <Check size={14} /> : <Circle size={14} />}
                </div>

                {task.isGoal && task.amount !== undefined ? (
                  <div
                    className={`flex-1 flex flex-wrap items-center gap-1.5 text-[var(--card-foreground)] ${task.done ? "opacity-50" : ""}`}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <span
                      onClick={() => toggleTask(task.id)}
                      className={`cursor-pointer ${task.done ? "line-through" : ""}`}
                    >
                      {task.prefix}
                    </span>
                    <input
                      type="number"
                      value={task.amount === 0 ? "" : task.amount}
                      onChange={(e) =>
                        updateTaskAmount(task.id, parseInt(e.target.value) || 0)
                      }
                      disabled={task.done}
                      className="w-24 text-center px-2 py-0.5 rounded-md outline-none focus:ring-2 focus:ring-[var(--accent)] font-semibold transition-all"
                      style={{
                        background: "var(--surface-tint)",
                        border: "1px solid var(--border)",
                        ...task.done ? { textDecoration: 'line-through' } : {}
                      }}
                    />
                    <span
                      onClick={() => toggleTask(task.id)}
                      className={`cursor-pointer ${task.done ? "line-through" : ""}`}
                    >
                      {task.suffix}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`text-left flex-1 text-[var(--card-foreground)] ${task.done ? "line-through opacity-50" : ""}`}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {task.text}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div
            className="mt-6 p-3 rounded-xl text-sm text-center"
            style={{
              color: "var(--secondary)",
              fontFamily: "var(--font-body)",
              background: "var(--surface-tint)",
            }}
          >
            {tasks.filter((t) => t.done).length} of {tasks.length} completed
          </div>
        </div>

        <div className="bento-card p-6 md:p-8 flex flex-col h-full">
          <h3
            className="text-xl lg:text-2xl font-bold mb-4 slashed-zero text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Budget Tracker
          </h3>
          <div className="space-y-4">
            {budget.map((item) => {
              const overBudget = item.actual > item.planned;
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[var(--card-foreground)]">
                      {item.category}
                    </span>
                    <span className="text-sm text-[var(--card-foreground)]">
                      ₹{item.actual.toLocaleString()} / ₹
                      {item.planned.toLocaleString()}
                    </span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--progress-inactive)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${
                          item.planned > 0
                            ? Math.min((item.actual / item.planned) * 100, 100)
                            : 0
                        }%`,
                        backgroundColor: overBudget ? "var(--red)" : item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">
        <div className="bento-card p-6 flex flex-col justify-center items-center text-center">
          <div className="text-sm font-medium mb-2 text-[var(--secondary)]">
            Days Remaining
          </div>
          <div
            className="text-4xl font-bold slashed-zero text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              0,
            ).getDate() - new Date().getDate()}
          </div>
        </div>
        <div className="bento-card p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--accent)] opacity-5 pointer-events-none" />
          <div className="text-sm font-medium mb-2 text-[var(--secondary)] relative z-10">
            Savings This Month
          </div>
          <div
            className="text-4xl font-bold slashed-zero text-[var(--accent-text)] relative z-10"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ₹{Math.round(savingsTarget / 1000)}K
          </div>
        </div>
        <div className="bento-card p-6 flex flex-col justify-center items-center text-center">
          <div className="text-sm font-medium mb-2 text-[var(--secondary)]">
            On Track
          </div>
          <div
            className="text-4xl font-bold slashed-zero text-[var(--accent-text)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {tasks.length > 0
              ? Math.round(
                  (tasks.filter((t) => t.done).length / tasks.length) * 100,
                )
              : 0}
            %
          </div>
        </div>
      </div>
    </div>
  );
}
