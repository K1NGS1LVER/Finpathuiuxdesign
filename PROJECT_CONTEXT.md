# FinPath — Full Project Context Document

> This document is designed to be fed to an AI for review, critique, and enhancement suggestions.

---

## 1. Project Overview

**FinPath** is a single-page React application that provides AI-powered personal financial planning for Indian users. It ingests a user's income, expenses, debts, and goals, then generates a month-by-month financial plan, a 0-100 health score, debt payoff strategies (avalanche vs snowball), tax regime comparisons, what-if scenario projections, and a cash-flow Sankey visualization. An AI companion called "Penny" (powered by Groq's Llama 3.3 70B) offers contextual financial advice.

**Goal:** Replace spreadsheet-based financial planning with an opinionated, goal-first planning tool that tells users exactly where every rupee should go each month, while making the experience visually rich and motivating.

**Target market:** Indian salaried professionals with 1-3 financial goals (bike, emergency fund, vacation, wedding, education, investment, debt payoff).

**Live status:** Pre-launch. Auth is mocked (hardcoded fake user). No real Supabase auth wired up. No test infrastructure.

---

## 2. Technical Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | React | 18.3.1 (not React 19) |
| **Build** | Vite | 6.3.5 (pinned via pnpm overrides) |
| **Language** | TypeScript | strict: true, noUnusedLocals: false |
| **Styling** | Tailwind CSS v4 | 4.1.12 via `@tailwindcss/vite` (no PostCSS config) |
| **State** | Zustand v5 | Single store with localStorage persistence |
| **Routing** | React Router v7 | BrowserRouter, Routes/Route pattern |
| **Charts** | Recharts 2.15.2 | Sankey, AreaChart, custom SVG charts |
| **Animation** | motion 12.x (Framer Motion) | Only used in Landing.tsx |
| **Confetti** | canvas-confetti | Celebrate.tsx, Progress.tsx |
| **Icons** | lucide-react 0.487.0 | stroke-width 1.5px via `.icon-wireframe` |
| **AI** | Groq SDK | llama-3.3-70b-versatile, temp 0.7 |
| **Auth** | Supabase | `@supabase/supabase-js` (imported but mocked) |
| **Document OCR** | pdfjs-dist + tesseract.js | Salary slip / loan doc extraction during onboarding |
| **UI Primitives** | shadcn/ui (46 Radix-based components) | `@radix-ui/react-*` |
| **Package manager** | pnpm | With vite@6.3.5 override |
| **Verification** | `pnpm run build` only | No lint, typecheck, or test scripts |

**Path alias:** `@/*` resolves to `src/*`

---

## 3. Architecture

**Single SPA — no monorepo, no multi-package.** All source in `src/`.

### Directory Map

```
src/
├── app/
│   ├── App.tsx                  # Router, layout shell, auth gating
│   ├── components/
│   │   ├── ErrorBoundary.tsx    # Class-based error boundary
│   │   ├── Header.tsx           # Top bar: theme toggle, user menu, financial indicators
│   │   ├── Sidebar.tsx          # Left nav: collapsible desktop, drawer mobile
│   │   ├── PennyPanel.tsx       # AI chat slide-in panel
│   │   ├── SankeyFlow.tsx       # Custom Sankey node/link renderers
│   │   ├── ScrollToTop.tsx      # Scroll reset on route change
│   │   ├── ImageWithFallback.tsx # Broken image fallback (figma/ subdir)
│   │   └── ui/                  # 46 shadcn/ui primitives
│   └── screens/                 # One file per page (default export)
│       ├── Landing.tsx          # Public marketing page
│       ├── Auth.tsx             # Sign in / sign up
│       ├── Onboarding.tsx       # 4-step wizard
│       ├── Loading.tsx          # Transitional animation
│       ├── Dashboard.tsx        # Financial overview
│       ├── Journey.tsx          # Interactive goal canvas
│       ├── Tax.tsx              # Tax regime comparison
│       ├── Month.tsx            # Monthly execution checklist
│       ├── Scenarios.tsx        # What-if projections
│       ├── Progress.tsx         # Long-term tracking
│       ├── Cashflow.tsx         # Sankey flow diagram
│       ├── Debt.tsx             # Debt payoff analysis
│       └── Celebrate.tsx        # Goal completion celebration
├── lib/
│   ├── store.ts                 # Zustand store (single source of truth)
│   ├── types.ts                 # All TypeScript interfaces
│   ├── plan-engine.ts           # Goal allocation & month-by-month projection
│   ├── health-score.ts          # 0-100 composite health score
│   ├── debt-strategies.ts       # Avalanche & snowball simulators
│   ├── tax-engine.ts            # FY 2024-25 old vs new regime comparison
│   ├── document-extractor.ts    # PDF/OCR document extraction
│   ├── auth-store.ts            # Mocked Supabase auth store
│   ├── supabase.ts              # Supabase client init
│   └── penny-prompt.ts          # (if exists) Penny system prompt helpers
├── server/
│   └── penny-api.ts             # Vite dev server middleware: /api/penny endpoint
└── styles/
    ├── index.css                # Entry: imports fonts → tailwind → theme
    ├── fonts.css                # @font-face for Lufga family (5 weights)
    ├── tailwind.css             # @theme bridge, source glob, tw-animate-css
    └── theme.css                # All design tokens, component classes, animations (2319 lines)
```

