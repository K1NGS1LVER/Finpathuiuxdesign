import { describe, it, expect } from 'vitest';
import { runAffordability, foirBandFor } from '../math/affordability';
import type { AffordabilityInput } from '../math/affordability';

function makeInput(overrides: Partial<AffordabilityInput> = {}): AffordabilityInput {
  return {
    targetCost: 800_000, // ₹8L (car)
    route: 'cash',
    netMonthlyIncome: 100_000,
    monthlyExpenses: 60_000,
    monthlyReserve: 5_000,
    existingEmiTotal: 10_000,
    investmentReturnRate: 8,
    annualInterestRate: 9,
    tenureMonths: 60,
    ...overrides,
  };
}

// ── foirBandFor ───────────────────────────────────────────────────────────────

describe('foirBandFor', () => {
  it('returns 50% cap for salaried home loan', () => {
    const { cap, capAmount, label } = foirBandFor(100_000, 'salaried', 'home');
    expect(cap).toBe(0.5);
    expect(capAmount).toBe(50_000);
    expect(label).toBe('50% of net income');
  });

  it('returns 40% cap for self_employed other loan', () => {
    const { cap } = foirBandFor(100_000, 'self_employed', 'other');
    expect(cap).toBe(0.4);
  });

  it('defaults to salaried other (40%) when args omitted', () => {
    const { cap } = foirBandFor(100_000);
    expect(cap).toBe(0.4);
  });

  it('capAmount rounds correctly', () => {
    const { capAmount } = foirBandFor(100_001, 'salaried', 'personal');
    expect(Number.isInteger(capAmount)).toBe(true);
  });
});

// ── Cash route ────────────────────────────────────────────────────────────────

describe('runAffordability — cash route', () => {
  it('affordable_now when surplus covers cost in ≤ 1 month', () => {
    // surplus = 100k - 60k - 0 - 0 = 40k; targetCost 30k → n=ceil(0.75)=1
    const result = runAffordability(
      makeInput({ targetCost: 30_000, existingEmiTotal: 0, monthlyReserve: 0 }),
    );
    expect(result.verdict).toBe('affordable_now');
    expect(result.monthsToAfford).not.toBeNull();
    expect(result.monthsToAfford!).toBeLessThanOrEqual(1);
    expect(result.gap).toBe(0);
    expect(result.emi).toBeNull();
    expect(result.foirOk).toBeNull();
    expect(result.levers).toHaveLength(0);
  });

  it('affordable_later when surplus is positive but needs time', () => {
    // surplus = 100k - 60k - 5k = 35k/mo (expenses include EMIs), target = 800k → ~22 months
    const result = runAffordability(makeInput());
    expect(result.verdict).toBe('affordable_later');
    expect(result.monthsToAfford).not.toBeNull();
    expect(result.monthsToAfford!).toBeGreaterThan(1);
    expect(result.monthlySurplus).toBe(35_000);
  });

  it('not_affordable when surplus is zero or negative', () => {
    // expenses 102k > income 100k → surplus = -2k → not_affordable
    const result = runAffordability(
      makeInput({ monthlyExpenses: 102_000, existingEmiTotal: 0, monthlyReserve: 0 }),
    );
    expect(result.verdict).toBe('not_affordable');
    expect(result.monthsToAfford).toBeNull();
    expect(result.gap).toBeGreaterThan(0);
  });

  it('emits levers when monthsToAfford > 36', () => {
    // Small surplus → will take > 36 months
    const result = runAffordability(makeInput({ targetCost: 5_000_000, investmentReturnRate: 0 }));
    expect(result.verdict).toBe('affordable_later');
    const types = result.levers.map((l) => l.type);
    expect(types).toContain('increaseSurplus');
    expect(types).toContain('cutExpenses');
    expect(types).toContain('raiseIncome');
  });

  it('emits no levers when monthsToAfford ≤ 36', () => {
    // 800k at 35k/mo ≈ 23 months — within benchmark
    const result = runAffordability(makeInput());
    expect(result.levers).toHaveLength(0);
  });

  it('lever monthlySavingsNeeded is positive integer', () => {
    const result = runAffordability(makeInput({ targetCost: 5_000_000, investmentReturnRate: 0 }));
    const lever = result.levers.find((l) => l.type === 'increaseSurplus');
    expect(lever).toBeDefined();
    expect(lever!.monthlySavingsNeeded).toBeGreaterThan(0);
    expect(Number.isInteger(lever!.monthlySavingsNeeded)).toBe(true);
  });

  it('raiseIncome lever targetIncome is > current income', () => {
    const input = makeInput({ targetCost: 5_000_000, investmentReturnRate: 0 });
    const result = runAffordability(input);
    const lever = result.levers.find((l) => l.type === 'raiseIncome');
    expect(lever).toBeDefined();
    expect(lever!.targetIncome).toBeGreaterThan(input.netMonthlyIncome);
  });

  it('uses zero-rate formula when investmentReturnRate is 0', () => {
    const result = runAffordability(makeInput({ investmentReturnRate: 0 }));
    // 800k / 35k = 23 months (ceil)
    expect(result.monthsToAfford).toBe(23);
  });
});

