import { test, expect } from '@playwright/test';
import { seedAndGo } from './fixtures/store-seed';

test.describe('month', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndGo(page, '/month');
  });

  test('monthly surplus section is visible', async ({ page }) => {
    // Month.tsx renders "Goals + Surplus Reserve" as a mission stat label
    await expect(page.getByText('Goals + Surplus Reserve')).toBeVisible();
  });

  test('monthly task checklist renders at least one item', async ({ page }) => {
    // With seeded rent = ₹20,000, the rent task always appears
    // "Pay rent ₹20,000 by 5th" is rendered as a plain text checklist item
    await expect(page.getByText(/Pay rent/i)).toBeVisible();
  });
});