---

## 4. Routing & Auth Gating

| Path | Screen | Auth Required | Onboarding Required | Has Layout Shell |
|---|---|---|---|---|
| `/` | Landing | No | No | No |
| `/auth` | Auth | No | No | No |
| `/onboarding` | Onboarding | Yes | No | No |
| `/loading` | Loading | Yes | — | No |
| `/dashboard` | Dashboard | Yes | Yes | Yes |
| `/journey` | Journey | Yes | Yes | Yes |
| `/tax` | Tax | Yes | Yes | Yes |
| `/month` | Month | Yes | Yes | Yes |
| `/scenarios` | Scenarios | Yes | Yes | Yes |
| `/progress` | Progress | Yes | Yes | Yes |
| `/cashflow` | Cashflow | Yes | Yes | Yes |
| `/debt` | Debt | Yes | Yes | Yes |
| `/celebrate` | Celebrate | Yes | Yes | Yes |

**Auth gating logic** (App.tsx):
1. While `authLoading`: full-screen spinner
2. No `user` + not on `/` or `/auth` → redirect to `/auth`
3. `user` + `onboarded` + on `/` or `/auth` → redirect to `/dashboard`
4. `user` + not `onboarded` + on `/auth` → redirect to `/onboarding`
5. `user` + not `onboarded` + on layout page → redirect to `/onboarding`

**Layout shell** (authenticated routes only): `Sidebar` (left) + `Header` (top) + scrollable `<main>` + `PennyPanel` (right slide-in).

**Goal-completion modal**: When `pendingGoalDecisions[0]` exists, a fixed overlay offers "Reinvest Into Remaining Goals" or "Keep As Net Worth Surplus".

---

## 5. State Management

### 5.1 Zustand Store (`useFinPathStore`)

Single store persisted to `localStorage` (key: `"finpath-store"`, version 1).

**State shape** (FinancialProfile):

| Field | Type | Description |
|---|---|---|
| `onboarded` | `boolean` | Has user completed onboarding? |
| `income` | `IncomeProfile` | salary, freelance, passive, total, expectedAnnualIncrement |
| `expenses` | `ExpenseProfile` | rent, food, transport, utilities, entertainment, other, total |
| `debts` | `DebtProfile` | items: DebtItem[], totalMonthly, totalPrincipal |
| `savings` | `number` | Total savings |
| `investments` | `number` | Total investments |
| `emergencyFund` | `number` | Emergency fund balance |
| `goals` | `Goal[]` | All financial goals (including auto-managed debt goal) |
| `healthScore` | `HealthScore` | 0-100 composite + 4 sub-scores + actions |
| `plan` | `FinancialPlan` | Month-by-month projection |
| `chatHistory` | `ChatMessage[]` | Penny chat messages |
| `currency` | `string` | User's currency code |
| `strategy` | `InvestmentStrategy` | "avalanche" or "snowball" |
| `monthlySurplusReserve` | `number` | Buffer reserve from surplus |
| `pendingGoalDecisions` | `GoalCompletionDecision[]` | Queue of completed-goal decisions |
| `lastUpdated` | `string` | ISO timestamp |
| `stepUpEnabled` | `boolean` | Step-up SIP plan toggle |

**Store actions and their side effects:**

| Method | Triggers | Notes |
|---|---|---|
| `setIncome` | HealthScore + Plan | |
| `setExpenses` | HealthScore + Plan | |
| `setDebts` | HealthScore + Plan | Normalizes, syncs debt goal, normalizes priorities |
| `setSavings` / `setInvestments` / `setEmergencyFund` | HealthScore + Plan | |
| `setStrategy` | Plan | Avalanche ↔ Snowball |
| `setGoals` | Plan | Resolves debts from goals first |
| `addGoal` | Plan | Auto-assigns next priority number |
| `updateGoal` | Plan | Auto-detects completion, enqueues decision |
| `removeGoal` | Plan | Removes pending decision if any |
| `completeGoal` | Plan | Sets status + currentAmount |
| `addLumpsum` | Plan | Auto-completes if threshold reached |
| `resolveGoalCompletionDecision` | Plan | "reinvest" or "surplus" |
| `computeHealthScore` | — | Computes 4-dimension score |
| `generatePlan` | — | Regenerates plan + mutates goal monthlyAllocations |
| `completeOnboarding` | HealthScore + Plan | Sets all initial data |
| `updateSettings` | HealthScore + Plan | Supports salary hike |

