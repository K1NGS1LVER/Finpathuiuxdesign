import { forwardRef, useMemo } from "react";
import PdfCoverPage from "./PdfCoverPage";
import PdfHealthScorePage from "./PdfHealthScorePage";
import PdfSankeyPage from "./PdfSankeyPage";
import PdfInsightsPage from "./PdfInsightsPage";
import {
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
} from "./PdfPage";
import {
  buildSankeyData,
  computeCashflowKpis,
} from "@/lib/sankey-data";
import { buildAdvisorInsights } from "@/lib/insights";
import { getThemeTokens } from "@/lib/theme-tokens";
import type { FinancialProfile } from "@/lib/types";

export interface PdfPagesProps {
  profile: FinancialProfile;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Zero-value fallbacks for half-hydrated profiles. Kept as standalone consts
// (spread below) so TypeScript doesn't flag the keys as always-overwritten.
const INCOME_DEFAULTS = {
  primary: 0,
  secondary: 0,
  passive: 0,
  variablePercent: 0,
  variable: 0,
  total: 0,
  primaryIncrement: 0,
  secondaryIncrement: 0,
  passiveIncrement: 0,
  netRate: 0.88,
  netMonthly: 0,
};

const EXPENSE_DEFAULTS = {
  rent: 0,
  food: 0,
  transport: 0,
  utilities: 0,
  entertainment: 0,
  other: 0,
  total: 0,
};

const PdfPages = forwardRef<HTMLDivElement, PdfPagesProps>(function PdfPages(
  { profile: rawProfile },
  ref,
) {
  // Defensive: coerce missing/partial fields so a half-hydrated profile
  // never crashes the PDF render.
  const profile: FinancialProfile = useMemo(
    () => ({
      ...rawProfile,
      goals: rawProfile.goals ?? [],
      debts: {
        items: rawProfile.debts?.items ?? [],
        totalMonthly: rawProfile.debts?.totalMonthly ?? 0,
        totalPrincipal: rawProfile.debts?.totalPrincipal,
      },
      income: { ...INCOME_DEFAULTS, ...rawProfile.income },
      expenses: { ...EXPENSE_DEFAULTS, ...rawProfile.expenses },
      savings: rawProfile.savings ?? 0,
      investments: rawProfile.investments ?? 0,
      monthlySurplusReserve: rawProfile.monthlySurplusReserve ?? 0,
    }),
    [rawProfile],
  );

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const tokens = useMemo(() => getThemeTokens(), []);
  const sankey = useMemo(() => buildSankeyData(profile), [profile]);
  const kpis = useMemo(() => computeCashflowKpis(profile), [profile]);
  const insights = useMemo(() => buildAdvisorInsights(profile), [profile]);

  const completedGoals = profile.goals.filter((g) => g.status === "complete").length;
  const goalCurrentTotal = profile.goals.reduce(
    (sum, g) => sum + Math.max(0, g.currentAmount || 0),
    0,
  );
  const netWorth = profile.savings + profile.investments + goalCurrentTotal;
  const monthlySurplus =
    profile.income.total - profile.expenses.total - profile.debts.totalMonthly;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: PDF_PAGE_WIDTH,
        backgroundColor: tokens.card,
        pointerEvents: "none",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      <PdfCoverPage
        dateLabel={dateLabel}
        netWorth={netWorth}
        monthlySurplus={monthlySurplus}
        goalsCompleted={completedGoals}
        goalsTotal={profile.goals.length}
        healthScore={profile.healthScore?.overall ?? null}
        tokens={tokens}
      />
      <PdfHealthScorePage
        healthScore={profile.healthScore}
        dateLabel={dateLabel}
        tokens={tokens}
      />
      <PdfSankeyPage
        sankey={sankey}
        kpis={kpis}
        monthLabel={monthLabel}
        dateLabel={dateLabel}
        tokens={tokens}
      />
      <PdfInsightsPage
        insights={insights}
        dateLabel={dateLabel}
        tokens={tokens}
      />
      <div aria-hidden="true" style={{ width: 1, height: PDF_PAGE_HEIGHT * 0 }} />
    </div>
  );
});

export default PdfPages;
