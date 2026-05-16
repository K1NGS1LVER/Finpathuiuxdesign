import { test, expect } from '@playwright/test';
import { seedAndGo } from './fixtures/store-seed';

test.describe('scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndGo(page, '/scenarios');
  });

  test('scenarios page renders projection chart', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Scenarios' })).toBeVisible();
    // Wealth projection chart (aria-label set in Scenarios.tsx)
    const chart = page.getByLabel(/wealth projection chart/i);
    await expect(chart).toBeVisible();
  });

  test('monthly investment slider updates displayed value', async ({ page }) => {
    const slider = page.getByLabel('Monthly investment');
    await expect(slider).toBeVisible();
    // Get current value
    const before = await slider.inputValue();
    // Move slider by filling a new value
    await slider.fill(String(Number(before) + 5000));
    await slider.dispatchEvent('input');
    // The displayed value changes (it's a controlled input)
    // Just verify the slider is still present and has new value
    const after = await slider.inputValue();
    expect(Number(after)).not.toEqual(Number(before));
  });

  test('clicking a preset button updates scenario', async ({ page }) => {
    const preset = page.getByText('Plan A · Steady');
    await expect(preset).toBeVisible();
    await preset.click();
    // After clicking, the monthly investment slider value changes
    // Plan A sets monthly: 40000
    const slider = page.getByLabel('Monthly investment');
    await expect(slider).toHaveValue('40000');
  });
});
