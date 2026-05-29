import type { FinancialProfile, Goal, DebtItem } from "./types";

export type NodeKind =
  | 'income-leaf'
  | 'income-merge'
  | 'expense-agg'
  | 'expense-leaf'
  | 'debt-agg'
  | 'debt-item'
  | 'goal-agg'
  | 'goal-item'
  | 'surplus'
  | 'disposable'
  | 'free-cash'

export interface SankeyNode {
  name: string;
  kind?: NodeKind;
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

  // Dynamic debt/goal items
  const debtItems = (debts?.items ?? []).filter((d: DebtItem) => (d.monthlyPayment ?? 0) > 0);
  const activeGoals = (profile.goals ?? []).filter((g: Goal) => g.status !== 'complete');
  function goalAmt(g: Goal): number {
    return profile.plan?.months?.[0]?.goalAllocations?.[g.id] ?? g.monthlyAllocation ?? 0;
  }
  const activeGoalsWithAmt = activeGoals.filter((g: Goal) => goalAmt(g) > 0);
  const debtTotal = debtItems.reduce((s: number, d: DebtItem) => s + d.monthlyPayment, 0);
  const goalsTotal = activeGoalsWithAmt.reduce((s: number, g: Goal) => s + goalAmt(g), 0);

  const housing = (expenses?.rent || 0) + (expenses?.utilities || 0);
  const food = expenses?.food || 0;
  const transport = expenses?.transport || 0;
  const otherExp = (expenses?.entertainment || 0) + (expenses?.other || 0);
  const totalExpensesDeduped = housing + food + transport + otherExp;
  const surplusReserve = monthlySurplusReserve || 0;
  const debtAndSavings = debtTotal + goalsTotal + surplusReserve;
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

  const allNodes: SankeyNode[] = [];
  const allLinks: SankeyLink[] = [];

