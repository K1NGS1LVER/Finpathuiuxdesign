// ============================================================
// Goals slice — goal CRUD, lumpsums, and completion decisions.
// ============================================================

import type { StateCreator } from 'zustand';
import type { Goal, GoalCompletionAction } from '../types';
import { appendMilestone } from '../sparks';
import { DEBT_GOAL_ID } from './defaults';
import {
  emptyDebtProfile,
  hasDebt,
  isDebtGoalComplete,
  normalizeActiveGoalPriorities,
  removeDecisionFromQueue,
  resolveDebtsFromGoals,
  syncDebtGoal,
  upsertDecision,
} from './goal-helpers';
import type { FinPathStore } from './index';

export interface GoalsSlice {
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  completeGoal: (id: string) => void;
  addLumpsum: (goalId: string, amount: number) => void;
  resolveGoalCompletionDecision: (goalId: string, action: GoalCompletionAction) => void;
}

export const createGoalsSlice: StateCreator<FinPathStore, [], [], GoalsSlice> = (set, get) => ({
  setGoals: (goals) => {
    set((s) => {
      const nextDebts = resolveDebtsFromGoals(s.debts, goals);
      return {
        debts: nextDebts,
        goals: normalizeActiveGoalPriorities(syncDebtGoal(goals, nextDebts, s.debtGoalDeleted)),
        lastUpdated: Date.now(),
      };
    });
    const store = get();
    store.generatePlan();
  },
  addGoal: (goal) => {
    set((s) => {
      const activeCount = s.goals.filter((g) => g.status !== 'complete').length;
      const goalWithPriority = {
        ...goal,
        priority: goal.priority > 0 ? goal.priority : activeCount + 1,
      };

      return {
        goals: normalizeActiveGoalPriorities(
          syncDebtGoal([...s.goals, goalWithPriority], s.debts, s.debtGoalDeleted),
        ),
        lastUpdated: Date.now(),
      };
    });
    const store = get();
    store.generatePlan();
  },
  updateGoal: (id, updates) => {
    set((s) => {
      const existingGoal = s.goals.find((g) => g.id === id);
      if (!existingGoal) {
        return { goals: s.goals, lastUpdated: Date.now() };
      }

      const mergedGoal = { ...existingGoal, ...updates };
      const nextTarget =
        typeof mergedGoal.targetAmount === 'number' && mergedGoal.targetAmount > 0
          ? mergedGoal.targetAmount
          : existingGoal.targetAmount;
      const nextAmount = Math.min(
        nextTarget,
        Math.max(
          0,
          typeof mergedGoal.currentAmount === 'number'
            ? mergedGoal.currentAmount
            : existingGoal.currentAmount,
        ),
      );
      const shouldComplete = mergedGoal.status === 'complete' || nextAmount >= nextTarget;

      const nextStatus: Goal['status'] = shouldComplete
        ? 'complete'
        : mergedGoal.status || (nextAmount > 0 ? 'in-progress' : 'not-started');

      const previousAllocation = Math.max(0, existingGoal.monthlyAllocation || 0);
      const becameComplete = existingGoal.status !== 'complete' && shouldComplete;

      const nextGoals = s.goals.map((goal) => {
        if (goal.id !== id) return goal;
        return {
          ...goal,
          ...updates,
          targetAmount: nextTarget,
          currentAmount: shouldComplete ? nextTarget : nextAmount,
          status: nextStatus,
        };
      });

      const pendingGoalDecisions = becameComplete
        ? existingGoal.category === 'debt'
          ? removeDecisionFromQueue(s.pendingGoalDecisions, id)
          : upsertDecision(s.pendingGoalDecisions, {
              goalId: id,
              goalName: existingGoal.name,
              freedMonthlyAmount: previousAllocation,
              createdAt: Date.now(),
            })
        : removeDecisionFromQueue(s.pendingGoalDecisions, id);
      const nextDebts =
        existingGoal.category === 'debt' && shouldComplete && !hasDebt(s.debts)
          ? emptyDebtProfile()
          : s.debts;

      // Mint a ledger milestone on the not-complete → complete transition.
      // Skip the synthetic debt-payoff goal: it's a derived view, not an
      // achievement the user earned and shouldn't clutter the chain.
      const nextMilestones =
        becameComplete && existingGoal.category !== 'debt'
          ? appendMilestone(s.milestones, {
              goalId: existingGoal.id,
              title: existingGoal.name,
              category: existingGoal.category,
              completedAt: new Date().toISOString(),
              amount: existingGoal.targetAmount,
              priority: existingGoal.priority,
            })
          : s.milestones;

      return {
        debts: nextDebts,
        goals: normalizeActiveGoalPriorities(syncDebtGoal(nextGoals, nextDebts, s.debtGoalDeleted)),
        pendingGoalDecisions,
        milestones: nextMilestones,
        lastUpdated: Date.now(),
      };
    });

    const store = get();
    store.generatePlan();
  },
  removeGoal: (id) => {
    set((s) => ({
      goals: normalizeActiveGoalPriorities(
        syncDebtGoal(
          s.goals.filter((g) => g.id !== id),
          s.debts,
          id === DEBT_GOAL_ID ? true : (s.debtGoalDeleted ?? false),
        ),
      ),
      debtGoalDeleted: id === DEBT_GOAL_ID ? true : (s.debtGoalDeleted ?? false),
      pendingGoalDecisions: removeDecisionFromQueue(s.pendingGoalDecisions, id),
      lastUpdated: Date.now(),
    }));
    const store = get();
    store.generatePlan();
  },
  completeGoal: (id) => {
    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;
    get().updateGoal(id, {
      status: 'complete',
      currentAmount: goal.targetAmount,
    });
  },

  addLumpsum: (goalId, amount) => {
    if (!amount || amount <= 0) return;

    set((s) => {
      let completedGoalId: string | null = null;
      let completedGoalName = '';
      let completedGoalAllocation = 0;

      const nextGoals = s.goals.map((goal) => {
        if (goal.id !== goalId) return goal;

        const nextAmount = Math.min(goal.targetAmount, goal.currentAmount + amount);
        const completed = nextAmount >= goal.targetAmount;
        if (completed) {
          completedGoalId = goal.id;
          completedGoalName = goal.name;
          completedGoalAllocation = Math.max(0, goal.monthlyAllocation || 0);
        }

        return {
          ...goal,
          currentAmount: nextAmount,
          lumpsumAdded: (goal.lumpsumAdded || 0) + amount,
          status: completed
            ? 'complete'
            : goal.status === 'not-started'
              ? 'in-progress'
              : goal.status,
        };
      });

      const pendingGoalDecisions = completedGoalId
        ? nextGoals.find((goal) => goal.id === completedGoalId)?.category === 'debt'
          ? removeDecisionFromQueue(s.pendingGoalDecisions, completedGoalId)
          : upsertDecision(s.pendingGoalDecisions, {
              goalId: completedGoalId,
              goalName: completedGoalName,
              freedMonthlyAmount: completedGoalAllocation,
              createdAt: Date.now(),
            })
        : s.pendingGoalDecisions;
      const nextDebts =
        isDebtGoalComplete(nextGoals.find((goal) => goal.id === goalId)) && !hasDebt(s.debts)
          ? emptyDebtProfile()
          : s.debts;

      const completedGoalForMilestone = completedGoalId
        ? nextGoals.find((g) => g.id === completedGoalId)
        : undefined;
      const nextMilestones =
        completedGoalForMilestone && completedGoalForMilestone.category !== 'debt'
          ? appendMilestone(s.milestones, {
              goalId: completedGoalForMilestone.id,
              title: completedGoalForMilestone.name,
              category: completedGoalForMilestone.category,
              completedAt: new Date().toISOString(),
              amount: completedGoalForMilestone.targetAmount,
              priority: completedGoalForMilestone.priority,
            })
          : s.milestones;

      return {
        debts: nextDebts,
        goals: normalizeActiveGoalPriorities(syncDebtGoal(nextGoals, nextDebts, s.debtGoalDeleted)),
        pendingGoalDecisions,
        milestones: nextMilestones,
        lastUpdated: Date.now(),
      };
    });

    const store = get();
    store.generatePlan();
  },

  resolveGoalCompletionDecision: (goalId, action) => {
    set((s) => {
      const decision = s.pendingGoalDecisions.find((item) => item.goalId === goalId);
      const freedMonthlyAmount = Math.max(0, decision?.freedMonthlyAmount || 0);

      const nextReserve =
        action === 'surplus' ? s.monthlySurplusReserve + freedMonthlyAmount : s.monthlySurplusReserve;

      return {
        pendingGoalDecisions: removeDecisionFromQueue(s.pendingGoalDecisions, goalId),
        monthlySurplusReserve: nextReserve,
        lastUpdated: Date.now(),
      };
    });

    const store = get();
    store.generatePlan();
  },
});
