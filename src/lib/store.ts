// ============================================================
// FinPath — Zustand Store (persisted to localStorage)
// Single source of truth for the entire app
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FinancialProfile,
  IncomeProfile,
  ExpenseProfile,
  DebtProfile,
  Goal,
  HealthScore,
  FinancialPlan,
  ChatMessage,
} from './types';
import { calculateHealthScore } from './health-score';
import { generatePlan } from './plan-engine';

/** Default empty profile */
const defaultProfile: FinancialProfile = {
  onboarded: false,
  income: { salary: 0, freelance: 0, passive: 0, total: 0 },
  expenses: { rent: 0, food: 0, transport: 0, utilities: 0, entertainment: 0, other: 0, total: 0 },
  debts: { items: [], totalMonthly: 0 },
  savings: 0,
  investments: 0,
  emergencyFund: 0,
  goals: [],
  healthScore: null,
  plan: null,
  chatHistory: [],
  currency: 'INR',
  lastUpdated: Date.now(),
};

interface FinPathStore extends FinancialProfile {
  // ── Profile setters ──────────────────────────────
  setIncome: (income: IncomeProfile) => void;
  setExpenses: (expenses: ExpenseProfile) => void;
  setDebts: (debts: DebtProfile) => void;
  setSavings: (savings: number) => void;
  setInvestments: (investments: number) => void;
  setEmergencyFund: (fund: number) => void;

  // ── Goal management ──────────────────────────────
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  completeGoal: (id: string) => void;

  // ── Engines ──────────────────────────────────────
  computeHealthScore: () => HealthScore;
  generatePlan: () => FinancialPlan;

  // ── Chat ─────────────────────────────────────────
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;

  // ── Onboarding ───────────────────────────────────
  completeOnboarding: (data: {
    income: number;
    expenses: number;
    debts: number;
    goals: { name: string; targetAmount?: number }[];
    expenseBreakdown?: Record<string, number>;
    debtBreakdown?: Record<string, number>;
  }) => void;

  // ── Reset ────────────────────────────────────────
  resetProfile: () => void;
  reset: () => void;
}

/** Map goal name from onboarding to a Goal object */
function goalNameToGoal(name: string, index: number): Goal {
  const goalConfigs: Record<string, Partial<Goal>> = {
    'Dream Bike': { category: 'bike', icon: 'Bike', targetAmount: 120000, timelineMonths: 18, color: 'var(--lime)' },
    'Investment': { category: 'investment', icon: 'TrendingUp', targetAmount: 500000, timelineMonths: 36, color: 'var(--violet)' },
    'Emergency Fund': { category: 'savings', icon: 'Shield', targetAmount: 300000, timelineMonths: 24, color: 'var(--blue)' },
    'Wedding': { category: 'family', icon: 'Heart', targetAmount: 500000, timelineMonths: 24, color: 'var(--amber)' },
    'Vacation': { category: 'travel', icon: 'Plane', targetAmount: 50000, timelineMonths: 6, color: 'var(--lime)' },
    'Upskill Course': { category: 'education', icon: 'GraduationCap', targetAmount: 100000, timelineMonths: 12, color: 'var(--violet)' },
    'Custom': { category: 'custom', icon: 'Target', targetAmount: 100000, timelineMonths: 12, color: 'var(--blue)' },
  };

  const config = goalConfigs[name] || goalConfigs['Custom']!;

  return {
    id: `goal-${Date.now()}-${index}`,
    name,
    icon: config.icon || 'Target',
    category: config.category || 'custom',
    targetAmount: config.targetAmount || 100000,
    currentAmount: 0,
    timelineMonths: config.timelineMonths || 12,
    priority: index + 1,
    status: 'not-started',
    monthlyAllocation: 0,
    color: config.color || 'var(--lime)',
  };
}

export const useFinPathStore = create<FinPathStore>()(
  persist(
    (set, get) => ({
      ...defaultProfile,

      setIncome: (income) => set({ income, lastUpdated: Date.now() }),
      setExpenses: (expenses) => set({ expenses, lastUpdated: Date.now() }),
      setDebts: (debts) => set({ debts, lastUpdated: Date.now() }),
      setSavings: (savings) => set({ savings, lastUpdated: Date.now() }),
      setInvestments: (investments) => set({ investments, lastUpdated: Date.now() }),
      setEmergencyFund: (fund) => set({ emergencyFund: fund, lastUpdated: Date.now() }),

      setGoals: (goals) => set({ goals, lastUpdated: Date.now() }),
      addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal], lastUpdated: Date.now() })),
      updateGoal: (id, updates) => set((s) => ({
        goals: s.goals.map(g => g.id === id ? { ...g, ...updates } : g),
        lastUpdated: Date.now(),
      })),
      removeGoal: (id) => set((s) => ({
        goals: s.goals.filter(g => g.id !== id),
        lastUpdated: Date.now(),
      })),
      completeGoal: (id) => set((s) => ({
        goals: s.goals.map(g => g.id === id ? { ...g, status: 'complete' as const, currentAmount: g.targetAmount } : g),
        lastUpdated: Date.now(),
      })),

      computeHealthScore: () => {
        const state = get();
        const score = calculateHealthScore({
          income: state.income,
          expenses: state.expenses,
          debts: state.debts,
          savings: state.savings,
          investments: state.investments,
          emergencyFund: state.emergencyFund,
        });
        set({ healthScore: score });
        return score;
      },

      generatePlan: () => {
        const state = get();
        const plan = generatePlan({
          income: state.income,
          expenses: state.expenses,
          debts: state.debts,
          goals: state.goals,
          savings: state.savings,
          investments: state.investments,
        });

        // Update goal monthly allocations
        const updatedGoals = state.goals.map(g => ({
          ...g,
          monthlyAllocation: plan.recommendedAllocations[g.id] || 0,
          status: plan.goalCompletionDates[g.id]
            ? 'in-progress' as const
            : g.status,
        }));

        set({ plan, goals: updatedGoals, lastUpdated: Date.now() });
        return plan;
      },

      addChatMessage: (msg) => set((s) => ({
        chatHistory: [...s.chatHistory, msg],
      })),
      clearChat: () => set({ chatHistory: [] }),

      completeOnboarding: (data) => {
        const income: IncomeProfile = {
          salary: data.income,
          freelance: 0,
          passive: 0,
          total: data.income,
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
        const debts: DebtProfile = {
          items: Object.entries(db)
            .filter(([, v]) => v > 0)
            .map(([key, value], i) => ({
              id: `debt-${i}`,
              name: key,
              category: key as any,
              principal: value * 12, // Rough estimate
              interestRate: 10, // Default
              monthlyPayment: value,
              remainingMonths: 12,
            })),
          totalMonthly: data.debts,
        };

        const goals = data.goals.map((g, i) => {
          const goal = goalNameToGoal(g.name, i);
          if (g.targetAmount && g.targetAmount > 0) {
            goal.targetAmount = g.targetAmount;
          }
          return goal;
        });

        // Set all financial data
        set({
          onboarded: true,
          income,
          expenses,
          debts,
          goals,
          savings: 0,
          investments: 0,
          emergencyFund: 0,
          lastUpdated: Date.now(),
        });

        // Compute health score and plan
        const store = get();
        store.computeHealthScore();
        store.generatePlan();
      },

      resetProfile: () => set({ ...defaultProfile }),
      reset: () => set({ ...defaultProfile }),
    }),
    {
      name: 'finpath-store',
      version: 1,
    }
  )
);