  if (hasMerger) {
    // Indices 0-3: income sources (only used ones matter due to filter+reindex)
    allNodes.push({ name: "Primary Income",   kind: 'income-leaf' });  // 0
    allNodes.push({ name: "Secondary Income", kind: 'income-leaf' });  // 1
    allNodes.push({ name: "Passive Income",   kind: 'income-leaf' });  // 2
    allNodes.push({ name: "Variable Income",  kind: 'income-leaf' });  // 3
    allNodes.push({ name: "Total Income",     kind: 'income-merge' }); // 4
    allNodes.push({ name: "Essential Expenses", kind: 'expense-agg' }); // 5
    allNodes.push({ name: "Disposable",       kind: 'disposable' });   // 6
    allNodes.push({ name: "Housing & Utilities", kind: 'expense-leaf' }); // 7
    allNodes.push({ name: "Food",             kind: 'expense-leaf' }); // 8
    allNodes.push({ name: "Transport",        kind: 'expense-leaf' }); // 9
    allNodes.push({ name: "Other Expenses",   kind: 'expense-leaf' }); // 10

    // Static links (income sources → merger, merger → expense/disposable)
    allLinks.push({ source: 0, target: 4, value: primaryInc });
    allLinks.push({ source: 1, target: 4, value: secondaryInc });
    allLinks.push({ source: 2, target: 4, value: passiveInc });
    allLinks.push({ source: 3, target: 4, value: variableInc });
    allLinks.push({ source: 4, target: 5, value: totalExpensesDeduped });
    allLinks.push({ source: 4, target: 6, value: disposable });
    allLinks.push({ source: 5, target: 7, value: housing });
    allLinks.push({ source: 5, target: 8, value: food });
    allLinks.push({ source: 5, target: 9, value: transport });
    allLinks.push({ source: 5, target: 10, value: otherExp });

    // Dynamic section starting at index 11
    let nextIdx = 11;

    // Free Cash node (Disposable passthrough)
    const freeCashIdx = nextIdx++;
    allNodes.push({ name: "Free Cash", kind: 'free-cash' });
    allLinks.push({ source: 6, target: freeCashIdx, value: disposable });

    // Debt aggregate + items
    let debtAggIdx = -1;
    if (debtTotal > 0) {
      debtAggIdx = nextIdx++;
      allNodes.push({ name: "Debt", kind: 'debt-agg' });
      allLinks.push({ source: 4, target: debtAggIdx, value: debtTotal });
      debtItems.forEach((d: DebtItem) => {
        const itemIdx = nextIdx++;
        allNodes.push({ name: d.name, kind: 'debt-item' });
        allLinks.push({ source: debtAggIdx, target: itemIdx, value: d.monthlyPayment });
      });
    }

    // Goals aggregate + items
    let goalAggIdx = -1;
    if (goalsTotal > 0) {
      goalAggIdx = nextIdx++;
      allNodes.push({ name: "Goals", kind: 'goal-agg' });
      allLinks.push({ source: 4, target: goalAggIdx, value: goalsTotal });
      activeGoalsWithAmt.forEach((g: Goal) => {
        const itemIdx = nextIdx++;
        allNodes.push({ name: g.name, kind: 'goal-item' });
        allLinks.push({ source: goalAggIdx, target: itemIdx, value: goalAmt(g) });
      });
    }

    // Surplus Reserve
    if (surplusReserve > 0) {
      const surplusIdx = nextIdx++;
      allNodes.push({ name: "Surplus Reserve", kind: 'surplus' });
      allLinks.push({ source: 4, target: surplusIdx, value: surplusReserve });
    }

  } else {
    // Single income source
    allNodes.push({ name: "Primary Income",    kind: 'income-leaf' }); // 0
    allNodes.push({ name: "Essential Expenses", kind: 'expense-agg' }); // 1
    allNodes.push({ name: "Disposable",         kind: 'disposable' });  // 2
    allNodes.push({ name: "Housing & Utilities", kind: 'expense-leaf' }); // 3
    allNodes.push({ name: "Food",               kind: 'expense-leaf' }); // 4
    allNodes.push({ name: "Transport",          kind: 'expense-leaf' }); // 5
    allNodes.push({ name: "Other Expenses",     kind: 'expense-leaf' }); // 6

    // Static links
    allLinks.push({ source: 0, target: 1, value: totalExpensesDeduped });
    allLinks.push({ source: 0, target: 2, value: disposable });
    allLinks.push({ source: 1, target: 3, value: housing });
    allLinks.push({ source: 1, target: 4, value: food });
    allLinks.push({ source: 1, target: 5, value: transport });
    allLinks.push({ source: 1, target: 6, value: otherExp });

    // Dynamic section starting at index 7
    let nextIdx = 7;

    // Free Cash node (Disposable passthrough)
    const freeCashIdx = nextIdx++;
    allNodes.push({ name: "Free Cash", kind: 'free-cash' });
    allLinks.push({ source: 2, target: freeCashIdx, value: disposable });

    // Debt aggregate + items
    let debtAggIdx = -1;
    if (debtTotal > 0) {
      debtAggIdx = nextIdx++;
      allNodes.push({ name: "Debt", kind: 'debt-agg' });
      allLinks.push({ source: 0, target: debtAggIdx, value: debtTotal });
      debtItems.forEach((d: DebtItem) => {
        const itemIdx = nextIdx++;
        allNodes.push({ name: d.name, kind: 'debt-item' });
        allLinks.push({ source: debtAggIdx, target: itemIdx, value: d.monthlyPayment });
      });
    }

    // Goals aggregate + items
    let goalAggIdx = -1;
    if (goalsTotal > 0) {
      goalAggIdx = nextIdx++;
      allNodes.push({ name: "Goals", kind: 'goal-agg' });
      allLinks.push({ source: 0, target: goalAggIdx, value: goalsTotal });
      activeGoalsWithAmt.forEach((g: Goal) => {
        const itemIdx = nextIdx++;
        allNodes.push({ name: g.name, kind: 'goal-item' });
        allLinks.push({ source: goalAggIdx, target: itemIdx, value: goalAmt(g) });
      });
    }

    // Surplus Reserve
    if (surplusReserve > 0) {
      const surplusIdx = nextIdx++;
      allNodes.push({ name: "Surplus Reserve", kind: 'surplus' });
      allLinks.push({ source: 0, target: surplusIdx, value: surplusReserve });
    }
  }

  // Filter zero-value links
  const filteredAllLinks = allLinks.filter((l) => l.value > 0);

  // Reindex: remove orphan nodes
  const referenced = new Set<number>();
  for (const link of filteredAllLinks) {
    referenced.add(link.source);
    referenced.add(link.target);
  }

  const usedIndices = Array.from(referenced).sort((a, b) => a - b);
  const oldToNew = new Map<number, number>();
  const filteredNodes = usedIndices.map((oldIdx, newIdx) => {
    oldToNew.set(oldIdx, newIdx);
    return allNodes[oldIdx];
  });

  const filteredLinks = filteredAllLinks.map((link) => ({
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
