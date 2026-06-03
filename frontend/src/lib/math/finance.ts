/**
 * Pure financial math helpers.
 * No React, Zustand, or DOM imports — safe to use in workers, tests, and backend ports.
 * All returned values are rounded to the nearest integer (rupees).
 */

/**
 * Standard PMT formula: monthly payment on a loan.
 * @param rate - Monthly interest rate (annualRate / 12 / 100)
 * @param nper  - Number of periods (months)
 * @param pv    - Present value / loan principal (positive number)
 * @returns Monthly payment as a positive integer
 */
export function pmt(rate: number, nper: number, pv: number): number {
  if (nper <= 0) return 0;
  if (rate === 0) return Math.round(pv / nper);
  const payment = (pv * rate) / (1 - Math.pow(1 + rate, -nper));
  return Math.round(payment);
}

/**
 * Future value after compounding monthly contributions.
 * @param rate    - Monthly rate (annualRate / 12 / 100)
 * @param nper    - Number of periods
 * @param payment - Monthly contribution (positive = contribution)
 * @param pv      - Initial present value (finance convention: negative means money you have;
 *                  pass 0 if starting from nothing)
 * @returns Future value as a positive integer
 */
export function fv(rate: number, nper: number, payment: number, pv = 0): number {
  if (rate === 0) return Math.round(Math.abs(pv) + payment * nper);
  const growth = Math.pow(1 + rate, nper);
  // Standard FV formula adapted for positive-contribution convention:
  // pv is negative in finance convention (money you invest/have), payment is positive (contribution).
  // FV = -pv*(1+r)^n + payment*((1+r)^n - 1)/r
  const result = -pv * growth + payment * ((growth - 1) / rate);
  return Math.round(Math.abs(result));
}

/**
 * Compound a starting amount monthly for N months at a given annual rate.
 * @param principal      - Starting amount
 * @param annualRatePct  - Annual rate as a percentage (e.g. 12 for 12%)
 * @param months         - Number of months
 * @returns Compounded value as a positive integer
 */
export function monthlyCompound(principal: number, annualRatePct: number, months: number): number {
  if (annualRatePct === 0 || months === 0) return Math.round(principal);
  const monthlyRate = annualRatePct / 100 / 12;
  return Math.round(principal * Math.pow(1 + monthlyRate, months));
}
