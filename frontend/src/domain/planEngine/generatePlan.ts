/**
 * generatePlan is a pure function — same input always produces same output.
 * This makes it independently testable, easy to move to a worker thread if
 * performance becomes an issue, and decoupled from the UI state container.
 *
 * In a production version, this would be triggered by a domain event bus
 * rather than called directly from the store.
 */

import type {
  IncomeProfile,
  ExpenseProfile,
  DebtProfile,
  Goal,
  MonthlyPlan,
  FinancialPlan,
  InvestmentStrategy,
} from '@/lib/types';

export interface PlanInput {
  income: IncomeProfile;
  expenses: ExpenseProfile;
  debts: DebtProfile;
  goals: Goal[];
  savings: number;
  investments: number;
  strategy?: InvestmentStrategy;
  monthlySurplusReserve?: number;
  pendingReallocationReserve?: number;
  stepUpEnabled?: boolean;
  /** Annual % return on `investments` (driven by Scenarios risk profile). */
  investmentReturnRate?: number;
}

/** Format a month offset to a readable date string */
function monthToDateStr(offset: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/**
 * Allocate surplus across goals based on priority and timeline.
 * Uses a weighted allocation that respects priority but also urgency.
 */
function allocateSurplus(
  surplus: number,
  goals: Goal[],
  strategy: InvestmentStrategy = 'avalanche',
): Record<string, number> {
  const allocations: Record<string, number> = {};

  // Debt goals track required debt payments that are already removed from surplus.
  const activeGoals = goals.filter((g) => g.status !== 'complete' && g.category !== 'debt');
  if (activeGoals.length === 0 || surplus <= 0) return allocations;

  // Calculate weight for each goal based on strategy, priority and urgency
  const weights: Record<string, number> = {};
  let totalWeight = 0;

  for (const goal of activeGoals) {
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    if (remaining <= 0) continue;

    // Priority weight: higher priority (lower number) = more weight
    const priorityWeight = 1 / (goal.priority || 1);

    // Urgency weight: shorter timeline = more urgent
    const urgencyWeight = goal.timelineMonths > 0 ? 1 / Math.sqrt(goal.timelineMonths) : 0.5;

    // Strategy modifier
    let strategyModifier = 1;
    if (strategy === 'snowball') {
      // Snowball: prioritize smaller remaining balances (quick wins)
      strategyModifier = 100000 / (remaining + 1000);
    } else if (strategy === 'avalanche') {
      // Avalanche: prioritize high priority and high urgency
      strategyModifier = priorityWeight > 0.5 ? 2 : 1;
    }

    // Combined weight
    const weight = priorityWeight * urgencyWeight * strategyModifier;
    weights[goal.id] = weight;
    totalWeight += weight;
  }

  // Distribute surplus proportionally
  if (totalWeight > 0) {
    for (const goal of activeGoals) {
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      if (remaining <= 0) continue;

      const share = (weights[goal.id] / totalWeight) * surplus;
      // Cap at what's actually needed
      allocations[goal.id] = Math.min(Math.round(share), remaining);
    }
  }

  return allocations;
}

export function generatePlan(input: PlanInput): FinancialPlan {
  const {
    income,
    expenses,
    debts,
    goals,
    savings,
    investments,
    strategy = 'avalanche',
    monthlySurplusReserve = 0,
    pendingReallocationReserve = 0,
    stepUpEnabled = false,
    investmentReturnRate = 12,
  } = input;

  const monthlyInvestmentFactor = 1 + investmentReturnRate / 100 / 12;

  const effectiveIncome = income.netMonthly || income.total;
  const monthlyExpensesDeduplicated = Math.max(0, expenses.total - debts.totalMonthly);
  const monthlySurplus = effectiveIncome - monthlyExpensesDeduplicated - debts.totalMonthly;
  const reservedSurplus = Math.max(0, monthlySurplusReserve);
  const pendingSurplus = Math.max(0, pendingReallocationReserve);
  const availableForGoals = Math.max(0, monthlySurplus - reservedSurplus - pendingSurplus);
  const maxMonths = 120;
  const months: MonthlyPlan[] = [];
  const goalCompletionDates: Record<string, string> = {};

  let cumulativeSavings = savings;
  let cumulativeInvestments = investments;
  let currentIncomeTotal = income.netMonthly || income.total;
  let curPrimary = income.primary;
  let curSecondary = income.secondary;
  let curPassive = income.passive;
  const baseAllocatableSurplus = availableForGoals;
  const goalProgress: Record<string, number> = {};

  for (const goal of goals) {
    goalProgress[goal.id] = goal.currentAmount;
  }

  const recommendedAllocations = allocateSurplus(availableForGoals, goals, strategy);

  const allGoalsComplete = () =>
    goals.every((g) => goalProgress[g.id] >= g.targetAmount || g.status === 'complete');

  const isDebtOverIncome = debts.totalMonthly > effectiveIncome - expenses.total;

  for (let m = 0; m < maxMonths; m++) {
    const milestones: string[] = [];
    if (m === 0 && isDebtOverIncome) {
      milestones.push(
        `Warning: Your debt payments (₹${debts.totalMonthly.toLocaleString('en-IN')}/mo) exceed your available income. Consider restructuring.`,
      );
    }

    if (m > 0 && m % 12 === 0) {
      const pInc = income.primaryIncrement || income.expectedAnnualIncrement || 0;
      const sInc = income.secondaryIncrement || 0;
      const paInc = income.passiveIncrement || 0;
      if (pInc > 0) curPrimary *= 1 + pInc / 100;
      if (sInc > 0) curSecondary *= 1 + sInc / 100;
      if (paInc > 0) curPassive *= 1 + paInc / 100;
      const curVariable = Math.round((curPassive * income.variablePercent) / 100);
      const netRate = income.netRate ?? 1.0;
      currentIncomeTotal =
        Math.round(curPrimary * netRate) + curSecondary + curPassive + curVariable;
      if (pInc > 0 || sInc > 0 || paInc > 0) {
        milestones.push(`Annual income increment applied`);
      }
    }

    const currentMonthlySurplus =
      currentIncomeTotal - monthlyExpensesDeduplicated - debts.totalMonthly;
    const surplus = Math.max(0, currentMonthlySurplus);
    const monthlyReservedSurplus = Math.min(surplus, reservedSurplus);
    const afterReserved = Math.max(0, surplus - monthlyReservedSurplus);
    const monthlyPendingSurplus = Math.min(afterReserved, pendingSurplus);

    let allocatableSurplus = Math.max(0, afterReserved - monthlyPendingSurplus);

    if (!stepUpEnabled) {
      allocatableSurplus = Math.min(allocatableSurplus, baseAllocatableSurplus);
    }

    const allocations = allocateSurplus(
      allocatableSurplus,
      goals.map((g) => ({ ...g, currentAmount: goalProgress[g.id] })),
      strategy,
    );

    let totalAllocated = 0;
    for (const goal of goals) {
      let allocation = allocations[goal.id] || 0;
      if (goal.category === 'debt') {
        allocation += goal.monthlyAllocation;
      }
      goalProgress[goal.id] += allocation;
      totalAllocated += goal.category === 'debt' ? 0 : allocation;

      if (goalProgress[goal.id] >= goal.targetAmount && !goalCompletionDates[goal.id]) {
        goalProgress[goal.id] = goal.targetAmount;
        goalCompletionDates[goal.id] = monthToDateStr(m + 1);
        milestones.push(`${goal.name} completed!`);
      }
    }

    const unallocatedSurplus = allocatableSurplus - totalAllocated;
    cumulativeSavings += Math.max(0, unallocatedSurplus);
    cumulativeSavings += monthlyReservedSurplus;

    cumulativeInvestments *= monthlyInvestmentFactor;

    let nonDebtGoalProgress = 0;
    let outstandingDebt = 0;
    for (const goal of goals) {
      if (goal.category === 'debt') {
        outstandingDebt += Math.max(0, goal.targetAmount - goalProgress[goal.id]);
      } else {
        nonDebtGoalProgress += goalProgress[goal.id];
      }
    }
    const netWorth =
      cumulativeSavings + cumulativeInvestments + nonDebtGoalProgress - outstandingDebt;

    months.push({
      month: m,
      date: monthToDateStr(m + 1),
      income: currentIncomeTotal,
      expenses: expenses.total,
      debtPayments: debts.totalMonthly,
      surplus,
      reservedSurplus: monthlyReservedSurplus,
      pendingSurplus: monthlyPendingSurplus,
      goalAllocations: { ...allocations },
      milestones,
      cumulativeSavings: Math.round(cumulativeSavings),
      netWorth: Math.round(netWorth),
    });

    if (allGoalsComplete()) {
      if (months.length > Object.keys(goalCompletionDates).length + 3) break;
    }
  }

  return {
    months,
    totalMonths: months.length,
    goalCompletionDates,
    recommendedAllocations,
  };
}
