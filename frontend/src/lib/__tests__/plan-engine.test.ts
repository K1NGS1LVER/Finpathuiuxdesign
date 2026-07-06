import { describe, it, expect } from 'vitest';
import { generatePlan, generateScenarioPlan } from '../plan-engine';
import type { IncomeProfile, ExpenseProfile, DebtProfile, Goal } from '../types';

function makeIncome(overrides: Partial<IncomeProfile> = {}): IncomeProfile {
  return {
    primary: 50000,
    secondary: 0,
    passive: 0,
    variablePercent: 0,
    variable: 0,
    total: 50000,
    primaryIncrement: 0,
    secondaryIncrement: 0,
    passiveIncrement: 0,
    netRate: 1,
    // 0 = unset: the engines fall back to `total` (netMonthly || total),
    // which keeps these fixtures driven by the `total` overrides.
    netMonthly: 0,
    ...overrides,
  };
}

function makeExpenses(overrides: Partial<ExpenseProfile> = {}): ExpenseProfile {
  return {
    rent: 10000,
    food: 5000,
    transport: 3000,
    utilities: 2000,
    entertainment: 2000,
    other: 3000,
    total: 25000,
    ...overrides,
  };
}

function makeDebts(overrides: Partial<DebtProfile> = {}): DebtProfile {
  return {
    items: [],
    totalMonthly: 0,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    name: 'Emergency Fund',
    icon: 'Shield',
    category: 'savings',
    targetAmount: 100000,
    currentAmount: 0,
    timelineMonths: 12,
    priority: 1,
    status: 'not-started',
    monthlyAllocation: 0,
    color: '#10b981',
    ...overrides,
  };
}

