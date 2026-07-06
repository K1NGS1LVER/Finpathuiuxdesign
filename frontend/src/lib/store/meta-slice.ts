// ============================================================
// Meta slice — storage mode, wholesale profile replacement,
// onboarding, chat, milestones, dreams, demo, reset, UI flags.
// ============================================================

import type { StateCreator } from 'zustand';
import type {
  ChatMessage,
  DebtItem,
  Dream,
  ExpenseProfile,
  FinancialProfile,
  IncomeProfile,
  InvestmentStrategy,
  Milestone,
  StorageMode,
} from '../types';
import { demoFinancialProfile, demoDreams } from '../fixtures/demoProfile';
import { defaultProfile } from './defaults';
import {
  goalNameToGoal,
  normalizeActiveGoalPriorities,
  normalizeDebtProfile,
  syncDebtGoal,
} from './goal-helpers';
import type { FinPathStore } from './index';

export interface MetaSlice {
  setStorageMode: (mode: StorageMode) => void;
  /**
   * Replace the financial profile wholesale (used by remote hydration
   * and JSON import). Skips recompute when `recompute=false`.
   */
  replaceProfile: (next: Partial<FinancialProfile>, opts?: { recompute?: boolean }) => void;

  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;

  completeOnboarding: (data: {
    primaryIncome: number;
    secondaryIncome?: number;
    passiveIncome?: number;
    variablePercent?: number;
    primaryIncrement?: number;
    secondaryIncrement?: number;
    passiveIncrement?: number;
    netRate?: number;
    expenses: number;
    debts: number;
    goals: { name: string; targetAmount?: number; priority?: number }[];
    expenseBreakdown?: Record<string, number>;
    debtBreakdown?: Record<string, number>;
    debtItems?: DebtItem[];
    totalDebtPrincipal?: number;
    strategy?: InvestmentStrategy;
    surplus?: number;
    expectedAnnualIncrement?: number;
    stepUpEnabled?: boolean;
  }) => void;

  setMilestones: (milestones: Milestone[]) => void;

  saveDream: (dream: Dream) => void;
  removeDream: (id: string) => void;

  loadDemoProfile: () => void;
  resetProfile: () => void;

  // UI-only flags (not persisted)
  pdfExporting: boolean;
  setPdfExporting: (b: boolean) => void;
}

export const createMetaSlice: StateCreator<FinPathStore, [], [], MetaSlice> = (set, get) => ({
  pdfExporting: false,
  setPdfExporting: (b: boolean) => set({ pdfExporting: b }),

  setStorageMode: (mode) => {
    set({ storageMode: mode, lastUpdated: Date.now() });
  },

  replaceProfile: (next, opts) => {
    // Wholesale replace — used by remote hydration + JSON import.
    // Preserves any fields the caller didn't include by merging onto the
    // current state, then bumps lastUpdated only if the caller didn't.
    const incoming: Partial<FinancialProfile> = { ...next };
    if (incoming.lastUpdated === undefined) {
      incoming.lastUpdated = Date.now();
    }
    set((state) => ({ ...state, ...incoming }));
    if (opts?.recompute !== false) {
      const store = get();
      store.computeHealthScore();
      store.generatePlan();
    }
  },

  addChatMessage: (msg) =>
    set((s) => ({
      chatHistory: [...s.chatHistory, msg],
    })),
  clearChat: () => set({ chatHistory: [] }),

  completeOnboarding: (data) => {
    const primaryIncome = data.primaryIncome || 0;
    const secondaryIncome = data.secondaryIncome || 0;
    const passiveIncome = data.passiveIncome || 0;
    const variablePercent = data.variablePercent || 0;
    const variable = Math.round((passiveIncome * variablePercent) / 100);
    const netRate = data.netRate ?? 1.0;
    const netMonthly = Math.round(
      primaryIncome * netRate + secondaryIncome + passiveIncome + variable,
    );
    const income: IncomeProfile = {
      primary: primaryIncome,
      secondary: secondaryIncome,
      passive: passiveIncome,
      variablePercent,
      variable,
      total: primaryIncome + secondaryIncome + passiveIncome + variable,
      primaryIncrement: data.primaryIncrement || 0,
      secondaryIncrement: data.secondaryIncrement || 0,
      passiveIncrement: data.passiveIncrement || 0,
      netRate,
      netMonthly,
    };

    const eb = data.expenseBreakdown || {};
    const expenses: ExpenseProfile = {
      rent: eb.rent || 0,
      food: eb.food || 0,
      transport: eb.transport || 0,
      utilities: eb.utilities || 0,
      entertainment: eb.entertainment || 0,
      other: eb.other || 0,
      total: data.expenses,
    };

    const db = data.debtBreakdown || {};
    const debts = normalizeDebtProfile(
      data.debtItems
        ? {
            items: data.debtItems,
            totalMonthly: data.debts,
            totalPrincipal: data.totalDebtPrincipal,
          }
        : {
            items: Object.entries(db)
              .filter(([, v]) => v > 0)
              .map(([key, value], i) => ({
                id: `debt-${i}`,
                name: key,
                category: key as DebtItem['category'],
                principal: value * 12,
                interestRate: 10,
                monthlyPayment: value,
                remainingMonths: 12,
              })),
            totalMonthly: data.debts,
            totalPrincipal: data.totalDebtPrincipal,
          },
    );

    const goals = data.goals.map((g, i) => {
      const goal = goalNameToGoal(g.name, i);
      if (g.targetAmount && g.targetAmount > 0) {
        goal.targetAmount = g.targetAmount;
      }
      if (g.priority !== undefined) {
        goal.priority = g.priority;
      }
      return goal;
    });

    // Set all financial data
    set({
      onboarded: true,
      income,
      expenses,
      debts,
      goals: normalizeActiveGoalPriorities(syncDebtGoal(goals, debts, false)),
      debtGoalDeleted: false,
      savings: 0,
      investments: 0,
      emergencyFund: 0,
      strategy: data.strategy || 'avalanche',
      stepUpEnabled: data.stepUpEnabled || false,
      monthlySurplusReserve: Math.max(0, data.surplus || 0),
      pendingGoalDecisions: [],
      lastUpdated: Date.now(),
    });

    // Compute health score and plan
    const store = get();
    store.computeHealthScore();
    store.generatePlan();
  },

  setMilestones: (milestones) => set({ milestones, lastUpdated: Date.now() }),

  saveDream: (dream) =>
    set((s) => ({
      dreams: [dream, ...(s.dreams ?? []).filter((d) => d.id !== dream.id)].slice(0, 10),
      lastUpdated: Date.now(),
    })),
  removeDream: (id) =>
    set((s) => ({
      dreams: (s.dreams ?? []).filter((d) => d.id !== id),
      lastUpdated: Date.now(),
    })),

  loadDemoProfile: () => {
    const { milestones, dreams, ...profileFields } = demoFinancialProfile;
    get().replaceProfile(profileFields);
    set({ milestones, dreams: dreams ?? demoDreams, demoMode: true, lastUpdated: Date.now() });
  },

  resetProfile: () => set({ ...defaultProfile }),
});
