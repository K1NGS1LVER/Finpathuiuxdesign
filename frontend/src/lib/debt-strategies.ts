// ============================================================
// FinPath — Debt Payoff Strategy Calculators
// Avalanche (highest interest first) & Snowball (lowest balance first)
// ============================================================

import type { DebtItem } from './types';

export interface PayoffStep {
  month: number;
  date: string;
  debtId: string;
  debtName: string;
  payment: number;
  remainingBalance: number;
  interestPaid: number;
  isPaidOff: boolean;
}

export interface PayoffResult {
  strategy: 'avalanche' | 'snowball';
  totalMonths: number;
  totalInterestPaid: number;
  totalPaid: number;
  steps: PayoffStep[];
  /** Month each debt is paid off */
  payoffDates: Record<string, number>;
}

interface DebtState {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minPayment: number;
}

/**
 * Calculate monthly interest for a debt
 */
function monthlyInterest(balance: number, annualRate: number): number {
  return balance * (annualRate / 100 / 12);
}

/**
 * Format month number to date string
 */
function monthToDate(monthOffset: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/**
 * Run a debt payoff simulation with a given ordering strategy
 */
function simulate(
  debts: DebtItem[],
  extraPayment: number,
  sortFn: (a: DebtState, b: DebtState) => number
): PayoffResult {
  if (debts.length === 0) {
    return {
      strategy: 'avalanche',
      totalMonths: 0,
      totalInterestPaid: 0,
      totalPaid: 0,
      steps: [],
      payoffDates: {},
    };
  }

  // Initialize state
  let activeDebts: DebtState[] = debts.map(d => ({
    id: d.id,
    name: d.name,
    balance: d.principal,
    interestRate: d.interestRate,
    minPayment: d.monthlyPayment,
  }));

  const steps: PayoffStep[] = [];
  const payoffDates: Record<string, number> = {};
  let totalInterestPaid = 0;
  let totalPaid = 0;
  let month = 0;
  const maxMonths = 360; // 30 year safety cap

  while (activeDebts.length > 0 && month < maxMonths) {
    month++;
    
    // Sort debts by strategy
    activeDebts.sort(sortFn);

    // Calculate total minimum payments
    const totalMinPayments = activeDebts.reduce((sum, d) => sum + d.minPayment, 0);
    let available = totalMinPayments + extraPayment;

    for (const debt of activeDebts) {
      // Apply interest
      const interest = monthlyInterest(debt.balance, debt.interestRate);
      debt.balance += interest;
      totalInterestPaid += interest;

      // Pay minimum or remaining balance
      const payment = Math.min(debt.balance, debt.minPayment);
      debt.balance -= payment;
      available -= payment;
      totalPaid += payment;

      steps.push({
        month,
        date: monthToDate(month),
        debtId: debt.id,
        debtName: debt.name,
        payment,
        remainingBalance: Math.max(0, debt.balance),
        interestPaid: interest,
        isPaidOff: debt.balance <= 0.01,
      });
    }

    // Apply extra payment to the priority debt (first in sorted order)
    if (available > 0 && activeDebts.length > 0) {
      const target = activeDebts[0];
      const extraPay = Math.min(target.balance, available);
      target.balance -= extraPay;
      totalPaid += extraPay;

      // Update the last step for this debt
      const lastStep = steps.filter(s => s.month === month && s.debtId === target.id).pop();
      if (lastStep) {
        lastStep.payment += extraPay;
        lastStep.remainingBalance = Math.max(0, target.balance);
        lastStep.isPaidOff = target.balance <= 0.01;
      }
    }

    // Remove paid-off debts
    activeDebts = activeDebts.filter(d => {
      if (d.balance <= 0.01) {
        payoffDates[d.id] = month;
        return false;
      }
      return true;
    });
  }

  return {
    strategy: 'avalanche',
    totalMonths: month,
    totalInterestPaid: Math.round(totalInterestPaid),
    totalPaid: Math.round(totalPaid),
    steps,
    payoffDates,
  };
}

/**
 * Avalanche strategy: Pay highest interest rate debts first
 * Minimizes total interest paid
 */
export function avalanche(debts: DebtItem[], extraMonthlyPayment: number = 0): PayoffResult {
  const result = simulate(
    debts,
    extraMonthlyPayment,
    (a, b) => b.interestRate - a.interestRate // Highest interest first
  );
  result.strategy = 'avalanche';
  return result;
}

/**
 * Snowball strategy: Pay smallest balance debts first
 * Psychologically motivating (quick wins)
 */
export function snowball(debts: DebtItem[], extraMonthlyPayment: number = 0): PayoffResult {
  const result = simulate(
    debts,
    extraMonthlyPayment,
    (a, b) => a.balance - b.balance // Smallest balance first
  );
  result.strategy = 'snowball';
  return result;
}

/**
 * Compare both strategies and return both results
 */
export function compareStrategies(debts: DebtItem[], extraMonthlyPayment: number = 0) {
  const avalancheResult = avalanche(debts, extraMonthlyPayment);
  const snowballResult = snowball(debts, extraMonthlyPayment);

  return {
    avalanche: avalancheResult,
    snowball: snowballResult,
    interestSaved: snowballResult.totalInterestPaid - avalancheResult.totalInterestPaid,
    monthsDifference: snowballResult.totalMonths - avalancheResult.totalMonths,
    recommendation: avalancheResult.totalInterestPaid < snowballResult.totalInterestPaid
      ? 'avalanche' as const
      : 'snowball' as const,
  };
}
