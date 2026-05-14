// ============================================================
// FinPath ΓÇö Indian Income Tax Calculator
// FY 2025-26 (AY 2026-27) slabs for Old & New regime
// ============================================================

import type { TaxResult } from './types';

/** Old Regime slabs FY 2025-26 */
const OLD_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

/** New Regime slabs FY 2025-26 (post Budget 2025) */
const NEW_SLABS = [
  { min: 0, max: 400000, rate: 0 },
  { min: 400000, max: 800000, rate: 5 },
  { min: 800000, max: 1200000, rate: 10 },
  { min: 1200000, max: 1600000, rate: 15 },
  { min: 1600000, max: 2000000, rate: 20 },
  { min: 2000000, max: 2400000, rate: 25 },
  { min: 2400000, max: Infinity, rate: 30 },
];

/** Standard deduction amounts */
const STANDARD_DEDUCTION_OLD = 50000;
const STANDARD_DEDUCTION_NEW = 75000;

/** Section 87A rebate threshold */
const REBATE_THRESHOLD_OLD = 500000;
const REBATE_THRESHOLD_NEW = 1200000;

/**
 * Calculate tax using given slabs
 */
function calculateSlabTax(
  taxableIncome: number,
  slabs: typeof OLD_SLABS
): { tax: number; slabBreakdown: { range: string; rate: number; tax: number }[] } {
  let remaining = taxableIncome;
  let totalTax = 0;
  const slabBreakdown: { range: string; rate: number; tax: number }[] = [];

  for (const slab of slabs) {
    if (remaining <= 0) break;

    const slabWidth = slab.max === Infinity ? remaining : slab.max - slab.min;
    const taxableInSlab = Math.min(remaining, slabWidth);
    const taxForSlab = taxableInSlab * (slab.rate / 100);

    slabBreakdown.push({
      range: slab.max === Infinity
        ? `Above ₹${(slab.min / 100000).toFixed(1)}L`
        : `₹${(slab.min / 100000).toFixed(1)}L – ₹${(slab.max / 100000).toFixed(1)}L`,
      rate: slab.rate,
      tax: Math.round(taxForSlab),
    });

    totalTax += taxForSlab;
    remaining -= taxableInSlab;
  }

  return { tax: Math.round(totalTax), slabBreakdown };
}

/**
 * Calculate tax under the Old Regime
 */
export function calculateOldRegime(grossIncome: number, deductions: number): TaxResult {
  // Apply standard deduction + claimed deductions
  const totalDeductions = STANDARD_DEDUCTION_OLD + deductions;
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  const { tax, slabBreakdown } = calculateSlabTax(taxableIncome, OLD_SLABS);

  // Section 87A rebate
  let applicableTax = tax;
  if (taxableIncome <= REBATE_THRESHOLD_OLD) {
    applicableTax = Math.max(0, tax - 12500);
  }

  // 4% Health & Education Cess
  const cess = Math.round(applicableTax * 0.04);
  const totalTax = applicableTax + cess;

  return {
    regime: 'old',
    grossIncome,
    deductions: totalDeductions,
    taxableIncome,
    tax: applicableTax,
    cess,
    totalTax,
    effectiveRate: grossIncome > 0 ? Math.round((totalTax / grossIncome) * 10000) / 100 : 0,
    slabs: slabBreakdown,
  };
}

/**
 * Calculate tax under the New Regime
 */
export function calculateNewRegime(grossIncome: number): TaxResult {
  // New regime: only standard deduction, no other deductions
  const deductions = STANDARD_DEDUCTION_NEW;
  const taxableIncome = Math.max(0, grossIncome - deductions);

  const { tax, slabBreakdown } = calculateSlabTax(taxableIncome, NEW_SLABS);

  // Section 87A rebate for new regime
  let applicableTax = tax;
  if (taxableIncome <= REBATE_THRESHOLD_NEW) {
    applicableTax = 0; // Full rebate
  }

  // 4% Health & Education Cess
  const cess = Math.round(applicableTax * 0.04);
  const totalTax = applicableTax + cess;

  return {
    regime: 'new',
    grossIncome,
    deductions,
    taxableIncome,
    tax: applicableTax,
    cess,
    totalTax,
    effectiveRate: grossIncome > 0 ? Math.round((totalTax / grossIncome) * 10000) / 100 : 0,
    slabs: slabBreakdown,
  };
}

/**
 * Compare both regimes and return the better option
 */
export function compareTaxRegimes(grossIncome: number, deductions: number) {
  const oldRegime = calculateOldRegime(grossIncome, deductions);
  const newRegime = calculateNewRegime(grossIncome);

  return {
    old: oldRegime,
    new: newRegime,
    savings: Math.abs(oldRegime.totalTax - newRegime.totalTax),
    betterRegime: oldRegime.totalTax <= newRegime.totalTax ? 'old' as const : 'new' as const,
  };
}
