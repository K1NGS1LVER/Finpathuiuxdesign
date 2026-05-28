import { Check, AlertTriangle, Sparkles } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useFinPathStore } from "@/lib/store";
import { formatInr, formatInrCompact } from "@/lib/format";
import confetti from "canvas-confetti";
import { pageContainer, pageSection } from "@/app/components/motion-variants";
import { AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

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
  const allDone        = doneTasks === tasks.length && tasks.length > 0;
  const totalGoalCommitted = goalTasks.reduce((s, t) => s + (t.amount || 0), 0);

  // ── Impact micro-row goals ───────────────────────────────
  const impactGoals = useMemo(
    () =>
      activeGoals
        .filter((g) => (g.monthlyAllocation || 0) > 0 || g.checkedThisMonth)
        .slice(0, 4),
    [activeGoals],
  );

  // ── Net worth 6-month chart data ─────────────────────────
  const nwChartData = useMemo(
    () =>
      (plan?.months ?? []).slice(0, 6).map((m) => ({
        label: m.date,
        netWorth: m.netWorth,
      })),
    [plan],
  );

  // ── Penny tip text ───────────────────────────────────────
  const pennyTipText =
    surplus > 5000
      ? `You have ${formatInr(Math.round(surplus - savingsTarget - debts.totalMonthly))} unallocated this month. Redirecting it to your top goal accelerates your plan.`
      : debts.totalMonthly > 0
        ? "Paying even ₹500 extra on your highest-rate debt each month compounds into significant savings over your timeline."
        : "Consistency is the engine. Checking off all tasks this month keeps your streak alive and your goals on schedule.";

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

      {/* ── Mission strip ── */}
      <motion.div className="bento-card mission-strip" variants={pageSection}>
        {/* Left: main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div className="mission-eyebrow">Mission</div>
          <h2 className="mission-title slashed-zero">
            Save {formatInrCompact(savingsTarget)}
            {debts.totalMonthly > 0 ? ` & pay ${formatInrCompact(debts.totalMonthly)} debt` : ""}
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
              {formatInr(pendingSurplus)} is waiting for your reinvest/surplus decision.
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch", margin: "0 var(--space-3)" }} />

        {/* Right: Days Left */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-0_5)", minWidth: 72 }}>
          <span style={{
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--font-weight-medium)",
            color: "var(--tertiary)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wider)",
            fontFamily: "var(--font-body)",
          }}>
            Days Left
          </span>
          <span style={{
            fontSize: "var(--text-3xl)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--tertiary)",
            fontFamily: "var(--font-display)",
            lineHeight: 1,
          }}>
            {daysLeft}
          </span>
        </div>
      </motion.div>

      {/* ── Main grid: Cashflow + Impact (left) | Checklist (right) ── */}
      <motion.div className="month-grid" variants={pageSection}>
        {/* ─── Left column ─── */}
        <div className="month-left-col">
          {/* Impact card (full — progress bars per goal) */}
          <div className="bento-card bento-card-sm">
            <p className="text-label">This Month's Impact</p>
            <div className="impact-goals-list">
              {impactGoals.length === 0 ? (
                <div className="month-impact-empty">
                  No goals receiving funds this month. Try adding a lumpsum!
                </div>
              ) : (
                impactGoals.map((goal) => {
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
                          <div className="progress-fill-pending" style={{ width: `${additionPct}%` }} />
                        )}
                      </div>
                      <div className="progress-bar-labels">
                        <span>{formatInrCompact(goal.currentAmount)}</span>
                        <span>{Math.round(basePct + additionPct)}%</span>
                        <span>{formatInrCompact(goal.targetAmount)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Net Worth Outlook (6-month projection) */}
          {nwChartData.length > 0 && (
            <div className="bento-card bento-card-sm" style={{ flex: 1 }}>
              <p className="text-label">Net Worth Outlook</p>
              <p style={{ fontSize: "var(--text-2xs)", color: "var(--tertiary)", marginBottom: "var(--space-2)" }}>
                6-month projection
              </p>
              <div role="img" aria-label="Net worth projection chart">
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={nwChartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="nw-month-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: "var(--text-2xs)", fill: "var(--secondary)", fontFamily: "var(--font-body)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-base)",
                        fontFamily: "var(--font-body)",
                        color: "var(--card-foreground)",
                      }}
                      formatter={(v: number) => [formatInr(v), "Net Worth"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="netWorth"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      fill="url(#nw-month-fill)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* ─── Right column: Checklist (unchanged) ─── */}
        <div className="month-right-col">
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

      {/* ── Lumpsum card ── */}
      <motion.div className="bento-card" variants={pageSection}>
        <h3 className="text-heading" style={{ marginBottom: "var(--space-0_5)" }}>
          One-Time Boost
        </h3>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--secondary)", marginBottom: "var(--space-2)" }}>
          Add a one-time amount to fast-track a goal.
        </p>
        <div className="lumpsum-inline">
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
            placeholder="Amount (₹)"
            className="input-surface w-full px-4 py-3 rounded-xl outline-none"
            aria-label="Lumpsum amount in rupees"
          />
          <button
            type="button"
            onClick={applyLumpsum}
            disabled={!lumpsumGoalId || !lumpsumAmount}
            className="btn-primary justify-center py-3 disabled:opacity-50"
          >
            Apply Lumpsum
          </button>
        </div>
        {lumpsumNotice && (
          <div className="lumpsum-notice" role="status" aria-live="polite">
            {lumpsumNotice}
          </div>
        )}
      </motion.div>

      {/* ── Penny card ── */}
      <motion.div className="bento-card penny-card" variants={pageSection} role="note">
        <div className="penny-insight-blob" />
        <div className="relative z-10 flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--penny-accent-subtle)", color: "var(--penny-accent)" }}>
            <Sparkles size={18} className="icon-wireframe" />
          </div>
          <h3 className="text-heading" style={{ color: "var(--card-foreground)" }}>Penny's Tip</h3>
        </div>
        <p className="relative z-10" style={{ fontSize: "var(--text-sm)", color: "var(--card-foreground)", fontFamily: "var(--font-body)", lineHeight: "var(--leading-relaxed)", margin: 0 }}>
          {pennyTipText}
        </p>
      </motion.div>
    </motion.div>
  );
}
