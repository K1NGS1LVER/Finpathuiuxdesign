import { pmt, fv } from './finance';

// ── FOIR table (pp2 #3 — single source of truth) ────────────────────────────
// All verdict and lever logic must call foirBandFor(); no inline cap math elsewhere.

export type EmploymentType = 'salaried' | 'self_employed';
export type LoanType = 'home' | 'personal' | 'vehicle' | 'other';

const FOIR_CAPS: Record<EmploymentType, Record<LoanType, number>> = {
  salaried: { home: 0.5, personal: 0.45, vehicle: 0.45, other: 0.4 },
  self_employed: { home: 0.45, personal: 0.4, vehicle: 0.4, other: 0.4 },
};

export function foirBandFor(
  netMonthly: number,
  employmentType: EmploymentType = 'salaried',
  loanType: LoanType = 'other',
): { cap: number; capAmount: number; label: string } {
  const cap = FOIR_CAPS[employmentType][loanType];
  return {
    cap,
    capAmount: Math.round(netMonthly * cap),
    label: `${Math.round(cap * 100)}% of net income`,
  };
}

// ── Types ────────────────────────────────────────────────────────────────────

export type LeverType = 'increaseSurplus' | 'cutExpenses' | 'extendTenure' | 'raiseIncome';

export type BlockedReason = 'foir_cap' | 'retirement_cap' | 'surplus_floor';

export interface Lever {
  type: LeverType;
  /** Additional monthly savings needed to reach target within benchmark window */
  monthlySavingsNeeded?: number;
  /** Months to afford after applying this lever */
  newMonthsToAfford?: number;
  /** Income level needed for this lever to close the gap */
  targetIncome?: number;
  /** Extended tenure (EMI route) */
  newTenureMonths?: number;
  /** Why the current path is blocked */
  reasonIfBlocked?: BlockedReason;
}

export interface AffordabilityInput {
  targetCost: number;
  route: 'cash' | 'emi';
  netMonthlyIncome: number;
  /** ExpenseProfile.total — should NOT include debt EMIs */
  monthlyExpenses: number;
  /** monthlySurplusReserve — intentional monthly park */
  monthlyReserve: number;
  /** DebtProfile.totalMonthly — existing EMI obligations */
  existingEmiTotal: number;
  /** Annual % return on savings (e.g. 12). Used for cash-route FV. */
  investmentReturnRate: number;
  // EMI route
  /** Annual interest rate % (default 9) */
  annualInterestRate?: number;
  /** Loan tenure in months (default 60) */
  tenureMonths?: number;
  // Optional Tier-2 signals
  ageYears?: number;
  employmentType?: EmploymentType;
  loanType?: LoanType;
}

