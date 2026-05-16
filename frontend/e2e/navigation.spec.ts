import { test, expect } from '@playwright/test';
import { seedAndGo } from './fixtures/store-seed';

test.describe('navigation', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndGo(page, '/dashboard');
  });

  test('sidebar Debt link navigates to /debt', async ({ page }) => {
    // Scope to the sidebar <aside> to avoid matching goal buttons on the dashboard
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: 'Debt', exact: true }).click();
    await expect(page).toHaveURL(/\/debt/);
    await expect(page.getByText('Total Outstanding')).toBeVisible();
  });

  test('sidebar Scenarios link navigates to /scenarios', async ({ page }) => {
    await page.getByRole('button', { name: 'Scenarios', exact: true }).click();
    await expect(page).toHaveURL(/\/scenarios/);
    await expect(page.getByRole('heading', { name: 'Scenarios' })).toBeVisible();
  });

  test('Penny panel opens and shows input', async ({ page }) => {
    // Ask Penny button is always visible (expanded sidebar on desktop)
    // title="Ask Penny" is only set when collapsed; text "Ask Penny" is always rendered
    const pennyBtn = page.getByRole('button', { name: 'Ask Penny' }).first();
    await expect(pennyBtn).toBeVisible();
    await pennyBtn.click();
    await expect(page.getByPlaceholder('Ask Penny anything...')).toBeVisible();
  });
});
