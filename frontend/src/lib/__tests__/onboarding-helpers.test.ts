import { describe, it, expect } from 'vitest';
import {
  weightedAvgGrowth,
  avgVariabilityPercent,
} from '../../app/screens/onboarding/onboarding-helpers';

describe('weightedAvgGrowth', () => {
  it('returns 0 for empty array', () => {
    expect(weightedAvgGrowth([])).toBe(0);
  });

  it('returns 0 when all amounts are zero', () => {
    expect(weightedAvgGrowth([{ amount: '0', growthRate: '10' }])).toBe(0);
  });

  it('returns the single item growth rate', () => {
    expect(weightedAvgGrowth([{ amount: '100000', growthRate: '15' }])).toBe(15);
  });

  it('returns weighted average for two items', () => {
    // 100k@10% + 50k@20% => (10000000 + 1000000) / 150000 = 13.333...
    expect(
      weightedAvgGrowth([
        { amount: '100000', growthRate: '10' },
        { amount: '50000', growthRate: '20' },
      ])
    ).toBeCloseTo(13.333, 2);
  });

  it('treats blank/non-numeric growthRate as 0', () => {
    expect(
      weightedAvgGrowth([
        { amount: '100000', growthRate: '' },
        { amount: '50000', growthRate: 'abc' },
      ])
    ).toBe(0);
  });
});

describe('avgVariabilityPercent', () => {
  it('returns 0 for empty array', () => {
    expect(avgVariabilityPercent([])).toBe(0);
  });

  it('returns single item variability', () => {
    expect(avgVariabilityPercent([{ amount: '50000', variabilityPercent: '8' }])).toBe(8);
  });

  it('returns weighted average for two items', () => {
    // 80k@5% + 20k@15% => (400000 + 300000) / 100000 = 7
    expect(
      avgVariabilityPercent([
        { amount: '80000', variabilityPercent: '5' },
        { amount: '20000', variabilityPercent: '15' },
      ])
    ).toBeCloseTo(7, 2);
  });
});
