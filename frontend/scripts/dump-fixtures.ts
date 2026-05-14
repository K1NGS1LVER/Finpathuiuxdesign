// ============================================================
// FinPath — Fixture dumper for cross-language engine parity
// Runs each TS engine on a curated set of inputs and writes
// { input, expected } JSON files. Python tests load these and
// must produce the same `expected` shape (modulo `date` fields,
// which are runtime-dependent and stripped during compare).
// Run via: pnpm fixtures
// ============================================================

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { calculateHealthScore } from '../src/lib/health-score';
import { avalanche, snowball, compareStrategies } from '../src/lib/debt-strategies';
import { generatePlan, generateScenarioPlan } from '../src/lib/plan-engine';
import type {
  IncomeProfile,
  ExpenseProfile,
  DebtItem,
  DebtProfile,
  Goal,
} from '../src/lib/types';

// scripts/ is at frontend/scripts/; repo root is two levels up.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE_ROOT = resolve(REPO_ROOT, 'tests/fixtures');

function writeFixture(engine: string, name: string, input: unknown, expected: unknown) {
  const dir = resolve(FIXTURE_ROOT, engine);
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, `${name}.json`);
  writeFileSync(file, JSON.stringify({ input, expected }, null, 2), 'utf8');
  console.log(`  wrote ${engine}/${name}.json`);
}

// ── Health score ───────────────────────────────────────────────
function makeIncome(p: Partial<IncomeProfile> = {}): IncomeProfile {
  const base: IncomeProfile = {
    primary: 80000,
    secondary: 0,
    passive: 0,
    variablePercent: 0,
    variable: 0,
    total: 80000,
    primaryIncrement: 0,
    secondaryIncrement: 0,
    passiveIncrement: 0,
  };
  const merged = { ...base, ...p };
  // Recompute total if user overrode parts without total
  if (p.total === undefined) {
    merged.total = (merged.primary || 0) + (merged.secondary || 0) + (merged.passive || 0) + (merged.variable || 0);
  }
  return merged;
}

function makeExpenses(p: Partial<ExpenseProfile> = {}): ExpenseProfile {
  const base: ExpenseProfile = {
    rent: 20000, food: 10000, transport: 5000, utilities: 3000, entertainment: 4000, other: 3000, total: 45000,
  };
  const merged = { ...base, ...p };
  if (p.total === undefined) {
    merged.total = merged.rent + merged.food + merged.transport + merged.utilities + merged.entertainment + merged.other;
  }
  return merged;
}

function makeDebts(p: Partial<DebtProfile> = {}): DebtProfile {
  return { items: [], totalMonthly: 0, ...p };
}

function dumpHealth() {
  console.log('[health]');
  const cases: { name: string; input: Parameters<typeof calculateHealthScore>[0] }[] = [
    {
      name: 'zero_income',
      input: { income: makeIncome({ primary: 0, total: 0 }), expenses: makeExpenses(), debts: makeDebts(), savings: 0, investments: 0, emergencyFund: 0 },
    },
    {
      name: 'healthy_solo',
      input: { income: makeIncome({ primary: 100000, total: 100000 }), expenses: makeExpenses({ total: 40000 }), debts: makeDebts(), savings: 100000, investments: 200000, emergencyFund: 300000 },
    },
    {
      name: 'diversified_high',
      input: { income: makeIncome({ primary: 80000, secondary: 20000, passive: 10000, variable: 5000, total: 115000 }), expenses: makeExpenses({ total: 50000 }), debts: makeDebts({ totalMonthly: 10000 }), savings: 50000, investments: 100000, emergencyFund: 600000 },
    },
    {
      name: 'heavy_debt',
      input: { income: makeIncome({ primary: 60000, total: 60000 }), expenses: makeExpenses({ total: 25000 }), debts: makeDebts({ totalMonthly: 35000 }), savings: 10000, investments: 0, emergencyFund: 5000 },
    },
    {
      name: 'mid_savings_low_emergency',
      input: { income: makeIncome({ primary: 70000, total: 70000 }), expenses: makeExpenses({ total: 50000 }), debts: makeDebts({ totalMonthly: 5000 }), savings: 20000, investments: 5000, emergencyFund: 40000 },
    },
    {
      name: 'negative_surplus',
      input: { income: makeIncome({ primary: 30000, total: 30000 }), expenses: makeExpenses({ total: 35000 }), debts: makeDebts({ totalMonthly: 5000 }), savings: 0, investments: 0, emergencyFund: 0 },
    },
  ];

  for (const c of cases) {
    writeFixture('health', c.name, c.input, calculateHealthScore(c.input));
  }
}

// ── Debt strategies ────────────────────────────────────────────
function makeDebt(p: Partial<DebtItem>): DebtItem {
  return {
    id: p.id ?? 'd1',
    name: p.name ?? 'Loan',
    category: p.category ?? 'personalLoan',
    principal: p.principal ?? 100000,
    interestRate: p.interestRate ?? 12,
    monthlyPayment: p.monthlyPayment ?? 5000,
    remainingMonths: p.remainingMonths ?? 24,
  };
}

