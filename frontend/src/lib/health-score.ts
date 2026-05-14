// ============================================================
// FinPath — Financial Health Score Engine
// Produces a 0–100 composite score across 4 dimensions
// ============================================================

import type { IncomeProfile, ExpenseProfile, DebtProfile, HealthScore } from './types';

interface HealthScoreInput {
  income: IncomeProfile;
  expenses: ExpenseProfile;
  debts: DebtProfile;
  savings: number;
  investments: number;
  emergencyFund: number;
}

/**
 * Calculate savings rate score (0–25)
 * >30% = 25, 20-30% = 20, 10-20% = 12, <10% = 5
 */
function scoreSavingsRate(income: number, expenses: number, debtPayments: number): number {
  if (income <= 0) return 0;
  const surplus = income - expenses - debtPayments;
  const rate = (surplus / income) * 100;
  if (rate >= 30) return 25;
  if (rate >= 20) return 20;
  if (rate >= 10) return 12;
  if (rate >= 0) return 5;
  return 0; // Negative savings
}

/**
 * Calculate debt load score (0–25)
 * DTI (debt-to-income) ratio
 * <20% = 25, 20-35% = 18, 35-50% = 10, >50% = 3
 */
function scoreDebtLoad(income: number, debtPayments: number): number {
  if (income <= 0) return 0;
  const dti = (debtPayments / income) * 100;
  if (dti === 0) return 25;
  if (dti < 20) return 22;
  if (dti < 35) return 18;
  if (dti < 50) return 10;
  return 3;
}

/**
 * Calculate emergency fund score (0–25)
 * >=6 months = 25, 3-6 = 18, 1-3 = 10, <1 = 3
 */
function scoreEmergencyFund(emergencyFund: number, monthlyExpenses: number): number {
  if (monthlyExpenses <= 0) return 25;
  const months = emergencyFund / monthlyExpenses;
  if (months >= 6) return 25;
  if (months >= 3) return 18;
  if (months >= 1) return 10;
  return 3;
}

/**
 * Calculate income stability score (0–25)
 * Based on income diversification
 * Multiple sources = more stable
 */
function scoreIncomeStability(income: IncomeProfile): number {
  const sources = [income.primary, income.secondary, income.passive, income.variable].filter(s => s > 0).length;
  if (income.total <= 0) return 0;

  if (sources >= 4) return 25;
  if (sources >= 3) return 25;
  if (sources >= 2) return 20;
  if (income.primary > 0) return 15;
  return 10;
}

/**
 * Generate actionable recommendations based on scores
 */
function generateActions(
  savingsScore: number,
  debtScore: number,
  emergencyScore: number,
  incomeScore: number,
  income: number,
  expenses: number,
  debtPayments: number,
  emergencyFund: number
): string[] {
  const actions: string[] = [];

  // Highest priority issues first
  if (emergencyScore < 18) {
    const monthlyExpense = expenses + debtPayments;
    const target = monthlyExpense * 3;
    const needed = Math.max(0, target - emergencyFund);
    actions.push(`Build your emergency fund — save ₹${Math.round(needed / 1000)}K more to reach 3 months' expenses`);
  }

  if (debtScore < 18) {
    actions.push(`Reduce debt payments below 35% of income — consider the avalanche method to save on interest`);
  }

  if (savingsScore < 20) {
    const targetSavings = income * 0.2;
    const currentSavings = income - expenses - debtPayments;
    const gap = Math.max(0, targetSavings - currentSavings);
    actions.push(`Increase monthly savings by ₹${Math.round(gap / 1000)}K to hit the 20% target`);
  }

  if (incomeScore < 20) {
    actions.push(`Explore a side income source to diversify — freelancing or passive income can boost stability`);
  }

  // If everything's great
  if (actions.length === 0) {
    actions.push(`You're in great shape! Consider increasing SIP contributions for long-term wealth building`);
  }

  return actions.slice(0, 3); // Top 3 only
}

/**
 * Calculate the complete financial health score
 */
export function calculateHealthScore(input: HealthScoreInput): HealthScore {
  const { income, expenses, debts, emergencyFund } = input;
  
  const monthlyExpensesDeduplicated = Math.max(0, expenses.total - debts.totalMonthly);
  
  const incomeStability = scoreIncomeStability(income);
  const savingsRate = scoreSavingsRate(income.total, monthlyExpensesDeduplicated, debts.totalMonthly);
  const debtLoad = scoreDebtLoad(income.total, debts.totalMonthly);
  const emergencyFundScore = scoreEmergencyFund(emergencyFund, monthlyExpensesDeduplicated + debts.totalMonthly);

  const overall = incomeStability + savingsRate + debtLoad + emergencyFundScore;

  const actions = generateActions(
    savingsRate,
    debtLoad,
    emergencyFundScore,
    incomeStability,
    income.total,
    monthlyExpensesDeduplicated,
    debts.totalMonthly,
    emergencyFund
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    incomeStability,
    debtLoad,
    savingsRate,
    emergencyFund: emergencyFundScore,
    actions,
  };
}
