import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useFinPathStore } from '@/lib/store';
import { COMPLETION_HOLD_MS } from "./constants";

export const GOAL_PRESETS = [
  { name: "Dream Bike", icon: "Bike", target: 120000, months: 18 },
  { name: "Emergency Fund", icon: "Shield", target: 300000, months: 24 },
  { name: "Vacation", icon: "Plane", target: 50000, months: 6 },
  { name: "Investment", icon: "TrendingUp", target: 500000, months: 36 },
  { name: "Wedding", icon: "Heart", target: 500000, months: 24 },
  { name: "Upskill Course", icon: "GraduationCap", target: 100000, months: 12 },
  { name: "House Fund", icon: "Home", target: 2000000, months: 60 },
  { name: "Clear Debt", icon: "CreditCard", target: 100000, months: 12 },
];

export function useJourneyGoals() {
  const storeGoals = useFinPathStore((s) => s.goals);
  const income = useFinPathStore((s) => s.income);
  const expenses = useFinPathStore((s) => s.expenses);
  const debts = useFinPathStore((s) => s.debts);
  const monthlySurplusReserve = useFinPathStore((s) => s.monthlySurplusReserve);
  const addGoal = useFinPathStore((s) => s.addGoal);
  const setGoals = useFinPathStore((s) => s.setGoals);
  const completeGoal = useFinPathStore((s) => s.completeGoal);
  const removeGoal = useFinPathStore((s) => s.removeGoal);

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [addGoalError, setAddGoalError] = useState("");
  const [customName, setCustomName] = useState("");
  const [customTarget, setCustomTarget] = useState("");
  const [customMonths, setCustomMonths] = useState("12");
  const [showAddModal, setShowAddModal] = useState(false);
  const [completingIds, setCompletingIds] = useState<string[]>([]);
  const completionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => { completionTimers.current.forEach(clearTimeout); }, []);

  const sortedGoals = useMemo(
    () =>
      storeGoals.slice().sort((a, b) => {
        if (a.status === "complete" && b.status !== "complete") return 1;
        if (a.status !== "complete" && b.status === "complete") return -1;
        return a.priority - b.priority;
      }),
    [storeGoals],
  );

  const activeGoals = useMemo(
    () => sortedGoals.filter((goal) => goal.status !== "complete"),
    [sortedGoals],
  );

  const completedGoals = useMemo(
    () => sortedGoals.filter((goal) => goal.status === "complete"),
    [sortedGoals],
  );

  const handleRemoveCompleted = useCallback(() => {
    for (const g of completedGoals) {
      removeGoal(g.id);
    }
  }, [completedGoals, removeGoal]);

  const monthlySurplus = useMemo(
    () => income.total - expenses.total - debts.totalMonthly - monthlySurplusReserve,
    [income.total, expenses.total, debts.totalMonthly, monthlySurplusReserve],
  );
  const existingMonthlyNeed = useMemo(
    () => activeGoals
      .filter((g) => g.category !== "debt")
      .reduce((sum, g) => sum + (g.monthlyAllocation || 0), 0),
    [activeGoals],
  );
  const budgetRemaining = monthlySurplus - existingMonthlyNeed;

  // Data-only: mutates store and schedules the completion-ring auto-clear.
  // Visual side effects (confetti) are fired by the caller in Journey.tsx.
  const handleComplete = useCallback(
    (goalId: string) => {
      completeGoal(goalId);
      setSelectedGoalId(null);
      setCompletingIds((prev) => [...prev, goalId]);
      const t = setTimeout(
        () => setCompletingIds((prev) => prev.filter((id) => id !== goalId)),
        COMPLETION_HOLD_MS,
      );
      completionTimers.current.push(t);
    },
    [completeGoal],
  );

  const handleDelete = useCallback(
    (goalId: string) => {
      removeGoal(goalId);
      setSelectedGoalId(null);
    },
    [removeGoal],
  );

  const handlePriorityChange = useCallback(
    (goalId: string, newPriority: number) => {
      const targetGoal = activeGoals.find((goal) => goal.id === goalId);
      if (!targetGoal) return;

      const clampedPriority = Math.max(1, Math.min(newPriority, activeGoals.length));
      const withoutTarget = activeGoals.filter((goal) => goal.id !== goalId);
      const nextActive = withoutTarget.slice();
      nextActive.splice(clampedPriority - 1, 0, { ...targetGoal, priority: clampedPriority });

      const priorityById = new Map<string, number>();
      nextActive.forEach((goal, index) => {
        priorityById.set(goal.id, index + 1);
      });

      const merged = storeGoals.map((goal) => {
        const nextPriority = priorityById.get(goal.id);
        return typeof nextPriority === "number" ? { ...goal, priority: nextPriority } : { ...goal, priority: 0 };
      });

      setGoals(merged);
    },
    [activeGoals, storeGoals, setGoals],
  );

  const closeAddModal = useCallback(() => {
    setCustomName("");
    setCustomTarget("");
    setCustomMonths("12");
    setAddGoalError("");
    setShowAddModal(false);
  }, []);

  const handleAddPreset = useCallback(
    (preset: (typeof GOAL_PRESETS)[0]) => {
      if (storeGoals.some((g) => g.name === preset.name)) return;

      const presetMonthly = Math.round(preset.target / preset.months);
      const totalAfterAdd = existingMonthlyNeed + presetMonthly;
      const availableSurplus = Math.max(0, monthlySurplus);

      if (presetMonthly > availableSurplus && availableSurplus > 0) {
        setAddGoalError(
          `"${preset.name}" needs ₹${presetMonthly.toLocaleString("en-IN")}/mo to finish in ${preset.months} months, but you only have ₹${availableSurplus.toLocaleString("en-IN")}/mo available. Remove an existing goal or pick a smaller target.`
        );
        return;
      }

      if (totalAfterAdd > availableSurplus && availableSurplus > 0) {
        setAddGoalError(
          `Adding "${preset.name}" will push your total monthly goal commitments to ₹${totalAfterAdd.toLocaleString("en-IN")}/mo — exceeding your available ₹${availableSurplus.toLocaleString("en-IN")}/mo. Remove an existing goal first, or your timelines will stretch significantly.`
        );
        return;
      }

      setAddGoalError("");
      addGoal({
        id: `goal-${Date.now()}`,
        name: preset.name,
        icon: preset.icon,
        category: "custom",
        targetAmount: preset.target,
        currentAmount: 0,
        timelineMonths: preset.months,
        priority: activeGoals.length + 1,
        status: "not-started",
        monthlyAllocation: 0,
        color: "var(--accent)",
      });
      closeAddModal();
    },
    [storeGoals, monthlySurplus, existingMonthlyNeed, activeGoals, addGoal, closeAddModal],
  );

  const handleAddCustom = useCallback(() => {
    if (!customName.trim() || !customTarget.trim()) return;

    const targetAmt = parseInt(customTarget) || 0;
    const months = parseInt(customMonths) || 12;
    const customMonthly = Math.round(targetAmt / months);
    const availableSurplus = Math.max(0, monthlySurplus);

    if (customMonthly > availableSurplus && availableSurplus > 0) {
      const minMonthsNeeded = availableSurplus > 0 ? Math.ceil(targetAmt / availableSurplus) : Infinity;
      setAddGoalError(
        `This goal needs ₹${customMonthly.toLocaleString("en-IN")}/mo to finish in ${months} months, but you only have ₹${availableSurplus.toLocaleString("en-IN")}/mo available. ` +
        (minMonthsNeeded < 999 ? `You'd need at least ${minMonthsNeeded} months to achieve this. ` : "") +
        `Either increase the timeline, reduce the target, or remove an existing goal.`
      );
      return;
    }

    const totalAfterAdd = existingMonthlyNeed + customMonthly;
    if (totalAfterAdd > availableSurplus && availableSurplus > 0) {
      setAddGoalError(
        `Adding this goal pushes your total monthly commitments to ₹${totalAfterAdd.toLocaleString("en-IN")}/mo — over your available ₹${availableSurplus.toLocaleString("en-IN")}/mo. Remove an existing goal first.`
      );
      return;
    }

    if (availableSurplus <= 0) {
      setAddGoalError(
        "You have no available surplus after expenses, debt, and reserve. You cannot add any goals until your income exceeds your outgoings."
      );
      return;
    }

    setAddGoalError("");
    addGoal({
      id: `goal-${Date.now()}`,
      name: customName.trim(),
      icon: "Target",
      category: "custom",
      targetAmount: targetAmt || 100000,
      currentAmount: 0,
      timelineMonths: months,
      priority: activeGoals.length + 1,
      status: "not-started",
      monthlyAllocation: 0,
      color: "var(--accent)",
    });
    closeAddModal();
  }, [customName, customTarget, customMonths, monthlySurplus, existingMonthlyNeed, activeGoals, addGoal, closeAddModal]);

  const selectedGoal = sortedGoals.find((g) => g.id === selectedGoalId) ?? null;

  return {
    storeGoals,
    sortedGoals,
    activeGoals,
    completedGoals,
    handleRemoveCompleted,
    monthlySurplus,
    existingMonthlyNeed,
    budgetRemaining,
    selectedGoalId,
    setSelectedGoalId,
    selectedGoal,
    completingIds,
    handleComplete,
    handleDelete,
    handlePriorityChange,
    handleAddPreset,
    handleAddCustom,
    showAddModal,
    setShowAddModal,
    closeAddModal,
    addGoalError,
    setAddGoalError,
    customName,
    setCustomName,
    customTarget,
    setCustomTarget,
    customMonths,
    setCustomMonths,
  };
}
