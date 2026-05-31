import type {
  FinancialProfile,
  Goal,
  DebtItem,
  Milestone,
} from "@/lib/types";
import { buildMilestoneChain } from "@/lib/sparks";
import { useFinPathStore } from "@/lib/store";

const PRIMARY = 120_000;
const SECONDARY = 15_000;
const PASSIVE = 3_000;
const VARIABLE_PERCENT = 6;
const VARIABLE = Math.round((PASSIVE * VARIABLE_PERCENT) / 100);

const EXPENSES = {
  rent: 28_000,
  food: 12_000,
  transport: 6_000,
  utilities: 4_000,
  entertainment: 5_000,
  other: 8_000,
};
const EXPENSES_TOTAL =
  EXPENSES.rent +
  EXPENSES.food +
  EXPENSES.transport +
  EXPENSES.utilities +
  EXPENSES.entertainment +
  EXPENSES.other;

const DEBT_ITEMS: DebtItem[] = [
  {
    id: "demo-debt-cc",
    name: "HDFC Credit Card",
    category: "creditCard",
    principal: 85_000,
    interestRate: 18,
    monthlyPayment: 6_000,
    remainingMonths: 18,
  },
  {
    id: "demo-debt-edu",
    name: "Education Loan",
    category: "educationLoan",
    principal: 4_50_000,
    interestRate: 9,
    monthlyPayment: 8_500,
    remainingMonths: 60,
  },
];
const DEBT_TOTAL_MONTHLY = DEBT_ITEMS.reduce(
  (sum, d) => sum + d.monthlyPayment,
  0,
);
const DEBT_TOTAL_PRINCIPAL = DEBT_ITEMS.reduce(
  (sum, d) => sum + d.principal,
  0,
);

const GOALS: Goal[] = [
  {
    id: "demo-goal-emergency",
    name: "Emergency fund",
    icon: "Umbrella",
    category: "savings",
    targetAmount: 3_00_000,
    currentAmount: 3_00_000,
    timelineMonths: 0,
    priority: 1,
    status: "complete",
    monthlyAllocation: 0,
    color: "var(--green)",
  },
  {
    id: "demo-goal-home",
    name: "House down payment",
    icon: "Home",
    category: "home",
    targetAmount: 15_00_000,
    currentAmount: 2_40_000,
    timelineMonths: 48,
    priority: 1,
    status: "in-progress",
    monthlyAllocation: 0,
    color: "var(--accent)",
  },
  {
    id: "demo-goal-japan",
    name: "Vacation — Japan",
    icon: "Plane",
    category: "travel",
    targetAmount: 2_50_000,
    currentAmount: 65_000,
    timelineMonths: 14,
    priority: 2,
    status: "in-progress",
    monthlyAllocation: 0,
    color: "var(--secondary-accent)",
  },
];

export const demoMilestones: Milestone[] = buildMilestoneChain([
  {
    goalId: "demo-goal-emergency",
    title: "Emergency fund",
    category: "savings",
    completedAt: "2026-03-15T00:00:00.000Z",
    amount: 3_00_000,
    priority: 1,
  },
]);

export const demoFinancialProfile: FinancialProfile = {
  onboarded: true,
  income: {
    primary: PRIMARY,
    secondary: SECONDARY,
    passive: PASSIVE,
    variablePercent: VARIABLE_PERCENT,
    variable: VARIABLE,
    total: PRIMARY + SECONDARY + PASSIVE + VARIABLE,
    primaryIncrement: 8,
    secondaryIncrement: 5,
    passiveIncrement: 4,
  },
  expenses: {
    ...EXPENSES,
    total: EXPENSES_TOTAL,
  },
  debts: {
    items: DEBT_ITEMS,
    totalMonthly: DEBT_TOTAL_MONTHLY,
    totalPrincipal: DEBT_TOTAL_PRINCIPAL,
  },
  savings: 1_20_000,
  investments: 4_50_000,
  emergencyFund: 3_00_000,
  goals: GOALS,
  healthScore: null,
  plan: null,
  chatHistory: [],
  currency: "INR",
  strategy: "avalanche",
  monthlySurplusReserve: 0,
  pendingGoalDecisions: [],
  lastUpdated: Date.now(),
  stepUpEnabled: true,
  investmentReturnRate: 12,
  storageMode: "local",
  milestones: demoMilestones,
  demoMode: true,
};

export type DemoProfileSeed = {
  profile: FinancialProfile;
  milestones: Milestone[];
};

export async function loadDemoProfile(): Promise<void> {
  useFinPathStore.getState().loadDemoProfile();
}
