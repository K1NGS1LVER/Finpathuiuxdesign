import { Check, AlertTriangle, Target, Sparkles } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
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

const fmt = (n: number) => n.toLocaleString("en-IN");

const now = new Date();
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
const daysLeft = daysInMonth - now.getDate();
const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

export default function Month() {
  const navigate = useNavigate();
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
      if (
        prev.length !== initialTasks.length ||
        !prev.every((pt, i) => pt.id === initialTasks[i].id)
      ) {
        return initialTasks;
      }
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
          newAmount = Math.min(goal.targetAmount, goal.currentAmount + task.amount);
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
      if (g && g.category !== "debt") return sum + Math.max(0, t.amount || 0);
      return sum;
    }, 0);
  const savingsTarget = Math.max(0, goalSavingsTarget + reservedSurplus);

  const doneTasks = tasks.filter((t) => t.done).length;
  const onTrackPct =
    tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  if (!plan || !plan.months || plan.months.length === 0) {
    return (
      <div className="month-page page-animate">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 icon-accent-subtle">
            <AlertTriangle size={32} className="icon-wireframe" />
          </div>
          <h2 className="text-display mb-2">No plan generated</h2>
          <p className="impact-subtitle max-w-md mb-8">
            We couldn't find an active financial plan. Head to Journey to set
            your goals and generate your path.
          </p>
          <button onClick={() => navigate("/journey")} className="btn-primary">
            Build Your Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="month-page page-animate">
      {/* Header */}
      <div className="month-header">
        <p className="text-label">{monthLabel} · {daysLeft} days left</p>
        <h2 className="month-title">This Month's Plan</h2>
      </div>

      {/* Debt warning */}
      {debts.totalMonthly > surplus && surplus >= 0 && (
        <div className="debt-warning">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 icon-wireframe" />
          <div>
            <div className="debt-warning-title">Debt payments exceed your surplus</div>
            <span>
              Monthly debt/EMI of ₹{debts.totalMonthly.toLocaleString("en-IN")} exceeds
              your surplus of ₹{Math.max(0, income.total - expenses.total).toLocaleString("en-IN")}.
              Consider negotiating lower payments or consolidating debt.
            </span>
          </div>
        </div>
      )}

      {/* Mission card */}
      <div className="bento-card mission-card">
        <div className="mission-blob" />
        <div className="mission-content">
          <div className="mission-left">
            <div className="mission-eyebrow">Mission</div>
            <h2 className="mission-title slashed-zero">
              Save ₹{Math.round(savingsTarget / 1000)}K
              {debts.totalMonthly > 0
                ? ` & pay ₹${Math.round(debts.totalMonthly / 1000)}K debt`
                : ""}
            </h2>
            <div className="mission-stats-row">
              <div>
                <div className="mission-stat-label">Goals + Surplus Reserve</div>
                <div className="mission-stat-value slashed-zero">
                  ₹{savingsTarget.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <div className="mission-stat-label">Debt Payments</div>
                <div className="mission-stat-value slashed-zero">
                  ₹{debts.totalMonthly.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
            {pendingSurplus > 0 && (
              <div className="mission-pending-note">
                ₹{pendingSurplus.toLocaleString("en-IN")} is waiting for your
                reinvest/surplus decision.
              </div>
            )}
          </div>

          <div className="mission-right">
            <div className="w-full">
              <div className="mission-right-label">Days Remaining</div>
              <div className="mission-right-value slashed-zero">{daysLeft}</div>
            </div>
            <hr className="mission-divider" />
            <div className="w-full">
              <div className="mission-right-label">On Track</div>
              <div className="mission-right-value slashed-zero">{onTrackPct}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-col grid */}
      <div className="month-grid">
        {/* Left: Checklist */}
        <div className="bento-card" style={{ padding: "var(--space-3)" }}>
          <div className="checklist-header">
            <div>
              <p className="text-label">Allocation Checklist</p>
              <p className="checklist-count">
                {doneTasks} of {tasks.length} complete
              </p>
            </div>
            <div className="checklist-pct slashed-zero">{onTrackPct}%</div>
          </div>

          <div className="checklist-list">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`checklist-item${task.done ? " done" : ""}`}
              >
                <div
                  onClick={() => toggleTask(task.id)}
                  className={`checklist-check${task.done ? " done" : ""}`}
                >
                  {task.done && <Check size={14} className="icon-wireframe" />}
                </div>

                <div className="checklist-content">
                  {task.isGoal && task.amount !== undefined ? (
                    <div className={`checklist-inline-row${task.done ? " done" : ""}`}>
                      <span
                        onClick={() => toggleTask(task.id)}
                        className={`cursor-pointer${task.done ? " done-text" : ""}`}
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
                        className={`task-amount-input${task.done ? " done" : ""}`}
                      />
                      <span
                        onClick={() => toggleTask(task.id)}
                        className={`cursor-pointer${task.done ? " done-text" : ""}`}
                      >
                        {task.suffix}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`checklist-label${task.done ? " done" : ""}`}
                    >
                      {task.text}
                    </button>
                  )}
                  <p className="checklist-meta">
                    {task.isGoal ? "Goal contribution" : "General task"}
                  </p>
                </div>

                {task.amount !== undefined && !task.isGoal && null}
                {task.amount !== undefined && (
                  <div className="checklist-amount slashed-zero">
                    ₹{fmt(task.amount)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="checklist-footer">
            {doneTasks} of {tasks.length} completed
          </div>
        </div>

        {/* Right column */}
        <div className="month-right-col">
          {/* Impact card */}
          <div className="bento-card" style={{ padding: "var(--space-3)" }}>
            <p className="text-label">This Month's Impact</p>
            <p className="impact-subtitle">
              How your contributions move the needle.
            </p>
            <div className="impact-goals-list">
              {(() => {
                const impactGoals = activeGoals
                  .filter((g) => (g.monthlyAllocation || 0) > 0 || g.checkedThisMonth)
                  .slice(0, 4);

                if (impactGoals.length === 0) {
                  return (
                    <div className="month-impact-empty">
                      No goals receiving funds this month. Try adding a lumpsum!
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
                  const basePct = Math.min(100, (goal.currentAmount / safeTarget) * 100);
                  const additionPct = Math.min(100 - basePct, (addition / safeTarget) * 100);

                  return (
                    <div key={goal.id}>
                      <div className="impact-goal-header">
                        <span className="impact-goal-name">
                          {goal.name}
                          {isDone && <Check size={14} className="text-accent icon-wireframe" />}
                        </span>
                        <span className={`impact-goal-score${isDone ? " done" : " pending"}`}>
                          {isDone
                            ? goal.category === "debt" ? "Paid!" : "Funded!"
                            : `+₹${(addition / 1000).toFixed(1)}K`}
                        </span>
                      </div>
                      <div className="progress-bar-outer">
                        <div className="progress-fill" style={{ width: `${basePct}%` }} />
                        {!isDone && additionPct > 0 && (
                          <div
                            className="progress-fill-pending"
                            style={{ width: `${additionPct}%` }}
                          />
                        )}
                      </div>
                      <div className="progress-bar-labels">
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

          {/* Penny suggestion card */}
          <div className="bento-card penny-card">
            <div className="penny-blob" />
            <div className="penny-suggest-inner">
              <div className="penny-suggest-header">
                <Sparkles size={18} className="text-accent icon-wireframe" />
                <p className="penny-suggest-title">Penny suggests</p>
              </div>
              <p className="penny-suggest-text">
                {surplus > 5000
                  ? `You have ₹${fmt(Math.round(surplus - savingsTarget - debts.totalMonthly))} unallocated this month. Redirecting it to your top goal accelerates your plan.`
                  : debts.totalMonthly > 0
                    ? "Paying even ₹500 extra on your highest-rate debt each month compounds into significant savings over your timeline."
                    : "Consistency is the engine. Checking off all tasks this month keeps your streak alive and your goals on schedule."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy + Lumpsum */}
      <div className="month-lower-grid">
        {/* Investment Strategy */}
        <div className="bento-card" style={{ padding: "var(--space-3)" }}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="text-heading">Investment Strategy</h3>
            <button
              onClick={() =>
                setStrategy(strategy === "avalanche" ? "snowball" : "avalanche")
              }
              className="strategy-toggle"
              aria-label={`Strategy: ${strategy}`}
            >
              <span
                className={`strategy-toggle-pill ${strategy === "avalanche" ? "left" : "right"}`}
              />
              <span
                className={`strategy-toggle-label ${strategy === "avalanche" ? "active" : "inactive"}`}
              >
                Avalanche
              </span>
              <span
                className={`strategy-toggle-label ${strategy === "snowball" ? "active" : "inactive"}`}
              >
                Snowball
              </span>
            </button>
          </div>

          <div className="strategy-info-box">
            {strategy === "avalanche" ? (
              <p>
                <strong className="text-card-foreground">Avalanche</strong>{" "}
                allocates funds by goal priority — highest priority goals get
                funded first.{" "}
                {(() => {
                  const p1 = activeGoals.find((g) => g.priority === 1);
                  return p1 ? (
                    <span>
                      Your <strong className="text-card-foreground">P1: {p1.name}</strong> receives{" "}
                      <strong className="text-card-foreground">
                        ₹{(p1.monthlyAllocation || 0).toLocaleString("en-IN")}/mo
                      </strong>.
                    </span>
                  ) : null;
                })()}
              </p>
            ) : (
              <p>
                <strong className="text-card-foreground">Snowball</strong>{" "}
                tackles the smallest remaining goal first for a quick win, then
                rolls freed-up money into the next.{" "}
                {(() => {
                  const smallest = [...activeGoals].sort(
                    (a, b) =>
                      a.targetAmount - a.currentAmount - (b.targetAmount - b.currentAmount),
                  )[0];
                  return smallest ? (
                    <span>
                      Currently focused on{" "}
                      <strong className="text-card-foreground">{smallest.name}</strong> with{" "}
                      <strong className="text-card-foreground">
                        ₹{(smallest.monthlyAllocation || 0).toLocaleString("en-IN")}/mo
                      </strong>.
                    </span>
                  ) : null;
                })()}
              </p>
            )}
          </div>

          {(() => {
            const nonDebtGoals = activeGoals.filter((g) => g.category !== "debt");
            const availableForGoals = Math.max(0, surplus - reservedSurplus - pendingSurplus);

            if (nonDebtGoals.length > 0 && availableForGoals <= 0) {
              return (
                <div className="warning-banner flex items-start gap-2 mt-3">
                  <Target size={16} className="flex-shrink-0 mt-0.5 icon-wireframe" />
                  <span>
                    <strong>Note:</strong> No monthly surplus to distribute. Switching
                    strategies won't change your checklist amounts right now.
                  </span>
                </div>
              );
            }

            if (nonDebtGoals.length === 1 && availableForGoals > 0) {
              return (
                <div className="warning-banner flex items-start gap-2 mt-3">
                  <Target size={16} className="flex-shrink-0 mt-0.5 icon-wireframe" />
                  <span>
                    <strong>Note:</strong> You only have one active goal. Strategies work
                    across <em>multiple</em> goals — add another to see the difference.
                  </span>
                </div>
              );
            }

            return null;
          })()}
        </div>

        {/* Lumpsum Fast-Track */}
        <div className="bento-card" style={{ padding: "var(--space-3)" }}>
          <h3 className="text-heading mb-1">Lumpsum Fast-Track</h3>
          <p className="impact-subtitle">Add a one-time amount to accelerate a goal.</p>
          <div className="flex flex-col gap-3">
            <select
              value={lumpsumGoalId}
              onChange={(e) => setLumpsumGoalId(e.target.value)}
              className="input-surface w-full px-4 py-3 rounded-xl outline-none"
              disabled={activeGoals.length === 0}
            >
              {activeGoals.length === 0 ? (
                <option value="">No active goals available</option>
              ) : (
                activeGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {`P${goal.priority} - ${goal.name}`}
                  </option>
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
              className="input-surface w-full px-4 py-3 rounded-xl outline-none"
            />
            <button
              onClick={applyLumpsum}
              disabled={!lumpsumGoalId || !lumpsumAmount}
              className="btn-primary w-full justify-center py-3 disabled:opacity-50"
            >
              Apply Lumpsum
            </button>
            {lumpsumNotice && (
              <div className="lumpsum-notice">{lumpsumNotice}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