**Critical behavior:** `generatePlan()` runs on every `setDebts`, `setIncome`, `setExpenses`, `addGoal`, `updateGoal`, `addLumpsum`, `setStrategy`, and `completeOnboarding` call. It also mutates goal `monthlyAllocation` and `status` in the store.

### 5.2 Auth Store (`useAuthStore`)

Separate Zustand store. **Currently mocked** — all operations return a fake user after 500ms delay. Supabase client is imported but not used in any action.

### 5.3 Debt Goal Auto-Management

The debt goal (`id: "goal-debt-payoff"`) is a special system-managed goal that mirrors the debt profile. It is automatically:
- Created when debts exist
- Removed when all debts are cleared
- Kept in sync with actual debt items

`resolveDebtsFromGoals()` checks `hasDebt(normalizedDebts)` before wiping debt items — a critical guard against accidental deletion.

---

## 6. Core Algorithms

### 6.1 Plan Engine (`plan-engine.ts`)

**Input:** Income, expenses, debts, goals, savings, investments, strategy, surplusReserve, stepUpEnabled.

**Surplus allocation algorithm:**
1. Filter out completed and debt-category goals (debt payments already deducted)
2. For each active goal, compute weight = `priorityWeight × urgencyWeight × strategyModifier`
   - `priorityWeight` = 1 / priority (lower number = higher weight)
   - `urgencyWeight` = 1 / √timelineMonths (shorter = more urgent)
   - **Avalanche**: strategyModifier = 2 if priorityWeight > 0.5, else 1
   - **Snowball**: strategyModifier = 100000 / (remaining + 1000) (smaller balances win)
3. Distribute surplus proportionally by weight, capped at each goal's remaining amount

**Month-by-month simulation** (capped at 120 months):
- Annual salary increment applied every 12 months (if set)
- Monthly surplus = currentIncome - expenses - debtPayments
- Subtract reservedSurplus and pendingSurplus
- If `stepUpEnabled` is false, cap allocatable surplus at original base
- Allocate to goals, track completions
- Unallocated surplus → cumulativeSavings
- Investments grow at ~1% monthly (12% annual)
- Net worth = cumulativeSavings + cumulativeInvestments + totalGoalProgress
- Stop 3 months after all goals complete

**Scenario analysis:** Applies percentage modifications to income/expense categories or timeline adjustments, then re-runs `generatePlan`.

### 6.2 Health Score (`health-score.ts`)

0-100 composite across 4 dimensions (each 0-25):

| Dimension | Scoring Logic |
|---|---|
| **Savings Rate** | ≥30% = 25, 20-30% = 20, 10-20% = 12, 0-10% = 5, negative = 0 |
| **Debt Load** (DTI) | 0% = 25, <20% = 22, 20-35% = 18, 35-50% = 10, >50% = 3 |
| **Emergency Fund** | ≥6 months = 25, 3-6 = 18, 1-3 = 10, <1 = 3 |
| **Income Stability** | 3+ sources = 25, 2 = 20, salary only = 15, single non-salary = 10, none = 0 |

Generates up to 3 prioritized action recommendations.

### 6.3 Debt Strategies (`debt-strategies.ts`)

| Strategy | Sort Order | Minimizes |
|---|---|---|
| **Avalanche** | Highest interest rate first | Total interest paid |
| **Snowball** | Smallest balance first | Time to first debt payoff |

Both use a shared simulation engine with monthly interest accrual, minimum payments, and extra payment applied to the priority debt. Safety cap: 360 months.

`compareStrategies()` returns interest saved, months difference, and recommendation.

### 6.4 Tax Engine (`tax-engine.ts`)

FY 2025-26 (AY 2026-27) comparison:

| Regime | Standard Deduction | Slabs | 87A Rebate |
|---|---|---|---|
| **Old** | ₹50,000 | 4 slabs (0/5/20/30%) | Up to ₹12,500 if taxable ≤ ₹5L |
| **New** | ₹75,000 | 7 slabs (0/5/10/15/20/25/30%) | Full rebate if taxable ≤ ₹12L |

4% Health & Education Cess applied on both.

### 6.5 Document Extractor (`document-extractor.ts`)