export interface AffordabilityResult {
  verdict: 'affordable_now' | 'affordable_later' | 'not_affordable';
  /** Cash route: months of saving needed. null if EMI route or not computable. */
  monthsToAfford: number | null;
  monthlySurplus: number;
  /** EMI route: computed monthly payment via PMT. */
  emi: number | null;
  /** EMI route: whether total EMIs fit within FOIR cap. null for cash route. */
  foirOk: boolean | null;
  /** EMI route: the FOIR cap amount (₹) for display. null for cash route. */
  foirCapAmount: number | null;
  /** Monthly gap to close: 0 if affordable_now, else shortfall. */
  gap: number;
  levers: Lever[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const BENCHMARK_MONTHS = 36; // "affordable in 3 years" target for lever math

/**
 * Analytic months-to-afford for cash savings.
 * Returns null when surplus ≤ 0 (can't save at all).
 */
function monthsToSave(
  targetCost: number,
  monthlySurplus: number,
  monthlyRate: number,
): number | null {
  if (monthlySurplus <= 0) return null;
  if (monthlyRate === 0) return Math.ceil(targetCost / monthlySurplus);
  // Solve FV = targetCost for n: n = log(1 + targetCost*r/surplus) / log(1+r)
  const n = Math.log(1 + (targetCost * monthlyRate) / monthlySurplus) / Math.log(1 + monthlyRate);
  return Math.ceil(n);
}

/**
 * Monthly savings needed to accumulate targetCost in exactly n months.
 * Inverse of FV formula.
 */
function requiredMonthlySavings(targetCost: number, months: number, monthlyRate: number): number {
  if (months <= 0) return targetCost;
  if (monthlyRate === 0) return Math.ceil(targetCost / months);
  const growth = Math.pow(1 + monthlyRate, months);
  return Math.ceil((targetCost * monthlyRate) / (growth - 1));
}

function buildCashLevers(
  input: AffordabilityInput,
  surplus: number,
  monthsToAfford: number | null,
  monthlyRate: number,
): Lever[] {
  const levers: Lever[] = [];

  // No levers needed when affordable within benchmark window
  if (monthsToAfford !== null && monthsToAfford <= BENCHMARK_MONTHS) return levers;

  const required36 = requiredMonthlySavings(input.targetCost, BENCHMARK_MONTHS, monthlyRate);
  const gap36 = required36 - Math.max(0, surplus);

  if (gap36 > 0) {
    // increaseSurplus — save more each month
    levers.push({
      type: 'increaseSurplus',
      monthlySavingsNeeded: gap36,
      newMonthsToAfford: BENCHMARK_MONTHS,
    });

    // cutExpenses — same math, different framing
    levers.push({
      type: 'cutExpenses',
      monthlySavingsNeeded: gap36,
      newMonthsToAfford: BENCHMARK_MONTHS,
    });

    // raiseIncome — what income level achieves the benchmark-month surplus
    const targetIncome =
      required36 + input.monthlyExpenses + input.monthlyReserve + input.existingEmiTotal;
    if (targetIncome > input.netMonthlyIncome) {
      levers.push({
        type: 'raiseIncome',
        targetIncome,
        newMonthsToAfford: BENCHMARK_MONTHS,
        reasonIfBlocked: surplus <= 0 ? 'surplus_floor' : undefined,
      });
    }
  }

  return levers;
}

function buildEmiLevers(
  input: AffordabilityInput,
  surplus: number,
  emi: number,
  foirOk: boolean,
  foirCapAmount: number,
  effectiveTenure: number,
  monthlyRate: number,
): Lever[] {
  const levers: Lever[] = [];
  const loanType = input.loanType ?? 'other';
  const employmentType = input.employmentType ?? 'salaried';

  if (!foirOk) {
    // extendTenure — find min tenure where EMI fits FOIR cap
    const maxTenure = input.ageYears ? (60 - input.ageYears) * 12 : 360;
    let extendedTenure: number | null = null;
    for (let t = effectiveTenure + 12; t <= maxTenure; t += 12) {
      const extEmi = pmt(monthlyRate, t, input.targetCost);
      const { capAmount } = foirBandFor(input.netMonthlyIncome, employmentType, loanType);
      if (input.existingEmiTotal + extEmi <= capAmount) {
        extendedTenure = t;
        break;
      }
    }

    if (extendedTenure !== null) {
      levers.push({
        type: 'extendTenure',
        newTenureMonths: extendedTenure,
        reasonIfBlocked:
          input.ageYears && extendedTenure >= (60 - input.ageYears) * 12
            ? 'retirement_cap'
            : 'foir_cap',
      });
    }

    // raiseIncome — income needed so existing + new EMI fits FOIR
    const incomeNeeded = Math.ceil(
      (input.existingEmiTotal + emi) / FOIR_CAPS[employmentType][loanType],
    );
    if (incomeNeeded > input.netMonthlyIncome) {
      levers.push({
        type: 'raiseIncome',
        targetIncome: incomeNeeded,
        reasonIfBlocked: 'foir_cap',
      });
    }
  } else if (emi > surplus) {
    // FOIR ok but EMI exceeds current surplus — need to free up cash flow
    const surplusGap = emi - surplus;

    levers.push({
      type: 'cutExpenses',
      monthlySavingsNeeded: surplusGap,
    });

    levers.push({
      type: 'raiseIncome',
      targetIncome: input.netMonthlyIncome + surplusGap,
    });
  }

  return levers;
}

// ── Main engine ──────────────────────────────────────────────────────────────

export function runAffordability(input: AffordabilityInput): AffordabilityResult {
  const {
    targetCost,
    route,
    netMonthlyIncome,
    monthlyExpenses,
    monthlyReserve,
    existingEmiTotal,
    investmentReturnRate,
    annualInterestRate = 9,
    tenureMonths = 60,
    ageYears,
    employmentType = 'salaried',
    loanType = 'other',
  } = input;

  // monthlySurplus: what's left after expenses, existing EMIs, and reserve
  const monthlySurplus = netMonthlyIncome - monthlyExpenses - existingEmiTotal - monthlyReserve;
  const monthlyRate = investmentReturnRate / 12 / 100;

  if (route === 'cash') {
    const mta = monthsToSave(targetCost, monthlySurplus, monthlyRate);
    const verdict =
      mta !== null && mta <= 1
        ? 'affordable_now'
        : mta !== null
          ? 'affordable_later'
          : 'not_affordable';

    const gap =
      verdict === 'affordable_now'
        ? 0
        : monthlySurplus <= 0
          ? Math.abs(monthlySurplus) +
            requiredMonthlySavings(targetCost, BENCHMARK_MONTHS, monthlyRate)
          : Math.max(
              0,
              requiredMonthlySavings(targetCost, BENCHMARK_MONTHS, monthlyRate) - monthlySurplus,
            );

    const levers = buildCashLevers(input, monthlySurplus, mta, monthlyRate);

    return {
      verdict,
      monthsToAfford: mta,
      monthlySurplus,
      emi: null,
      foirOk: null,
      foirCapAmount: null,
      gap,
      levers,
    };
  }

  // EMI route
  // Cap tenure at retirement if age provided
  const maxTenure = ageYears ? Math.max(1, (60 - ageYears) * 12) : tenureMonths;
  const effectiveTenure = Math.min(tenureMonths, maxTenure);
  const emiRate = annualInterestRate / 12 / 100;
  const emi = pmt(emiRate, effectiveTenure, targetCost);

  const { capAmount: foirCapAmount } = foirBandFor(netMonthlyIncome, employmentType, loanType);
  const foirOk = input.existingEmiTotal + emi <= foirCapAmount;

  const gap = foirOk
    ? Math.max(0, emi - monthlySurplus)
    : Math.max(0, input.existingEmiTotal + emi - foirCapAmount);

  const verdict =
    foirOk && emi <= monthlySurplus
      ? 'affordable_now'
      : foirOk || gap > 0
        ? 'affordable_later'
        : 'not_affordable';

  const levers = buildEmiLevers(
    input,
    monthlySurplus,
    emi,
    foirOk,
    foirCapAmount,
    effectiveTenure,
    emiRate,
  );

  // not_affordable only when FOIR blocked AND no lever can fix it
  const finalVerdict = !foirOk && levers.length === 0 ? 'not_affordable' : verdict;

  return {
    verdict: finalVerdict,
    monthsToAfford: null,
    monthlySurplus,
    emi,
    foirOk,
    foirCapAmount,
    gap,
    levers,
  };
}
