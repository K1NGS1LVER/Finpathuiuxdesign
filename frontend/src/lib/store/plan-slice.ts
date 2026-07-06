// ============================================================
// Plan slice — engines (health score, plan) + strategy knobs.
// ============================================================

import type { StateCreator } from 'zustand';
import type { FinancialPlan, Goal, HealthScore, InvestmentStrategy } from '../types';
import { calculateHealthScore } from '../health-score';
import { generatePlan } from '../plan-engine';
import {
  normalizeActiveGoalPriorities,
  resolveDebtsFromGoals,
  syncDebtGoal,
} from './goal-helpers';
import type { FinPathStore } from './index';

export interface PlanSlice {
  setStrategy: (strategy: InvestmentStrategy) => void;
  setInvestmentReturnRate: (rate: number) => void;
  computeHealthScore: () => HealthScore;
  generatePlan: () => FinancialPlan;
}

export const createPlanSlice: StateCreator<FinPathStore, [], [], PlanSlice> = (set, get) => ({
  setStrategy: (strategy) => {
    set({ strategy, lastUpdated: Date.now() });
    // Recalculate plan with new strategy
    const store = get();
    store.generatePlan();
  },

  setInvestmentReturnRate: (rate) => {
    // Clamp to a sane band — UI picker maxes at 14, but allow some headroom.
    const clamped = Math.max(0, Math.min(30, rate));
    set({ investmentReturnRate: clamped, lastUpdated: Date.now() });
    get().generatePlan();
  },

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
    const debts = resolveDebtsFromGoals(state.debts, state.goals);
    const syncedGoals = normalizeActiveGoalPriorities(
      syncDebtGoal(state.goals, debts, state.debtGoalDeleted),
    );
    const plan = generatePlan({
      income: state.income,
      expenses: state.expenses,
      debts,
      goals: syncedGoals,
      savings: state.savings,
      investments: state.investments,
      strategy: state.strategy,
      monthlySurplusReserve: state.monthlySurplusReserve,
      pendingReallocationReserve: state.pendingGoalDecisions.reduce(
        (sum, decision) => sum + Math.max(0, decision.freedMonthlyAmount),
        0,
      ),
      stepUpEnabled: state.stepUpEnabled,
      investmentReturnRate: state.investmentReturnRate,
    });

    // Update goal monthly allocations
    const updatedGoals = normalizeActiveGoalPriorities(
      syncedGoals.map((g) => {
        const isComplete = g.status === 'complete' || g.currentAmount >= g.targetAmount;
        const nextStatus: Goal['status'] = isComplete
          ? 'complete'
          : g.currentAmount > 0 ||
              g.category === 'debt' ||
              (plan.recommendedAllocations[g.id] || 0) > 0
            ? 'in-progress'
            : 'not-started';

        return {
          ...g,
          currentAmount: isComplete ? g.targetAmount : g.currentAmount,
          monthlyAllocation:
            g.category === 'debt'
              ? Math.max(0, debts.totalMonthly || 0)
              : g.checkedThisMonth
                ? g.monthlyAllocation || plan.recommendedAllocations[g.id] || 0
                : plan.recommendedAllocations[g.id] || 0,
          status: nextStatus,
        };
      }),
    );

    set({ debts, plan, goals: updatedGoals, lastUpdated: Date.now() });
    return plan;
  },
});