Two-stage extraction:
1. Raw text: PDF via pdfjs-dist, Image via tesseract.js OCR
2. Intelligent parsing: keyword detection (25 salary keywords, 22 loan keywords, minimum 2 required) → regex extraction of amounts, EMI, interest rates
- Handles Indian number formats (lakh/crore, 1,20,000 comma grouping)
- Detects annual vs monthly (CTC > ₹5L → divide by 12)
- 15MB file size limit

---

## 7. Design System

### 7.1 Typography

**Typeface:** Lufga (5 weights loaded: Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700). 13 additional TTF files (Thin, ExtraLight, Black, ExtraBold, all Italic variants) exist in the fonts directory but are unused.

**Hierarchy classes:**

| Class | Mobile | Desktop (768px+) | Weight | Tracking |
|---|---|---|---|---|
| `.text-hero` | 48px | 80px | Bold | -0.03em |
| `.text-display` | 36px | 64px | Bold | -0.02em |
| `.text-title` | 22px | 36px | Bold | -0.02em |
| `.text-heading` | 22px | 22px | SemiBold | 0 |
| `.text-label` | 12px | 12px | Medium | 0.07em, uppercase |

**Scale:** 2xs(10), xs(12), sm(14), base(15), lg(18), xl(22), 2xl(28), 3xl(36), 4xl(48), 5xl(64), 6xl(80)

### 7.2 Color System

**Three accent colors + semantic + goal category colors:**

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--accent` (Primary) | `#495bff` (blue) | `#7b8cff` | CTAs, primary actions |
| `--secondary-accent` | `#ac49ff` (violet) | `#c77dff` | Secondary highlights |
| `--tertiary-accent` | `#b0ff09` (lime) | `#b0ff09` | Success, growth, active states |
| `--penny-accent` | `#495bff` | `#8e9bff` | AI/Penny brand |
| `--green` | `#22c55e` | `#22c55e` | Positive financial indicators |
| `--amber` | `#f59e0b` | `#f59e0b` | Warning, neutral indicators |
| `--red` | `#ef4444` | `#ef4444` | Danger, negative indicators |
| `--teal` | `#14b8a6` / `#2dd4bf` | | Bike/travel goals |
| `--terracotta` | `#d97757` / `#f09b7a` | | Home/family goals |
| `--cobalt` | `#3b82f6` / `#60a5fa` | | Education/investment goals |
| `--rose` | `#f43f5e` / `#fb7185` | | Debt/wedding goals |

Each accent has: base, hover, text, bright, subtle, glow, and on-accent variants.

**Dark mode philosophy:** Every token re-declared. Accent colors lighten for dark surface contrast. Subtle/glow variants increase opacity (0.14 vs 0.08). Shadows switch from blue-tinted to pure black with higher opacity.

### 7.3 Spacing

8px scale: 0, 8, 16, 24, 32, 40, 48, 64, 96px

### 7.4 Radii

4, 8, 12, 16, 24, 32px, 9999px (pill)

### 7.5 Shadows

4 levels (sm/md/lg/xl) — light mode uses blue-tinted rgba(5,15,28,...), dark mode uses pure black with higher opacity.

### 7.6 Backgrounds

Multi-layered ambient gradient system:
- `:root` body: Linear gradient + 3 fixed radial gradient blobs (blue, violet, indigo)
- `body::before`: Second ambient layer with different blob positions
- Dark mode: Drastically dimmed blobs (6%/4%/2% vs 12%/7%/4%)

### 7.7 Glassmorphism

**`.bento-card`** — Core card:
- Background: `var(--card)` = 85% white / 60% dark navy
- Backdrop blur: 32px
- Border: 1px solid `var(--border)` (near-transparent)
- Shadow: `var(--shadow-md)`
- Radius: 32px
- Padding: 16px mobile / 32px desktop
- Hover: Only lifts/glows on `button.bento-card`, `a.bento-card`, or `.bento-card.interactive`

**`.penny-insight-card`** — AI insight variant:
- Even more transparent background (`var(--surface-tint)`)
- Blue-tinted border + inner accent glow blob
- Dark mode: `mix-blend-mode: screen` on blob

### 7.8 Animations

| Animation | Duration | Used By |
|---|---|---|
| `scenarioFadeSlide` | 600ms | Page transitions |
| `shimmer` | 2s infinite | Skeleton loading |
| `drawLine` | 1.2s | Scenario chart line |
| `pulseRing` | 2.4s infinite | Active indicators |
| `msgIn` | 280ms | Penny chat messages |
| `dotBounce` | 1.2s infinite | Loading dots |
| `float` | 6s infinite | Decorative elements |

**Transitions:** Buttons use spring-like cubic-bezier(0.34, 1.56, 0.64, 1) for press, cards use smoother cubic-bezier(0.22, 1, 0.36, 1) for hover.

