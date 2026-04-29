// ============================================================
// FinPath — Zustand Store (persisted to localStorage)
// Single source of truth for the entire app
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FinancialProfile,
  IncomeProfile,
  ExpenseProfile,
  DebtProfile,
  Goal,
  HealthScore,
  FinancialPlan,
  ChatMessage,
  InvestmentStrategy,
  GoalCompletionAction,
  GoalCompletionDecision,
} from "./types";
import { calculateHealthScore } from "./health-score";
import { generatePlan } from "./plan-engine";

/** Default empty profile */
const defaultProfile: FinancialProfile = {
  onboarded: false,
  income: { salary: 0, freelance: 0, passive: 0, total: 0 },
  expenses: {
    rent: 0,
    food: 0,
    transport: 0,
    utilities: 0,
    entertainment: 0,
    other: 0,
    total: 0,
  },
  debts: { items: [], totalMonthly: 0 },
  savings: 0,
  investments: 0,
  emergencyFund: 0,
  goals: [],
  healthScore: null,
  plan: null,
  chatHistory: [],
  currency: "INR",
  strategy: "avalanche",
  monthlySurplusReserve: 0,
  pendingGoalDecisions: [],
  lastUpdated: Date.now(),
};

const DEBT_GOAL_ID = "goal-debt-payoff";

interface FinPathStore extends FinancialProfile {
  // ── Profile setters ────────────────────────────────────
  setIncome: (income: IncomeProfile) => void;
  setExpenses: (expenses: ExpenseProfile) => void;
  setDebts: (debts: DebtProfile) => void;
  setSavings: (savings: number) => void;
  setInvestments: (investments: number) => void;
  setEmergencyFund: (fund: number) => void;

  // ── Strategy ──────────────────────────────────────
  setStrategy: (strategy: InvestmentStrategy) => void;

  // ── Goal management ──────────────────────────────────
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  completeGoal: (id: string) => void;
  addLumpsum: (goalId: string, amount: number) => void;
  resolveGoalCompletionDecision: (
    goalId: string,
    action: GoalCompletionAction,
  ) => void;

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
    goals: { name: string; targetAmount?: number; priority?: number }[];
    expenseBreakdown?: Record<string, number>;
    debtBreakdown?: Record<string, number>;
    strategy?: InvestmentStrategy;
    surplus?: number;
  }) => void;

  // ── Settings (editable, reflects everywhere) ──────
  updateSettings: (data: {
    income?: number;
    expenses?: Partial<ExpenseProfile>;
    salaryHike?: number; // percentage
  }) => void;

  // ── Reset ────────────────────────────────────────
  resetProfile: () => void;
  reset: () => void;
}

/** Map goal name from onboarding to a Goal object */
function goalNameToGoal(name: string, index: number): Goal {
  const goalConfigs: Record<string, Partial<Goal>> = {
    "Dream Bike": {
      category: "bike",
      icon: "Bike",
      targetAmount: 120000,
      timelineMonths: 18,
      color: "var(--accent)",
    },
    Investment: {
      category: "investment",
      icon: "TrendingUp",
      targetAmount: 500000,
      timelineMonths: 36,
      color: "var(--tertiary-accent)",
    },
    "Emergency Fund": {
      category: "savings",
      icon: "Shield",
      targetAmount: 300000,
      timelineMonths: 24,
      color: "var(--tertiary-accent)",
    },
    Wedding: {
      category: "family",
      icon: "Heart",
      targetAmount: 500000,
      timelineMonths: 24,
      color: "var(--amber)",
    },
    Vacation: {
      category: "travel",
      icon: "Plane",
      targetAmount: 50000,
      timelineMonths: 6,
      color: "var(--accent)",
    },
    "Upskill Course": {
      category: "education",
      icon: "GraduationCap",
      targetAmount: 100000,
      timelineMonths: 12,
      color: "var(--tertiary-accent)",
    },
    Custom: {
      category: "custom",
      icon: "Target",
      targetAmount: 100000,
      timelineMonths: 12,
      color: "var(--tertiary-accent)",
    },
  };

  const config = goalConfigs[name] || goalConfigs["Custom"]!;

  return {
    id: `goal-${Date.now()}-${index}`,
    name,
    icon: config.icon || "Target",
    category: config.category || "custom",
    targetAmount: config.targetAmount || 100000,
    currentAmount: 0,
    timelineMonths: config.timelineMonths || 12,
    priority: index + 1,
    status: "not-started",
    monthlyAllocation: 0,
    color: config.color || "var(--accent)",
  };
}

function getDebtGoalTarget(debts: DebtProfile): number {
  const itemPrincipal = debts.items.reduce(
    (sum, debt) => sum + Math.max(0, debt.principal || 0),
    0,
  );

  if (itemPrincipal > 0) return itemPrincipal;
  return Math.max(0, debts.totalMonthly || 0) * 12;
}

