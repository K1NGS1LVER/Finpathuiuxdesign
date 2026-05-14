import { describe, it, expect } from 'vitest';
import { calculateHealthScore } from '../health-score';
import type { IncomeProfile, ExpenseProfile, DebtProfile } from '../types';

function makeIncome(overrides: Partial<IncomeProfile> = {}): IncomeProfile {
  return {
    primary: 80000,
    secondary: 20000,
    passive: 10000,
    variablePercent: 10,
    variable: 1000,
    total: 111000,
    primaryIncrement: 0,
    secondaryIncrement: 0,
    passiveIncrement: 0,
    ...overrides,
  };
}

function makeExpenses(overrides: Partial<ExpenseProfile> = {}): ExpenseProfile {
  return {
    rent: 15000,
    food: 8000,
    transport: 5000,
    utilities: 3000,
    entertainment: 2000,
    other: 2000,
    total: 35000,
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

describe('calculateHealthScore', () => {
  it('returns a near-perfect score for a healthy profile', () => {
    const result = calculateHealthScore({
      income: makeIncome(),
      expenses: makeExpenses({ total: 35000 }),
      debts: makeDebts({ totalMonthly: 5000 }),
      savings: 500000,
      investments: 500000,
      emergencyFund: 300000,
    });
    expect(result.overall).toBeGreaterThanOrEqual(85);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it('returns near-zero score for zero income with no emergency fund', () => {
    const result = calculateHealthScore({
      income: makeIncome({ primary: 0, secondary: 0, passive: 0, variable: 0, variablePercent: 0, total: 0 }),
      expenses: makeExpenses({ total: 20000 }),
      debts: makeDebts(),
      savings: 0,
      investments: 0,
      emergencyFund: 0,
    });
    expect(result.overall).toBeLessThanOrEqual(5);
  });

  it('scores savings rate 25 when surplus >= 30% of income', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 50000 }),
      debts: makeDebts({ totalMonthly: 5000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.savingsRate).toBe(25);
  });

  it('scores savings rate 20 when surplus is 20-30% of income', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 75000 }),
      debts: makeDebts({ totalMonthly: 10000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.savingsRate).toBe(20);
  });

  it('scores savings rate 12 when surplus is 10-20% of income', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 85000 }),
      debts: makeDebts({ totalMonthly: 10000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.savingsRate).toBe(12);
  });

  it('scores savings rate 5 when surplus is 0-10% of income', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 92000 }),
      debts: makeDebts({ totalMonthly: 10000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.savingsRate).toBe(5);
  });

  it('scores savings rate 0 when expenses exceed income', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 50000 }),
      expenses: makeExpenses({ total: 60000 }),
      debts: makeDebts({ totalMonthly: 20000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 0,
    });
    expect(result.savingsRate).toBe(0);
  });

  it('scores debt load 25 when DTI is 0%', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 50000 }),
      debts: makeDebts({ totalMonthly: 0 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.debtLoad).toBe(25);
  });

  it('scores debt load 22 when DTI < 20%', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 50000 }),
      debts: makeDebts({ totalMonthly: 10000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.debtLoad).toBe(22);
  });

  it('scores debt load 18 when DTI is 20-35%', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 50000 }),
      debts: makeDebts({ totalMonthly: 25000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.debtLoad).toBe(18);
  });

  it('scores debt load 10 when DTI is 35-50%', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 50000 }),
      debts: makeDebts({ totalMonthly: 40000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.debtLoad).toBe(10);
  });

  it('scores debt load 3 when DTI > 50%', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 50000 }),
      debts: makeDebts({ totalMonthly: 60000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.debtLoad).toBe(3);
  });

  it('scores emergency fund 25 when fund >= 6 months expenses', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts({ totalMonthly: 10000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 300000,
    });
    expect(result.emergencyFund).toBe(25);
  });

  it('scores emergency fund 18 when fund covers 3-6 months', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts({ totalMonthly: 10000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 150000,
    });
    expect(result.emergencyFund).toBe(18);
  });

  it('scores emergency fund 10 when fund covers 1-3 months', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts({ totalMonthly: 10000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 35000,
    });
    expect(result.emergencyFund).toBe(10);
  });

  it('scores emergency fund 3 when fund < 1 month expenses', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 50000 }),
      debts: makeDebts({ totalMonthly: 10000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 5000,
    });
    expect(result.emergencyFund).toBe(3);
  });

  it('scores income stability 25 with 3+ income sources', () => {
    const result = calculateHealthScore({
      income: makeIncome(),
      expenses: makeExpenses({ total: 50000 }),
      debts: makeDebts({ totalMonthly: 5000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.incomeStability).toBe(25);
  });

  it('scores income stability 20 with 2 income sources', () => {
    const result = calculateHealthScore({
      income: makeIncome({ passive: 0, variable: 0, variablePercent: 0, total: 100000 }),
      expenses: makeExpenses({ total: 50000 }),
      debts: makeDebts({ totalMonthly: 5000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.incomeStability).toBe(20);
  });

  it('scores income stability 15 with 1 income source', () => {
    const result = calculateHealthScore({
      income: makeIncome({ secondary: 0, passive: 0, variable: 0, variablePercent: 0, total: 80000 }),
      expenses: makeExpenses({ total: 50000 }),
      debts: makeDebts({ totalMonthly: 5000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.incomeStability).toBe(15);
  });

  it('returns "Build your emergency fund" action when emergency score < 18', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts({ totalMonthly: 5000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 5000,
    });
    expect(result.actions.some(a => a.includes('emergency fund'))).toBe(true);
  });

  it('returns "Reduce debt payments" action when debt score < 18', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts({ totalMonthly: 40000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.actions.some(a => a.includes('debt payments'))).toBe(true);
  });

  it('returns "Increase monthly savings" action when savings score < 20', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 100000 }),
      expenses: makeExpenses({ total: 82000 }),
      debts: makeDebts({ totalMonthly: 5000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.actions.some(a => a.includes('savings'))).toBe(true);
  });

  it('returns "Explore a side income" action when income stability < 20', () => {
    const result = calculateHealthScore({
      income: makeIncome({ secondary: 0, passive: 0, variable: 0, variablePercent: 0, total: 50000 }),
      expenses: makeExpenses({ total: 20000 }),
      debts: makeDebts({ totalMonthly: 5000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.actions.some(a => a.includes('side income'))).toBe(true);
  });

  it('returns "great shape" action when all scores are high', () => {
    const result = calculateHealthScore({
      income: makeIncome(),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts({ totalMonthly: 5000 }),
      savings: 500000,
      investments: 500000,
      emergencyFund: 500000,
    });
    expect(result.actions.some(a => a.includes('great shape'))).toBe(true);
  });

  it('caps actions at 3 items', () => {
    const result = calculateHealthScore({
      income: makeIncome({ total: 50000, secondary: 0, passive: 0, variable: 0, variablePercent: 0 }),
      expenses: makeExpenses({ total: 40000 }),
      debts: makeDebts({ totalMonthly: 20000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 1000,
    });
    expect(result.actions.length).toBeLessThanOrEqual(3);
  });

  it('clamps overall score between 0 and 100', () => {
    const result = calculateHealthScore({
      income: makeIncome(),
      expenses: makeExpenses({ total: 30000 }),
      debts: makeDebts({ totalMonthly: 5000 }),
      savings: 0,
      investments: 0,
      emergencyFund: 500000,
    });
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });
});
