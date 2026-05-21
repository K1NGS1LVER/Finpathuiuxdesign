# Journey Goal Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Goal Value and Timeline editable in the JourneyGoalDetailPanel slide-over, with live monthly recompute and dispatch to the global Zustand store.

**Architecture:** Add `isEditing` toggle state to `JourneyGoalDetailPanel`. In edit mode the body swaps to a form with a target-amount number input and linked months + date inputs. "Update Goal" dispatches `updateGoal(id, { targetAmount, timelineMonths })` which already triggers full plan + health-score recomputation — all dependent screens update automatically.

**Tech Stack:** React 18 + TypeScript strict, Zustand v5, CSS variables from `theme.css`, Lucide React icons, `pnpm build` as verification gate

---

## File Modified

| File | What changes |
|---|---|
| `frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx` | Add helper fns, store selector, edit state, edit form, validation, dispatch |

---

### Task 1: Add helper functions and store selector

**Files:**
- Modify: `frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx:1-5`

- [ ] **Step 1: Add store import and Partial type import**

Replace the existing imports block at the top of the file:

```tsx
import { useState, useEffect, useRef } from "react";
import { X, CheckCircle, Trash2, Trophy, Pencil } from "lucide-react";
import type { Goal } from '@/lib/types';
import { getGoalIcon } from "./icon-map";
import { useFinPathStore } from "@/lib/store";
```

- [ ] **Step 2: Add the two date↔months helper functions after the imports block (before `GoalRing`)**

```tsx
function monthsToYYYYMM(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function yyyymmToMonths(value: string): number {
  const [y, m] = value.split("-").map(Number);
  const target = new Date(y, (m ?? 1) - 1, 1);
  const now = new Date();
  const diff =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  return Math.max(1, diff);
}
```

- [ ] **Step 3: Verify build passes**

```bash
cd frontend && pnpm build
```

Expected: 0 errors, 0 type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx
git commit -m "feat(journey): add date<>months helpers and store selector to GoalDetailPanel"
```

---

### Task 2: Add edit state and "Edit Goal" button in view mode

**Files:**
- Modify: `frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx`

- [ ] **Step 1: Add edit state variables and store selector inside `JourneyGoalDetailPanel`, after the existing `confirmTimer` and `confirmCompleteTimer` refs**

Find this block inside the function body (around line 104):

```tsx
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmCompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
```

Replace with:

```tsx
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmCompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftTarget, setDraftTarget] = useState(0);
  const [draftMonths, setDraftMonths] = useState(0);

  const updateGoal = useFinPathStore((s) => s.updateGoal);
```

- [ ] **Step 2: Add `handleEditClick` after the existing `handleCompleteClick` function**

Find the end of `handleCompleteClick` (around line 184):

```tsx
  const handleCompleteClick = () => {
    if (!confirmComplete) {
      setConfirmComplete(true);
      confirmCompleteTimer.current = setTimeout(() => setConfirmComplete(false), 3000);
      return;
    }
    if (confirmCompleteTimer.current) clearTimeout(confirmCompleteTimer.current);
    setConfirmComplete(false);
    onComplete(goal.id);
  };
```

Add immediately after:

```tsx
  const handleEditClick = () => {
    setDraftTarget(goal.targetAmount);
    setDraftMonths(goal.timelineMonths || 12);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };
```

- [ ] **Step 3: Add "Edit Goal" button in the view-mode body, after the Priority block**

Find the Priority block closing tag in the JSX body (around line 347):

```tsx
        {/* Priority buttons (active goals only) */}
        {!isComplete && (
          <div style={{ marginBottom: 20 }}>
            ...
          </div>
        )}

        {/* Status badge */}
```

Add a new block between Priority and Status badge:

```tsx
        {/* Edit goal — view mode only */}
        {!isComplete && !isEditing && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={handleEditClick}
              className="w-full flex items-center justify-center gap-1.5"
              style={{
                padding: "9px",
                borderRadius: "var(--radius-base)",
                background: "var(--surface-tint)",
                border: "1px solid var(--border)",
                color: "var(--accent)",
                fontWeight: "var(--font-weight-semibold)",
                fontSize: "var(--text-xs)",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                transition: "all 200ms ease",
              }}
            >
              <Pencil size={12} className="icon-wireframe" />
              Edit Goal
            </button>
          </div>
        )}

        {/* Status badge */}
```

- [ ] **Step 4: Verify build passes**

```bash
cd frontend && pnpm build
```

Expected: 0 errors. Start the dev server (`pnpm dev`) and open the Journey page. Click a goal node — the detail panel should show "Edit Goal" button. Clicking it should do nothing visible yet (state updates but edit form doesn't render yet).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx
git commit -m "feat(journey): add edit state and Edit Goal button to GoalDetailPanel view mode"
```

---

### Task 3: Render the edit form body

**Files:**
- Modify: `frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx`

- [ ] **Step 1: Compute validation and live monthly values above the return statement**