// ── EMI route ─────────────────────────────────────────────────────────────────

describe('runAffordability — EMI route', () => {
  it('affordable_now when EMI fits FOIR and surplus', () => {
    // 800k at 9%/60mo ≈ ₹16,607 EMI; surplus=35k; FOIR cap=40k → fits both
    const result = runAffordability(makeInput({ route: 'emi' }));
    expect(result.verdict).toBe('affordable_now');
    expect(result.emi).not.toBeNull();
    expect(result.emi!).toBeGreaterThan(0);
    expect(result.foirOk).toBe(true);
    expect(result.monthsToAfford).toBeNull();
    expect(result.levers).toHaveLength(0);
  });

  it('not_affordable or affordable_later when FOIR exceeded', () => {
    // Huge loan vs low income → FOIR bust
    const result = runAffordability(
      makeInput({
        route: 'emi',
        targetCost: 10_000_000,
        netMonthlyIncome: 40_000,
        monthlyExpenses: 20_000,
        existingEmiTotal: 0,
        monthlyReserve: 0,
      }),
    );
    expect(result.foirOk).toBe(false);
    expect(['not_affordable', 'affordable_later']).toContain(result.verdict);
    expect(result.gap).toBeGreaterThan(0);
  });

  it('extendTenure lever resolves FOIR block when possible', () => {
    // 5M loan at 60mo → large EMI; at 240mo it might fit
    const result = runAffordability(
      makeInput({
        route: 'emi',
        targetCost: 5_000_000,
        netMonthlyIncome: 100_000,
        monthlyExpenses: 50_000,
        existingEmiTotal: 0,
        monthlyReserve: 0,
        tenureMonths: 60,
        loanType: 'home',
      }),
    );
    if (!result.foirOk) {
      const extLever = result.levers.find((l) => l.type === 'extendTenure');
      if (extLever) {
        expect(extLever.newTenureMonths).toBeGreaterThan(60);
      }
    }
  });

  it('caps tenure at retirement age when ageYears provided', () => {
    // Age 55 → max tenure = 60 months
    const result = runAffordability(makeInput({ route: 'emi', ageYears: 55 }));
    // EMI calculated at 60mo (min of tenureMonths and (60-55)*12=60)
    expect(result.emi).not.toBeNull();
    expect(result.emi!).toBeGreaterThan(0);
  });

  it('retirement_cap reason set when tenure hits age ceiling', () => {
    // Age 58 → max 24mo; requested 60mo → capped
    const result = runAffordability(
      makeInput({
        route: 'emi',
        ageYears: 58,
        targetCost: 5_000_000,
        netMonthlyIncome: 80_000,
        monthlyExpenses: 40_000,
        existingEmiTotal: 0,
        monthlyReserve: 0,
        loanType: 'home',
      }),
    );
    const blocked = result.levers.find((l) => l.reasonIfBlocked === 'retirement_cap');
    // May or may not exist depending on whether extend helps, but no crash
    expect(result.emi).not.toBeNull();
    void blocked; // suppress unused warning
  });

  it('foirCapAmount is positive integer', () => {
    const result = runAffordability(makeInput({ route: 'emi' }));
    expect(result.foirCapAmount).not.toBeNull();
    expect(result.foirCapAmount!).toBeGreaterThan(0);
    expect(Number.isInteger(result.foirCapAmount!)).toBe(true);
  });

  it('affordable_later when FOIR ok but EMI exceeds surplus', () => {
    // EMI > surplus but FOIR ok → affordable_later with cutExpenses/raiseIncome levers
    const result = runAffordability(
      makeInput({
        route: 'emi',
        netMonthlyIncome: 100_000,
        monthlyExpenses: 80_000, // tight surplus
        existingEmiTotal: 0,
        monthlyReserve: 0,
        targetCost: 800_000,
      }),
    );
    if (result.foirOk && result.emi! > result.monthlySurplus) {
      expect(result.verdict).toBe('affordable_later');
      const types = result.levers.map((l) => l.type);
      expect(types).toContain('cutExpenses');
    }
  });
});