function getDebtGoalTimeline(debts: DebtProfile): number {
  const itemTimeline = debts.items.reduce(
    (max, debt) => Math.max(max, debt.remainingMonths || 0),
    0,
  );

  if (itemTimeline > 0) return itemTimeline;
  return debts.totalMonthly > 0 ? 12 : 0;
}

function hasDebt(debts: DebtProfile): boolean {
  return (
    Math.max(0, debts.totalMonthly || 0) > 0 ||
    debts.items.some(
      (debt) =>
        Math.max(0, debt.principal || 0) > 0 &&
        Math.max(0, debt.monthlyPayment || 0) > 0 &&
        Math.max(0, debt.remainingMonths || 0) > 0,
    )
  );
}

function emptyDebtProfile(): DebtProfile {
  return { items: [], totalMonthly: 0 };
}

function normalizeDebtProfile(debts: DebtProfile): DebtProfile {
  const totalMonthly = Math.max(0, debts.totalMonthly || 0);

  if (debts.items.length === 0) {
    return totalMonthly > 0
      ? { items: [], totalMonthly }
      : emptyDebtProfile();
  }

  const activeItems = debts.items.filter(
    (debt) =>
      Math.max(0, debt.principal || 0) > 0 &&
      Math.max(0, debt.monthlyPayment || 0) > 0 &&
      Math.max(0, debt.remainingMonths || 0) > 0,
  );

  if (activeItems.length === 0) {
    return emptyDebtProfile();
  }

  const activeMonthly = activeItems.reduce(
    (sum, debt) => sum + Math.max(0, debt.monthlyPayment || 0),
    0,
  );

  return {
    items: activeItems,
    totalMonthly: activeMonthly,
  };
}

function isDebtGoalComplete(goal: Goal | undefined): boolean {
  return !!(
    goal &&
    goal.category === "debt" &&
    (goal.status === "complete" ||
      (goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount))
  );
}

function resolveDebtsFromGoals(debts: DebtProfile, goals: Goal[]): DebtProfile {
  const normalizedDebts = normalizeDebtProfile(debts);
  const debtGoal = goals.find((goal) => goal.category === "debt");
  return isDebtGoalComplete(debtGoal) ? emptyDebtProfile() : normalizedDebts;
}

function makeDebtGoal(
  debts: DebtProfile,
  existingGoal: Goal | undefined,
  priority: number,
): Goal {
  const targetAmount = Math.max(1, getDebtGoalTarget(debts));
  const currentAmount = Math.min(
    targetAmount,
    Math.max(0, existingGoal?.currentAmount || 0),
  );
  const status: Goal["status"] =
    currentAmount >= targetAmount
      ? "complete"
      : currentAmount > 0
        ? "in-progress"
        : "not-started";

  return {
    id: DEBT_GOAL_ID,
    name: "Debt Payoff",
    icon: "CreditCard",
    category: "debt",
    targetAmount,
    currentAmount,
    timelineMonths: Math.max(1, getDebtGoalTimeline(debts)),
    priority: existingGoal?.priority || priority,
    status,
    monthlyAllocation: Math.max(0, debts.totalMonthly || 0),
    color: "var(--red)",
    checkedThisMonth: existingGoal?.checkedThisMonth,
    lumpsumAdded: existingGoal?.lumpsumAdded,
  };
}

function syncDebtGoal(goals: Goal[], debts: DebtProfile): Goal[] {
  const existingDebtGoal = goals.find((goal) => goal.id === DEBT_GOAL_ID);
  const goalsWithoutDebt = goals.filter((goal) => goal.id !== DEBT_GOAL_ID);

  if (!hasDebt(debts)) {
    return goalsWithoutDebt;
  }

  const activeCount = goalsWithoutDebt.filter(
    (goal) => goal.status !== "complete",
  ).length;

  return [
    makeDebtGoal(debts, existingDebtGoal, activeCount + 1),
    ...goalsWithoutDebt,
  ];
}

/** Keep active goal priorities contiguous (1..N) after add/remove/reorder actions. */
function normalizeActiveGoalPriorities(goals: Goal[]): Goal[] {
  const activeGoals = goals
    .filter((g) => g.status !== "complete")
    .slice()
    .sort(
      (a, b) =>
        (a.priority || Number.MAX_SAFE_INTEGER) -
        (b.priority || Number.MAX_SAFE_INTEGER),
    );

  const priorityById = new Map<string, number>();
  activeGoals.forEach((goal, index) => {
    priorityById.set(goal.id, index + 1);
  });

  return goals.map((goal) => {
    const nextPriority = priorityById.get(goal.id);
    return typeof nextPriority === "number"
      ? { ...goal, priority: nextPriority }
      : goal;
  });
}

