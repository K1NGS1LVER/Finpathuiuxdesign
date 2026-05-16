import { test, expect } from '@playwright/test';
import { seedAndGo, SEEDED_STORE } from './fixtures/store-seed';

test.describe('auth routing', () => {
  test('landing page renders CTA button', async ({ page }) => {
    // No seed — user is mock-authed but not onboarded
    await page.goto('/');
    await expect(page.getByText('Start My Journey').first()).toBeVisible();
  });

  test('/auth with unauthenticated-like state redirects to /onboarding', async ({ page }) => {
    // Mock auth user exists (VITE_AUTH_MOCK=true) but no onboarded flag
    // → AppContent sends to /onboarding
    await page.goto('/auth');
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('authenticated + onboarded user visiting /auth redirects to /dashboard', async ({
    page,
  }) => {
    await seedAndGo(page, '/auth');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
