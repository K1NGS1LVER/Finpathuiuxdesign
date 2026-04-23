// ============================================================
// FinPath — Month-by-Month Plan Generation Engine
// THE CENTREPIECE: Everything depends on this.
// ============================================================

import type { IncomeProfile, ExpenseProfile, DebtProfile, Goal, MonthlyPlan, FinancialPlan } from './types';

interface PlanInput {
  income: IncomeProfile;
  expenses: ExpenseProfile;
  debts: DebtProfile;
  goals: Goal[];
  savings: number;
  investments: number;
}

/**
 * Format a month offset to a readable date string
 */
function monthToDateStr(offset: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/**
 * Allocate surplus across goals based on priority and timeline
 * Uses a weighted allocation that respects priority but also urgency
 */
function allocateSurplus(
  surplus: number,
  goals: Goal[]
): Record<string, number> {
  const allocations: Record<string, number> = {};

  // Only allocate to non-complete goals
  const activeGoals = goals.filter(g => g.status !== 'complete');
  if (activeGoals.length === 0 || surplus <= 0) return allocations;

  // Calculate weight for each goal based on priority and urgency
  const weights: Record<string, number> = {};
  let totalWeight = 0;

  for (const goal of activeGoals) {
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    if (remaining <= 0) continue;

    // Priority weight: higher priority (lower number) = more weight
    const priorityWeight = 1 / (goal.priority || 1);

    // Urgency weight: shorter timeline = more urgent
    const urgencyWeight = goal.timelineMonths > 0
      ? 1 / Math.sqrt(goal.timelineMonths)
      : 0.5;

    // Combined weight
    const weight = priorityWeight * urgencyWeight;
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

/**
 * Generate a complete month-by-month financial plan
 */
export function generatePlan(input: PlanInput): FinancialPlan {
  const { income, expenses, debts, goals, savings, investments } = input;

  const monthlySurplus = income.total - expenses.total - debts.totalMonthly;
  const maxMonths = 120; // Cap at 10 years
  const months: MonthlyPlan[] = [];
  const goalCompletionDates: Record<string, string> = {};

  // Track running state
  let cumulativeSavings = savings;
  let cumulativeInvestments = investments;
  const goalProgress: Record<string, number> = {};

  // Initialize goal progress
  for (const goal of goals) {
    goalProgress[goal.id] = goal.currentAmount;
  }

  // Determine recommended monthly allocations
  const recommendedAllocations = allocateSurplus(
    Math.max(0, monthlySurplus),
    goals
  );

  // Check if all goals are complete
  const allGoalsComplete = () =>
    goals.every(g => goalProgress[g.id] >= g.targetAmount || g.status === 'complete');

  for (let m = 0; m < maxMonths; m++) {
    const milestones: string[] = [];

    // Available surplus this month
    const surplus = Math.max(0, monthlySurplus);

    // Allocate to goals
    const allocations = allocateSurplus(surplus, goals.map(g => ({
      ...g,
      currentAmount: goalProgress[g.id],
    })));

    // Apply allocations and check for completions
    let totalAllocated = 0;
    for (const goal of goals) {
      const allocation = allocations[goal.id] || 0;
      goalProgress[goal.id] += allocation;
      totalAllocated += allocation;

      // Check if goal just completed
      if (goalProgress[goal.id] >= goal.targetAmount && !goalCompletionDates[goal.id]) {
        goalProgress[goal.id] = goal.targetAmount;
        goalCompletionDates[goal.id] = monthToDateStr(m + 1);
        milestones.push(`🎉 ${goal.name} completed!`);
      }
    }

    // Remaining surplus goes to general savings
    const unallocatedSurplus = surplus - totalAllocated;
    cumulativeSavings += Math.max(0, unallocatedSurplus);

    // Rough net worth estimate (savings + investments + goal progress)
    const totalGoalProgress = Object.values(goalProgress).reduce((a, b) => a + b, 0);
    const netWorth = cumulativeSavings + cumulativeInvestments + totalGoalProgress;

    // Simple investment growth (assumed 12% annual)
    cumulativeInvestments *= 1.01; // ~1% monthly

    months.push({
      month: m,
      date: monthToDateStr(m + 1),
      income: income.total,
      expenses: expenses.total,
      debtPayments: debts.totalMonthly,
      surplus,
      goalAllocations: { ...allocations },
      milestones,
      cumulativeSavings: Math.round(cumulativeSavings),
      netWorth: Math.round(netWorth),
    });

    // Stop if all goals complete and we have 6 months buffer data
    if (allGoalsComplete()) {
      // Add 3 more months of buffer data then stop
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

/**
 * Re-run plan with modified inputs (for scenario analysis)
 */
export function generateScenarioPlan(
  baseInput: PlanInput,
  modifications: {
    incomeChange?: number; // Percentage
    expenseChange?: number; // Percentage
    timelineChange?: number; // Months to add/subtract
  }
): FinancialPlan {
  const modifiedInput = { ...baseInput };

  if (modifications.incomeChange !== undefined) {
    const factor = 1 + modifications.incomeChange / 100;
    modifiedInput.income = {
      ...baseInput.income,
      salary: Math.round(baseInput.income.salary * factor),
      freelance: Math.round(baseInput.income.freelance * factor),
      passive: Math.round(baseInput.income.passive * factor),
      total: Math.round(baseInput.income.total * factor),
    };
  }

  if (modifications.expenseChange !== undefined) {
    const factor = 1 + modifications.expenseChange / 100;
    modifiedInput.expenses = {
      ...baseInput.expenses,
      rent: Math.round(baseInput.expenses.rent * factor),
      food: Math.round(baseInput.expenses.food * factor),
      transport: Math.round(baseInput.expenses.transport * factor),
      utilities: Math.round(baseInput.expenses.utilities * factor),
      entertainment: Math.round(baseInput.expenses.entertainment * factor),
      other: Math.round(baseInput.expenses.other * factor),
      total: Math.round(baseInput.expenses.total * factor),
    };
  }

  if (modifications.timelineChange !== undefined) {
    modifiedInput.goals = baseInput.goals.map(g => ({
      ...g,
      timelineMonths: Math.max(1, g.timelineMonths + modifications.timelineChange!),
    }));
  }

  return generatePlan(modifiedInput);
}
