# Journey Goal Action Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two stacked action buttons ("Complete for the Month" primary, "Complete Goal" secondary) above the existing footer in `JourneyGoalDetailPanel`, wired to `updateGoal` and `completeGoal` store actions respectively.

**Architecture:** New `onCompleteMonth` prop threads from `Journey.tsx` (where `updateGoal` is selected from store) down into `JourneyGoalDetailPanel`. A new `flex-col` section is inserted between the scrollable body and the existing footer. The primary button disables when `goal.checkedThisMonth === true`; both buttons hide when `goal.status === 'complete'`.

**Tech Stack:** React 18 + TypeScript strict, Zustand v5, Lucide React icons, CSS utility classes from `theme.css` (`.btn-complete-goal`, `.btn-ghost-gradient`, `.button-press`)

---

## Files

| Action | Path | Responsibility |
|---|---|---|
| Modify | `frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx` | Add prop, import icon, insert button section |
| Modify | `frontend/src/app/screens/Journey.tsx` | Add store selector, define handler, pass prop |

---

### Task 1: Update JourneyGoalDetailPanel — props and icon import

**Files:**
- Modify: `frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx:2` (icon import)
- Modify: `frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx:85-92` (interface)
- Modify: `frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx:94-101` (function params)

- [ ] **Step 1: Add Trophy to icon import (line 2)**

Replace:
```tsx
import { X, CheckCircle, Trash2 } from "lucide-react";
```
With:
```tsx
import { X, CheckCircle, Trash2, Trophy } from "lucide-react";
```

- [ ] **Step 2: Add onCompleteMonth to the props interface (lines 85-92)**

Replace:
```ts
interface JourneyGoalDetailPanelProps {
  goal: Goal | null;
  onClose: () => void;
  onComplete: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onPriorityChange: (goalId: string, newPriority: number) => void;
  activeGoalsCount: number;
}
```
With:
```ts
interface JourneyGoalDetailPanelProps {
  goal: Goal | null;
  onClose: () => void;
  onComplete: (goalId: string) => void;
  onCompleteMonth: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onPriorityChange: (goalId: string, newPriority: number) => void;
  activeGoalsCount: number;
}
```

- [ ] **Step 3: Destructure onCompleteMonth in function signature (lines 94-101)**

Replace:
```ts
export default function JourneyGoalDetailPanel({
  goal,
  onClose,
  onComplete,
  onDelete,
  onPriorityChange,
  activeGoalsCount,
}: JourneyGoalDetailPanelProps) {
```
With:
```ts
export default function JourneyGoalDetailPanel({
  goal,
  onClose,
  onComplete,
  onCompleteMonth,
  onDelete,
  onPriorityChange,
  activeGoalsCount,
}: JourneyGoalDetailPanelProps) {
```

- [ ] **Step 4: Run type check to confirm no errors yet**

```bash
cd frontend && pnpm build 2>&1 | head -30
```

Expected: TypeScript error about missing `onCompleteMonth` prop at the call site in `Journey.tsx`. This is correct — it confirms the prop is required. The call site gets fixed in Task 2.

---

### Task 2: Insert the new button section in the panel JSX

**Files:**
- Modify: `frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx:364-366` (between body close and footer)

- [ ] **Step 1: Insert new button section between body and footer**

Find this exact block (the closing of the scrollable body div, line 364):
```tsx
        </div>
      </div>

      {/* Footer actions */}
```

Replace with:
```tsx
        </div>
      </div>

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
          <button
            onClick={() => !goal.checkedThisMonth && onCompleteMonth(goal.id)}
            disabled={goal.checkedThisMonth === true}
            className="w-full flex items-center justify-center gap-1.5 btn-complete-goal button-press disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              padding: "11px",
              borderRadius: "var(--radius-base)",
              fontFamily: "var(--font-display)",
            }}
          >
            <CheckCircle size={14} className="icon-wireframe" />
            {goal.checkedThisMonth ? "✓ Done this month" : "Complete for the Month"}
          </button>
          <button
            onClick={() => onComplete(goal.id)}
            className="w-full flex items-center justify-center gap-1.5 btn-ghost-gradient button-press"
            style={{
              padding: "11px",
              borderRadius: "var(--radius-base)",
              fontFamily: "var(--font-display)",
            }}
          >
            <Trophy size={14} className="icon-wireframe" />
            Complete Goal
          </button>
        </div>
      )}

      {/* Footer actions */}
```

---

### Task 3: Wire handler and prop in Journey.tsx

**Files:**
- Modify: `frontend/src/app/screens/Journey.tsx:117` (add updateGoal selector)
- Modify: `frontend/src/app/screens/Journey.tsx:136-155` (add handleCompleteMonth after handleCompleteGoal)
- Modify: `frontend/src/app/screens/Journey.tsx:547-554` (pass onCompleteMonth prop)

- [ ] **Step 1: Add updateGoal selector (line 117)**

Find:
```ts
  const income = useFinPathStore((s) => s.income);
```
Add immediately after:
```ts
  const updateGoal = useFinPathStore((s) => s.updateGoal);
```

- [ ] **Step 2: Define handleCompleteMonth after handleCompleteGoal**

Find the closing of `handleCompleteGoal` — look for its last line (the `confetti({...})` call block ends around line 156). After the closing `};` of that function, add:

```ts
  const handleCompleteMonth = (goalId: string) => {
    updateGoal(goalId, { checkedThisMonth: true });
  };
```

- [ ] **Step 3: Pass onCompleteMonth at the JourneyGoalDetailPanel call site (lines 547-554)**

Find:
```tsx
        <JourneyGoalDetailPanel
          goal={goals.selectedGoal}
          onClose={() => goals.setSelectedGoalId(null)}
          onComplete={handleCompleteGoal}
          onDelete={goals.handleDelete}
          onPriorityChange={goals.handlePriorityChange}
          activeGoalsCount={goals.activeGoals.length}
        />
```
Replace with:
```tsx
        <JourneyGoalDetailPanel
          goal={goals.selectedGoal}
          onClose={() => goals.setSelectedGoalId(null)}
          onComplete={handleCompleteGoal}
          onCompleteMonth={handleCompleteMonth}
          onDelete={goals.handleDelete}
          onPriorityChange={goals.handlePriorityChange}
          activeGoalsCount={goals.activeGoals.length}
        />
```

---

### Task 4: Verify and commit

**Files:** none (verification only)

- [ ] **Step 1: Run TypeScript build**

```bash
cd frontend && pnpm build
```

Expected: `✓ built in Xs` with 0 errors, 0 warnings about the new prop.

- [ ] **Step 2: Run vitest suite**

```bash
cd frontend && pnpm test
```

Expected: 61 tests pass (no engine changes, so no failures expected).

- [ ] **Step 3: Start dev server and verify visually**

```bash
cd frontend && pnpm dev
```

Open `http://localhost:5173`, navigate to Journey screen, click any active goal node to open the detail panel. Verify:
1. "Complete for the Month" (accent-filled primary) appears above the footer divider
2. "Complete Goal" (outline/ghost secondary) appears below it, stacked
3. Both buttons are below the status badge and above the existing "Mark complete" + delete row
4. Click "Complete for the Month" → button disables, label changes to "✓ Done this month"
5. Reload (or use Zustand devtools to reset `checkedThisMonth`) → button re-enables
6. Click "Complete Goal" → goal transitions to complete, new section + existing "Mark complete" all hide

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/screens/journey/JourneyGoalDetailPanel.tsx frontend/src/app/screens/Journey.tsx
git commit -m "feat(journey): add Complete for Month and Complete Goal actions to goal detail panel"
```
