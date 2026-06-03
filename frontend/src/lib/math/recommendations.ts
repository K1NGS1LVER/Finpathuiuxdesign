/**
 * Cross-goal intelligence engine.
 * Pure function — no React, Zustand, or DOM imports.
 * Mines a FinancialProfile for cross-goal signals and returns ranked CrossGoalInsight[].
 */

import type { FinancialProfile, CrossGoalInsight, Goal } from '../types';
import { formatInr, formatInrCompact } from '../format';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the highest-priority active non-debt goal (lowest priority number),
 * or null if none exists.
 */
function getTopActiveGoal(goals: FinancialProfile['goals']): Goal | null {
  return (
    goals
      .filter((g) => g.status !== 'complete' && g.category !== 'debt')
      .sort((a, b) => a.priority - b.priority)[0] ?? null
  );
}

/**
 * Computes the effective monthly allocation for a goal.
 * Uses the plan-assigned allocation if positive, otherwise derives from remaining / timeline.
 */
function monthlyAllocFor(g: Goal): number {
  if (g.monthlyAllocation > 0) return g.monthlyAllocation;
  const remaining = Math.max(0, g.targetAmount - g.currentAmount);
  return Math.round(remaining / Math.max(1, g.timelineMonths));
}

/**
 * Computes months saved when adding extraMonthly to an active goal's current allocation.
 */
function computeMonthsSaved(targetGoal: Goal, extraMonthly: number): number {
  const remaining = Math.max(0, targetGoal.targetAmount - targetGoal.currentAmount);
  const currentAlloc = targetGoal.monthlyAllocation || 0;
  const newAlloc = currentAlloc + extraMonthly;
  const oldMonths =
    currentAlloc > 0 ? Math.ceil(remaining / currentAlloc) : targetGoal.timelineMonths;
  const newMonths = newAlloc > 0 ? Math.ceil(remaining / newAlloc) : oldMonths;
  return Math.max(0, oldMonths - newMonths);
}

// ── Main engine ──────────────────────────────────────────────────────────────

