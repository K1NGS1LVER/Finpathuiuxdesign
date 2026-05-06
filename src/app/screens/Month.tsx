import { Check, Circle, AlertTriangle, Wallet, Target } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useFinPathStore } from "@/lib/store";

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
        suffix: "toward debt",
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
          suffix: `to ${goal.name} savings`,
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
  const prevInitialTasksRef = useRef(initialTasks);

  useEffect(() => {
    const prevInitial = prevInitialTasksRef.current;
    prevInitialTasksRef.current = initialTasks;

    setTasks((prev) => {
      // If task structure completely changed, adopt new tasks
      if (
        prev.length !== initialTasks.length ||
        !prev.every((pt, i) => pt.id === initialTasks[i].id)
      ) {
        return initialTasks;
      }

      // Otherwise synchronize done state, and update amount if the backend generated amount changed
      return prev.map((pt, i) => {
        const backendAmountChanged =
          prevInitial[i]?.amount !== initialTasks[i].amount;
        return {
          ...initialTasks[i],
          done: pt.done,
          amount: backendAmountChanged ? initialTasks[i].amount : pt.amount,
        };
      });
    });
  }, [initialTasks]);

  const updateTaskAmount = (id: string, newAmount: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, amount: newAmount } : t)),
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
  const goalSavingsTarget = tasks
    .filter((t) => t.isGoal && t.amount !== undefined)
    .reduce((sum, t) => {
      const g = activeGoals.find((g) => g.id === t.goalId);
      if (g && g.category !== "debt") {
        return sum + Math.max(0, t.amount || 0);
      }
      return sum;
    }, 0);
  const savingsTarget = Math.max(0, goalSavingsTarget + reservedSurplus);

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
            <div className="font-semibold mb-1">
              Debt payments exceed your surplus
            </div>
            <span>
              Your monthly debt/EMI of ₹
              {debts.totalMonthly.toLocaleString("en-IN")} is more than your
              surplus of ₹
              {Math.max(0, income.total - expenses.total).toLocaleString(
                "en-IN",
              )}
              . Consider negotiating lower payments or consolidating debt.
            </span>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden z-10 bento-card border-2 border-[var(--tertiary-accent)]" style={{ boxShadow: '0 0 40px var(--tertiary-accent-glow)' }}>
        <div className="penny-insight-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] bg-[var(--tertiary-accent)] opacity-20 dark:opacity-40 dark:mix-blend-screen blur-[100px] md:blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 justify-between">
          <div className="flex-1">
            <div
              className="text-xs md:text-sm font-semibold tracking-wider mb-2 text-[var(--tertiary-accent-text)] uppercase"
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

          <div className="flex flex-col justify-center items-center text-center min-w-[140px] border-t md:border-t-0 md:border-l border-[var(--border)] pt-6 md:pt-0 md:pl-8 gap-6">
            <div className="w-full">
              <div className="text-xs font-medium mb-1 text-[var(--secondary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-body)" }}>
                Days Remaining
              </div>
              <div
                className="text-3xl font-bold slashed-zero text-[var(--card-foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {new Date(
                  new Date().getFullYear(),
                  new Date().getMonth() + 1,
                  0,
                ).getDate() - new Date().getDate()}
              </div>
            </div>
            
            <hr className="w-full border-t border-[var(--border)] opacity-50" />
            
            <div className="w-full">
              <div className="text-xs font-medium mb-1 text-[var(--secondary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-body)" }}>
                On Track
              </div>
              <div
                  className="text-3xl font-bold slashed-zero text-[var(--tertiary-accent-text)]"
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
                    backgroundColor: task.done
                      ? "var(--accent)"
                      : "transparent",
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
                        ...(task.done
                          ? { textDecoration: "line-through" }
                          : {}),
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
          <div>
            <h3
              className="text-xl lg:text-2xl font-bold mb-1 slashed-zero text-[var(--card-foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              This Month's Impact
            </h3>
            <p
              className="text-sm text-[var(--secondary)] mb-6"
              style={{ fontFamily: "var(--font-body)" }}
            >
              See how your monthly plan accelerates your targets.
            </p>
          </div>
          <div className="space-y-5">
            {(() => {
              const impactGoals = activeGoals
                .filter(
                  (g) => (g.monthlyAllocation || 0) > 0 || g.checkedThisMonth,
                )
                .slice(0, 4);

              if (impactGoals.length === 0) {
                return (
                  <div
                    className="text-center p-6 rounded-xl border border-dashed border-[var(--border)] text-[var(--secondary)] text-sm"
                    style={{ background: "var(--surface-tint)" }}
                  >
                    No goals are receiving funds this month. Try adding a
                    lumpsum!
                  </div>
                );
              }

              return impactGoals.map((goal) => {
                const task = tasks.find((t) => t.goalId === goal.id);
                const isDone = task ? task.done : !!goal.checkedThisMonth;
                const addition = isDone
                  ? 0
                  : task?.amount !== undefined
                    ? task.amount
                    : goal.monthlyAllocation || 0;
                const safeTarget = Math.max(1, goal.targetAmount);
                const basePct = Math.min(
                  100,
                  (goal.currentAmount / safeTarget) * 100,
                );
                const additionPct = Math.min(
                  100 - basePct,
                  (addition / safeTarget) * 100,
                );

                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--card-foreground)] flex items-center gap-2 text-sm">
                        {goal.name}{" "}
                        {isDone && (
                          <Check size={14} style={{ color: "var(--accent)" }} />
                        )}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: isDone
                            ? "var(--accent)"
                            : "var(--card-foreground)",
                        }}
                      >
                        {isDone
                          ? goal.category === "debt"
                            ? "Paid!"
                            : "Funded!"
                          : `+₹${(addition / 1000).toFixed(1)}K`}
                      </span>
                    </div>

                    <div
                      className="h-3 rounded-full overflow-hidden flex relative"
                      style={{
                        background: "var(--progress-inactive)",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${basePct}%`,
                          backgroundColor: goal.color || "var(--accent)",
                        }}
                      />
                      {!isDone && additionPct > 0 && (
                        <div
                          className="h-full transition-all duration-1000 animate-pulse relative overflow-hidden"
                          style={{
                            width: `${additionPct}%`,
                            backgroundColor: goal.color || "var(--accent)",
                            opacity: 0.6,
                          }}
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.15) 10px, rgba(255,255,255,0.15) 20px)",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between mt-1.5 text-[10px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                      <span>₹{(goal.currentAmount / 1000).toFixed(1)}K</span>
                      <span>{Math.round(basePct + additionPct)}%</span>
                      <span>₹{(goal.targetAmount / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Investment Strategy + Lumpsum — two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
        <div className="bento-card p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3
              className="text-xl font-bold text-[var(--card-foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Investment Strategy
            </h3>
            <button
              onClick={() =>
                setStrategy(strategy === "avalanche" ? "snowball" : "avalanche")
              }
              className="relative flex items-center h-9 px-1 rounded-full transition-all cursor-pointer select-none"
              style={{
                width: "10.5rem",
                background:
                  strategy === "avalanche"
                    ? "var(--tertiary-accent)"
                    : "var(--accent)",
                border: "none",
              }}
              aria-label={`Strategy: ${strategy}`}
            >
              <span
                className="absolute top-0.5 h-8 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: "calc(50% - 0.25rem)",
                  left:
                    strategy === "avalanche" ? "0.25rem" : "calc(50% + 0rem)",
                  background: "var(--card)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                }}
              />
              <span
                className="relative z-10 flex-1 text-center text-xs font-semibold transition-colors duration-200"
                style={{
                  fontFamily: "var(--font-body)",
                  color:
                    strategy === "avalanche"
                      ? "var(--on-tertiary-accent)"
                      : "var(--on-accent)",
                }}
              >
                Avalanche
              </span>
              <span
                className="relative z-10 flex-1 text-center text-xs font-semibold transition-colors duration-200"
                style={{
                  fontFamily: "var(--font-body)",
                  color:
                    strategy === "snowball"
                      ? "var(--on-tertiary-accent)"
                      : "var(--on-tertiary-accent)",
                }}
              >
                Snowball
              </span>
            </button>
          </div>

          <div
            className="text-sm p-4 rounded-xl"
            style={{
              background: "var(--surface-tint)",
              border: "1px solid var(--border)",
              color: "var(--secondary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {strategy === "avalanche" ? (
              <p className="leading-relaxed">
                <strong className="text-[var(--card-foreground)]">
                  Avalanche
                </strong>{" "}
                allocates funds by goal priority — highest priority goals get
                funded first.{" "}
                {(() => {
                  const p1 = activeGoals.find((g) => g.priority === 1);
                  return p1 ? (
                    <span>
                      Your{" "}
                      <strong className="text-[var(--card-foreground)]">
                        P1: {p1.name}
                      </strong>{" "}
                      receives{" "}
                      <strong className="text-[var(--card-foreground)]">
                        ₹{(p1.monthlyAllocation || 0).toLocaleString("en-IN")}
                        /mo
                      </strong>
                      .
                    </span>
                  ) : null;
                })()}
              </p>
            ) : (
              <p className="leading-relaxed">
                <strong className="text-[var(--card-foreground)]">
                  Snowball
                </strong>{" "}
                tackles the smallest remaining goal first for a quick win, then
                rolls freed-up money into the next.{" "}
                {(() => {
                  const smallest = [...activeGoals].sort(
                    (a, b) =>
                      a.targetAmount -
                      a.currentAmount -
                      (b.targetAmount - b.currentAmount),
                  )[0];
                  return smallest ? (
                    <span>
                      Currently focused on{" "}
                      <strong className="text-[var(--card-foreground)]">
                        {smallest.name}
                      </strong>{" "}
                      with{" "}
                      <strong className="text-[var(--card-foreground)]">
                        ₹
                        {(smallest.monthlyAllocation || 0).toLocaleString(
                          "en-IN",
                        )}
                        /mo
                      </strong>
                      .
                    </span>
                  ) : null;
                })()}
              </p>
            )}
          </div>

          {/* Warning when strategy has no effect */}
          {(() => {
            const nonDebtGoals = activeGoals.filter(
              (g) => g.category !== "debt",
            );
            const availableForGoals = Math.max(
              0,
              surplus - reservedSurplus - pendingSurplus,
            );

            if (nonDebtGoals.length > 0 && availableForGoals <= 0) {
              return (
                <div
                  className="flex items-start gap-2 p-3 mt-2 rounded-xl text-xs"
                  style={{
                    background: "var(--amber-subtle)",
                    color: "var(--amber-text)",
                    border: "1px solid var(--amber)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <Target size={16} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Note:</strong> You currently have no available
                    monthly surplus to distribute. The strategy engine needs
                    extra funds to work, so switching plans won't change your
                    Action Checklist amounts right now.
                  </span>
                </div>
              );
            }

            if (nonDebtGoals.length === 1 && availableForGoals > 0) {
              return (
                <div
                  className="flex items-start gap-2 p-3 mt-2 rounded-xl text-xs"
                  style={{
                    background: "var(--amber-subtle)",
                    color: "var(--amber-text)",
                    border: "1px solid var(--amber)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <Target size={16} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Note:</strong> You only have one active goal right
                    now. Avalanche and Snowball strategies prioritize between{" "}
                    <em>multiple</em> goals, so switching plans won't change
                    your allocations. Add another goal to see it in action!
                  </span>
                </div>
              );
            }

            return null;
          })()}
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
    </div>
  );
}
