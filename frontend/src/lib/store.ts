// ============================================================
// FinPath — Zustand Store (persisted to localStorage)
// Single source of truth for the entire app
// ============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  FinancialProfile,
  IncomeProfile,
  ExpenseProfile,
  DebtProfile,
  DebtItem,
  Goal,
  HealthScore,
  FinancialPlan,
  ChatMessage,
  InvestmentStrategy,
  GoalCompletionAction,
  GoalCompletionDecision,
  StorageMode,
  Milestone,
} from "./types";
import { calculateHealthScore } from "./health-score";
import { generatePlan } from "./plan-engine";
import {
  demoFinancialProfile,
  demoMilestones,
} from "./fixtures/demoProfile";

/** Default empty profile */
const defaultProfile: FinancialProfile = {
  onboarded: false,
  income: { primary: 0, secondary: 0, passive: 0, variablePercent: 0, variable: 0, total: 0, primaryIncrement: 0, secondaryIncrement: 0, passiveIncrement: 0 },
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
  investmentReturnRate: 12,
  storageMode: "local",
  debtGoalDeleted: false,
  milestones: [],
  demoMode: false,
};

const safeStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch (e) {
      console.warn("localStorage.getItem failed", e);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.warn("localStorage.setItem failed (quota exceeded?)", e);
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch (e) {
      console.warn("localStorage.removeItem failed", e);
    }
  },
}));

const DEBT_GOAL_ID = "goal-debt-payoff";

interface FinPathStore extends FinancialProfile {
  // ── Profile setters ────────────────────────────────────
  setIncome: (income: IncomeProfile) => void;
  setExpenses: (expenses: ExpenseProfile) => void;
  setDebts: (debts: DebtProfile) => void;
  addDebtItem: (debt: DebtItem) => void;
  setSavings: (savings: number) => void;
  setInvestments: (investments: number) => void;
  setEmergencyFund: (fund: number) => void;

  // ── Strategy ──────────────────────────────────────
  setStrategy: (strategy: InvestmentStrategy) => void;
  setInvestmentReturnRate: (rate: number) => void;

  // ── Storage mode (Phase 4 — dual storage) ─────────
  setStorageMode: (mode: StorageMode) => void;
  /**
   * Replace the financial profile wholesale (used by remote hydration
   * and JSON import). Skips recompute when `recompute=false`.
   */
  replaceProfile: (
    next: Partial<FinancialProfile>,
    opts?: { recompute?: boolean },
  ) => void;

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
    primaryIncome: number;
    secondaryIncome?: number;
    passiveIncome?: number;
    variablePercent?: number;
    primaryIncrement?: number;
    secondaryIncrement?: number;
    passiveIncrement?: number;
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

  // ── Settings (editable, reflects everywhere) ──────
  updateSettings: (data: {
    income?: number;
    expenses?: Partial<ExpenseProfile>;
    salaryHike?: number; // percentage
  }) => void;

  // ── Milestones (Sparks ledger) ───────────────────
  setMilestones: (milestones: Milestone[]) => void;

  // ── Demo path ────────────────────────────────────
  loadDemoProfile: () => void;

  // ── Reset ────────────────────────────────────────
  resetProfile: () => void;

  // ── UI-only flags (not persisted) ────────────────
  pdfExporting: boolean;
  setPdfExporting: (b: boolean) => void;
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
  if (debts.totalPrincipal && debts.totalPrincipal > 0) return debts.totalPrincipal;
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
    (debts.totalPrincipal && debts.totalPrincipal > 0) ||
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
    totalMonthly: Math.max(totalMonthly, activeMonthly),
    totalPrincipal: debts.totalPrincipal,
  };
}

function isDebtGoalComplete(goal: Goal | undefined): boolean {
  return !!(goal && goal.category === "debt" && goal.status === "complete");
}

