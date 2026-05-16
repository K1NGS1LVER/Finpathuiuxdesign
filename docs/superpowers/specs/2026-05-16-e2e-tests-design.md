# E2E Test Suite Design Spec

**Date:** 2026-05-16
**Status:** Approved

## Goal

Add browser-level E2E tests covering golden paths and key interactions. Zero server dependencies — tests run fully offline using localStorage seeding and API route mocking.

## Scope

**In:** Auth flow, all 7 app screens (golden path + key interactions), Penny chat (mocked), sidebar navigation.

**Out:** CI/GitHub Actions (deferred), real backend calls, onboarding wizard steps, Penny SSE stream, Settings cloud sync (requires real Supabase).

## Approach

**Playwright + localStorage seeding.**

Each test injects a pre-built `finpath-store` into `localStorage` via `page.addInitScript` before navigation. This skips auth and onboarding entirely. `VITE_AUTH_MOCK=true` set in the `webServer` env so `auth-store.ts` auto-signs in the mock user. All `/api/*` routes are intercepted via `page.route()`.

Why not real backend: tests must be deterministic and offline-capable. API mocking is sufficient for golden-path verification.

## File Structure

```
frontend/
  e2e/
    fixtures/
      store-seed.ts      # seeded finpath-store (authenticated + onboarded + realistic data)
      api-mocks.ts       # reusable page.route() helpers for /api/penny, /api/simulate/*
    auth.spec.ts         # landing, auth page, mock login redirect
    dashboard.spec.ts    # health score, KPI cards, net worth chart
    journey.spec.ts      # goals list, add-goal modal, goal persists
    debt.spec.ts         # debt KPIs, strategy toggle, payoff chart
    scenarios.spec.ts    # income slider updates projection, preset applies
    month.spec.ts        # monthly breakdown, expense categories
    navigation.spec.ts   # sidebar links, Penny panel open/close
    penny.spec.ts        # send message, mocked reply renders
  playwright.config.ts
```

## Configuration

`frontend/playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    env: { VITE_AUTH_MOCK: 'true' },
  },
});
```

`package.json` addition:
```json
"test:e2e": "playwright test"
```

## State Seeding

`e2e/fixtures/store-seed.ts` exports a single `SEEDED_STORE` object — a valid serialized `finpath-store` at version 5 with:
- `onboarded: true`
- `income.total: 120000` (₹1.2L/month, 2 sources)
- `expenses.total: 60000` (₹60K/month)
- `debts.items`: 2 items — home loan (8.5% APR, ₹50L) + personal loan (14% APR, ₹3L)
- `debts.totalMonthly: 52000`
- `goals`: 3 goals — Emergency Fund, Europe Trip, Retirement
- `strategy: 'balanced'`
- `storageMode: 'local'`

`healthScore` and `plan` are omitted — the store recomputes them on load via `computeHealthScore()` and `generatePlan()`.

Injection pattern (used in every test file's `beforeEach`):
```ts
await page.addInitScript((seed) => {
  localStorage.setItem('finpath-store', JSON.stringify(seed));
}, SEEDED_STORE);
await page.goto('/dashboard');
```

## API Mocks

`e2e/fixtures/api-mocks.ts` exports:
- `mockPenny(page)` — intercepts `POST /api/penny`, returns `{ reply: "Your savings rate is healthy at 33%. Consider increasing your emergency fund." }`
- `mockPennyStream(page)` — intercepts `POST /api/penny/stream`, returns a minimal SSE sequence (token events + done)
- `mockSimulate(page)` — intercepts `POST /api/simulate/*`, returns fixture-matching responses from `tests/fixtures/`

## Test Cases (~22 tests)

### `auth.spec.ts` (3 tests)
1. Landing page renders hero and CTA button
2. `/auth` page shows sign-in form
3. With `VITE_AUTH_MOCK=true`, navigating to `/` redirects to `/dashboard`

### `dashboard.spec.ts` (3 tests)
1. Health score ring renders with a numeric score
2. Net worth chart (`/dashboard`) is present in DOM
3. At least 3 goal rows visible in goals section

### `journey.spec.ts` (3 tests)
1. Journey screen renders goal nodes
2. "Add goal" button opens modal
3. Adding a goal with name + amount + timeline closes modal and goal appears in list

### `debt.spec.ts` (3 tests)
1. Debt KPIs (Total Outstanding, Monthly EMI, Avg Interest Rate) all visible
2. Strategy toggle switches label from "Avalanche" to "Snowball"
3. Payoff timeline chart is present in DOM after strategy toggle

### `scenarios.spec.ts` (3 tests)
1. Scenarios screen renders projection chart
2. Moving income slider updates the displayed income value
3. Clicking a preset button (e.g., "Side Hustle") updates scenario inputs

### `month.spec.ts` (2 tests)
1. Month screen renders monthly surplus value
2. Expense breakdown categories are listed

### `navigation.spec.ts` (3 tests)
1. Sidebar "Debt" link navigates to `/debt`
2. Sidebar "Scenarios" link navigates to `/scenarios`
3. Penny panel opens when the Penny button is clicked

### `penny.spec.ts` (2 tests, mocked API)
1. Penny panel renders input field and send button
2. Typing a message and submitting renders a reply in the chat

## Assertions Strategy

- **Prefer semantic selectors**: `getByRole`, `getByText`, `getByLabel` over CSS selectors
- **Avoid implementation details**: don't assert on class names or internal store state
- **Wait for data**: use `expect(locator).toBeVisible()` which auto-retries (no manual waits)
- **Chart presence**: assert chart container is in DOM (`toBeInViewport` or `toBeVisible`); don't assert specific SVG paths

## Running

```bash
# from frontend/
pnpm test:e2e              # all tests, headless
pnpm test:e2e --ui         # Playwright UI mode (interactive)
pnpm test:e2e --debug      # headed + step-through debugger
pnpm test:e2e e2e/debt.spec.ts  # single file
```

## Dependencies Added

```
@playwright/test  (devDependency)
```

Run once after install:
```bash
pnpm exec playwright install chromium
```