Find this block (just before the `return` statement, after the `stats` array):

```tsx
  const handleDeleteClick = () => {
```

Add these computed values immediately before `handleDeleteClick`:

```tsx
  const draftMonthly = Math.round(
    Math.max(0, draftTarget - (goal.currentAmount || 0)) / Math.max(1, draftMonths)
  );

  const draftValidationError: string | null =
    draftTarget <= 0
      ? "Enter a target amount"
      : draftTarget <= (goal.currentAmount || 0)
      ? `Target must exceed amount already saved (₹${(goal.currentAmount || 0).toLocaleString("en-IN")})`
      : draftMonths < 1
      ? "At least 1 month required"
      : null;

  const isDraftValid = draftValidationError === null;
```

- [ ] **Step 2: Wrap the existing body content so it only renders when NOT editing**

Find the opening of the body `<div>` (around line 232):

```tsx
      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
```

Add `{!isEditing && (` immediately after the opening `<div>` tag and close it with `)}` just before the closing `</div>` of the body. The result should look like:

```tsx
      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {!isEditing && (
          <>
            {/* Ring + target amount — existing code */}
            ...
            {/* Stats grid — existing code */}
            ...
            {/* Priority buttons — existing code with Edit Goal button added in Task 2 */}
            ...
            {/* Status badge — existing code */}
            ...
          </>
        )}
```

Close the `<>` fragment and the body `</div>` after the Status badge block.

- [ ] **Step 3: Add the edit form body after the `{!isEditing && (...)}` block, still inside the body `<div>`**

```tsx
        {isEditing && (
          <>
            {/* Ring + Target Amount input */}
            <div className="flex items-center gap-4" style={{ marginBottom: 20 }}>
              <GoalRing pct={pct} color={statusColor} size={80} />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "var(--text-2xs)",
                    color: "var(--tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  Target Amount (₹)
                </p>
                <input
                  type="number"
                  min={1}
                  value={draftTarget}
                  onChange={(e) => setDraftTarget(Math.max(0, Number(e.target.value)))}
                  className="slashed-zero tabular-nums w-full"
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--card-foreground)",
                    background: "var(--surface-tint)",
                    border: "1px solid var(--accent)",
                    borderRadius: "var(--radius-sm)",
                    padding: "6px 10px",
                    outline: "none",
                    letterSpacing: "-0.02em",
                  }}
                />
              </div>
            </div>

            {/* Timeline — months + date picker, linked */}
            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontSize: "var(--text-2xs)",
                  color: "var(--tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                Timeline
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <p style={{ fontSize: "var(--text-2xs)", color: "var(--tertiary)", marginBottom: 4 }}>
                    Months
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={draftMonths}
                    onChange={(e) => setDraftMonths(Math.max(1, Number(e.target.value)))}
                    className="w-full tabular-nums"
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-weight-bold)",
                      color: "var(--card-foreground)",
                      background: "var(--surface-tint)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "7px 10px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <p style={{ fontSize: "var(--text-2xs)", color: "var(--tertiary)", marginBottom: 4 }}>
                    Target Date
                  </p>
                  <input
                    type="month"
                    min={monthsToYYYYMM(1)}
                    value={monthsToYYYYMM(draftMonths)}
                    onChange={(e) => setDraftMonths(yyyymmToMonths(e.target.value))}
                    className="w-full"
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--card-foreground)",
                      background: "var(--surface-tint)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "7px 8px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <p style={{ fontSize: "var(--text-2xs)", color: "var(--tertiary)", marginTop: 6, fontStyle: "italic" }}>
                ↔ changing either updates the other
              </p>
            </div>

            {/* Live monthly recompute */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-base)",
                  background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                }}
              >
                <p
                  style={{
                    fontSize: "var(--text-2xs)",
                    color: "var(--accent-text)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}
                >
                  New Monthly Needed
                </p>
                <p
                  className="slashed-zero tabular-nums"
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--accent)",
                  }}
                >
                  ₹{draftMonthly.toLocaleString("en-IN")}/mo
                </p>
                <p style={{ fontSize: "var(--text-2xs)", color: "var(--tertiary)", marginTop: 2 }}>
                  updates as you type
                </p>
              </div>
            </div>

            {/* Validation error */}
            {draftValidationError && (
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--red)",
                  marginBottom: 12,
                }}
              >
                {draftValidationError}
              </p>
            )}
          </>
        )}
```

- [ ] **Step 4: Verify build passes**

```bash
cd frontend && pnpm build
```

Expected: 0 errors. In the browser, click "Edit Goal" — the panel body should switch to show the target input, timeline inputs, and monthly tile. The ring stays visible. Typing in "Months" should update "Target Date" and vice versa.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx
git commit -m "feat(journey): render edit form body with target/timeline inputs and live monthly tile"
```

---

### Task 4: Wire Update Goal dispatch, Cancel, and hide lifecycle buttons

**Files:**
- Modify: `frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx`

- [ ] **Step 1: Add `handleUpdate` function after `handleCancel`**

Find `handleCancel` added in Task 2 and add immediately after:

```tsx
  const handleUpdate = () => {
    if (!isDraftValid) return;
    updateGoal(goal.id, {
      targetAmount: draftTarget,
      timelineMonths: draftMonths,
    });
    setIsEditing(false);
  };
