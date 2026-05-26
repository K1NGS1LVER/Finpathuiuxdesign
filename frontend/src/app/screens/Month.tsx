import { Check, AlertTriangle, Target, Sparkles } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useFinPathStore } from "@/lib/store";
import { formatInr, formatInrCompact } from "@/lib/format";
import confetti from "canvas-confetti";
import { pageContainer, pageSection } from "@/app/components/motion-variants";
import type { ExpenseProfile } from "@/lib/types";

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

const TREND_MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];

function buildExpenseCats(expenses: ExpenseProfile) {
  return [
    { id: "rent",          label: "Housing",       amount: expenses.rent,          color: "var(--secondary-accent)", subtle: "var(--secondary-accent-subtle)" },
    { id: "food",          label: "Food",           amount: expenses.food,          color: "var(--accent)",            subtle: "var(--accent-subtle)" },
    { id: "utilities",     label: "Utilities",      amount: expenses.utilities,     color: "var(--teal)",              subtle: "var(--teal-subtle)" },
    { id: "transport",     label: "Transport",      amount: expenses.transport,     color: "var(--amber)",             subtle: "var(--amber-subtle)" },
    { id: "entertainment", label: "Entertainment",  amount: expenses.entertainment, color: "var(--cobalt)",            subtle: "var(--cobalt-subtle)" },
    { id: "other",         label: "Other",          amount: expenses.other,         color: "var(--tertiary)",          subtle: "var(--surface-hover)" },
  ].filter((c) => c.amount > 0);
}

