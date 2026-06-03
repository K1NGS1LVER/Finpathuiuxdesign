import { describe, it, expect } from 'vitest';
import { pmt, fv, monthlyCompound } from '../math/finance';

describe('pmt', () => {
  it('calculates monthly payment for a 5-year loan at 9% annual interest', () => {
    // rate = 9%/12 = 0.75% per month, nper = 60, pv = 500000
    const rate = 9 / 12 / 100;
    const result = pmt(rate, 60, 500000);
    // Standard PMT for these values ≈ ₹10,379
    expect(result).toBeGreaterThan(10000);
    expect(result).toBeLessThan(11000);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('returns pv / nper when rate is 0', () => {
    expect(pmt(0, 10, 100000)).toBe(10000);
  });

  it('returns 0 when nper is 0', () => {
    expect(pmt(0.01, 0, 100000)).toBe(0);
  });

  it('returns a positive integer for typical home loan inputs', () => {
    const rate = 8.5 / 12 / 100;
    const result = pmt(rate, 240, 5000000); // 20-year, ₹50L
    expect(result).toBeGreaterThan(0);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('fv', () => {
  it('calculates savings accumulation over 24 months at 8% annual with ₹5000/mo', () => {
    const rate = 8 / 12 / 100;
    const result = fv(rate, 24, 5000, 0);
    // 24 months of ₹5k at 8% annual ≈ ₹129,970
    expect(result).toBeGreaterThan(125000);
    expect(result).toBeLessThan(135000);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('returns pv + payment * nper when rate is 0', () => {
    expect(fv(0, 12, 5000, 0)).toBe(60000);
    expect(fv(0, 12, 5000, -10000)).toBe(70000);
  });

  it('pv defaults to 0 when omitted', () => {
    const rate = 6 / 12 / 100;
    const withZero = fv(rate, 12, 1000, 0);
    const withDefault = fv(rate, 12, 1000);
    expect(withZero).toBe(withDefault);
  });

  it('returns a positive integer', () => {
    const result = fv(1 / 100, 60, 10000, 0);
    expect(result).toBeGreaterThan(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('accounts for existing principal when pv is negative (finance convention)', () => {
    const rate = 8 / 12 / 100;
    const withPrincipal = fv(rate, 24, 5000, -50000);
    const withoutPrincipal = fv(rate, 24, 5000, 0);
    expect(withPrincipal).toBeGreaterThan(withoutPrincipal);
  });
});

describe('monthlyCompound', () => {
  it('compounds ₹100000 at 12% annual for 12 months to ~₹112683', () => {
    // 100000 * (1 + 0.12/12)^12 = 100000 * 1.01^12 ≈ 112682.50 → rounds to 112683
    const result = monthlyCompound(100000, 12, 12);
    expect(result).toBe(112683);
  });

  it('returns principal unchanged when rate is 0', () => {
    expect(monthlyCompound(50000, 0, 12)).toBe(50000);
  });

  it('returns principal unchanged when months is 0', () => {
    expect(monthlyCompound(50000, 10, 0)).toBe(50000);
  });

  it('returns a positive integer', () => {
    const result = monthlyCompound(200000, 8, 36);
    expect(result).toBeGreaterThan(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('grows proportionally over longer horizons', () => {
    const short = monthlyCompound(100000, 10, 12);
    const long = monthlyCompound(100000, 10, 24);
    expect(long).toBeGreaterThan(short);
  });
});
