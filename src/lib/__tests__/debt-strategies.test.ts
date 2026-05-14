import { describe, it, expect } from 'vitest';
import { avalanche, snowball, compareStrategies } from '../debt-strategies';
import type { DebtItem } from '../types';

function makeDebt(overrides: Partial<DebtItem> = {}): DebtItem {
  return {
    id: 'debt-1',
    name: 'Personal Loan',
    category: 'personalLoan',
    principal: 100000,
    interestRate: 12,
    monthlyPayment: 5000,
    remainingMonths: 20,
    ...overrides,
  };
}

describe('avalanche', () => {
  it('returns empty result for empty debts array', () => {
    const result = avalanche([]);
    expect(result.totalMonths).toBe(0);
    expect(result.totalInterestPaid).toBe(0);
    expect(result.totalPaid).toBe(0);
    expect(result.steps).toHaveLength(0);
    expect(result.payoffDates).toEqual({});
  });

  it('pays off a single debt', () => {
    const result = avalanche([makeDebt()]);
    expect(result.totalMonths).toBeGreaterThan(0);
    expect(result.payoffDates['debt-1']).toBeDefined();
  });

  it('sorts debts by highest interest rate first', () => {
    const low = makeDebt({ id: 'low', name: 'Low Rate', interestRate: 5, principal: 50000, monthlyPayment: 5000 });
    const high = makeDebt({ id: 'high', name: 'High Rate', interestRate: 24, principal: 50000, monthlyPayment: 5000 });
    const result = avalanche([low, high], 2000);

    const month1Steps = result.steps.filter(s => s.month === 1);
    const highStep = month1Steps.find(s => s.debtId === 'high');
    const lowStep = month1Steps.find(s => s.debtId === 'low');
    expect(highStep).toBeDefined();
    expect(lowStep).toBeDefined();
    expect(highStep!.payment).toBeGreaterThanOrEqual(lowStep!.payment);
  });

  it('finishes sooner with extra monthly payment', () => {
    const debts = [makeDebt({ principal: 200000, monthlyPayment: 5000 })];
    const noExtra = avalanche(debts, 0);
    const withExtra = avalanche(debts, 5000);
    expect(withExtra.totalMonths).toBeLessThan(noExtra.totalMonths);
  });

  it('pays less total interest with extra payments', () => {
    const debts = [makeDebt({ principal: 200000, interestRate: 15, monthlyPayment: 5000 })];
    const noExtra = avalanche(debts, 0);
    const withExtra = avalanche(debts, 5000);
    expect(withExtra.totalInterestPaid).toBeLessThan(noExtra.totalInterestPaid);
  });

  it('sets strategy to "avalanche"', () => {
    const result = avalanche([makeDebt()]);
    expect(result.strategy).toBe('avalanche');
  });
});

describe('snowball', () => {
  it('returns empty result for empty debts array', () => {
    const result = snowball([]);
    expect(result.totalMonths).toBe(0);
    expect(result.steps).toHaveLength(0);
  });

  it('pays off a single debt', () => {
    const result = snowball([makeDebt()]);
    expect(result.payoffDates['debt-1']).toBeDefined();
  });

  it('sorts debts by smallest balance first', () => {
    const small = makeDebt({ id: 'small', name: 'Small', principal: 20000, interestRate: 5, monthlyPayment: 3000 });
    const big = makeDebt({ id: 'big', name: 'Big', principal: 200000, interestRate: 5, monthlyPayment: 3000 });
    const result = snowball([small, big], 2000);

    const smallPayoff = result.payoffDates['small'];
    const bigPayoff = result.payoffDates['big'];
    expect(smallPayoff).toBeDefined();
    expect(bigPayoff).toBeDefined();
    expect(smallPayoff).toBeLessThan(bigPayoff);
  });

  it('sets strategy to "snowball"', () => {
    const result = snowball([makeDebt()]);
    expect(result.strategy).toBe('snowball');
  });
});

describe('compareStrategies', () => {
  it('returns both avalanche and snowball results', () => {
    const debts = [
      makeDebt({ id: 'd1', principal: 50000, interestRate: 10, monthlyPayment: 3000 }),
      makeDebt({ id: 'd2', principal: 100000, interestRate: 20, monthlyPayment: 5000 }),
    ];
    const comparison = compareStrategies(debts, 2000);
    expect(comparison.avalanche.strategy).toBe('avalanche');
    expect(comparison.snowball.strategy).toBe('snowball');
  });

  it('avalanche total interest is less than or equal to snowball', () => {
    const debts = [
      makeDebt({ id: 'd1', principal: 50000, interestRate: 5, monthlyPayment: 3000 }),
      makeDebt({ id: 'd2', principal: 100000, interestRate: 20, monthlyPayment: 5000 }),
    ];
    const comparison = compareStrategies(debts, 1000);
    expect(comparison.avalanche.totalInterestPaid).toBeLessThanOrEqual(comparison.snowball.totalInterestPaid);
  });

  it('computes interestSaved as snowball minus avalanche interest', () => {
    const debts = [
      makeDebt({ id: 'd1', principal: 50000, interestRate: 5, monthlyPayment: 3000 }),
      makeDebt({ id: 'd2', principal: 100000, interestRate: 20, monthlyPayment: 5000 }),
    ];
    const comparison = compareStrategies(debts, 1000);
    expect(comparison.interestSaved).toBe(comparison.snowball.totalInterestPaid - comparison.avalanche.totalInterestPaid);
  });

  it('computes monthsDifference as snowball minus avalanche months', () => {
    const debts = [
      makeDebt({ id: 'd1', principal: 50000, interestRate: 5, monthlyPayment: 3000 }),
      makeDebt({ id: 'd2', principal: 100000, interestRate: 20, monthlyPayment: 5000 }),
    ];
    const comparison = compareStrategies(debts, 1000);
    expect(comparison.monthsDifference).toBe(comparison.snowball.totalMonths - comparison.avalanche.totalMonths);
  });

  it('recommends avalanche when it saves interest', () => {
    const debts = [
      makeDebt({ id: 'd1', principal: 50000, interestRate: 5, monthlyPayment: 3000 }),
      makeDebt({ id: 'd2', principal: 100000, interestRate: 24, monthlyPayment: 5000 }),
    ];
    const comparison = compareStrategies(debts, 2000);
    if (comparison.avalanche.totalInterestPaid < comparison.snowball.totalInterestPaid) {
      expect(comparison.recommendation).toBe('avalanche');
    }
  });

  it('handles empty debts gracefully', () => {
    const comparison = compareStrategies([], 0);
    expect(comparison.avalanche.totalMonths).toBe(0);
    expect(comparison.snowball.totalMonths).toBe(0);
    expect(comparison.interestSaved).toBe(0);
  });
});
