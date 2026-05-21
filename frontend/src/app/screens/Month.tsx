import { Check, AlertTriangle, Target, Sparkles } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useFinPathStore } from "@/lib/store";
import { formatInr, formatInrCompact } from "@/lib/format";
import confetti from "canvas-confetti";
import { pageContainer, pageSection } from "@/app/components/motion-variants";

interface MonthTask {
  id: string;
  text: string;
  done: boolean;
  isGoal: boolean;
  goalId?: string;
  amount?: number;
  committedAmount?: number;
  prefix?: string;
  suffix?: string;
}

export default function Month() {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();
  const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

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
        text: `Pay rent ${formatInr(expenses.rent)} by 5th`,
        done: false,
        isGoal: false,
      });
    }

    if (debts.totalMonthly > 0 && debtGoal) {
      taskList.push({
        id: "debt-payment",
        text: `Pay ${formatInr(debts.totalMonthly)} toward debt`,
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
          Math.max(0, goal.targetAmount - goal.currentAmount) /
            Math.max(1, goal.timelineMonths),
        );
      if (monthly > 0) {
        taskList.push({
          id: goal.id,
          text: `Add ${formatInrCompact(monthly)} to ${goal.name} savings`,
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
        const backendDoneChanged =
          prevInitial[i]?.done !== initialTasks[i].done;
        return {
          ...initialTasks[i],
          // If store's done state changed externally (e.g. from Journey panel),
          // respect it; otherwise preserve the user's local toggle.
          done: backendDoneChanged ? initialTasks[i].done : pt.done,
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

  useEffect(() => {
    if (!lumpsumNotice) return;
    const id = setTimeout(() => setLumpsumNotice(""), 4000);
    return () => clearTimeout(id);
  }, [lumpsumNotice]);

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
          // Use the amount that was actually committed when checking, not the
          // current (possibly edited) task.amount, to avoid over/under-subtraction.
          const subtractAmount = task.committedAmount ?? task.amount;
          newAmount = Math.max(0, goal.currentAmount - subtractAmount);
        }

        const justCompleted = newAmount >= goal.targetAmount;
        updateGoal(goal.id, {
          currentAmount: newAmount,
          checkedThisMonth: newDoneState,
          status:
            justCompleted
              ? "complete"
              : newAmount > 0
                ? "in-progress"
                : "not-started",
        });

        if (newDoneState) {
          const styles = getComputedStyle(document.documentElement);
          const accent = styles.getPropertyValue("--accent").trim();
          const secondary = styles.getPropertyValue("--secondary-accent").trim();
          const lime = styles.getPropertyValue("--tertiary-accent").trim();
          const green = styles.getPropertyValue("--green").trim();
          if (justCompleted) {
            const end = Date.now() + 2000;
            const frame = () => {
              confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: [accent, secondary, accent] });
              confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: [accent, lime, green] });
              if (Date.now() < end) requestAnimationFrame(frame);
            };
            frame();
          } else {
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: [accent, secondary, lime] });
          }
        }
      }
    }

    setTasks(tasks.map((t) => {
      if (t.id !== id) return t;
      const newDone = !t.done;
      return {
        ...t,
        done: newDone,
        // Lock in the amount used at check time so uncheck subtracts the right value.
        committedAmount: newDone && t.isGoal ? task.amount : t.committedAmount,
      };
    }));
  };

  const applyLumpsum = () => {
    const amount = parseInt(lumpsumAmount, 10) || 0;
    if (!lumpsumGoalId || amount <= 0) return;

    const goal = goals.find((g) => g.id === lumpsumGoalId);
    addLumpsum(lumpsumGoalId, amount);
    setLumpsumAmount("");
    setLumpsumNotice(
      goal
        ? `Added ${formatInr(amount)} to ${goal.name}`
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
  const goalTasks = tasks.filter((t) => t.isGoal);
  const doneGoalTasks = goalTasks.filter((t) => t.done).length;
  const onTrackPct =
    goalTasks.length > 0 ? Math.round((doneGoalTasks / goalTasks.length) * 100) : 0;

  if (!plan || !plan.months || plan.months.length === 0) {
    return (
      <div className="month-page">
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
    <motion.div className="month-page" variants={pageContainer} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div className="month-header" variants={pageSection}>
        <p className="text-label" style={{ color: 'var(--tertiary)' }}>{monthLabel} · {daysLeft} days left</p>
        <h2 className="month-title">This Month's Plan</h2>
      </motion.div>

      {/* Debt warning */}
      {debts.totalMonthly > surplus && surplus >= 0 && (
        <motion.div className="debt-warning" variants={pageSection}>
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 icon-wireframe" />
          <div>
            <div className="debt-warning-title">Debt payments exceed your surplus</div>
            <span>
              Monthly debt/EMI of {formatInr(debts.totalMonthly)} exceeds
              your surplus of {formatInr(Math.max(0, income.total - expenses.total))}.
              Consider negotiating lower payments or consolidating debt.
            </span>
          </div>
        </motion.div>
      )}

      {/* Mission card */}
      <motion.div className="bento-card" variants={pageSection}>
        <div className="mission-content">
          <div className="mission-left">
            <div className="mission-eyebrow">Mission</div>
            <h2 className="mission-title slashed-zero">
              Save {formatInrCompact(savingsTarget)}
              {debts.totalMonthly > 0
                ? ` & pay ${formatInrCompact(debts.totalMonthly)} debt`
                : ""}
            </h2>
            <div className="mission-stats-row">
              <div>
                <div className="mission-stat-label">Goals + Surplus Reserve</div>
                <div className="mission-stat-value slashed-zero">
                  {formatInr(savingsTarget)}
                </div>
              </div>
              <div>
                <div className="mission-stat-label">Debt Payments</div>
                <div className="mission-stat-value slashed-zero">
                  {formatInr(debts.totalMonthly)}
                </div>
              </div>
            </div>
            {pendingSurplus > 0 && (
              <div className="mission-pending-note">
                {formatInr(pendingSurplus)} is waiting for your
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
      </motion.div>

      {/* Main 2-col grid */}
      <motion.div className="month-grid" variants={pageSection}>
        {/* Left: Checklist */}
        <div className="bento-card bento-card-sm">
          <div className="checklist-header">
            <div>
              <p className="text-label">To-Dos This Month</p>
              <p className="checklist-count">
                {doneTasks} of {tasks.length} complete
              </p>
            </div>
          </div>

          <ul className="checklist-list" role="list">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`checklist-item${task.done ? " done" : ""}`}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={task.done}
                  aria-label={`${task.done ? 'Uncheck' : 'Check'} ${task.isGoal && task.prefix ? task.prefix + task.suffix : task.text}`}
                  onClick={() => toggleTask(task.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTask(task.id); } }}
                  className={`checklist-check${task.done ? " done" : ""}`}
                >
                  {task.done && <Check size={14} className="icon-wireframe" />}
                </button>

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
                        type="text"
                        inputMode="numeric"
                        value={task.amount === 0 ? "" : task.amount}
                        onChange={(e) =>
                          updateTaskAmount(task.id, parseInt(e.target.value) || 0)
                        }
                        disabled={task.done}
                        aria-label={`Amount for ${task.prefix}${task.suffix}`}
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
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleTask(task.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTask(task.id); } }}
                      className={`checklist-label${task.done ? " done" : ""}`}
                    >
                      {task.text}
                    </span>
                  )}
                  <p className="checklist-meta">
                    {task.isGoal ? "Goal contribution" : "General task"}
                  </p>
                </div>

                {task.amount !== undefined && (
                  <div className="checklist-amount slashed-zero">
                    {formatInr(task.amount)}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="checklist-footer">
            {doneTasks} of {tasks.length} completed
          </div>
        </div>

        {/* Right column */}
        <div className="month-right-col">
          {/* Impact card */}
          <div className="bento-card bento-card-sm">
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
                            : `+${formatInrCompact(addition)}`}
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
                        <span>{formatInrCompact(goal.currentAmount)}</span>
                        <span>{Math.round(basePct + additionPct)}%</span>
                        <span>{formatInrCompact(goal.targetAmount)}</span>
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
                  ? `You have ${formatInr(Math.round(surplus - savingsTarget - debts.totalMonthly))} unallocated this month. Redirecting it to your top goal accelerates your plan.`
                  : debts.totalMonthly > 0
                    ? "Paying even ₹500 extra on your highest-rate debt each month compounds into significant savings over your timeline."
                    : "Consistency is the engine. Checking off all tasks this month keeps your streak alive and your goals on schedule."}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Strategy + Lumpsum */}
      <motion.div className="month-lower-grid" variants={pageSection}>
        {/* Investment Strategy */}
        <div className="bento-card bento-card-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="text-heading">Investment Strategy</h3>
            <button
              type="button"
              onClick={() =>
                setStrategy(strategy === "avalanche" ? "snowball" : "avalanche")
              }
              className="strategy-toggle"
              aria-label={`Strategy: ${strategy}`}
              aria-pressed={strategy === "avalanche"}
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
                        {formatInr(p1.monthlyAllocation || 0)}/mo
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
                        {formatInr(smallest.monthlyAllocation || 0)}/mo
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
        <div className="bento-card bento-card-sm">
          <h3 className="text-heading mb-1">Lumpsum Fast-Track</h3>
          <p className="impact-subtitle">Add a one-time amount to accelerate a goal.</p>
          <div className="flex flex-col gap-3">
            <select
              value={lumpsumGoalId}
              onChange={(e) => setLumpsumGoalId(e.target.value)}
              className="input-surface w-full px-4 py-3 rounded-xl outline-none"
              disabled={activeGoals.length === 0}
              aria-label="Select goal for lumpsum"
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
              inputMode="numeric"
              value={lumpsumAmount}
              onChange={(e) =>
                setLumpsumAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="Lumpsum amount (₹)"
              className="input-surface w-full px-4 py-3 rounded-xl outline-none"
              aria-label="Lumpsum amount in rupees"
            />
            <button
              type="button"
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
      </motion.div>
    </motion.div>
  );
}
