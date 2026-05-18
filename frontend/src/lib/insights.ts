import type { FinancialProfile, Goal, DebtItem } from "./types";
import { formatInr, formatInrCompact } from "./format";
import { avalanche } from "./debt-strategies";

export interface AdvisorInsights {
  bigPicture: string[];
  strengths: string[];
  watchAreas: string[];
  actions: string[];
  goals: GoalSummary[];
  debts: DebtSummary[];
  footnote: string;
}

export interface GoalSummary {
  name: string;
  target: number;
  current: number;
  progressPct: number;
  timelineMonths: number;
  monthlyAllocation: number;
  status: Goal["status"];
}

export interface DebtSummary {
  name: string;
  principal: number;
  interestRate: number;
  monthlyPayment: number;
  payoffEstimate: string;
}

function monthFromNow(monthsAhead: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function buildAdvisorInsights(
  profile: FinancialProfile,
): AdvisorInsights {
  const {
    income,
    expenses,
    debts,
    savings,
    investments,
    emergencyFund,
    goals,
    healthScore,
  } = profile;

  const safeGoals = goals ?? [];
  const safeDebtItems = debts?.items ?? [];
  const totalIncome = income?.total || 0;
  const totalExpenses = expenses?.total || 0;
  const totalDebtMonthly = debts?.totalMonthly || 0;
  const surplus = totalIncome - totalExpenses - totalDebtMonthly;
  const savingsRatePct =
    totalIncome > 0 ? Math.round((surplus / totalIncome) * 100) : 0;
  const dtiPct =
    totalIncome > 0
      ? Math.round((totalDebtMonthly / totalIncome) * 100)
      : 0;
  const monthlyExpensesPlusDebt = totalExpenses + totalDebtMonthly;
  const efMonths =
    monthlyExpensesPlusDebt > 0
      ? Math.floor(emergencyFund / monthlyExpensesPlusDebt)
      : 0;
  const goalTargetTotal = safeGoals.reduce(
    (sum, g) => sum + (g.targetAmount || 0),
    0,
  );
  const goalCurrentTotal = safeGoals.reduce(
    (sum, g) => sum + Math.max(0, g.currentAmount || 0),
    0,
  );
  const netWorth = (savings ?? 0) + (investments ?? 0) + goalCurrentTotal;
  const completed = safeGoals.filter((g) => g.status === "complete").length;
  const active = safeGoals.filter((g) => g.status !== "complete").length;

  const bigPicture: string[] = [
    `Monthly income: ${formatInr(totalIncome)} · monthly expenses: ${formatInr(totalExpenses)} · monthly debt servicing: ${formatInr(totalDebtMonthly)}.`,
    `Net worth today: ${formatInrCompact(netWorth)} (${formatInr(savings ?? 0)} cash, ${formatInr(investments ?? 0)} investments, ${formatInr(goalCurrentTotal)} in goals).`,
    `Savings rate: ${savingsRatePct}% · debt-to-income: ${dtiPct}% · emergency fund covers ${efMonths} month${efMonths === 1 ? "" : "s"} of essential outflow.`,
    `Goals tracked: ${safeGoals.length} (${completed} complete, ${active} active) targeting ${formatInrCompact(goalTargetTotal)} in total.`,
  ];

  const strengths: string[] = [];
  const watchAreas: string[] = [];

  if (healthScore) {
    if (healthScore.savingsRate >= 18) {
      strengths.push(
        `Strong savings rate (${savingsRatePct}%) — above the 20% benchmark for wealth-building.`,
      );
    } else if (healthScore.savingsRate < 12) {
      watchAreas.push(
        `Savings rate of ${savingsRatePct}% is below the 20% benchmark; trimming discretionary spend by ${formatInr(Math.max(0, Math.round(totalIncome * 0.2 - surplus)))}/mo would close the gap.`,
      );
    }

    if (healthScore.debtLoad >= 18) {
      strengths.push(
        `Healthy debt load — monthly debt servicing is only ${dtiPct}% of income.`,
      );
    } else if (healthScore.debtLoad < 12) {
      watchAreas.push(
        `Debt-to-income ratio of ${dtiPct}% is elevated; consider prioritising high-interest debt before new commitments.`,
      );
    }

    if (healthScore.emergencyFund >= 18) {
      strengths.push(
        `Emergency fund covers ${efMonths}+ months of expenses — strong safety net.`,
      );
    } else if (healthScore.emergencyFund < 12) {
      const target = monthlyExpensesPlusDebt * 3;
      const needed = Math.max(0, target - (emergencyFund ?? 0));
      watchAreas.push(
        `Emergency fund covers ${efMonths} month${efMonths === 1 ? "" : "s"}; build to 3 months by saving an additional ${formatInr(needed)}.`,
      );
    }

    if (healthScore.incomeStability >= 18) {
      strengths.push(
        `Diversified income sources reduce dependence on any single stream.`,
      );
    } else if (healthScore.incomeStability < 12) {
      watchAreas.push(
        `Income is concentrated in a single source — consider adding a secondary or passive income stream over the next 6–12 months.`,
      );
    }
  }

  if (strengths.length === 0) {
    strengths.push(
      `Plan is set up and tracked monthly — the foundation for long-term wealth building is in place.`,
    );
  }
  if (watchAreas.length === 0) {
    watchAreas.push(
      `No critical risk flags. Continue to revisit allocations quarterly.`,
    );
  }

  const actions = healthScore?.actions?.length
    ? [...healthScore.actions]
    : [`Review your plan with Penny to surface personalised next steps.`];

  const goalSummaries: GoalSummary[] = safeGoals.map((g) => ({
    name: g.name,
    target: g.targetAmount || 0,
    current: Math.max(0, g.currentAmount || 0),
    progressPct:
      g.targetAmount > 0
        ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
        : 0,
    timelineMonths: g.timelineMonths || 0,
    monthlyAllocation: g.monthlyAllocation || 0,
    status: g.status,
  }));

  const sortedDebts: DebtItem[] = [...safeDebtItems].sort(
    (a, b) => b.interestRate - a.interestRate,
  );
  const payoffSchedule = sortedDebts.length > 0 ? avalanche(sortedDebts, 0) : null;
  const debtSummaries: DebtSummary[] = sortedDebts.map((d) => {
    const months = payoffSchedule?.payoffDates?.[d.id];
    return {
      name: d.name,
      principal: d.principal,
      interestRate: d.interestRate,
      monthlyPayment: d.monthlyPayment,
      payoffEstimate: months ? `Payoff ${monthFromNow(months)}` : `—`,
    };
  });

  return {
    bigPicture,
    strengths,
    watchAreas,
    actions,
    goals: goalSummaries,
    debts: debtSummaries,
    footnote:
      "Generated by FinPath · For informational use only · Not financial advice.",
  };
}
