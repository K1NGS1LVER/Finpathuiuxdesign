import type { FinancialProfile } from "./types";

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export type SankeyProfileSlice = Pick<
  FinancialProfile,
  "income" | "expenses" | "debts" | "monthlySurplusReserve" | "plan" | "goals"
>;

export function computeGoalAllocationsTotal(profile: SankeyProfileSlice): number {
  const month0 = profile.plan?.months?.[0];
  if (month0?.goalAllocations) {
    return Object.values(month0.goalAllocations).reduce((sum, v) => sum + v, 0);
  }
  return (profile.goals ?? [])
    .filter((g) => g.status !== "complete")
    .reduce((sum, g) => sum + (g.monthlyAllocation || 0), 0);
}

export function buildSankeyData(profile: SankeyProfileSlice): SankeyData {
  const income = profile.income;
  const expenses = profile.expenses;
  const debts = profile.debts;
  const monthlySurplusReserve = profile.monthlySurplusReserve;
  const totalIncome = income?.total || 0;
  if (totalIncome <= 0) return { nodes: [], links: [] };

  const goalAllocationsTotal = computeGoalAllocationsTotal(profile);
  const debtPayments = debts?.totalMonthly || 0;
  const housing = (expenses?.rent || 0) + (expenses?.utilities || 0);
  const food = expenses?.food || 0;
  const transport = expenses?.transport || 0;
  const otherExp = (expenses?.entertainment || 0) + (expenses?.other || 0);
  const totalExpensesDeduped = housing + food + transport + otherExp;
  const surplusReserve = monthlySurplusReserve || 0;
  const goalsProgress = Math.max(0, goalAllocationsTotal);
  const debtAndSavings = debtPayments + goalsProgress + surplusReserve;
  const disposable = Math.max(
    0,
    totalIncome - totalExpensesDeduped - debtAndSavings,
  );

  const primaryInc = income?.primary || 0;
  const secondaryInc = income?.secondary || 0;
  const passiveInc = income?.passive || 0;
  const variableInc = income?.variable || 0;
  const activeSources = [primaryInc, secondaryInc, passiveInc, variableInc]
    .filter((v) => v > 0).length;
  const hasMerger = activeSources > 1;

  let allNodes: SankeyNode[];
  let allLinks: SankeyLink[];

  if (hasMerger) {
    allNodes = [
      { name: "Primary Income" },
      { name: "Secondary Income" },
      { name: "Passive Income" },
      { name: "Variable Income" },
      { name: "Total Income" },
      { name: "Essential Expenses" },
      { name: "Debt & Savings" },
      { name: "Disposable" },
      { name: "Housing & Utilities" },
      { name: "Food" },
      { name: "Transport" },
      { name: "Other Expenses" },
      { name: "Debt Payments" },
      { name: "Goals Progress" },
      { name: "Surplus Reserve" },
      { name: "Free Cash" },
    ];
    allLinks = [
      { source: 0, target: 4, value: primaryInc },
      { source: 1, target: 4, value: secondaryInc },
      { source: 2, target: 4, value: passiveInc },
      { source: 3, target: 4, value: variableInc },
      { source: 4, target: 5, value: totalExpensesDeduped },
      { source: 4, target: 6, value: debtAndSavings },
      { source: 4, target: 7, value: disposable },
      { source: 5, target: 8, value: housing },
      { source: 5, target: 9, value: food },
      { source: 5, target: 10, value: transport },
      { source: 5, target: 11, value: otherExp },
      { source: 6, target: 12, value: debtPayments },
      { source: 6, target: 13, value: goalsProgress },
      { source: 6, target: 14, value: surplusReserve },
      { source: 7, target: 15, value: disposable },
    ].filter((l) => l.value > 0);
  } else {
    allNodes = [
      { name: "Primary Income" },
      { name: "Essential Expenses" },
      { name: "Debt & Savings" },
      { name: "Disposable" },
      { name: "Housing & Utilities" },
      { name: "Food" },
      { name: "Transport" },
      { name: "Other Expenses" },
      { name: "Debt Payments" },
      { name: "Goals Progress" },
      { name: "Surplus Reserve" },
      { name: "Free Cash" },
    ];
    allLinks = [
      { source: 0, target: 1, value: totalExpensesDeduped },
      { source: 0, target: 2, value: debtAndSavings },
      { source: 0, target: 3, value: disposable },
      { source: 1, target: 4, value: housing },
      { source: 1, target: 5, value: food },
      { source: 1, target: 6, value: transport },
      { source: 1, target: 7, value: otherExp },
      { source: 2, target: 8, value: debtPayments },
      { source: 2, target: 9, value: goalsProgress },
      { source: 2, target: 10, value: surplusReserve },
      { source: 3, target: 11, value: disposable },
    ].filter((l) => l.value > 0);
  }

  const referenced = new Set<number>();
  for (const link of allLinks) {
    referenced.add(link.source);
    referenced.add(link.target);
  }

  const usedIndices = Array.from(referenced).sort((a, b) => a - b);
  const oldToNew = new Map<number, number>();
  const filteredNodes = usedIndices.map((oldIdx, newIdx) => {
    oldToNew.set(oldIdx, newIdx);
    return allNodes[oldIdx];
  });

  const filteredLinks = allLinks.map((link) => ({
    ...link,
    source: oldToNew.get(link.source)!,
    target: oldToNew.get(link.target)!,
  }));

  return { nodes: filteredNodes, links: filteredLinks };
}

export interface CashflowKpis {
  totalIncome: number;
  totalExpensesDeduped: number;
  debtAndSavings: number;
  disposable: number;
  goalsProgress: number;
  debtPayments: number;
  surplusReserve: number;
  expensePct: number;
  debtAndSavingsPct: number;
  disposablePct: number;
}

export function computeCashflowKpis(profile: SankeyProfileSlice): CashflowKpis {
  const income = profile.income;
  const expenses = profile.expenses;
  const debts = profile.debts;
  const monthlySurplusReserve = profile.monthlySurplusReserve;
  const totalIncome = income?.total || 0;
  const goalsProgress = computeGoalAllocationsTotal(profile);
  const debtPayments = debts?.totalMonthly || 0;
  const surplusReserve = monthlySurplusReserve || 0;
  const housing = (expenses?.rent || 0) + (expenses?.utilities || 0);
  const food = expenses?.food || 0;
  const transport = expenses?.transport || 0;
  const otherExp = (expenses?.entertainment || 0) + (expenses?.other || 0);
  const totalExpensesDeduped = housing + food + transport + otherExp;
  const debtAndSavings = debtPayments + goalsProgress + surplusReserve;
  const disposable = Math.max(
    0,
    totalIncome - totalExpensesDeduped - debtAndSavings,
  );
  const pct = (n: number) =>
    totalIncome > 0 ? Math.round((n / totalIncome) * 100) : 0;
  return {
    totalIncome,
    totalExpensesDeduped,
    debtAndSavings,
    disposable,
    goalsProgress,
    debtPayments,
    surplusReserve,
    expensePct: pct(totalExpensesDeduped),
    debtAndSavingsPct: pct(debtAndSavings),
    disposablePct: pct(disposable),
  };
}
