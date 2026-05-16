import { test, expect } from '@playwright/test';
import { seedAndGo } from './fixtures/store-seed';

test.describe('debt', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndGo(page, '/debt');
  });

  test('debt KPI cards render with seeded data', async ({ page }) => {
    await expect(page.getByText('Total Outstanding')).toBeVisible();
    await expect(page.getByText('Monthly EMI')).toBeVisible();
    await expect(page.getByText('Avg Interest Rate')).toBeVisible();
  });

  test('strategy toggle switches between Avalanche and Snowball', async ({ page }) => {
    // Default is Avalanche — aria-label reflects current strategy
    const toggle = page.getByLabel(/Strategy: avalanche/i);
    await expect(toggle).toBeVisible();
    // Click to switch to Snowball
    await toggle.click();
    // Now the aria-label reflects the new strategy
    await expect(page.getByLabel(/Strategy: snowball/i)).toBeVisible();
  });

  test('payoff timeline chart is visible', async ({ page }) => {
    // The chart container div has role="img" and aria-label="Debt payoff timeline chart"
    await expect(page.getByRole('img', { name: /debt payoff timeline chart/i })).toBeVisible();
  });
});