### 7.9 Responsive Breakpoints

| Breakpoint | Width | Changes |
|---|---|---|
| Default | <768px | Single column, smaller padding/text |
| Tablet | ≥768px | Card padding increase, typography scale jumps, side-by-side layouts |
| Desktop | ≥1024px | Month grid 2fr/1fr, lower grid 1fr/1fr |

No custom named breakpoints — all raw `@media (min-width: Npx)` in CSS.

---

## 8. Screen-by-Screen Detail

### 8.1 Landing (`/`)
**Purpose:** Public marketing page. Introduces FinPath, showcases features, drives sign-up.

**Sections:**
- Fixed nav bar: Logo, Features link, Testimonials link, "Start My Journey" CTA, theme toggle
- Hero: Two-column — tagline/headline/CTAs left, mock dashboard card right (animated health score ring at 78, stats)
- Features (2×2 grid): Goal-first planning, Debt payoff intelligence, Penny AI, What-if engine
- Testimonials: Three cards with Indian names/titles
- CTA footer + copyright

**Interactions:** CTA → `/auth`, anchor scroll, theme toggle
**Store:** None
**Charts:** SVG health ring (animated stroke-dashoffset), progress bar
**Animation:** Framer Motion (motion 12.x) for hero animations

### 8.2 Auth (`/auth`)
**Purpose:** Sign in / sign up with Supabase (currently mocked).

**Sections:** Theme toggle, decorative blobs, logo, dynamic title, form card (email, password, optional name), mode toggle, password visibility toggle, error alert, confirmation view

**Interactions:** Form submit, mode toggle, back link, theme toggle
**Store:** useAuthStore (signIn, signUp, loading, error)
**Charts:** None

### 8.3 Onboarding (`/onboarding`)
**Purpose:** 4-step wizard collecting financial profile.

**Steps:**
1. **Income:** Monthly income, currency selector (8 currencies), annual increment %, salary slip file upload
2. **Expenses & Debt:** Total or breakdown (6 expense categories + 6 debt categories), file upload for loan docs
3. **Goals:** 6 preset options + custom goal, max 3 goals, priority assignment (P1/P2/P3), target amounts
4. **Strategy:** Available budget, step-up plan toggle, avalanche/snowball selection, surplus reserve input

**Interactions:** Income/expense inputs, currency dropdowns, file uploads (PDF/image → OCR), goal toggles, strategy selection, navigation buttons
**Store:** Writes `completeOnboarding(...)` which populates entire store
**Modals:** `ExtractionPopup` — document extraction status, auto-dismisses after 6s
**Charts:** Progress bar only

### 8.4 Loading (`/loading`)
**Purpose:** Transitional animation. Runs `computeHealthScore()` and `generatePlan()`.

**Sections:** Spinner, "Creating your FinPath..." title, 5 animated sequential steps, Penny quote

**Interactions:** None (auto-redirects to `/dashboard` after 1.8s)
**Store:** Calls `computeHealthScore()` at step 3, `generatePlan()` at step 5

### 8.5 Dashboard (`/dashboard`)
**Purpose:** Main financial overview.

**Sections:**
- Header: "Financial Overview", period selector (This month / Quarter / YTD)
- Active Goals Card (8 cols): Up to 3 goals with progress bars, View All link
- Next Step Card (4 cols): Top-priority goal with "Done for this month" button
- Health + Metrics Card (7 cols): Income/Surplus/Savings metrics + SVG health ring + 4 sub-score bars
- Recent Activity Card (5 cols): Up to 5 goals with allocation status
- Achievements Card (12 cols): 8 badge tiles (First Step, Healthy Start, etc.)
- Penny's Insights Card (12 cols): 3 insight tiles + "Ask follow-up"

**Interactions:** Period selector, goal clicks → `/journey`, "Done for this month" → `updateGoal`, achievement viewing, Penny follow-up
**Store:** Reads income, expenses, debts, goals, savings, healthScore, investments; writes updateGoal
**Charts:** SVG health ring, progress bars

### 8.6 Journey (`/journey`)
**Purpose:** Interactive canvas-based goal map. Drag, pan, zoom.

**Sections:**
- Canvas: SVG dot grid, connection lines (income → goals), draggable income node, draggable goal nodes
- Add Goal button (top-right)
- JourneyAddGoalModal: Preset grid (8 options) + custom goal form, budget warnings
- JourneyGoalDetailPanel (right slide-in): Goal stats, priority selector, "Mark Complete" (confetti), "Delete Goal"

