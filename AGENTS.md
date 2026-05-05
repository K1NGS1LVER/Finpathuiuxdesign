# AGENTS.md — FinPath Agent Guide

## Commands

```bash
pnpm run build    # Production build (vite build) — only verification step, no lint/typecheck/test scripts
pnpm run dev      # Dev server (vite)
```

There is no `lint`, `typecheck`, or `test` script. `build` is the sole verification gate. Build must pass with 0 errors before considering changes complete.

## Architecture

**Single SPA — no monorepo, no multi-package.** All source in `src/`. Entrypoint: `src/app/App.tsx` — a `BrowserRouter` with `ErrorBoundary` wrapping every route.

### Directory map

| Path | Purpose |
|---|---|
| `src/app/App.tsx` | Router, layout shell (Sidebar + Header + `<main>` + PennyPanel), auth gating, goal-completion modal |
| `src/app/components/` | Shared UI: Sidebar, Header, ErrorBoundary, PennyPanel, SankeyFlow, plus `ui/` (shadcn primitives from `components.json`) |
| `src/app/screens/` | One file per page — each is the `default export` rendered by a route |
| `src/lib/store.ts` | Zustand store with localStorage persistence (key: `"finpath-store"`, version 1). Single source of truth for all financial data |
| `src/lib/types.ts` | Core types: `FinancialProfile`, `Goal`, `DebtItem`, `ExpenseProfile`, `IncomeProfile`, `HealthScore`, `FinancialPlan`, etc. |
| `src/lib/plan-engine.ts` | Goal allocation engine — generates the `FinancialPlan` (month-by-month projections) |
| `src/lib/health-score.ts` | Health score calculator — produces 0–100 composite score across 4 dimensions |
| `src/lib/debt-strategies.ts` | Debt payoff simulators: `avalanche()`, `snowball()`, `compareStrategies()` |
| `src/lib/tax-engine.ts` | Tax regime comparison (FY 2024-25 old vs new) |
| `src/styles/` | CSS cascade: `index.css` → `fonts.css` → `tailwind.css` → `theme.css` |

### State management

All app state lives in a single Zustand store (`useFinPathStore`) persisted to localStorage. **Every state change must be done through store setters** (`setIncome`, `updateGoal`, `addGoal`, `setDebts`, etc.). The store auto-computes health score and regenerates the plan on most mutations.

**Critical: `generatePlan()` runs on every `setDebts`, `setIncome`, `setExpenses`, `addGoal`, `updateGoal`, `addLumpsum`, `setStrategy`, and `completeOnboarding` call.** This function calls `resolveDebtsFromGoals()` which can wipe `debts` to `emptyDebtProfile()` if the debt goal's `status === "complete"`. After a recent fix, it now also checks `hasDebt(normalizedDebts)` before wiping. If you touch debt-related logic in the store, verify that `debts.items` doesn't get wrongly emptied.

**Auth:** Separate `useAuthStore` (Supabase auth). Auth gating in `App.tsx:98-133` — non-authenticated users → `/auth`, non-onboarded → `/onboarding`.

### Route table

| Path | Screen | Auth Required | Onboarding Required |
|---|---|---|---|
| `/` | Landing | No | No |
| `/auth` | Auth | No | No |
| `/onboarding` | Onboarding | Yes | No |
| `/loading` | Loading | Yes | — |
| `/dashboard` | Dashboard | Yes | Yes |
| `/journey` | Journey | Yes | Yes |
| `/tax` | Tax | Yes | Yes |
| `/month` | Month | Yes | Yes |
| `/scenarios` | Scenarios | Yes | Yes |
| `/progress` | Progress | Yes | Yes |
| `/cashflow` | Cashflow | Yes | Yes |
| `/debt` | Debt | Yes | Yes |
| `/celebrate` | Celebrate | Yes | Yes |

Layout (Sidebar + Header) only renders for non-public routes (not `/`, `/auth`, `/onboarding`, `/loading`).

### CSS & styling system

