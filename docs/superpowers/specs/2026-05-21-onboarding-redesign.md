# Onboarding Redesign — Design Spec

**Date:** 2026-05-21  
**Status:** Approved  
**Approach:** B — hook rewrite + new step components  

---

## Overview

Redesign the FinPath onboarding flow from a single centered card to a split-panel layout. Introduce dynamic arrays for income sources and debt items (each with a rate of interest). Keep expenses as fixed preset categories. Theme uses existing `theme.css` tokens exclusively — no new palette.

---

## Layout — `Onboarding.tsx`

**Desktop (≥768px):** Two-column split.

- **Left panel** (320px fixed, non-scrolling):
  - Logo mark + wordmark + Back button
  - Vertical stepper: 4 numbered dots connected by lines. Completed → accent fill + checkmark. Current → accent fill + pulse ring (`pulse-ring` CSS class). Upcoming → `--surface-tint` fill, muted text.
  - Step heading: eyebrow label ("Step N of 4"), H2 title, subtitle, lime hint badge
  - Live summary card: appears after step 1 has data. Shows monthly income, expenses+debt (step ≥2), surplus (green/red, step ≥2), goals selected (step ≥3). Animates in (`summaryIn` keyframe: fadeUp 8px, 0.4s).
  - Vertical divider (1px, `--border`) separates panels

- **Right panel** (flex-1, scrollable):
  - Theme toggle (sun/moon) top-right, absolute positioned
  - Glassmorphism form card (`bento-card`) centered vertically, `max-width: 480px`
  - Navigation buttons below card (Back pill + Continue/Launch gradient pill)
  - Step counter: "Step N of 4 · X steps remaining"

**Mobile (<768px):** Stacked vertically.

- Top bar: Back button left, logo center, theme toggle right
- Horizontal progress pills (4 segments, accent fill = completed/current)
- Step heading (eyebrow + H2 + subtitle) above form card
- Left panel stepper hidden on mobile
- Live summary card hidden on mobile

**Animations:**
- Step content card: `fadeSlide` keyframe (opacity 0→1, translateY 14px→0, 0.4s cubic-bezier(0.22,1,0.36,1)) on `key` change
- Background blobs: fixed, `--accent` top-left, `--secondary-accent` bottom-right, pointer-events none

---

## State Model — `useOnboardingForm.ts`

### New local interfaces

```typescript
export type IncomeType = 'salary' | 'freelance' | 'passive' | 'rental' | 'dividend' | 'other';

export interface IncomeItem {
  id: string;
  name: string;
  type: IncomeType;
  amount: string;
  growthRate: string;        // annual % → primaryIncrement / secondaryIncrement / passiveIncrement
  variabilityPercent: string; // yield % — only meaningful for passive/rental/dividend
}

export interface OnboardingDebtItem {
  id: string;
  name: string;
  category: DebtItem['category']; // reuses union from types.ts
  monthlyPayment: string;
  principal: string;
  interestRate: string;      // annual % — required new field
}
```

### Replaced state

| Removed | Replaced with |
|---|---|
| `primaryIncome`, `secondaryIncome`, `passiveIncome`, `variablePercent`, `primaryIncrement`, `secondaryIncrement`, `passiveIncrement`, `manualTotalIncome`, `showIncomeBreakdown` | `incomeItems: IncomeItem[]` (default: one empty item) |
| `debtBreakdown: DebtBreakdown`, `manualTotalDebt`, `totalDebtPrincipal`, `showDebtBreakdown` | `debtItems: OnboardingDebtItem[]` (default: empty array) |

### Kept state

`expenseBreakdown`, `incomeCurrency`, `expensesCurrency`, `debtCurrency`, `selectedGoals`, `selectedStrategy`, `surplusAmount`, `stepUpEnabled`, `exchangeRates`, `isExtracting`, `extractionPopup`, all navigation state.

### Derived values

```typescript
const totalIncomeINR = sum of incomeItems.map(i => convertToINR(i.amount, incomeCurrency))
const totalDebtINR   = sum of debtItems.map(d => convertToINR(d.monthlyPayment, debtCurrency))
const totalPrincipal = sum of debtItems.map(d => convertToINR(d.principal, debtCurrency))
```

---

## Submit Mapping — `submitOnboarding()`

### Income items → `IncomeProfile`

```typescript
const passiveItems = incomeItems.filter(i => ['passive','rental','dividend'].includes(i.type));
const activeItems  = incomeItems.filter(i => !['passive','rental','dividend'].includes(i.type));
const sorted       = [...activeItems].sort((a,b) => toNum(b.amount) - toNum(a.amount));

primaryIncome      = toINR(sorted[0]?.amount) or totalIncomeINR (if no items)
secondaryIncome    = sum(sorted.slice(1).map(toINR))
passiveIncome      = sum(passiveItems.map(toINR))
primaryIncrement   = parseFloat(sorted[0]?.growthRate) || 0
secondaryIncrement = weightedAvgGrowth(sorted.slice(1))
passiveIncrement   = weightedAvgGrowth(passiveItems)
variablePercent    = avgVariabilityPercent(passiveItems)
```