function resolveDebtsFromGoals(debts: DebtProfile, _goals: Goal[]): DebtProfile {
  return normalizeDebtProfile(debts);
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
    name: "Debt Payoff (1yr Est.)",
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

function syncDebtGoal(goals: Goal[], debts: DebtProfile, debtGoalDeleted?: boolean): Goal[] {
  const existingDebtGoal = goals.find((goal) => goal.id === DEBT_GOAL_ID);
  const goalsWithoutDebt = goals.filter((goal) => goal.id !== DEBT_GOAL_ID);

  if (!hasDebt(debts) || debtGoalDeleted) {
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
      : { ...goal, priority: 0 };
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
      pdfExporting: false,
      setPdfExporting: (b: boolean) => set({ pdfExporting: b }),

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
            goals: normalizeActiveGoalPriorities(
              syncDebtGoal(s.goals, nextDebts, false),
            ),
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

      setGoals: (goals) => {
        set((s) => {
          const nextDebts = resolveDebtsFromGoals(s.debts, goals);
          return {
            debts: nextDebts,
            goals: normalizeActiveGoalPriorities(
              syncDebtGoal(goals, nextDebts, s.debtGoalDeleted),
            ),
            lastUpdated: Date.now(),
          };
        });
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
            existingGoal.category === "debt" && shouldComplete && !hasDebt(s.debts)
              ? emptyDebtProfile()
              : s.debts;

          return {
            debts: nextDebts,
            goals: normalizeActiveGoalPriorities(
              syncDebtGoal(nextGoals, nextDebts, s.debtGoalDeleted),
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
              id === DEBT_GOAL_ID ? true : (s.debtGoalDeleted ?? false),
            ),
          ),
          debtGoalDeleted: id === DEBT_GOAL_ID ? true : (s.debtGoalDeleted ?? false),
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
          ) && !hasDebt(s.debts)
            ? emptyDebtProfile()
            : s.debts;

          return {
            debts: nextDebts,
            goals: normalizeActiveGoalPriorities(
              syncDebtGoal(nextGoals, nextDebts, s.debtGoalDeleted),
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

      setInvestmentReturnRate: (rate) => {
        // Clamp to a sane band — UI picker maxes at 14, but allow some headroom.
        const clamped = Math.max(0, Math.min(30, rate));
        set({ investmentReturnRate: clamped, lastUpdated: Date.now() });
        get().generatePlan();
      },

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
                  : g.checkedThisMonth
                    ? (g.monthlyAllocation || plan.recommendedAllocations[g.id] || 0)
                    : (plan.recommendedAllocations[g.id] || 0),
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
        const primaryIncome = data.primaryIncome || 0;
        const secondaryIncome = data.secondaryIncome || 0;
        const passiveIncome = data.passiveIncome || 0;
        const variablePercent = data.variablePercent || 0;
        const variable = Math.round(passiveIncome * variablePercent / 100);
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
              }
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
          strategy: data.strategy || "avalanche",
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

      updateSettings: (data) => {
        const state = get();
        const updates: Partial<FinancialProfile> = { lastUpdated: Date.now() };

        if (data.income !== undefined) {
          const newPrimary = data.income;
          const newVariable = Math.round(state.income.passive * state.income.variablePercent / 100);
          updates.income = {
            ...state.income,
            primary: newPrimary,
            variable: newVariable,
            total: newPrimary + state.income.secondary + state.income.passive + newVariable,
          };
        }

        if (data.salaryHike !== undefined) {
          const factor = 1 + data.salaryHike / 100;
          const newPrimary = Math.round(state.income.primary * factor);
          const newVariable = Math.round(state.income.passive * state.income.variablePercent / 100);
          updates.income = {
            ...state.income,
            primary: newPrimary,
            variable: newVariable,
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

      setMilestones: (milestones) => set({ milestones, lastUpdated: Date.now() }),

      loadDemoProfile: () => {
        const { milestones, ...profileFields } = demoFinancialProfile;
        get().replaceProfile(profileFields);
        set({ milestones, demoMode: true, lastUpdated: Date.now() });
      },

      resetProfile: () => set({ ...defaultProfile }),
    }),
    {
      name: "finpath-store",
      version: 6,
      storage: safeStorage,
      partialize: (state) => {
        const { pdfExporting: _exporting, ...rest } = state;
        return rest;
      },
      migrate: (persistedState: any, version: number) => {
        if (version < 2 && persistedState?.income) {
          const inc = persistedState.income;
          inc.primary = inc.salary ?? 0;
          inc.secondary = inc.freelance ?? 0;
          inc.variablePercent = 0;
          inc.variable = 0;
          delete inc.salary;
          delete inc.freelance;
        }
        if (version < 3 && persistedState?.income) {
          const inc = persistedState.income;
          inc.primaryIncrement = inc.primaryIncrement ?? inc.expectedAnnualIncrement ?? 0;
          inc.secondaryIncrement = inc.secondaryIncrement ?? 0;
          inc.passiveIncrement = inc.passiveIncrement ?? 0;
          // Fix variable base: recompute from passive
          inc.variable = Math.round((inc.passive || 0) * (inc.variablePercent || 0) / 100);
          inc.total = (inc.primary || 0) + (inc.secondary || 0) + (inc.passive || 0) + inc.variable;
        }
        if (version < 4 && persistedState) {
          // Seed default 12% to preserve pre-existing plan output for
          // already-onboarded users who never saw the Scenarios picker.
          persistedState.investmentReturnRate = persistedState.investmentReturnRate ?? 12;
        }
        if (version < 5 && persistedState) {
          // Existing users default to 'local' — cloud sync is opt-in.
          persistedState.storageMode = persistedState.storageMode ?? "local";
        }
        if (version < 6 && persistedState) {
          persistedState.milestones = persistedState.milestones ?? [];
        }
        return persistedState;
      },
    },
  ),
);