function dumpDebt() {
  console.log('[debt]');
  const cases: { name: string; debts: DebtItem[]; extra: number }[] = [
    { name: 'empty', debts: [], extra: 0 },
    {
      name: 'single_loan_no_extra',
      debts: [makeDebt({ id: 'a', principal: 50000, interestRate: 18, monthlyPayment: 3000 })],
      extra: 0,
    },
    {
      name: 'single_loan_with_extra',
      debts: [makeDebt({ id: 'a', principal: 100000, interestRate: 15, monthlyPayment: 5000 })],
      extra: 5000,
    },
    {
      name: 'mixed_two_loans',
      debts: [
        makeDebt({ id: 'a', name: 'Credit Card', category: 'creditCard', principal: 80000, interestRate: 36, monthlyPayment: 4000 }),
        makeDebt({ id: 'b', name: 'Personal Loan', category: 'personalLoan', principal: 200000, interestRate: 14, monthlyPayment: 8000 }),
      ],
      extra: 3000,
    },
    {
      name: 'three_loans_avalanche_vs_snowball',
      debts: [
        makeDebt({ id: 'a', principal: 30000, interestRate: 8, monthlyPayment: 2000 }),
        makeDebt({ id: 'b', principal: 150000, interestRate: 22, monthlyPayment: 5000 }),
        makeDebt({ id: 'c', principal: 50000, interestRate: 12, monthlyPayment: 3000 }),
      ],
      extra: 4000,
    },
  ];

  for (const c of cases) {
    writeFixture('debt', `avalanche__${c.name}`, { debts: c.debts, extra: c.extra }, avalanche(c.debts, c.extra));
    writeFixture('debt', `snowball__${c.name}`, { debts: c.debts, extra: c.extra }, snowball(c.debts, c.extra));
    writeFixture('debt', `compare__${c.name}`, { debts: c.debts, extra: c.extra }, compareStrategies(c.debts, c.extra));
  }
}

// ── Plan engine ────────────────────────────────────────────────
function makeGoal(p: Partial<Goal>): Goal {
  return {
    id: p.id ?? 'g1',
    name: p.name ?? 'Goal',
    icon: p.icon ?? 'Target',
    category: p.category ?? 'savings',
    targetAmount: p.targetAmount ?? 100000,
    currentAmount: p.currentAmount ?? 0,
    timelineMonths: p.timelineMonths ?? 12,
    priority: p.priority ?? 1,
    status: p.status ?? 'in-progress',
    monthlyAllocation: p.monthlyAllocation ?? 0,
    color: p.color ?? '#3b82f6',
  };
}

function dumpPlan() {
  console.log('[plan]');
  const cases: { name: string; input: Parameters<typeof generatePlan>[0] }[] = [
    {
      name: 'no_goals',
      input: {
        income: makeIncome({ primary: 80000, total: 80000 }),
        expenses: makeExpenses({ total: 40000 }),
        debts: makeDebts(),
        goals: [],
        savings: 50000,
        investments: 100000,
        strategy: 'avalanche',
      },
    },
    {
      name: 'single_goal_short_timeline',
      input: {
        income: makeIncome({ primary: 100000, total: 100000 }),
        expenses: makeExpenses({ total: 50000 }),
        debts: makeDebts(),
        goals: [makeGoal({ id: 'bike', name: 'Bike', targetAmount: 100000, timelineMonths: 6, priority: 1 })],
        savings: 0,
        investments: 0,
        strategy: 'avalanche',
      },
    },
    {
      name: 'two_goals_avalanche',
      input: {
        income: makeIncome({ primary: 120000, total: 120000 }),
        expenses: makeExpenses({ total: 60000 }),
        debts: makeDebts({ totalMonthly: 10000 }),
        goals: [
          makeGoal({ id: 'emergency', name: 'Emergency', targetAmount: 300000, timelineMonths: 12, priority: 1 }),
          makeGoal({ id: 'travel', name: 'Travel', targetAmount: 100000, timelineMonths: 24, priority: 2 }),
        ],
        savings: 0,
        investments: 0,
        strategy: 'avalanche',
      },
    },
    {
      name: 'two_goals_snowball',
      input: {
        income: makeIncome({ primary: 120000, total: 120000 }),
        expenses: makeExpenses({ total: 60000 }),
        debts: makeDebts({ totalMonthly: 10000 }),
        goals: [
          makeGoal({ id: 'emergency', name: 'Emergency', targetAmount: 300000, timelineMonths: 12, priority: 1 }),
          makeGoal({ id: 'travel', name: 'Travel', targetAmount: 100000, timelineMonths: 24, priority: 2 }),
        ],
        savings: 0,
        investments: 0,
        strategy: 'snowball',
      },
    },
    {
      name: 'step_up_enabled',
      input: {
        income: makeIncome({ primary: 80000, total: 80000, primaryIncrement: 10 }),
        expenses: makeExpenses({ total: 40000 }),
        debts: makeDebts(),
        goals: [makeGoal({ id: 'house', name: 'House', targetAmount: 1000000, timelineMonths: 36, priority: 1 })],
        savings: 0,
        investments: 0,
        strategy: 'avalanche',
        stepUpEnabled: true,
      },
    },
    {
      name: 'scenario_income_up_20',
      input: {
        income: makeIncome({ primary: 100000, total: 100000 }),
        expenses: makeExpenses({ total: 50000 }),
        debts: makeDebts(),
        goals: [makeGoal({ id: 'g', targetAmount: 240000, timelineMonths: 12 })],
        savings: 0,
        investments: 0,
        strategy: 'avalanche',
      },
    },
  ];

  for (const c of cases) {
    writeFixture('plan', c.name, c.input, generatePlan(c.input));
  }

  // Scenario plan: one fixture with explicit modifications
  const scenarioInput = cases[cases.length - 1].input;
  const mods = { incomeChange: 20, expenseChange: -10 };
  writeFixture(
    'plan',
    'scenario__income_up_20_expenses_down_10',
    { base: scenarioInput, modifications: mods },
    generateScenarioPlan(scenarioInput, mods),
  );
}

// ── Entrypoint ─────────────────────────────────────────────────
mkdirSync(FIXTURE_ROOT, { recursive: true });
dumpHealth();
dumpDebt();
dumpPlan();
console.log('Done.');