```

- [ ] **Step 2: Add Update Goal + Cancel buttons — rendered only when `isEditing`**

Find the existing lifecycle actions block (around line 383):

```tsx
      {/* New lifecycle actions */}
      {!isComplete && (
        <div
          className="flex-shrink-0"
          style={{
            padding: "12px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button ... > {/* Complete for Month */} </button>
          <button ... > {/* Complete Goal */} </button>
        </div>
      )}
```

Replace the entire lifecycle actions block with:

```tsx
      {/* Edit mode: Update / Cancel */}
      {isEditing && (
        <div
          className="flex-shrink-0"
          style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}
        >
          <button
            onClick={handleUpdate}
            disabled={!isDraftValid}
            className="w-full flex items-center justify-center gap-1.5 button-press"
            style={{
              padding: "11px",
              borderRadius: "var(--radius-base)",
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-semibold)",
              cursor: isDraftValid ? "pointer" : "not-allowed",
              background: isDraftValid ? "var(--accent)" : "var(--surface-tint)",
              border: isDraftValid ? "none" : "1px solid var(--border)",
              color: isDraftValid ? "#fff" : "var(--tertiary)",
              transition: "all 200ms ease",
            }}
          >
            Update Goal
          </button>
          <button
            onClick={handleCancel}
            className="w-full flex items-center justify-center gap-1.5"
            style={{
              padding: "9px",
              borderRadius: "var(--radius-base)",
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--tertiary)",
              fontWeight: "var(--font-weight-medium)",
              fontSize: "var(--text-xs)",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              transition: "all 200ms ease",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* View mode: lifecycle actions */}
      {!isComplete && !isEditing && (
        <div
          className="flex-shrink-0"
          style={{
            padding: "12px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            onClick={() => !goal.checkedThisMonth && onCompleteMonth(goal.id)}
            disabled={goal.checkedThisMonth === true}
            aria-label={goal.checkedThisMonth ? "Goal already marked complete this month" : "Mark this month's contribution as complete"}
            className="w-full flex items-center justify-center gap-1.5 btn-complete-goal button-press"
            style={{
              padding: "11px",
              borderRadius: "var(--radius-base)",
              fontFamily: "var(--font-display)",
            }}
          >
            <CheckCircle size={16} className="icon-wireframe" />
            {goal.checkedThisMonth ? "✓ Done this month" : "Complete for the Month"}
          </button>
          <button
            onClick={handleCompleteClick}
            className="w-full flex items-center justify-center gap-1.5 button-press"
            style={{
              padding: "11px",
              borderRadius: "var(--radius-base)",
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-semibold)",
              cursor: "pointer",
              transition: "all 200ms ease",
              background: confirmComplete ? "var(--green-subtle)" : "transparent",
              border: `1px solid ${confirmComplete ? "color-mix(in srgb, var(--green) 33%, transparent)" : "color-mix(in srgb, var(--accent) 40%, transparent)"}`,
              color: confirmComplete ? "var(--green-text)" : "var(--accent)",
            }}
          >
            <Trophy size={16} className="icon-wireframe" />
            {confirmComplete ? "Confirm complete?" : "Complete Goal"}
          </button>
        </div>
      )}
```

- [ ] **Step 3: Verify build passes**

```bash
cd frontend && pnpm build
```

Expected: 0 errors.

- [ ] **Step 4: Manual browser test — golden path**

Start dev server: `cd frontend && pnpm dev`

1. Go to `/journey`, click a goal node → Detail panel opens
2. Click **Edit Goal** → form appears with current values pre-filled
3. Change Target Amount — verify Monthly tile updates instantly
4. Change Months — verify Target Date updates; change Target Date — verify Months updates
5. Set Target to a value below Current Amount → "Update Goal" button goes grey, error label appears
6. Fix values → button re-enables
7. Click **Update Goal** → panel returns to view mode, stats grid shows new values
8. Navigate to `/dashboard` — metrics reflect new plan (no refresh needed)
9. Go back to `/journey`, click same goal → shows updated target and timeline

- [ ] **Step 5: Manual browser test — cancel path**

1. Click **Edit Goal**, change values
2. Click **Cancel** → panel returns to view mode with original values unchanged

- [ ] **Step 6: Run full test suite**

```bash
cd frontend && pnpm test
```

Expected: all 61 tests pass (engine tests — no component tests exist for this panel).

```bash
cd frontend && pnpm build
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx
git commit -m "feat(journey): wire Update Goal dispatch and Cancel, hide lifecycle buttons in edit mode"
```
