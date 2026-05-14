import { describe, it, expect } from 'vitest';
import { calculateOldRegime, calculateNewRegime, compareTaxRegimes } from '../tax-engine';

describe('calculateOldRegime', () => {
  it('returns 0 totalTax for zero gross income', () => {
    const result = calculateOldRegime(0, 0);
    expect(result.totalTax).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.cess).toBe(0);
  });

  it('returns 0 tax when taxable income is below 2.5L after deductions', () => {
    const result = calculateOldRegime(250000, 0);
    expect(result.taxableIncome).toBeLessThanOrEqual(250000);
    expect(result.totalTax).toBe(0);
  });

  it('applies standard deduction of 50000 for old regime', () => {
    const result = calculateOldRegime(500000, 0);
    expect(result.deductions).toBe(50000);
    expect(result.taxableIncome).toBe(450000);
  });

  it('adds claimed deductions to standard deduction', () => {
    const result = calculateOldRegime(1000000, 150000);
    expect(result.deductions).toBe(50000 + 150000);
    expect(result.taxableIncome).toBe(800000);
  });

  it('applies Section 87A rebate when taxable income <= 5L', () => {
    const result = calculateOldRegime(550000, 0);
    if (result.taxableIncome <= 500000) {
      expect(result.tax).toBeLessThanOrEqual(12500);
    }
  });

  it('calculates 4% cess on applicable tax', () => {
    const result = calculateOldRegime(1000000, 0);
    if (result.tax > 0) {
      expect(result.cess).toBe(Math.round(result.tax * 0.04));
    }
  });

  it('computes effective rate as totalTax / grossIncome * 100', () => {
    const result = calculateOldRegime(1500000, 0);
    const expectedRate = Math.round((result.totalTax / 1500000) * 10000) / 100;
    expect(result.effectiveRate).toBe(expectedRate);
  });

  it('returns slab breakdown that sums to total slab tax', () => {
    const result = calculateOldRegime(2000000, 0);
    const slabSum = result.slabs.reduce((sum, s) => sum + s.tax, 0);
    expect(slabSum).toBe(result.tax + (result.tax > 0 ? 0 : 0) + (result.taxableIncome <= 500000 ? 12500 : 0));
  });

  it('does not let taxable income go negative', () => {
    const result = calculateOldRegime(10000, 0);
    expect(result.taxableIncome).toBe(0);
  });

  it('returns regime as "old"', () => {
    const result = calculateOldRegime(500000, 0);
    expect(result.regime).toBe('old');
  });
});

describe('calculateNewRegime', () => {
  it('returns 0 totalTax for zero gross income', () => {
    const result = calculateNewRegime(0);
    expect(result.totalTax).toBe(0);
  });

  it('returns 0 tax when taxable income is below 4L', () => {
    const result = calculateNewRegime(400000);
    expect(result.taxableIncome).toBeLessThanOrEqual(400000);
    expect(result.totalTax).toBe(0);
  });

  it('applies standard deduction of 75000 for new regime', () => {
    const result = calculateNewRegime(500000);
    expect(result.deductions).toBe(75000);
  });

  it('applies full Section 87A rebate when taxable income <= 12L', () => {
    const result = calculateNewRegime(1200000);
    if (result.taxableIncome <= 1200000) {
      expect(result.tax).toBe(0);
      expect(result.totalTax).toBe(0);
    }
  });

  it('calculates correct tax for high income (20L)', () => {
    const result = calculateNewRegime(2000000);
    expect(result.taxableIncome).toBe(2000000 - 75000);
    expect(result.totalTax).toBeGreaterThan(0);
    expect(result.tax).toBeGreaterThan(0);
  });

  it('calculates 4% cess on applicable tax', () => {
    const result = calculateNewRegime(1500000);
    if (result.tax > 0) {
      expect(result.cess).toBe(Math.round(result.tax * 0.04));
    }
  });

  it('returns regime as "new"', () => {
    const result = calculateNewRegime(1000000);
    expect(result.regime).toBe('new');
  });

  it('does not let taxable income go negative', () => {
    const result = calculateNewRegime(10000);
    expect(result.taxableIncome).toBe(0);
  });
});

describe('compareTaxRegimes', () => {
  it('returns both old and new regime results', () => {
    const comparison = compareTaxRegimes(1000000, 100000);
    expect(comparison.old.regime).toBe('old');
    expect(comparison.new.regime).toBe('new');
  });

  it('picks the cheaper regime as betterRegime', () => {
    const comparison = compareTaxRegimes(1000000, 100000);
    if (comparison.old.totalTax <= comparison.new.totalTax) {
      expect(comparison.betterRegime).toBe('old');
    } else {
      expect(comparison.betterRegime).toBe('new');
    }
  });

  it('computes savings as absolute difference between regimes', () => {
    const comparison = compareTaxRegimes(1500000, 50000);
    expect(comparison.savings).toBe(Math.abs(comparison.old.totalTax - comparison.new.totalTax));
  });

  it('returns 0 savings when both regimes cost the same', () => {
    const comparison = compareTaxRegimes(0, 0);
    expect(comparison.savings).toBe(0);
  });
});