**Interactions:** Drag nodes, pan/zoom canvas, add preset/custom goals, mark complete, delete, change priority
**Store:** Reads income, expenses, debts, goals; writes addGoal, setGoals, completeGoal, removeGoal
**Charts:** SVG connections, progress bars
**Modals:** JourneyAddGoalModal
**Confetti:** canvas-confetti on goal completion

### 8.7 Tax (`/tax`)
**Purpose:** FY 2024-25 Old vs New tax regime comparison.

**Sections:**
- Input card: Annual income, deductions, regime selector (New/Old pills)
- Old Regime Card: Tax liability + breakdown
- New Regime Card: Tax liability + breakdown
- Savings Card: Difference amount + percentage
- Recommendation Card: Best regime text
- Penny's Deduction Guide: 4 deduction tiles (80C, 80D, 24(b), HRA)

**Interactions:** Income/deduction inputs, regime toggle
**Store:** Reads income only
**Charts:** None

### 8.8 Month (`/month`)
**Purpose:** Monthly plan execution checklist.

**Sections:**
- Header: Month label, days left, "This Month's Plan"
- Debt warning banner (conditional)
- Mission Card: Savings target + debt payment summary, days remaining, on-track %
- Left column: Allocation Checklist with checkboxes, inline editable amounts, completion counter
- Right column: Impact Card (per-goal progress bars), Penny Suggests Card
- Lower grid: Investment Strategy Card (Avalanche/Snowball toggle with sliding indicator), Lumpsum Fast-Track Card (goal selector, amount input, apply button)

**Interactions:** Toggle checkboxes, edit amounts, strategy toggle, lumpsum apply
**Store:** Reads income, expenses, debts, goals, plan, strategy; writes updateGoal, addLumpsum, setStrategy
**Charts:** Progress bars

### 8.9 Scenarios (`/scenarios`)
**Purpose:** What-if compound growth projections.

**Sections:**
- Header with show/hide baseline toggle
- 3 KPI cards: Projected total, vs baseline difference, required monthly (% of income)
- Chart Card: Custom SVG area chart (scenario curve + optional dashed baseline), interactive tooltip
- Controls Card: Monthly investment slider (10K-200K), time horizon slider (3-30 years), risk profile buttons (Conservative 7% / Balanced 10% / Aggressive 14%)
- Quick presets row: 3 preset scenarios

**Interactions:** Sliders, risk profile buttons, preset buttons, chart hover tooltip, baseline toggle
**Store:** Reads income only
**Charts:** Custom SVG area chart with gradient fill, draw animation, interactive tooltip

### 8.10 Progress (`/progress`)
**Purpose:** Long-term progress tracking.

**Sections:**
- 4 KPI cards: Net Worth Delta, Avg Monthly Save, Goals Hit, Streak
- Net Worth Trajectory Chart: SVG line chart (5 historical + current + up to 6 projected points), solid/dashed lines, area fill, tooltip
- Monthly Check-in Card: Per-goal progress, "Complete Monthly Check-in" button (confetti)
- Milestones + Penny Quarterly Review: 6 milestones with done/pending states, quarterly AI review, "Discuss with Penny" button
- Health Score Strip: 4 sub-scores + "Penny's Top Actions"

**Interactions:** Monthly check-in button (confetti), Penny discussion button, chart hover
**Store:** Reads income, expenses, debts, goals, plan, healthScore, savings, investments
**Charts:** SVG trajectory chart, progress bars

### 8.11 Cashflow (`/cashflow`)
**Purpose:** Sankey diagram of monthly cash flow.

**Sections:**
- Header: "Money Flow" with current month/year
- Flow Diagram Card: Recharts Sankey with custom nodes/links from SankeyFlow.tsx, text breakdown below
- Goal Allocations Card (conditional): Per-goal progress + monthly allocation
- Penny's Insight Card: Numbered contextual insights (expense ratio, savings rate, DTI, etc.)

**Interactions:** None (read-only)
**Store:** Reads income, expenses, plan, goals, debts, savings, emergencyFund, healthScore
**Charts:** Recharts Sankey diagram with custom rendering

### 8.12 Debt (`/debt`)
**Purpose:** Debt payoff strategy comparison.

**Sections:**
- 3 metric cards: Total Outstanding (red), Monthly EMI, Avg Interest Rate (amber)
- Strategy toggle (Avalanche/Snowball)
- Extra Monthly Payment slider (0-50K)
- Payoff Timeline Chart: Recharts stacked AreaChart (per-debt areas + alternate strategy dashed line)
- Ranked Debt List: Numbered, sorted by strategy, with progress bars
- Penny Insight: Strategy savings comparison
- Empty state: "No Debts Tracked" with add prompt

**Fallback logic:** If `debts.items` is empty but debt goal exists, reconstructs debt items from goal. `useEffect` auto-repairs store on mount.