`weightedAvgGrowth(items)`: `sum(amount * growthRate) / sum(amount)` — falls back to 0 if no items.

### Debt items → `DebtProfile`

```typescript
debtItems.map(item => ({
  id:             item.id,
  name:           item.name,
  category:       item.category,
  principal:      toINR(item.principal),
  interestRate:   parseFloat(item.interestRate) || 0,
  monthlyPayment: toINR(item.monthlyPayment),
  remainingMonths: Math.ceil(toINR(item.principal) / toINR(item.monthlyPayment)) || 0,
}))
```

`DebtProfile.totalMonthly` = sum of mapped `monthlyPayment`.

### `completeOnboarding` dispatch

The store's `completeOnboarding` currently accepts a flat `debtBreakdown` object and builds `DebtProfile.items` from fixed categories. Minor update needed:

- Add `debtItems?: DebtItem[]` to the param object
- When `debtItems` is provided (new onboarding path), use it directly as `DebtProfile.items`
- Keep `debtBreakdown` optional for backward compatibility — old persisted state that replays through the store still works
- `DebtProfile.totalMonthly` recalculated as `sum(debtItems.map(d => d.monthlyPayment))`

---

## Step Components

### Step 1 — `OnboardingStepIncome.tsx` (full rewrite)

- Currency selector top-right (existing `CURRENCIES` list)
- Dynamic list of `IncomeItem` cards. Each card:
  - Name text input (editable inline)
  - Type dropdown: `Salary | Freelance | Passive | Rental | Dividend | Other`
  - Remove button (×, hidden if only one item remains)
  - 3-field sub-grid: Amount/mo | Growth %/yr | Variability %
  - Variability field: highlighted with `--secondary-accent` / `var(--accent-subtle)` border only when type is `passive | rental | dividend`; otherwise neutral
- "Add income source" dashed button (disabled when 8+ items)
- INR conversion hint below total if currency ≠ INR
- Upload salary slip pill button (existing `ExtractionPopup` flow)
- Total summary row: sum of all items in INR

### Step 2 — `OnboardingStepExpensesDebt.tsx` (debt section rewritten; expense section unchanged)

**Expenses (unchanged pattern):**
- Currency selector
- Hero total input + "Breakdown" toggle
- 2×3 grid of fixed category inputs (rent, food, transport, utilities, entertainment, other)
- INR conversion hint

**Debt (new dynamic list):**
- Currency selector
- Dynamic list of `OnboardingDebtItem` cards. Each card:
  - Name text input
  - Category dropdown (homeLoan | carLoan | personalLoan | creditCard | educationLoan | other)
  - Remove button (×)
  - 3-field sub-grid: EMI/mo | Principal | Rate %
  - Rate % field always highlighted red (`--red` border + subtle red background) — signals it's required for avalanche/snowball
- "Add debt / EMI" dashed button
- Upload loan doc pill button (existing extraction flow)
- Surplus banner (green if positive, amber if negative) — shows once both expense total and any debt item filled

### Step 3 — `OnboardingStepGoals.tsx` (no change)

Existing preset goal cards with priority selection, inline amount editing, custom goal addition all kept as-is.

### Step 4 — `OnboardingStepStrategy.tsx` (no change)

---

## Files Changed

| File | Change type |
|---|---|
| `frontend/src/app/screens/Onboarding.tsx` | Full rewrite |
| `frontend/src/app/screens/onboarding/useOnboardingForm.ts` | Full rewrite |
| `frontend/src/app/screens/onboarding/OnboardingStepIncome.tsx` | Full rewrite |
| `frontend/src/app/screens/onboarding/OnboardingStepExpensesDebt.tsx` | Debt section rewritten; expense section unchanged |
| `frontend/src/lib/store.ts` | Minor: `completeOnboarding` accepts `debtItems?: DebtItem[]` |
| `frontend/src/app/screens/onboarding/OnboardingStepGoals.tsx` | No change |
| `frontend/src/app/screens/onboarding/OnboardingStepStrategy.tsx` | No change |
| `frontend/src/app/screens/onboarding/OnboardingProgressBar.tsx` | No change |
| `frontend/src/app/screens/onboarding/OnboardingNavigation.tsx` | No change |
| `frontend/src/app/screens/onboarding/ExtractionPopup.tsx` | No change |
| `frontend/src/styles/theme.css` | No change |

---

## Constraints

- All CSS values use `theme.css` tokens (`--accent`, `--card`, `--border`, `--surface-tint`, etc.) — no hardcoded hex values
- No new npm packages
- `pnpm build` must pass (0 TS errors) after implementation
- `pnpm test` must pass (61 vitest cases unaffected — engine tests only)
- `completeOnboarding` store dispatch shape must remain backward-compatible for already-onboarded users (existing `FinancialProfile` shape unchanged)
- Extraction popup flow (`ExtractionPopup.tsx`) must remain functional — extracted income maps to first income item; extracted debt creates a new debt item entry
