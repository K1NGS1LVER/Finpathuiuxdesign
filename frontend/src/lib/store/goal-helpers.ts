// ============================================================
// Pure goal/debt helpers used by the store slices.
// No store access here — everything is (input) => output.
// ============================================================

import type { DebtProfile, Goal, GoalCompletionDecision } from '../types';
import { DEBT_GOAL_ID } from './defaults';

/** Map goal name from onboarding to a Goal object */
export function goalNameToGoal(name: string, index: number): Goal {
  const goalConfigs: Record<string, Partial<Goal>> = {
    'Dream Bike': {
      category: 'bike',
      icon: 'Bike',
      targetAmount: 120000,
      timelineMonths: 18,
      color: 'var(--accent)',
    },
    Investment: {
      category: 'investment',
      icon: 'TrendingUp',
      targetAmount: 500000,
      timelineMonths: 36,
      color: 'var(--tertiary-accent)',
    },
    'Emergency Fund': {
      category: 'savings',
      icon: 'Shield',
      targetAmount: 300000,
      timelineMonths: 24,
      color: 'var(--tertiary-accent)',
    },
    Wedding: {
      category: 'family',
      icon: 'Heart',
      targetAmount: 500000,
      timelineMonths: 24,
      color: 'var(--amber)',
    },
    Vacation: {
      category: 'travel',
      icon: 'Plane',
      targetAmount: 50000,
      timelineMonths: 6,
      color: 'var(--accent)',
    },
    'Upskill Course': {
      category: 'education',
      icon: 'GraduationCap',
      targetAmount: 100000,
      timelineMonths: 12,
      color: 'var(--tertiary-accent)',
    },
    Custom: {
      category: 'custom',
      icon: 'Target',
      targetAmount: 100000,
      timelineMonths: 12,
      color: 'var(--tertiary-accent)',
    },
  };

  const config = goalConfigs[name] || goalConfigs['Custom']!;

  return {
    id: `goal-${Date.now()}-${index}`,
    name,
    icon: config.icon || 'Target',
    category: config.category || 'custom',
    targetAmount: config.targetAmount || 100000,
    currentAmount: 0,
    timelineMonths: config.timelineMonths || 12,
    priority: index + 1,
    status: 'not-started',
    monthlyAllocation: 0,
    color: config.color || 'var(--accent)',
  };
}

export function getDebtGoalTarget(debts: DebtProfile): number {
  const itemPrincipal = debts.items.reduce(
    (sum, debt) => sum + Math.max(0, debt.principal || 0),
    0,
  );

  if (itemPrincipal > 0) return itemPrincipal;
  if (debts.totalPrincipal && debts.totalPrincipal > 0) return debts.totalPrincipal;
  return Math.max(0, debts.totalMonthly || 0) * 12;
}

export function getDebtGoalTimeline(debts: DebtProfile): number {
  const itemTimeline = debts.items.reduce(
    (max, debt) => Math.max(max, debt.remainingMonths || 0),
    0,
  );

  if (itemTimeline > 0) return itemTimeline;
  return debts.totalMonthly > 0 ? 12 : 0;
}

export function hasDebt(debts: DebtProfile): boolean {
  return (
    Math.max(0, debts.totalMonthly || 0) > 0 ||
    (debts.totalPrincipal && debts.totalPrincipal > 0) ||
    debts.items.some(
      (debt) =>
        Math.max(0, debt.principal || 0) > 0 &&
        Math.max(0, debt.monthlyPayment || 0) > 0 &&
        Math.max(0, debt.remainingMonths || 0) > 0,
    )
  );
}

export function emptyDebtProfile(): DebtProfile {
  return { items: [], totalMonthly: 0 };
}

