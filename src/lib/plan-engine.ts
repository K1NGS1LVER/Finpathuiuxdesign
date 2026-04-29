// ============================================================
// FinPath — Month-by-Month Plan Generation Engine
// THE CENTREPIECE: Everything depends on this.
// ============================================================

import type {
  IncomeProfile,
  ExpenseProfile,
  DebtProfile,
  Goal,
  MonthlyPlan,
  FinancialPlan,
  InvestmentStrategy,
} from "./types";

interface PlanInput {
  income: IncomeProfile;
  expenses: ExpenseProfile;
  debts: DebtProfile;
  goals: Goal[];
  savings: number;
  investments: number;
  strategy?: InvestmentStrategy;
  monthlySurplusReserve?: number;
  pendingReallocationReserve?: number;
}

/**
 * Format a month offset to a readable date string
 */
function monthToDateStr(offset: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

/**
 * Allocate surplus across goals based on priority and timeline
 * Uses a weighted allocation that respects priority but also urgency
 */
function allocateSurplus(
  surplus: number,
  goals: Goal[],
  strategy: InvestmentStrategy = "avalanche",
): Record<string, number> {
  const allocations: Record<string, number> = {};

  // Debt goals track required debt payments that are already removed from surplus.
  const activeGoals = goals.filter(
    (g) => g.status !== "complete" && g.category !== "debt",
  );
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
    const urgencyWeight =
      goal.timelineMonths > 0 ? 1 / Math.sqrt(goal.timelineMonths) : 0.5;

    // Strategy modifier
    let strategyModifier = 1;
    if (strategy === "snowball") {
      // Snowball: prioritize smaller remaining balances (quick wins)
      strategyModifier = 100000 / (remaining + 1000);
    } else if (strategy === "avalanche") {
      // Avalanche: prioritize high priority and high urgency (or debt if we had debt mixed here)
      // Usually avalanche is highest interest, but for goals we can map it to strict priority
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

/**
 * Generate a complete month-by-month financial plan
 */
export function generatePlan(input: PlanInput): FinancialPlan {
  const {
    income,
    expenses,
    debts,
    goals,
    savings,
    investments,
    strategy = "avalanche",
    monthlySurplusReserve = 0,
    pendingReallocationReserve = 0,
  } = input;

  const monthlySurplus = income.total - expenses.total - debts.totalMonthly;
  const reservedSurplus = Math.max(0, monthlySurplusReserve);
  const pendingSurplus = Math.max(0, pendingReallocationReserve);
  const availableForGoals = Math.max(
    0,
    monthlySurplus - reservedSurplus - pendingSurplus,
  );
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
    availableForGoals,
    goals,
    strategy,
  );

  // Check if all goals are complete
  const allGoalsComplete = () =>
    goals.every(
      (g) => goalProgress[g.id] >= g.targetAmount || g.status === "complete",
    );

  // Edge case: debt payments exceed available income
  const isDebtOverIncome = debts.totalMonthly > income.total - expenses.total;

  for (let m = 0; m < maxMonths; m++) {
    const milestones: string[] = [];
    if (m === 0 && isDebtOverIncome) {
      milestones.push(`Warning: Your debt payments (₹${debts.totalMonthly.toLocaleString("en-IN")}/mo) exceed your available income. Consider restructuring.`);
    }

    // Available surplus this month
    const surplus = Math.max(0, monthlySurplus);
    const monthlyReservedSurplus = Math.min(surplus, reservedSurplus);
    const afterReserved = Math.max(0, surplus - monthlyReservedSurplus);
    const monthlyPendingSurplus = Math.min(afterReserved, pendingSurplus);
    const allocatableSurplus = Math.max(
      0,
      afterReserved - monthlyPendingSurplus,
    );

    // Allocate to goals
    const allocations = allocateSurplus(
      allocatableSurplus,
      goals.map((g) => ({ ...g, currentAmount: goalProgress[g.id] })),
      strategy,
    );

    // Apply allocations and check for completions
    let totalAllocated = 0;
    for (const goal of goals) {
      const allocation = allocations[goal.id] || 0;
      goalProgress[goal.id] += allocation;
      totalAllocated += allocation;

      // Check if goal just completed
      if (
        goalProgress[goal.id] >= goal.targetAmount &&
        !goalCompletionDates[goal.id]
      ) {
        goalProgress[goal.id] = goal.targetAmount;
        goalCompletionDates[goal.id] = monthToDateStr(m + 1);
        milestones.push(`${goal.name} completed!`);
      }
    }

    // Remaining surplus goes to general savings
    const unallocatedSurplus = allocatableSurplus - totalAllocated;
    cumulativeSavings += Math.max(0, unallocatedSurplus);
    cumulativeSavings += monthlyReservedSurplus;

    // Rough net worth estimate (savings + investments + goal progress)
    const totalGoalProgress = Object.values(goalProgress).reduce(
      (a, b) => a + b,
      0,
    );
    const netWorth =
      cumulativeSavings + cumulativeInvestments + totalGoalProgress;

    // Simple investment growth (assumed 12% annual)
    cumulativeInvestments *= 1.01; // ~1% monthly

    months.push({
      month: m,
      date: monthToDateStr(m + 1),
      income: income.total,
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
  },
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
    modifiedInput.goals = baseInput.goals.map((g) => ({
      ...g,
      timelineMonths: Math.max(
        1,
        g.timelineMonths + modifications.timelineChange!,
      ),
    }));
  }

  return generatePlan(modifiedInput);
}
