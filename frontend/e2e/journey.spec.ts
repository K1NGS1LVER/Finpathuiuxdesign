import { test, expect } from '@playwright/test';
import { seedAndGo } from './fixtures/store-seed';

test.describe('journey', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndGo(page, '/journey');
  });

  test('journey canvas renders with seeded goal nodes', async ({ page }) => {
    // The canvas SVG background is present
    await expect(page.locator('svg.canvas-bg').first()).toBeVisible();
    // At least one seeded goal name appears as a goal node
    await expect(page.getByText('Emergency Fund').first()).toBeVisible();
  });

  test('Add Goal button opens modal', async ({ page }) => {
    // The button text "Add Goal" is visible (sm:inline span, default 1280px viewport)
    const addGoalBtn = page.getByRole('button', { name: /add goal/i }).first();
    await expect(addGoalBtn).toBeVisible();
    await addGoalBtn.click();
    // Modal heading "Add Goal" appears inside the dialog overlay
    // We target the h3 heading specifically to distinguish it from the button
    await expect(page.locator('h3').filter({ hasText: 'Add Goal' })).toBeVisible();
  });

  test('closing the modal returns to journey view', async ({ page }) => {
    await page.getByRole('button', { name: /add goal/i }).first().click();
    // Confirm modal is open
    await expect(page.locator('h3').filter({ hasText: 'Add Goal' })).toBeVisible();
    // Close via clicking the backdrop overlay (fixed inset-0 div behind modal content)
    // The modal backdrop has onClick={onClose} — click top-left corner of the page (outside card)
    await page.mouse.click(10, 10);
    // Modal heading should no longer be visible
    await expect(page.locator('h3').filter({ hasText: 'Add Goal' })).not.toBeVisible();
    // Journey canvas is visible again
    await expect(page.locator('svg.canvas-bg').first()).toBeVisible();
  });
});