export function normalizeDebtProfile(debts: DebtProfile): DebtProfile {
  const totalMonthly = Math.max(0, debts.totalMonthly || 0);

  if (debts.items.length === 0) {
    return totalMonthly > 0 ? { items: [], totalMonthly } : emptyDebtProfile();
  }

  const activeItems = debts.items.filter(
    (debt) =>
      Math.max(0, debt.principal || 0) > 0 &&
      Math.max(0, debt.monthlyPayment || 0) > 0 &&
      Math.max(0, debt.remainingMonths || 0) > 0,
  );

  if (activeItems.length === 0) {
    return emptyDebtProfile();
  }

  const activeMonthly = activeItems.reduce(
    (sum, debt) => sum + Math.max(0, debt.monthlyPayment || 0),
    0,
  );

  return {
    items: activeItems,
    totalMonthly: Math.max(totalMonthly, activeMonthly),
    totalPrincipal: debts.totalPrincipal,
  };
}

export function isDebtGoalComplete(goal: Goal | undefined): boolean {
  return !!(goal && goal.category === 'debt' && goal.status === 'complete');
}

export function resolveDebtsFromGoals(debts: DebtProfile, _goals: Goal[]): DebtProfile {
  return normalizeDebtProfile(debts);
}

export function makeDebtGoal(
  debts: DebtProfile,
  existingGoal: Goal | undefined,
  priority: number,
): Goal {
  const targetAmount = Math.max(1, getDebtGoalTarget(debts));
  const currentAmount = Math.min(targetAmount, Math.max(0, existingGoal?.currentAmount || 0));
  const status: Goal['status'] =
    currentAmount >= targetAmount ? 'complete' : currentAmount > 0 ? 'in-progress' : 'not-started';

  return {
    id: DEBT_GOAL_ID,
    name: 'Debt Payoff (1yr Est.)',
    icon: 'CreditCard',
    category: 'debt',
    targetAmount,
    currentAmount,
    timelineMonths: Math.max(1, getDebtGoalTimeline(debts)),
    priority: existingGoal?.priority || priority,
    status,
    monthlyAllocation: Math.max(0, debts.totalMonthly || 0),
    color: 'var(--red)',
    checkedThisMonth: existingGoal?.checkedThisMonth,
    lumpsumAdded: existingGoal?.lumpsumAdded,
  };
}

export function syncDebtGoal(
  goals: Goal[],
  debts: DebtProfile,
  debtGoalDeleted?: boolean,
): Goal[] {
  const existingDebtGoal = goals.find((goal) => goal.id === DEBT_GOAL_ID);
  const goalsWithoutDebt = goals.filter((goal) => goal.id !== DEBT_GOAL_ID);

  if (!hasDebt(debts) || debtGoalDeleted) {
    return goalsWithoutDebt;
  }

  const activeCount = goalsWithoutDebt.filter((goal) => goal.status !== 'complete').length;

  return [makeDebtGoal(debts, existingDebtGoal, activeCount + 1), ...goalsWithoutDebt];
}

/** Keep active goal priorities contiguous (1..N) after add/remove/reorder actions. */
export function normalizeActiveGoalPriorities(goals: Goal[]): Goal[] {
  const activeGoals = goals
    .filter((g) => g.status !== 'complete')
    .slice()
    .sort(
      (a, b) => (a.priority || Number.MAX_SAFE_INTEGER) - (b.priority || Number.MAX_SAFE_INTEGER),
    );

  const priorityById = new Map<string, number>();
  activeGoals.forEach((goal, index) => {
    priorityById.set(goal.id, index + 1);
  });

  return goals.map((goal) => {
    const nextPriority = priorityById.get(goal.id);
    return typeof nextPriority === 'number'
      ? { ...goal, priority: nextPriority }
      : { ...goal, priority: 0 };
  });
}

export function removeDecisionFromQueue(
  pendingGoalDecisions: GoalCompletionDecision[],
  goalId: string,
): GoalCompletionDecision[] {
  return pendingGoalDecisions.filter((decision) => decision.goalId !== goalId);
}

export function upsertDecision(
  pendingGoalDecisions: GoalCompletionDecision[],
  nextDecision: GoalCompletionDecision,
): GoalCompletionDecision[] {
  const existingIndex = pendingGoalDecisions.findIndex(
    (decision) => decision.goalId === nextDecision.goalId,
  );

  if (existingIndex === -1) {
    return [...pendingGoalDecisions, nextDecision];
  }

  const copy = pendingGoalDecisions.slice();
  copy[existingIndex] = nextDecision;
  return copy;
}