**Interactions:** Strategy toggle, extra payment slider
**Store:** Reads debts, goals; writes setDebts (auto-repair)
**Charts:** Recharts stacked AreaChart

### 8.13 Celebrate (`/celebrate`)
**Purpose:** Goal completion celebration.

**Sections:**
- Hero: Trophy icon in glowing circle, congratulations headline, dynamic subtitle
- Goal Summary Cards: Per completed goal with stats
- Journey So Far Card: Before (₹0) vs Today (savings + investments), full-width progress bar
- Action buttons: "Back to Dashboard", "View Journey Map"

**Interactions:** Navigation buttons only
**Store:** Reads goals, income, savings, investments, healthScore
**Charts:** Progress bar only
**Confetti:** canvas-confetti with continuous left+right cannon for 3s on mount

---

## 9. Shared Components

### 9.1 App.tsx (Shell)
- BrowserRouter wrapping everything
- `AppContent`: Auth gating, layout shell (Sidebar + Header + main + PennyPanel)
- Dark mode state persisted to `localStorage("finpath-mode")`
- Goal-completion decision modal when `pendingGoalDecisions[0]` exists
- `useEffect`: computeHealthScore + generatePlan on onboarded change

### 9.2 Sidebar
- Custom component (not the shadcn/ui sidebar)
- 7 nav items with icons, active indicator (left accent bar)
- Collapsible on desktop (80px → 240px), drawer on mobile
- "Ask Penny" button at bottom with accent glow
- `document.body.style.overflow = 'hidden'` when mobile drawer open

### 9.3 Header
- Theme toggle (animated Sun/Moon crossfade)
- User avatar with dropdown (name, email, sign out)
- Desktop surplus/decision indicators
- Sign out → `signOut()` + `resetStore()` + navigate to `/`

### 9.4 PennyPanel
- Right slide-in panel (380px desktop, full-width mobile)
- Chat interface: messages, loading spinner, quick suggestion chips
- API call: `POST /api/penny` with full financial profile
- 20s timeout, rate limit (429) handling
- Reads 12 store selectors individually (performance pattern)

### 9.5 SankeyFlow.tsx
- `CustomNode`: Renders Sankey node with name + formatted value, color-mapped by node name
- `CustomLink`: Renders filled SVG bezier band with source-based coloring
- `usePalette()`: `useMemo` with `[]` deps (intentional — CSS vars are synchronous)
- `formatInr`: INR formatting with rupee symbol + Indian comma separators
- `resolveCssVar`: Runtime CSS variable resolution with fallback

### 9.6 ErrorBoundary
- Class-based, catches render errors
- Fallback: AlertTriangle + error message + "Try Again" button
- `animate` prop controls page-animation wrapper (top-level passes false)

### 9.7 ScrollToTop
- Resets both `window.scrollTo(0,0)` and `<main>` scroll on route change

### 9.8 shadcn/ui (46 components)
Standard Radix-based primitives. Largely unused in current screens (screens use custom components + Tailwind directly). Notable: `sonner.tsx` imports `next-themes` but the app doesn't use Next.js.

---

## 10. Server-Side (Dev Only)

### penny-api.ts (Vite middleware)
- Endpoint: `POST /api/penny`
- Proxies to Groq API (llama-3.3-70b-versatile, temp 0.7, max 500 tokens)
- Rate limiting: 15 requests / 60 seconds per IP
- Response caching: 5-minute TTL, max 100 entries
- Data anonymization: Strips personal info, sends only aggregates
- System prompt: Penny personality (warm, direct, celebratory, risk-flagging) + user's financial snapshot

---

## 11. Known Issues & Technical Debt