- **Tailwind CSS v4** with `@tailwindcss/vite` plugin — no PostCSS config needed (deleted)
- **Custom CSS variables** in `theme.css` — dual light/dark mode with `.dark` class
- **Glassmorphism** via `.bento-card` — semi-transparent background + 32px backdrop-blur
- **No CSS modules, no styled-components, no CSS-in-JS** except inline `style={{}}` props
- **Design tokens:** See `design.md` (gitignored reference doc) or `theme.css` directly
- **Known issues:** `css_audit.md` (gitignored) lists 12 findings — don't fix until `design.md` is finalized per user instruction
- **Dead file:** `default_shadcn_theme.css` at root — 120 lines, 0 imports, safe to delete
- **Dead file:** `theme.css.bak` in `src/styles/` — backup artifact
- **Unused classes in theme.css:** `bento-card-sm`, `bento-card-lg`, `dashboard-loading`, `dashboard-ready`, custom `gap-1` through `gap-4` — never referenced, safe to remove
- Duplicate `.penny-insight-card` pattern exists in 5 files and should be extracted as a CSS class — deferred per `design.md` finalization

### Shared Sankey components

`src/app/components/SankeyFlow.tsx` exports: `CustomNode`, `CustomLink`, `usePalette`, `formatInr`, `resolveCssVar`. Used by `Cashflow.tsx` and `Debt.tsx`. The `palette` is resolved from CSS variables via `useMemo` — **do not** extract to a module-level cache (theme toggle breaks). Use `usePalette()` hook or pass `palette` as a prop.

### Debt.tsx fallback logic

`Debt.tsx` has a fallback that reconstructs debt items from the debt goal when `debts.items` is empty (persisted state corruption from old `resolveDebtsFromGoals` bug). An `useEffect` auto-repairs the store on mount. If this ever fires unexpectedly, the root cause is the `resolveDebtsFromGoals` logic in the store.

## Coding conventions

- **`@/*` path alias** resolves to `src/*` — use it for all internal imports
- **File naming:** PascalCase for components, camelCase for hooks/utils. Screen files match route names: `Debt.tsx` for `/debt`, `Journey.tsx` for `/journey`, etc.
- **Exports:** Each screen is a `default export` function component
- **Store access:** Use individual selectors (`useFinPathStore(s => s.income)`) not destructuring the entire store — avoids unnecessary re-renders
- **Format INR:** Use `formatInr` from `SankeyFlow.tsx` or inline `toLocaleString('en-IN')` — standard pattern is `₹` prefix with comma separators
- **CSS variables:** Always reference via `var(--token)` or `resolveCssVar('--token')` for runtime resolution. Never hardcode hex values in components
- **Icons:** lucide-react icons get `className="icon-wireframe"` (1.5px stroke) — standard sizing is 14px (small), 18px (buttons), 20px (sidebar), 24px (headers)
- **Typography classes:** Use `.text-hero`, `.text-display`, `.text-title`, `.text-heading`, `.text-label` from theme.css for consistent hierarchy
- **TypeScript:** `strict: true` but `noUnusedLocals: false` and `noUnusedParameters: false` — unused imports won't break the build but should be cleaned up
- **No `useMemo` dependency**: The `pal` palette `useMemo` has an empty dependency array `[]` — this is intentional because CSS variable resolution is synchronous at call time and doesn't change within a render cycle

## Libraries & toolchain

- **Vite 6.3.5** with `@vitejs/plugin-react` — no special config needed
- **React 18.3.1** — not React 19, use React 18 APIs
- **recharts 2.15.2** — used for Sankey, AreaChart, LineChart across screens
- **lucide-react 0.487.0** — all icons, stroke-width 1.5px via `.icon-wireframe` class
- **zustand v5** — with `persist` middleware to localStorage
- **react-router v7** — uses `useNavigate`, `useLocation`, `Routes`/`Route` pattern
- **motion 12.x** (Framer Motion) — only used in `Landing.tsx` for hero animation
- **canvas-confetti** — used in `Celebrate.tsx` and `Progress.tsx` for celebration animations
- **@radix-ui/react-*** — shadcn/ui component primitives (accordion, dialog, dropdown-menu, etc.)
- **Supabase** — auth only (`@supabase/supabase-js`, `useAuthStore`)
- **Groq SDK** — used in `PennyPanel.tsx` for AI chat responses
- **pdfjs-dist** + **tesseract.js** — document extraction during onboarding
- **pnpm** with pnpm overrides: `vite@6.3.5` pinned

## Git-ignored reference files

These exist at the project root but are in `.gitignore`:

- `design.md` — Full screen/chart/component specification with ASCII layout diagrams for all 13 screens
- `css_audit.md` — 12 CSS audit findings with remediation plan (deferred until design.md finalized)
- `css_improvement.md` — Additional CSS improvements