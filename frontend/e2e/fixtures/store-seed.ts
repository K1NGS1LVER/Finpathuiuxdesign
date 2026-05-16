/**
 * Pre-built finpath-store for E2E tests.
 * Injected into localStorage before page load to skip auth + onboarding.
 * VITE_AUTH_MOCK=true (set in playwright.config.ts webServer env) provides
 * the authenticated user object via auth-store separately.
 */
export const SEEDED_STORE = {
  state: {
    onboarded: true,
    income: {
      primary: 100000,
      secondary: 20000,
      passive: 0,
      variable: 0,
      variablePercent: 0,
      total: 120000,
      primaryIncrement: 8,
      secondaryIncrement: 5,
      passiveIncrement: 0,
    },
    expenses: {
      rent: 20000,
      food: 8000,
      transport: 3000,
      utilities: 2000,
      entertainment: 2000,
      other: 10000,
      total: 45000,
    },
    savings: 15000,
    investments: 10000,
    emergencyFund: 90000,
    debts: {
      items: [
        {
          id: 'debt-home',
          name: 'Home Loan',
          category: 'homeLoan',
          principal: 5000000,
          interestRate: 8.5,
          monthlyPayment: 45000,
          remainingMonths: 180,
        },
        {
          id: 'debt-personal',
          name: 'Personal Loan',
          category: 'personalLoan',
          principal: 300000,
          interestRate: 14,
          monthlyPayment: 7000,
          remainingMonths: 48,
        },
      ],
      totalMonthly: 52000,
      totalPrincipal: 5300000,
    },
    goals: [
      {
        id: 'goal-emergency',
        name: 'Emergency Fund',
        icon: 'Shield',
        category: 'savings',
        targetAmount: 270000,
        currentAmount: 90000,
        timelineMonths: 24,
        priority: 1,
        status: 'in-progress',
        monthlyAllocation: 8000,
        color: 'var(--amber)',
      },
      {
        id: 'goal-europe',
        name: 'Europe Trip',
        icon: 'Plane',
        category: 'travel',
        targetAmount: 200000,
        currentAmount: 0,
        timelineMonths: 18,
        priority: 2,
        status: 'not-started',
        monthlyAllocation: 11000,
        color: 'var(--accent)',
      },
      {
        id: 'goal-retirement',
        name: 'Retirement',
        icon: 'TrendingUp',
        category: 'investment',
        targetAmount: 10000000,
        currentAmount: 0,
        timelineMonths: 300,
        priority: 3,
        status: 'not-started',
        monthlyAllocation: 7000,
        color: 'var(--green)',
      },
    ],
    strategy: 'balanced',
    storageMode: 'local',
    monthlySurplusReserve: 0,
    chatHistory: [],
    pendingGoalDecisions: [],
    healthScore: null,
    plan: null,
    lastUpdated: 1747400000000,
  },
  version: 5,
};

/** Call in beforeEach to inject seeded store and navigate to a route. */
export async function seedAndGo(
  page: import('@playwright/test').Page,
  path = '/dashboard',
) {
  await page.addInitScript((seed) => {
    localStorage.setItem('finpath-store', JSON.stringify(seed));
  }, SEEDED_STORE);
  await page.goto(path);
}
