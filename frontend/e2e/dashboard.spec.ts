import { test, expect } from '@playwright/test';
import { seedAndGo } from './fixtures/store-seed';

test.describe('dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndGo(page, '/dashboard');
  });

  test('health score ring is visible with a numeric score', async ({ page }) => {
    // The SVG has aria-label="Health score: X out of 100"
    const ring = page.getByLabel(/health score.*out of 100/i);
    await expect(ring).toBeVisible();
    // The score overlay text exists (exact match to avoid collision with badge description text)
    await expect(page.getByText('Score', { exact: true })).toBeVisible();
  });

  test('financial overview section renders KPI cards', async ({ page }) => {
    await expect(page.getByText('Financial Overview')).toBeVisible();
    // Health Meter label
    await expect(page.getByText('Health Meter')).toBeVisible();
  });

  test('active goals section shows seeded goals', async ({ page }) => {
    // The view-all button exists (goals are seeded)
    const viewAllBtn = page.getByLabel('View all goals');
    await expect(viewAllBtn).toBeVisible();
    // At least one goal name from seed is visible in the goals list
    await expect(page.getByRole('button', { name: 'View goal: Emergency Fund' })).toBeVisible();
  });
});
