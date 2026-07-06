import { describe, it, expect } from 'vitest';
import { generatePlan } from './generatePlan';
import type { IncomeProfile, ExpenseProfile, DebtProfile, Goal } from '../../lib/types';

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

describe('generatePlan (pure function)', () => {
  it('produces the same output for the same input (determinism)', () => {
    const input = {
      income: makeIncome(),
      expenses: makeExpenses(),
      debts: makeDebts(),
      goals: [makeGoal()],
      savings: 0,
      investments: 0,
    };

    const planA = generatePlan(input);
    const planB = generatePlan(input);

    expect(planA).toEqual(planB);
  });

  it('returns a valid plan when goals array is empty', () => {
    const plan = generatePlan({
      income: makeIncome(),
      expenses: makeExpenses(),
      debts: makeDebts(),
      goals: [],
      savings: 0,
      investments: 0,
    });

    expect(Array.isArray(plan.months)).toBe(true);
    expect(plan.months.length).toBeGreaterThan(0);
    expect(plan.totalMonths).toBeGreaterThanOrEqual(0);
    expect(plan.goalCompletionDates).toEqual({});
    expect(plan.months[0]).toHaveProperty('surplus');
  });

  it('higher monthly surplus reduces totalMonths to goal completion', () => {
    const goal = makeGoal({ id: 'g1', targetAmount: 120000, timelineMonths: 24 });

    // ₹40k/mo surplus
    const planHighSurplus = generatePlan({
      income: makeIncome({ primary: 80000, total: 80000 }),
      expenses: makeExpenses({ total: 40000 }),
      debts: makeDebts(),
      goals: [{ ...goal }],
      savings: 0,
      investments: 0,
    });

    // ₹20k/mo surplus
    const planLowSurplus = generatePlan({
      income: makeIncome({ primary: 60000, total: 60000 }),
      expenses: makeExpenses({ total: 40000 }),
      debts: makeDebts(),
      goals: [{ ...goal }],
      savings: 0,
      investments: 0,
    });

    expect(planHighSurplus.totalMonths).toBeLessThan(planLowSurplus.totalMonths);
  });
});