export function buildCrossGoalInsights(profile: FinancialProfile): CrossGoalInsight[] {
  const insights: CrossGoalInsight[] = [];
  const { goals, debts, income, pendingGoalDecisions } = profile;
  const topGoal = getTopActiveGoal(goals);

  // ── Rule 1: Sell depreciating asset (priority 1) ──────────────────────────
  {
    const completedBikeGoals = goals
      .filter((g) => g.status === 'complete' && g.category === 'bike')
      .sort((a, b) => b.currentAmount - a.currentAmount);

    const targetGoal = topGoal;

    if (completedBikeGoals.length > 0 && targetGoal !== null) {
      const completedGoal = completedBikeGoals[0];
      const assetValue = Math.round(completedGoal.currentAmount * 0.6);

      if (assetValue >= 1000) {
        const monthlyAlloc = monthlyAllocFor(targetGoal);

        if (monthlyAlloc > 0) {
          const remaining = Math.max(0, targetGoal.targetAmount - targetGoal.currentAmount);
          const maxMonths =
            monthlyAlloc > 0 ? Math.ceil(remaining / monthlyAlloc) : targetGoal.timelineMonths;
          const monthsSaved = Math.min(Math.round(assetValue / monthlyAlloc), maxMonths);

          if (monthsSaved >= 1) {
            insights.push({
              id: `sell-asset-${completedGoal.id}-${targetGoal.id}`,
              priority: 1,
              relatedGoalIds: [completedGoal.id, targetGoal.id],
              observation: `Your completed ${completedGoal.name} goal has ${formatInrCompact(completedGoal.currentAmount)} as a depreciating asset.`,
              action: `Sell the ${completedGoal.name} and put the estimated ${formatInr(assetValue)} as a lumpsum into ${targetGoal.name}.`,
              impact: `Reach ${targetGoal.name} ~${monthsSaved} month${monthsSaved !== 1 ? 's' : ''} earlier (assumes 60% resale value).`,
              tone: 'positive',
              icon: 'ArrowUpRight',
            });
          }
        }
      }
    }
  }

  // ── Rule 2: Redeploy completed savings (priority 2) ───────────────────────
  {
    const completedSavingsGoals = goals
      .filter((g) => g.status === 'complete' && g.category === 'savings' && g.currentAmount > 5000)
      .sort((a, b) => b.currentAmount - a.currentAmount);

    const targetGoal = topGoal;

    if (completedSavingsGoals.length > 0 && targetGoal !== null) {
      const savingsGoal = completedSavingsGoals[0];
      const cash = savingsGoal.currentAmount;
      const monthlyAlloc = monthlyAllocFor(targetGoal);
      const monthsSaved = monthlyAlloc > 0 ? Math.round(cash / monthlyAlloc) : 0;

      insights.push({
        id: `redeploy-savings-${savingsGoal.id}-${targetGoal.id}`,
        priority: 2,
        relatedGoalIds: [savingsGoal.id, targetGoal.id],
        observation: `${savingsGoal.name} is complete with ${formatInr(cash)} available.`,
        action: `Move ${formatInr(cash)} as a one-time lumpsum into ${targetGoal.name}.`,
        impact:
          monthsSaved > 0
            ? `Cuts ${targetGoal.name} timeline by ~${monthsSaved} months.`
            : `Gets ${targetGoal.name} a ${formatInrCompact(cash)} head start.`,
        tone: 'positive',
        icon: 'PiggyBank',
      });
    }
  }

  // ── Rule 3: Free allocation from pending decision (priority 3) ────────────
  {
    const targetGoal = topGoal;

    if (pendingGoalDecisions.length > 0 && targetGoal !== null) {
      const decision = pendingGoalDecisions[0];
      const freedAmount = decision.freedMonthlyAmount;

      if (freedAmount > 0) {
        const monthsSaved = computeMonthsSaved(targetGoal, freedAmount);

        insights.push({
          id: `free-alloc-${decision.goalId}`,
          priority: 3,
          relatedGoalIds: [decision.goalId, targetGoal.id],
          observation: `${decision.goalName} completed, freeing ${formatInr(freedAmount)}/month.`,
          action: `Redirect the freed ${formatInr(freedAmount)}/month to ${targetGoal.name}.`,
          impact:
            monthsSaved > 0
              ? `Reach ${targetGoal.name} ~${monthsSaved} months sooner.`
              : `Adds ${formatInr(freedAmount)}/mo to your top goal.`,
          tone: 'positive',
          icon: 'Zap',
        });
      }
    }
  }

  // ── Rule 4: Debt near payoff frees EMI (priority 4) ───────────────────────
  {
    const nearPayoffDebts = (debts.items ?? []).filter(
      (d) => d.remainingMonths >= 1 && d.remainingMonths <= 6,
    );

    const targetGoal = topGoal;

    if (nearPayoffDebts.length > 0 && targetGoal !== null) {
      const debt = nearPayoffDebts.sort((a, b) => b.monthlyPayment - a.monthlyPayment)[0];
      const freedEmi = debt.monthlyPayment;

      if (freedEmi > 0) {
        const monthsSaved = computeMonthsSaved(targetGoal, freedEmi);

        insights.push({
          id: `debt-payoff-${debt.id}`,
          priority: 4,
          relatedGoalIds: [targetGoal.id],
          observation: `${debt.name} pays off in ${debt.remainingMonths} month${debt.remainingMonths !== 1 ? 's' : ''}, freeing ${formatInr(freedEmi)}/month.`,
          action: `When it clears, channel the ${formatInr(freedEmi)}/month EMI directly into ${targetGoal.name}.`,
          impact:
            monthsSaved > 0
              ? `${targetGoal.name} arrives ~${monthsSaved} months earlier.`
              : `Adds ${formatInr(freedEmi)}/mo to savings momentum.`,
          tone: 'info',
          icon: 'TrendingUp',
        });
      }
    }
  }

  // ── Rule 5: Step-up income boost (priority 5) ─────────────────────────────
  {
    const targetGoal = topGoal;

    if (income.primaryIncrement > 0 && targetGoal !== null) {
      const annualRaise = Math.round(
        (income.primary * income.netRate * income.primaryIncrement) / 100,
      );
      const monthlyBoost = Math.round(
        (income.primary * income.netRate * income.primaryIncrement) / 100 / 12,
      );

      if (monthlyBoost >= 500) {
        const monthsSaved = computeMonthsSaved(targetGoal, monthlyBoost);

        if (monthsSaved >= 1) {
          insights.push({
            id: `stepup-${targetGoal.id}`,
            priority: 5,
            relatedGoalIds: [targetGoal.id],
            observation: `A ${income.primaryIncrement}% raise adds ${formatInr(annualRaise)}/year (${formatInr(monthlyBoost)}/mo) to your capacity.`,
            action: `Earmark the raise increment for ${targetGoal.name} starting next salary cycle.`,
            impact:
              monthsSaved > 0
                ? `Reach ${targetGoal.name} ~${monthsSaved} months earlier.`
                : `Accelerates your top goal without changing current spending.`,
            tone: 'positive',
            icon: 'ArrowUpRight',
          });
        }
      }
    }
  }

  return insights.sort((a, b) => a.priority - b.priority);
}
