# Journey Goal Editing — Design Spec

**Date:** 2026-05-21  
**Status:** Approved  
**Scope:** `JourneyGoalDetailPanel.tsx` only — no new files, no store changes

---

## Problem

The Journey page Goal Detail Panel is read-only. Users cannot change a goal's target amount or timeline after creation. Any edit requires deleting and re-adding the goal.

---

## Solution

Add an edit mode toggle to `JourneyGoalDetailPanel`. Clicking "Edit Goal" switches the panel body to an edit form. "Update Goal" dispatches to the Zustand store. The existing `updateGoal` action already triggers `computeHealthScore()` + `generatePlan()`, so all dependent screens (Dashboard, Progress, Month, Debt) re-render automatically — no additional wiring required.

---

## Editable Fields

| Field | Store key | Type |
|---|---|---|
| Target Amount | `goal.targetAmount` | `number` (INR) |
| Timeline | `goal.timelineMonths` | `number` (months) |

`timelineMonths` is exposed as two linked inputs: a **months number input** and a **month/year date picker**. Changing either updates the other. The store only saves `timelineMonths`; the date is derived locally.

**Read-only in edit mode:** `currentAmount`, `monthlyAllocation` (plan-engine output), `status`, `priority`.

---

## Local State Added to Panel

```ts
const [isEditing, setIsEditing]     = useState(false);
const [draftTarget, setDraftTarget] = useState(0);
const [draftMonths, setDraftMonths] = useState(0);
```

No `draftDate` state — the date picker value is derived from `draftMonths` on every render and converts back to months on change.

```ts
// months → YYYY-MM string for <input type="month">
function monthsToYYYYMM(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// YYYY-MM string → months from today (min 1)
function yyyymmToMonths(value: string): number {
  const [y, m] = value.split("-").map(Number);
  const target = new Date(y, m - 1, 1);
  const now = new Date();
  const diff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(1, diff);
}
```

---

## Edit Mode Entry

```ts
const handleEditClick = () => {
  setDraftTarget(goal.targetAmount);
  setDraftMonths(goal.timelineMonths);
  setIsEditing(true);
};
```

---

## Live Monthly Recompute

Computed on every render from draft values — no state, no effect:

```ts
const draftMonthly = Math.round(
  Math.max(0, draftTarget - (goal.currentAmount || 0)) / Math.max(1, draftMonths)
);
```

Displayed as "New Monthly Needed" in an accent-tinted tile while editing.

---

## Validation Rules

| Field | Rule | Error message |
|---|---|---|
| `draftTarget` | > 0 | "Enter a target amount" |
| `draftTarget` | > `goal.currentAmount` | "Target must exceed amount already saved (₹X)" |
| `draftMonths` | ≥ 1 | "At least 1 month required" |
| Date picker | min = next calendar month | Blocked by `min` attribute — no extra error needed |

- "Update Goal" button `disabled` while any rule violated
- Error labels rendered as small red text beneath the offending input
- Only one error shown at a time (target errors take priority)

---

## Store Dispatch

```ts
const updateGoal = useFinPathStore((s) => s.updateGoal);

const handleUpdate = () => {
  if (!isValid) return;
  updateGoal(goal.id, {
    targetAmount: draftTarget,
    timelineMonths: draftMonths,
  });
  setIsEditing(false);
};
```

`updateGoal` internally calls `computeHealthScore()` + `generatePlan()` — reactive propagation to all screens is automatic.

---

## Cancel

```ts
const handleCancel = () => {
  setIsEditing(false);
  // draftTarget / draftMonths left stale — re-initialized on next edit entry
};
```

---

## Panel Layout Changes

### View State (existing, unchanged except one addition)

The panel body stays identical. One new button added after the Priority section and before the lifecycle action buttons:

```
[ ✏️ Edit Goal ]   ← new ghost button, full width
```

### Edit State (replaces body content when isEditing = true)

```
┌─────────────────────────────────┐
│ [icon] Dream Home          [×]  │  ← header unchanged
├─────────────────────────────────┤
│  [ring]  Target Amount (₹)      │
│          [________5000000_____] │  ← number input, accent border
│          ████████░░░░░░░░ 38%   │  ← progress bar unchanged
├─────────────────────────────────┤
│  Timeline                       │
│  [Months___60__] [Date 2030-05] │  ← linked, side by side
│  ↔ changing either updates other│
├─────────────────────────────────┤
│  ┌─ New Monthly Needed ────────┐ │
│  │  ₹51,667/mo  (updates live) │ │  ← accent-tinted tile
│  └─────────────────────────────┘ │
│  [error label if invalid]        │
├─────────────────────────────────┤
│  [ Update Goal ]                 │  ← disabled when invalid
│  [ Cancel      ]                 │
├─────────────────────────────────┤
│  [ 🗑 Delete goal ]              │  ← footer always visible
└─────────────────────────────────┘
```

**Note:** Priority buttons, status badge, "Complete for Month", and "Complete Goal" are hidden while `isEditing = true`. They return when the user cancels or saves.

**Ring percentage** stays based on `goal.currentAmount / goal.targetAmount` (actual saved progress) while editing — it does not preview the draft target. This avoids confusing the user into thinking progress has changed before they commit.

---

## Scope Boundaries

**In scope:**
- Edit target amount and timeline months in `JourneyGoalDetailPanel`
- Linked date ↔ months inputs
- Live monthly recompute preview
- Validation with disabled Update button
- Dispatch via existing `updateGoal`

**Out of scope:**
- Editing goal name, icon, category, or color
- Editing `currentAmount` (lumpsum path handled separately)
- Editing priority (already handled by Priority buttons in view mode)
- Any changes to other screens (propagation is automatic)
- New store actions or new files

---

## Files Modified

| File | Change |
|---|---|
| `frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx` | Add `isEditing` state + edit form section + helper functions |