function ExpenseSparkline({ total }: { total: number }) {
  const data = useMemo(() => {
    const b = total || 50000;
    return [
      Math.round(b * 1.08),
      Math.round(b * 1.055),
      Math.round(b * 1.03),
      Math.round(b * 1.015),
      Math.round(b * 1.005),
      b,
    ];
  }, [total]);

  const W = 240, H = 38;
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const range = mx - mn || 1;
  const yv = (v: number) => H - ((v - mn) / range) * (H - 10) - 5;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${yv(v)}`).join(" ");
  const fillPts = `0,${H} ${pts} ${W},${H}`;

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id="spk-month-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill="url(#spk-month-fill)" />
      <polyline
        points={pts}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
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
        id: "rent",
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

    for (const goal of activeGoals.filter((g) => g.category !== "debt").slice(0, 2)) {
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

    taskList.push({ id: "review", text: "Review subscription services", done: false, isGoal: false });
    taskList.push({ id: "track",  text: "Track all expenses this week",  done: false, isGoal: false });

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
        const backendAmountChanged = prevInitial[i]?.amount !== initialTasks[i].amount;
        const backendDoneChanged   = prevInitial[i]?.done   !== initialTasks[i].done;
        return {
          ...initialTasks[i],
          done:   backendDoneChanged   ? initialTasks[i].done   : pt.done,
          amount: backendAmountChanged ? initialTasks[i].amount : pt.amount,
        };
      });
    });
  }, [initialTasks]);

  const updateTaskAmount = (id: string, newAmount: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, amount: newAmount } : t)));
  };

  useEffect(() => {
    if (!lumpsumGoalId && activeGoals.length > 0) setLumpsumGoalId(activeGoals[0].id);
    if (activeGoals.length === 0) setLumpsumGoalId("");
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
          const subtractAmount = task.committedAmount ?? task.amount;
          newAmount = Math.max(0, goal.currentAmount - subtractAmount);
        }

        const justCompleted = newAmount >= goal.targetAmount;
        updateGoal(goal.id, {
          currentAmount: newAmount,
          checkedThisMonth: newDoneState,
          status: justCompleted ? "complete" : newAmount > 0 ? "in-progress" : "not-started",
        });

        if (newDoneState) {
          const styles = getComputedStyle(document.documentElement);
          const accent    = styles.getPropertyValue("--accent").trim();
          const secondary = styles.getPropertyValue("--secondary-accent").trim();
          const lime      = styles.getPropertyValue("--tertiary-accent").trim();
          const green     = styles.getPropertyValue("--green").trim();
          if (justCompleted) {
            const end = Date.now() + 2000;
            const frame = () => {
              confetti({ particleCount: 3, angle: 60,  spread: 55, origin: { x: 0, y: 0.7 }, colors: [accent, secondary, accent] });
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

    setTasks(
      tasks.map((t) => {
        if (t.id !== id) return t;
        const newDone = !t.done;
        return {
          ...t,
          done: newDone,
          committedAmount: newDone && t.isGoal ? task.amount : t.committedAmount,
        };
      }),
    );
  };

  const applyLumpsum = () => {
    const amount = parseInt(lumpsumAmount, 10) || 0;
    if (!lumpsumGoalId || amount <= 0) return;
    const goal = goals.find((g) => g.id === lumpsumGoalId);
    addLumpsum(lumpsumGoalId, amount);
    setLumpsumAmount("");
    setLumpsumNotice(goal ? `Added ${formatInr(amount)} to ${goal.name}` : "Lumpsum applied");
  };

  // ── Computed values ──────────────────────────────────────
  const surplus          = income.total - expenses.total - debts.totalMonthly;
  const reservedSurplus  = plan?.months?.[0]?.reservedSurplus || 0;
  const pendingSurplus   = plan?.months?.[0]?.pendingSurplus  || 0;
  const goalSavingsTarget = tasks
    .filter((t) => t.isGoal && t.amount !== undefined)
    .reduce((sum, t) => {
      const g = activeGoals.find((g) => g.id === t.goalId);
      if (g && g.category !== "debt") return sum + Math.max(0, t.amount || 0);
      return sum;
    }, 0);
  const savingsTarget = Math.max(0, goalSavingsTarget + reservedSurplus);

  const doneTasks      = tasks.filter((t) => t.done).length;
  const goalTasks      = tasks.filter((t) => t.isGoal);
  const nonGoalTasks   = tasks.filter((t) => !t.isGoal);
  const doneGoalTasks  = goalTasks.filter((t) => t.done).length;
  const onTrackPct     = goalTasks.length > 0 ? Math.round((doneGoalTasks / goalTasks.length) * 100) : 0;
  const allDone        = doneTasks === tasks.length && tasks.length > 0;
  const totalGoalCommitted = goalTasks.reduce((s, t) => s + (t.amount || 0), 0);

  // ── Cashflow expense cats ────────────────────────────────
  const expenseCats = useMemo(() => buildExpenseCats(expenses), [expenses]);
  const expenseTotal = expenseCats.reduce((s, c) => s + c.amount, 0) || expenses.total;

  const getGoalColor = (goalId?: string): string => {
    if (!goalId) return "var(--accent)";
    return activeGoals.find((g) => g.id === goalId)?.color || "var(--accent)";
  };

  // ── Empty plan guard ─────────────────────────────────────
  if (!plan || !plan.months || plan.months.length === 0) {
    return (
      <div className="month-page">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 icon-accent-subtle">
            <AlertTriangle size={32} className="icon-wireframe" />
          </div>
          <h2 className="text-display mb-2">No plan generated</h2>
          <p className="impact-subtitle max-w-md mb-8">
            We couldn't find an active financial plan. Head to Journey to set your goals and
            generate your path.
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
        <p className="text-label" style={{ color: "var(--tertiary)" }}>
          {monthLabel} · {daysLeft} days left
        </p>
        <h2 className="month-title">This Month's Plan</h2>
      </motion.div>

      {/* Debt warning */}
      {debts.totalMonthly > surplus && surplus >= 0 && (
        <motion.div className="debt-warning" variants={pageSection}>
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 icon-wireframe" />
          <div>
            <div className="debt-warning-title">Debt payments exceed your surplus</div>
            <span>
              Monthly debt/EMI of {formatInr(debts.totalMonthly)} exceeds your surplus of{" "}
              {formatInr(Math.max(0, income.total - expenses.total))}. Consider negotiating lower
              payments or consolidating debt.
            </span>
          </div>
        </motion.div>
      )}

      {/* ── Mission card ── */}
      <motion.div className="bento-card" variants={pageSection}>
        <div className="mission-content">
          <div className="mission-left">
            <div className="mission-eyebrow">Mission</div>
            <h2 className="mission-title slashed-zero">
              Save {formatInrCompact(savingsTarget)}
              {debts.totalMonthly > 0 ? ` & pay ${formatInrCompact(debts.totalMonthly)} debt` : ""}
            </h2>
            <div className="mission-stats-row">
              <div>
                <div className="mission-stat-label">Goals + Surplus Reserve</div>
                <div
                  className="mission-stat-value slashed-zero"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {formatInr(savingsTarget)}
                </div>
              </div>
              <div>
                <div className="mission-stat-label">Debt Payments</div>
                <div
                  className="mission-stat-value slashed-zero"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {formatInr(debts.totalMonthly)}
                </div>
              </div>
            </div>
            {pendingSurplus > 0 && (
              <div className="mission-pending-note">
                {formatInr(pendingSurplus)} is waiting for your reinvest/surplus decision.
              </div>
            )}
          </div>

          <div className="mission-right">
            <div className="w-full">
              <div className="mission-right-label">Days Remaining</div>
              <div
                className="mission-right-value slashed-zero"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {daysLeft}
              </div>
            </div>
            <hr className="mission-divider" />
            <div className="w-full">
              <div className="mission-right-label">On Track</div>
              <div
                className="mission-right-value slashed-zero"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {onTrackPct}%
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Main grid: Cashflow + Impact + Penny (left) | Checklist (right) ── */}
      <motion.div className="month-grid" variants={pageSection}>
        {/* ─── Left column: Cashflow + Impact + Penny ─── */}
        <div className="month-left-col">
          {/* Cashflow breakdown */}
          <div className="bento-card">
            <p className="cashflow-section-title">Where did the money go?</p>

            {expenseCats.length > 0 ? (
              <>
                <div className="cashflow-bar">
                  {expenseCats.map((c, i) => (
                    <div
                      key={c.id}
                      className="cashflow-bar-segment"
                      style={{
                        width: `${(c.amount / expenseTotal) * 100}%`,
                        background: c.color,
                        borderRadius:
                          i === 0
                            ? "var(--radius-full) var(--radius-xs) var(--radius-xs) var(--radius-full)"
                            : i === expenseCats.length - 1
                              ? "var(--radius-xs) var(--radius-full) var(--radius-full) var(--radius-xs)"
                              : "var(--radius-xs)",
                      }}
                    />
                  ))}
                </div>

                <div className="cashflow-legend">
                  {expenseCats.map((c) => (
                    <div key={c.id} className="cashflow-legend-item">
                      <div className="cashflow-legend-dot" style={{ background: c.color }} />
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>

                <div className="cashflow-rows">
                  {expenseCats.map((c) => {
                    const pct = (c.amount / expenseTotal) * 100;
                    return (
                      <div key={c.id} className="cashflow-row">
                        <div className="cashflow-row-node" style={{ background: c.subtle }}>
                          <div className="cashflow-row-node-dot" style={{ background: c.color }} />
                        </div>
                        <div className="cashflow-row-body">
                          <div className="cashflow-row-header">
                            <span className="cashflow-row-label">{c.label}</span>
                            <span className="cashflow-row-amount">{formatInr(c.amount)}</span>
                          </div>
                          <div className="cashflow-row-bar-outer">
                            <div
                              className="cashflow-row-bar-inner"
                              style={{ width: `${pct}%`, background: c.color }}
                            />
                          </div>
                        </div>
                        <span className="cashflow-row-pct">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p style={{ color: "var(--tertiary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-2)" }}>
                No expense breakdown available. Add expense details in onboarding.
              </p>
            )}

            <div className="cashflow-trend">
              <div className="cashflow-trend-header">
                <p className="cashflow-trend-label">6-Month Expense Trend</p>
                <span className="cashflow-trend-badge">↓ Reducing</span>
              </div>
              <ExpenseSparkline total={expenseTotal} />
              <div className="cashflow-trend-months">
                {TREND_MONTHS.map((m, i) => (
                  <span
                    key={m + i}
                    className={`cashflow-trend-month${i === TREND_MONTHS.length - 1 ? " current" : ""}`}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Impact card */}
          <div className="bento-card bento-card-sm">
            <p className="text-label">This Month's Impact</p>
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
                  const task     = tasks.find((t) => t.goalId === goal.id);
                  const isDone   = task ? task.done : !!goal.checkedThisMonth;
                  const addition = isDone
                    ? 0
                    : task?.amount !== undefined
                      ? task.amount
                      : goal.monthlyAllocation || 0;
                  const safeTarget  = Math.max(1, goal.targetAmount);
                  const basePct     = Math.min(100, (goal.currentAmount / safeTarget) * 100);
                  const additionPct = Math.min(100 - basePct, (addition / safeTarget) * 100);

                  return (
                    <div key={goal.id}>
                      <div className="impact-goal-header">
                        <span className="impact-goal-name">
                          {goal.name}
                          {isDone && <Check size={14} className="icon-wireframe" />}
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
        </div>

        {/* ─── Right column: Checklist ─── */}
        <div className="month-right-col">
          {/* Monthly Execution checklist */}
          <div className="bento-card bento-card-sm">
            {/* Progress header */}
            <div className="execution-header">
              <div className="execution-label">Monthly Execution</div>
              <div className="execution-progress-row">
                <span className="execution-count">
                  {doneTasks}/{tasks.length}
                </span>
                {allDone && (
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--secondary)",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    complete
                  </span>
                )}
              </div>
              <div className="execution-bar-outer">
                <div
                  className={`execution-bar-inner${allDone ? " all-done" : ""}`}
                  style={{ width: `${tasks.length ? (doneTasks / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Goal Allocations */}
            {goalTasks.length > 0 && (
              <div style={{ marginBottom: "var(--space-2)" }}>
                <div className="execution-sub-label">
                  Goal Allocations
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--tertiary)",
                      fontWeight: "var(--font-weight-regular)",
                    }}
                  >
                    {doneGoalTasks}/{goalTasks.length}
                  </span>
                </div>

                {goalTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`goal-check-row${task.done ? " is-done" : ""}`}
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className={`goal-check-box${task.done ? " done" : ""}`}>
                      {task.done && (
                        <Check size={10} style={{ color: "#fff", strokeWidth: 3 }} />
                      )}
                    </div>

                    <div
                      className="goal-check-label-wrapper"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.isGoal && task.amount !== undefined ? (
                        <div className={`checklist-inline-row${task.done ? " done" : ""}`}>
                          <span
                            className={task.done ? "done-text" : ""}
                            onClick={() => toggleTask(task.id)}
                            style={{ cursor: "pointer" }}
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
                            className={task.done ? "done-text" : ""}
                            onClick={() => toggleTask(task.id)}
                            style={{ cursor: "pointer" }}
                          >
                            {task.suffix}
                          </span>
                        </div>
                      ) : (
                        <span className={`goal-check-label${task.done ? " done" : ""}`}>
                          {task.text}
                        </span>
                      )}
                    </div>

                    {task.amount !== undefined && (
                      <span className={`goal-check-amount${task.done ? " done" : ""}`}>
                        {formatInr(task.amount)}
                      </span>
                    )}
                  </div>
                ))}

                {/* Total committed chip */}
                <div className="execution-total-chip">
                  <span className="execution-total-label">Total committed</span>
                  <span className="execution-total-value">{formatInr(totalGoalCommitted)}</span>
                </div>
              </div>
            )}

            {/* Regular Tasks */}
            {nonGoalTasks.length > 0 && (
              <div>
                <div className="execution-sub-label">Tasks</div>
                <ul className="checklist-list" role="list">
                  {nonGoalTasks.map((task) => (
                    <li key={task.id} className={`checklist-item${task.done ? " done" : ""}`}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={task.done}
                        aria-label={`${task.done ? "Uncheck" : "Check"} ${task.text}`}
                        onClick={() => toggleTask(task.id)}
                        className={`checklist-check${task.done ? " done" : ""}`}
                      >
                        {task.done && <Check size={14} className="icon-wireframe" />}
                      </button>
                      <div className="checklist-content">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleTask(task.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleTask(task.id);
                            }
                          }}
                          className={`checklist-label${task.done ? " done" : ""}`}
                        >
                          {task.text}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {allDone && (
              <div
                style={{
                  width: "100%",
                  marginTop: "var(--space-2)",
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-base)",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  fontFamily: "var(--font-display)",
                  textAlign: "center",
                }}
              >
                Month complete — great work!
              </div>
            )}
          </div>

        </div>
      </motion.div>

      {/* ── Strategy + Lumpsum ── */}
      <motion.div className="month-lower-grid" variants={pageSection}>
        {/* Investment Strategy */}
        <div className="bento-card bento-card-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="text-heading">Investment Strategy</h3>
            <button
              type="button"
              onClick={() => setStrategy(strategy === "avalanche" ? "snowball" : "avalanche")}
              className="strategy-toggle"
              aria-label={`Strategy: ${strategy}`}
              aria-pressed={strategy === "avalanche"}
            >
              <span className={`strategy-toggle-pill ${strategy === "avalanche" ? "left" : "right"}`} />
              <span className={`strategy-toggle-label ${strategy === "avalanche" ? "active" : "inactive"}`}>
                Avalanche
              </span>
              <span className={`strategy-toggle-label ${strategy === "snowball" ? "active" : "inactive"}`}>
                Snowball
              </span>
            </button>
          </div>

          <div className="strategy-info-box">
            {strategy === "avalanche" ? (
              <p>
                <strong className="text-card-foreground">Avalanche</strong> allocates funds by
                goal priority — highest priority goals get funded first.{" "}
                {(() => {
                  const p1 = activeGoals.find((g) => g.priority === 1);
                  return p1 ? (
                    <span>
                      Your <strong className="text-card-foreground">P1: {p1.name}</strong> receives{" "}
                      <strong className="text-card-foreground">
                        {formatInr(p1.monthlyAllocation || 0)}/mo
                      </strong>
                      .
                    </span>
                  ) : null;
                })()}
              </p>
            ) : (
              <p>
                <strong className="text-card-foreground">Snowball</strong> tackles the smallest
                remaining goal first for a quick win, then rolls freed-up money into the next.{" "}
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
                      </strong>
                      .
                    </span>
                  ) : null;
                })()}
              </p>
            )}
          </div>

          {(() => {
            const nonDebtGoals      = activeGoals.filter((g) => g.category !== "debt");
            const availableForGoals = Math.max(0, surplus - reservedSurplus - pendingSurplus);

            if (nonDebtGoals.length > 0 && availableForGoals <= 0) {
              return (
                <div className="warning-banner flex items-start gap-2 mt-3">
                  <Target size={16} className="flex-shrink-0 mt-0.5 icon-wireframe" />
                  <span>
                    <strong>Note:</strong> No monthly surplus to distribute. Switching strategies
                    won't change your checklist amounts right now.
                  </span>
                </div>
              );
            }

            if (nonDebtGoals.length === 1 && availableForGoals > 0) {
              return (
                <div className="warning-banner flex items-start gap-2 mt-3">
                  <Target size={16} className="flex-shrink-0 mt-0.5 icon-wireframe" />
                  <span>
                    <strong>Note:</strong> You only have one active goal. Strategies work across{" "}
                    <em>multiple</em> goals — add another to see the difference.
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
              onChange={(e) => setLumpsumAmount(e.target.value.replace(/[^0-9]/g, ""))}
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
            {lumpsumNotice && <div className="lumpsum-notice">{lumpsumNotice}</div>}
          </div>
        </div>
      </motion.div>

      {/* ── Penny suggestion (full width) ── */}
      <motion.div variants={pageSection}>
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
      </motion.div>
    </motion.div>
  );
}