1. **Auth is mocked** — `useAuthStore` returns a hardcoded fake user. Supabase is imported but unused.
2. **Missing `TaxResult` type** — `tax-engine.ts` imports `TaxResult` from `./types` but it doesn't exist in `types.ts`. May be masked by `skipLibCheck: true`.
3. **`formatInr` duplication** — Identical inline implementations in `SankeyFlow.tsx`, `App.tsx`, and `Header.tsx`.
4. **`sonner.tsx` uses `next-themes`** — shadcn component assumes Next.js, but app is Vite/React.
5. **No tests** — Zero test files, zero test scripts. Build is the only verification gate.
6. **Unused shadcn/ui components** — 46 primitives installed but screens use custom components + Tailwind.
7. **Unused font files** — 13 of 18 TTF files never declared in `fonts.css`.
8. **Dead CSS files** — `default_shadcn_theme.css` (root), `theme.css.bak` (src/styles/).
9. **Unused CSS classes** — `.bento-card-sm`, `.bento-card-lg`, `.dashboard-loading`, `.dashboard-ready`, `gap-1` through `gap-4`.
10. **Duplicate `.penny-insight-card` pattern** — Exists as inline styles in 5 component files. Deferred extraction.
11. **Debt.tsx fallback** — Reconstructs debt items from debt goal when `debts.items` is empty (corruption from old `resolveDebtsFromGoals` bug). `useEffect` auto-repairs on mount.
12. **`usePalette()` empty deps** — `useMemo` with `[]` works because CSS var resolution is synchronous and parent re-render provides fresh values. But linting/tools may flag it.
13. **Investment growth assumption** — Plan engine uses flat 12% annual (1% monthly compounding) — a simplification.
14. **Document extraction is regex-only** — No ML/AI. Keyword matching with 2-of-N threshold.
15. **Two Sidebar systems** — Custom `Sidebar.tsx` (used) + shadcn `ui/sidebar.tsx` (unused, full context system).
16. **`next-themes` dependency** — Listed in package.json but app uses custom dark mode (`.dark` class toggled by `isDark` state). The `sonner.tsx` component is the only consumer.
17. **No error monitoring** — `ErrorBoundary` logs to console only. No Sentry, LogRocket, etc.
18. **No real backend** — Only `/api/penny` dev middleware. No production API, no database beyond localStorage.

---

## 12. Package.json Dependencies (Key)

| Category | Packages |
|---|---|
| **UI** | @mui/material, @mui/icons-material, @emotion/react, @emotion/styled |
| **Radix** | 22 @radix-ui/react-* packages |
| **State** | zustand v5, react-hook-form |
| **Routing** | react-router v7 |
| **Charts** | recharts 2.15.2 |
| **Animation** | motion 12.x, canvas-confetti |
| **AI** | groq-sdk |
| **Document** | pdfjs-dist, tesseract.js |
| **Auth** | @supabase/supabase-js |
| **Utility** | date-fns, clsx, tailwind-merge, class-variance-authority, cmdk, sonner, vaul, lucide-react |
| **Layout** | react-resizable-panels, react-responsive-masonry, embla-carousel-react, react-slick |
| **Styling** | tw-animate-css, tailwind-merge |
| **Drag** | react-dnd, react-dnd-html5-backend |

Note: Several packages appear installed but unused in the current codebase (e.g., @mui/material, react-dnd, react-responsive-masonry, react-slick, embla-carousel-react).

---

## 13. File Counts & Size

| Category | Files | Approx Lines |
|---|---|---|
| **Screens** | 13 | ~6,500 |
| **Shared Components** | 7 (non-ui) | ~800 |
| **shadcn/ui** | 46 | ~4,000 |
| **Lib** | 9 | ~2,400 |
| **Styles** | 4 | ~2,400 |
| **Server** | 1 | ~250 |
| **Total src/** | ~80 | ~16,350 |

---

## 14. CSS Token Reference (Complete)

### Spacing (8px scale)
`--space-0: 0px` | `--space-1: 8px` | `--space-2: 16px` | `--space-3: 24px` | `--space-4: 32px` | `--space-5: 40px` | `--space-6: 48px` | `--space-8: 64px` | `--space-12: 96px`

### Radii
`--radius-xs: 4px` | `--radius-sm: 8px` | `--radius-base: 12px` | `--radius-md: 16px` | `--radius-lg: 24px` | `--radius-xl: 32px` | `--radius-full: 9999px`

### Shadows
`--shadow-sm` through `--shadow-xl` (4 levels, mode-dependent)

### Accent families (each has: base, hover, text, bright, subtle, glow, on-accent)
- Primary (`--accent*`): Blue
- Secondary (`--secondary-accent*`): Violet
- Tertiary (`--tertiary-accent*`): Lime
- Penny (`--penny-accent*`): Blue (AI brand)

### Semantic
- `--green*` (base, text, subtle)
- `--amber*` (base, text, subtle)
- `--red*` (base, text, subtle)

### Goal category
- `--teal*` (base, text, subtle)
- `--terracotta*` (base, text, subtle)
- `--cobalt*` (base, text, subtle)
- `--rose*` (base, text, subtle)

### Neutral
`--neutral-100` through `--neutral-800` (blue-tinted, direction inverts between light/dark)

### Surface states
`--surface-tint` | `--surface-hover` | `--surface-active`

### Backgrounds
`--background` (multi-gradient) | `--background-solid` | `--background-loading`

### Canvas (Journey page)
`--canvas-dot` | `--canvas-border`

### Compatibility aliases
`--lime` → `--tertiary-accent` | `--violet` → `--secondary-accent` | `--blue` → `--accent` | `--orange`/`--yellow` → `--amber`
