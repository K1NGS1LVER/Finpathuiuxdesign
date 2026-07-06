// ============================================================
// Profile slice — income / expenses / debts / balances setters.
// Each mutation recomputes health score + plan.
// ============================================================

import type { StateCreator } from 'zustand';
import type { DebtItem, DebtProfile, ExpenseProfile, FinancialProfile, IncomeProfile } from '../types';
import {
  hasDebt,
  normalizeActiveGoalPriorities,
  normalizeDebtProfile,
  syncDebtGoal,
} from './goal-helpers';
import type { FinPathStore } from './index';

export interface ProfileSlice {
  setIncome: (income: IncomeProfile) => void;
  setExpenses: (expenses: ExpenseProfile) => void;
  setDebts: (debts: DebtProfile) => void;
  addDebtItem: (debt: DebtItem) => void;
  setSavings: (savings: number) => void;
  setInvestments: (investments: number) => void;
  setEmergencyFund: (fund: number) => void;
  setAgeYears: (age: number | undefined) => void;
  updateSettings: (data: {
    income?: number;
    expenses?: Partial<ExpenseProfile>;
    salaryHike?: number; // percentage
  }) => void;
}

export const createProfileSlice: StateCreator<FinPathStore, [], [], ProfileSlice> = (
  set,
  get,
) => ({
  setIncome: (income) => {
    const netRate = income.netRate ?? get().income.netRate ?? 1.0;
    const netMonthly = Math.round(
      income.primary * netRate + income.secondary + income.passive + income.variable,
    );
    set({ income: { ...income, netRate, netMonthly }, lastUpdated: Date.now() });
    const store = get();
    store.computeHealthScore();
    store.generatePlan();
  },
  setExpenses: (expenses) => {
    set({ expenses, lastUpdated: Date.now() });
    const store = get();
    store.computeHealthScore();
    store.generatePlan();
  },
  setDebts: (debts) => {
    const nextDebts = normalizeDebtProfile(debts);
    set((s) => ({
      debts: nextDebts,
      goals: normalizeActiveGoalPriorities(
        syncDebtGoal(s.goals, nextDebts, hasDebt(nextDebts) ? (s.debtGoalDeleted ?? false) : false),
      ),
      debtGoalDeleted: hasDebt(nextDebts) ? (s.debtGoalDeleted ?? false) : false,
      lastUpdated: Date.now(),
    }));
    const store = get();
    store.computeHealthScore();
    store.generatePlan();
  },
  addDebtItem: (debt) => {
    set((s) => {
      const nextItems = [...(s.debts.items ?? []), debt];
      const nextDebts = normalizeDebtProfile({
        items: nextItems,
        totalMonthly: nextItems.reduce((sum, d) => sum + Math.max(0, d.monthlyPayment || 0), 0),
        totalPrincipal: nextItems.reduce((sum, d) => sum + Math.max(0, d.principal || 0), 0),
      });
      return {
        debts: nextDebts,
        goals: normalizeActiveGoalPriorities(syncDebtGoal(s.goals, nextDebts, false)),
        debtGoalDeleted: false,
        lastUpdated: Date.now(),
      };
    });
    const store = get();
    store.computeHealthScore();
    store.generatePlan();
  },
  setSavings: (savings) => {
    set({ savings, lastUpdated: Date.now() });
    const store = get();
    store.computeHealthScore();
    store.generatePlan();
  },
  setInvestments: (investments) => {
    set({ investments, lastUpdated: Date.now() });
    const store = get();
    store.computeHealthScore();
    store.generatePlan();
  },
  setEmergencyFund: (fund) => {
    set({ emergencyFund: fund, lastUpdated: Date.now() });
    const store = get();
    store.computeHealthScore();
    store.generatePlan();
  },
  setAgeYears: (age) => set({ ageYears: age, lastUpdated: Date.now() }),

  updateSettings: (data) => {
    const state = get();
    const updates: Partial<FinancialProfile> = { lastUpdated: Date.now() };

    if (data.income !== undefined) {
      const newPrimary = data.income;
      const newVariable = Math.round((state.income.passive * state.income.variablePercent) / 100);
      const nr = state.income.netRate ?? 1.0;
      updates.income = {
        ...state.income,
        primary: newPrimary,
        variable: newVariable,
        total: newPrimary + state.income.secondary + state.income.passive + newVariable,
        netRate: nr,
        netMonthly: Math.round(
          newPrimary * nr + state.income.secondary + state.income.passive + newVariable,
        ),
      };
    }

    if (data.salaryHike !== undefined) {
      const factor = 1 + data.salaryHike / 100;
      const newPrimary = Math.round(state.income.primary * factor);
      const newVariable = Math.round((state.income.passive * state.income.variablePercent) / 100);
      const nr = state.income.netRate ?? 1.0;
      updates.income = {
        ...state.income,
        primary: newPrimary,
        variable: newVariable,
        total: Math.round(state.income.total * factor),
        netRate: nr,
        netMonthly: Math.round(
          newPrimary * nr + state.income.secondary + state.income.passive + newVariable,
        ),
      };
    }

    if (data.expenses) {
      updates.expenses = {
        ...state.expenses,
        ...data.expenses,
        total: Object.entries({ ...state.expenses, ...data.expenses })
          .filter(([k]) => k !== 'total')
          .reduce((sum, [, v]) => sum + (typeof v === 'number' ? v : 0), 0),
      };
    }

    set(updates);

    // Recompute
    const store = get();
    store.computeHealthScore();
    store.generatePlan();
  },
});