describe('generatePlan', () => {
  it('produces a months array with at least one entry', () => {
    const plan = generatePlan({
      income: makeIncome(),
      expenses: makeExpenses(),
      debts: makeDebts(),
      goals: [makeGoal()],
      savings: 0,
      investments: 0,
    });
    expect(plan.months.length).toBeGreaterThan(0);
    expect(plan.totalMonths).toBe(plan.months.length);
  });

  it('computes surplus correctly with expense-debt deduplication', () => {
    const plan = generatePlan({
      income: makeIncome({ total: 60000 }),
      expenses: makeExpenses({ total: 20000 }),
      debts: makeDebts({ totalMonthly: 5000, items: [] }),
      goals: [makeGoal()],
      savings: 0,
      investments: 0,
    });
    const month0 = plan.months[0];
    expect(month0.surplus).toBe(40000);
    expect(month0.debtPayments).toBe(5000);
  });

  it('allocates surplus to active goals and records recommended allocations', () => {
    const plan = generatePlan({
      income: makeIncome({ total: 80000 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts(),
      goals: [makeGoal({ targetAmount: 500000, id: 'g1' })],
      savings: 0,
      investments: 0,
    });
    const alloc = plan.recommendedAllocations['g1'];
    expect(alloc).toBeGreaterThan(0);
    expect(plan.months[0].goalAllocations['g1']).toBe(alloc);
  });

  it('skips completed goals', () => {
    const plan = generatePlan({
      income: makeIncome({ total: 80000 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts(),
      goals: [makeGoal({ status: 'complete', id: 'g1' }), makeGoal({ id: 'g2', targetAmount: 200000 })],
      savings: 0,
      investments: 0,
    });
    expect(plan.recommendedAllocations['g1']).toBeUndefined();
    expect(plan.recommendedAllocations['g2']).toBeGreaterThan(0);
  });

  it('skips debt-category goals in allocation (they track separate payments)', () => {
    const plan = generatePlan({
      income: makeIncome({ total: 80000 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts(),
      goals: [makeGoal({ category: 'debt', id: 'debt-g', monthlyAllocation: 5000 })],
      savings: 0,
      investments: 0,
    });
    expect(plan.recommendedAllocations['debt-g']).toBeUndefined();
  });

  it('records a goal completion date when a goal is fully funded', () => {
    const plan = generatePlan({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 20000 }),
      debts: makeDebts(),
      goals: [makeGoal({ targetAmount: 10000, id: 'g1' })],
      savings: 0,
      investments: 0,
    });
    expect(plan.goalCompletionDates['g1']).toBeDefined();
  });

  it('emits a completion milestone when a goal is fully funded', () => {
    const plan = generatePlan({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 20000 }),
      debts: makeDebts(),
      goals: [makeGoal({ targetAmount: 10000, name: 'EF' })],
      savings: 0,
      investments: 0,
    });
    const milestoneMonth = plan.months.find(m => m.milestones.some(ms => ms.includes('EF completed')));
    expect(milestoneMonth).toBeDefined();
  });

  it('emits a debt-over-income warning milestone when debt payments exceed available income', () => {
    const plan = generatePlan({
      income: makeIncome({ total: 30000 }),
      expenses: makeExpenses({ total: 25000 }),
      debts: makeDebts({ totalMonthly: 10000, items: [] }),
      goals: [makeGoal()],
      savings: 0,
      investments: 0,
    });
    expect(plan.months[0].milestones.some(m => m.includes('Warning'))).toBe(true);
  });

  it('respects monthlySurplusReserve and reduces goal allocation', () => {
    const planNoReserve = generatePlan({
      income: makeIncome({ total: 80000 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts(),
      goals: [makeGoal({ id: 'g1' })],
      savings: 0,
      investments: 0,
    });
    const planWithReserve = generatePlan({
      income: makeIncome({ total: 80000 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts(),
      goals: [makeGoal({ id: 'g1' })],
      savings: 0,
      investments: 0,
      monthlySurplusReserve: 10000,
    });
    expect(planWithReserve.months[0].reservedSurplus).toBe(10000);
    expect(planWithReserve.recommendedAllocations['g1']).toBeLessThan(planNoReserve.recommendedAllocations['g1']);
  });

  it('caps allocatable surplus to base when stepUpEnabled is false', () => {
    const plan = generatePlan({
      income: makeIncome({ total: 80000, primaryIncrement: 10 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts(),
      goals: [makeGoal()],
      savings: 0,
      investments: 0,
      stepUpEnabled: false,
    });
    const month0Alloc = plan.months[0].goalAllocations['goal-1'] || 0;
    const month12 = plan.months[12];
    if (month12) {
      const month12Alloc = month12.goalAllocations['goal-1'] || 0;
      expect(month12Alloc).toBeLessThanOrEqual(month0Alloc + 1);
    }
  });

  it('allows growing allocation when stepUpEnabled is true and income increments', () => {
    const plan = generatePlan({
      income: makeIncome({ total: 80000, primary: 80000, primaryIncrement: 20 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts(),
      goals: [makeGoal({ targetAmount: 99999999 })],
      savings: 0,
      investments: 0,
      stepUpEnabled: true,
    });
    const month0Alloc = plan.months[0].goalAllocations['goal-1'] || 0;
    const month12 = plan.months[12];
    if (month12) {
      const month12Alloc = month12.goalAllocations['goal-1'] || 0;
      expect(month12Alloc).toBeGreaterThan(month0Alloc);
    }
  });

  it('applies annual income increment at month 12', () => {
    const plan = generatePlan({
      income: makeIncome({ total: 60000, primary: 60000, primaryIncrement: 10 }),
      expenses: makeExpenses({ total: 20000 }),
      debts: makeDebts(),
      goals: [makeGoal({ targetAmount: 99999999 })],
      savings: 0,
      investments: 0,
    });
    expect(plan.months[12].income).toBeGreaterThan(plan.months[11].income);
  });

  it('stops early when all goals complete', () => {
    const plan = generatePlan({
      income: makeIncome({ total: 200000 }),
      expenses: makeExpenses({ total: 10000 }),
      debts: makeDebts(),
      goals: [makeGoal({ targetAmount: 5000 })],
      savings: 0,
      investments: 0,
    });
    expect(plan.totalMonths).toBeLessThan(120);
  });

  it('computes cumulative savings from unallocated surplus', () => {
    const plan = generatePlan({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts(),
      goals: [makeGoal({ targetAmount: 1 })],
      savings: 0,
      investments: 0,
    });
    expect(plan.months[0].cumulativeSavings).toBeGreaterThanOrEqual(0);
  });
});

describe('generateScenarioPlan', () => {
  const baseInput = {
    income: makeIncome({ total: 60000, primary: 50000, secondary: 5000, passive: 5000 }),
    expenses: makeExpenses({ total: 20000 }),
    debts: makeDebts(),
    goals: [makeGoal()],
    savings: 0,
    investments: 0,
  };

  it('scales all income fields by percentage', () => {
    const plan = generateScenarioPlan(baseInput, { incomeChange: 10 });
    const month0 = plan.months[0];
    expect(month0.income).toBeGreaterThan(baseInput.income.total);
  });

  it('scales all expense fields by percentage', () => {
    const plan = generateScenarioPlan(baseInput, { expenseChange: 20 });
    const month0 = plan.months[0];
    expect(month0.expenses).toBeGreaterThan(baseInput.expenses.total);
  });

  it('adjusts goal timeline with timelineChange', () => {
    const plan = generateScenarioPlan(baseInput, { timelineChange: 6 });
    expect(plan.months.length).toBeGreaterThan(0);
  });

  it('enforces minimum timeline of 1 month on goals', () => {
    const input = {
      ...baseInput,
      goals: [makeGoal({ timelineMonths: 2 })],
    };
    const plan = generateScenarioPlan(input, { timelineChange: -5 });
    expect(plan.months.length).toBeGreaterThan(0);
  });

  it('applies combined modifications', () => {
    const plan = generateScenarioPlan(baseInput, { incomeChange: 5, expenseChange: -10, timelineChange: 3 });
    expect(plan.months.length).toBeGreaterThan(0);
    expect(plan.months[0].income).toBeGreaterThan(baseInput.income.total);
  });
});