function removeDecisionFromQueue(
  pendingGoalDecisions: GoalCompletionDecision[],
  goalId: string,
): GoalCompletionDecision[] {
  return pendingGoalDecisions.filter((decision) => decision.goalId !== goalId);
}

function upsertDecision(
  pendingGoalDecisions: GoalCompletionDecision[],
  nextDecision: GoalCompletionDecision,
): GoalCompletionDecision[] {
  const existingIndex = pendingGoalDecisions.findIndex(
    (decision) => decision.goalId === nextDecision.goalId,
  );

  if (existingIndex === -1) {
    return [...pendingGoalDecisions, nextDecision];
  }

  const copy = pendingGoalDecisions.slice();
  copy[existingIndex] = nextDecision;
  return copy;
}

export const useFinPathStore = create<FinPathStore>()(
  persist(
    (set, get) => ({
      ...defaultProfile,

      setIncome: (income) => {
        set({ income, lastUpdated: Date.now() });
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
            syncDebtGoal(s.goals, nextDebts),
          ),
          lastUpdated: Date.now(),
        }));
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

      setGoals: (goals) => {
        set((s) => ({
          debts: resolveDebtsFromGoals(s.debts, goals),
          goals: normalizeActiveGoalPriorities(
            syncDebtGoal(goals, resolveDebtsFromGoals(s.debts, goals)),
          ),
          lastUpdated: Date.now(),
        }));
        const store = get();
        store.generatePlan();
      },
      addGoal: (goal) => {
        set((s) => {
          const activeCount = s.goals.filter(
            (g) => g.status !== "complete",
          ).length;
          const goalWithPriority = {
            ...goal,
            priority: goal.priority > 0 ? goal.priority : activeCount + 1,
          };

          return {
            goals: normalizeActiveGoalPriorities(
              syncDebtGoal([...s.goals, goalWithPriority], s.debts),
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
            typeof mergedGoal.targetAmount === "number" &&
            mergedGoal.targetAmount > 0
              ? mergedGoal.targetAmount
              : existingGoal.targetAmount;
          const nextAmount = Math.min(
            nextTarget,
            Math.max(
              0,
              typeof mergedGoal.currentAmount === "number"
                ? mergedGoal.currentAmount
                : existingGoal.currentAmount,
            ),
          );
          const shouldComplete =
            mergedGoal.status === "complete" || nextAmount >= nextTarget;

          const nextStatus: Goal["status"] = shouldComplete
            ? "complete"
            : mergedGoal.status ||
              (nextAmount > 0 ? "in-progress" : "not-started");

          const previousAllocation = Math.max(
            0,
            existingGoal.monthlyAllocation || 0,
          );
          const becameComplete =
            existingGoal.status !== "complete" && shouldComplete;

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
            ? existingGoal.category === "debt"
              ? removeDecisionFromQueue(s.pendingGoalDecisions, id)
              : upsertDecision(s.pendingGoalDecisions, {
                goalId: id,
                goalName: existingGoal.name,
                freedMonthlyAmount: previousAllocation,
                createdAt: Date.now(),
              })
            : removeDecisionFromQueue(s.pendingGoalDecisions, id);
          const nextDebts =
            existingGoal.category === "debt" && shouldComplete
              ? emptyDebtProfile()
              : s.debts;

          return {
            debts: nextDebts,
            goals: normalizeActiveGoalPriorities(
              syncDebtGoal(nextGoals, nextDebts),
            ),
            pendingGoalDecisions,
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
            ),
          ),
          pendingGoalDecisions: removeDecisionFromQueue(
            s.pendingGoalDecisions,
            id,
          ),
          lastUpdated: Date.now(),
        }));
        const store = get();
        store.generatePlan();
      },
      completeGoal: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal) return;
        get().updateGoal(id, {
          status: "complete",
          currentAmount: goal.targetAmount,
        });
      },

      addLumpsum: (goalId, amount) => {
        if (!amount || amount <= 0) return;

        set((s) => {
          let completedGoalId: string | null = null;
          let completedGoalName = "";
          let completedGoalAllocation = 0;

          const nextGoals = s.goals.map((goal) => {
            if (goal.id !== goalId) return goal;

            const nextAmount = Math.min(
              goal.targetAmount,
              goal.currentAmount + amount,
            );
            const completed = nextAmount >= goal.targetAmount;
            if (completed) {
              completedGoalId = goal.id;
              completedGoalName = goal.name;
              completedGoalAllocation = Math.max(
                0,
                goal.monthlyAllocation || 0,
              );
            }

            return {
              ...goal,
              currentAmount: nextAmount,
              lumpsumAdded: (goal.lumpsumAdded || 0) + amount,
              status: completed
                ? "complete"
                : goal.status === "not-started"
                  ? "in-progress"
                  : goal.status,
            };
          });

          const pendingGoalDecisions = completedGoalId
            ? nextGoals.find((goal) => goal.id === completedGoalId)?.category ===
              "debt"
              ? removeDecisionFromQueue(s.pendingGoalDecisions, completedGoalId)
              : upsertDecision(s.pendingGoalDecisions, {
                goalId: completedGoalId,
                goalName: completedGoalName,
                freedMonthlyAmount: completedGoalAllocation,
                createdAt: Date.now(),
              })
            : s.pendingGoalDecisions;
          const nextDebts = isDebtGoalComplete(
            nextGoals.find((goal) => goal.id === goalId),
          )
            ? emptyDebtProfile()
            : s.debts;

          return {
            debts: nextDebts,
            goals: normalizeActiveGoalPriorities(
              syncDebtGoal(nextGoals, nextDebts),
            ),
            pendingGoalDecisions,
            lastUpdated: Date.now(),
          };
        });

        const store = get();
        store.generatePlan();
      },

      resolveGoalCompletionDecision: (goalId, action) => {
        set((s) => {
          const decision = s.pendingGoalDecisions.find(
            (item) => item.goalId === goalId,
          );
          const freedMonthlyAmount = Math.max(
            0,
            decision?.freedMonthlyAmount || 0,
          );

          const nextReserve =
            action === "surplus"
              ? s.monthlySurplusReserve + freedMonthlyAmount
              : s.monthlySurplusReserve;

          return {
            pendingGoalDecisions: removeDecisionFromQueue(
              s.pendingGoalDecisions,
              goalId,
            ),
            monthlySurplusReserve: nextReserve,
            lastUpdated: Date.now(),
          };
        });

        const store = get();
        store.generatePlan();
      },

      setStrategy: (strategy) => {
        set({ strategy, lastUpdated: Date.now() });
        // Recalculate plan with new strategy
        const store = get();
        store.generatePlan();
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
          syncDebtGoal(state.goals, debts),
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
        });

        // Update goal monthly allocations
        const updatedGoals = normalizeActiveGoalPriorities(
          syncedGoals.map((g) => {
            const isComplete =
              g.status === "complete" || g.currentAmount >= g.targetAmount;
            const nextStatus: Goal["status"] = isComplete
              ? "complete"
              : g.currentAmount > 0 ||
                  g.category === "debt" ||
                  (plan.recommendedAllocations[g.id] || 0) > 0
                ? "in-progress"
                : "not-started";

            return {
              ...g,
              currentAmount: isComplete ? g.targetAmount : g.currentAmount,
              monthlyAllocation:
                g.category === "debt"
                  ? Math.max(0, debts.totalMonthly || 0)
                  : plan.recommendedAllocations[g.id] || 0,
              status: nextStatus,
            };
          }),
        );

        set({ debts, plan, goals: updatedGoals, lastUpdated: Date.now() });
        return plan;
      },

      addChatMessage: (msg) =>
        set((s) => ({
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
        const debts = normalizeDebtProfile({
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
        });

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
          goals: normalizeActiveGoalPriorities(syncDebtGoal(goals, debts)),
          savings: 0,
          investments: 0,
          emergencyFund: 0,
          strategy: data.strategy || "avalanche",
          monthlySurplusReserve: Math.max(0, data.surplus || 0),
          pendingGoalDecisions: [],
          lastUpdated: Date.now(),
        });

        // Compute health score and plan
        const store = get();
        store.computeHealthScore();
        store.generatePlan();
      },

      updateSettings: (data) => {
        const state = get();
        const updates: Partial<FinancialProfile> = { lastUpdated: Date.now() };

        if (data.income !== undefined) {
          updates.income = {
            ...state.income,
            salary: data.income,
            total: data.income + state.income.freelance + state.income.passive,
          };
        }

        if (data.salaryHike !== undefined) {
          const factor = 1 + data.salaryHike / 100;
          updates.income = {
            ...state.income,
            salary: Math.round(state.income.salary * factor),
            total: Math.round(state.income.total * factor),
          };
        }

        if (data.expenses) {
          updates.expenses = {
            ...state.expenses,
            ...data.expenses,
            total: Object.entries({ ...state.expenses, ...data.expenses })
              .filter(([k]) => k !== "total")
              .reduce((sum, [, v]) => sum + (typeof v === "number" ? v : 0), 0),
          };
        }

        set(updates);

        // Recompute
        const store = get();
        store.computeHealthScore();
        store.generatePlan();
      },

      resetProfile: () => set({ ...defaultProfile }),
      reset: () => set({ ...defaultProfile }),
    }),
    {
      name: "finpath-store",
      version: 1,
    },
  ),
);
