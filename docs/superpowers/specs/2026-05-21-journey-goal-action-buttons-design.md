# Journey Goal Detail Panel — Action Buttons Design

**Date:** 2026-05-21  
**Status:** Approved

## Context

The `JourneyGoalDetailPanel` currently has one permanent action in its footer: a single "Mark complete" button that transitions a goal to `status: 'complete'` (irreversible). Users need a second, lighter-weight action — marking a goal's monthly milestone as fulfilled without terminating the goal. This spec adds both actions as a distinct stacked button section above the existing footer.

## Scope

Files modified:
- `frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx` — new props, new button section
- `frontend/src/app/screens/Journey.tsx` — wire `onCompleteMonth` handler at call site

No new store setters needed. `updateGoal` and `completeGoal` already exist.

## DOM Structure

New `<div>` section inserted between the scrollable body and the existing footer (currently around line 365 in `JourneyGoalDetailPanel.tsx`). Guarded by `goal.status !== 'complete'` — same condition as the existing "Mark complete" button.

```
[scrollable body]
[new-actions section]          ← INSERT
  └─ Complete for the Month    (primary, full-width, stacked top)
  └─ Complete Goal             (secondary, full-width, stacked below)
[existing footer]
  └─ Mark complete (gradient)
  └─ Delete (with confirm)
```

## Props

Add one new prop to `JourneyGoalDetailPanelProps`:

```ts
onCompleteMonth: (goalId: string) => void;
```

In `Journey.tsx`, pass it as:

```tsx
onCompleteMonth={(goalId) =>
  useFinPathStore.getState().updateGoal(goalId, { checkedThisMonth: true })
}
```

Or extract `updateGoal` via selector at the top of `Journey.tsx` and reference it inline. Existing `onComplete` prop reused as-is for "Complete Goal".

## Button Specifications

| Button | Class tokens | Icon | Width | Disabled when | Disabled label |
|---|---|---|---|---|---|
| Complete for the Month | `btn-complete-goal button-press` | `CheckCircle` 16px | 100% | `goal.checkedThisMonth === true` | `✓ Done this month` |
| Complete Goal | `btn-ghost-gradient button-press` | `Trophy` 16px | 100% | never | — |

- `btn-complete-goal` — accent fill, high contrast. Existing token in `theme.css`.
- `btn-ghost-gradient` — outline/transparent interior, gradient border. Low visual weight prevents accidental permanent-completion clicks.
- `button-press` — scale(1.02)/scale(0.98) hover/active micro-interaction. Already used on existing buttons in the panel.
- Layout: `flex flex-col gap-2` container, padded to match existing footer spacing.

## State

No new local state. `goal.checkedThisMonth` (from props, sourced from Zustand) drives the disabled/label toggle reactively. Existing `confirmDelete` / `confirmTimer` state in the panel is untouched.

## Interaction Rules

- Both new buttons hidden when `goal.status === 'complete'` (same guard as existing "Mark complete").
- "Complete for the Month" disabled (not hidden) when `goal.checkedThisMonth === true`. Label changes to `✓ Done this month`. Opacity reduced via `disabled:opacity-50`.
- "Complete Goal" always enabled while goal is active. Calls `onComplete(goal.id)` → `completeGoal(id)` in store → triggers `GoalCompletionDecision` flow in `App.tsx`.

## Verification

1. `pnpm build` — 0 TypeScript errors. New prop must be passed at every call site in `Journey.tsx`.
2. Visual check: primary button (accent fill) clearly dominates over outline secondary.
3. Toggle `checkedThisMonth: true` via Zustand devtools → primary button disables, label reads "✓ Done this month".
4. Click "Complete Goal" → goal flips to `complete`, all three action buttons (both new + existing "Mark complete") hide.
5. `pnpm test` — 61 vitest tests pass (no engine changes, so no fixture regen needed).
