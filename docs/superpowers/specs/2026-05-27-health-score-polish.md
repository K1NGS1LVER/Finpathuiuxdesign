# Health Score Visual Polish — Design Spec

**Date:** 2026-05-27  
**Status:** Implemented

## Problem

Health score (0–100, four sub-scores of 0–25) was rendered as a static ring + flat bar list on Dashboard and a numeric grid + plain text list on Progress. It didn't read as a feature — it read as debug output.

## Goals

- Make the ring the visual hero, not a detail
- Animate sub-score bars on mount
- Show projected score impact next to each action
- Show score delta since last plan generation

## Design Decisions

### Scope
Both screens — Dashboard (compact) and Progress (full) — via a shared `<HealthScoreWidget variant="compact"|"full">` component.

### Architecture
Single shared component: `frontend/src/app/components/HealthScoreWidget.tsx`. Both screens import it. No engine type changes; no Python parity impact.

### Visual language
- Ring: large dominant element (140 px compact, 180 px full), existing accent → secondary-accent gradient + `drop-shadow(var(--accent-glow))`
- Sub-score bars: 3 px thin rows (`var(--accent)` at 0.7 opacity) — purely indicative, not traffic-light colored
- Score numbers: `var(--green-muted)` ≥80 %, `var(--accent-text)` ≥48 %, `var(--amber-text)` <48 %
- Action cards: `penny-card` + `penny-insight-blob` wrapper; items use `surface-hover` bg + `border` (matching existing Penny action list)
- Impact text: `var(--green-muted)`
- Delta pill: semantic green/red with opacity background

### Green token
Added `--green-muted` (#3a7d5c light / #7ac99a dark) — desaturated sage green used for score labels and impact numbers. More restrained than `--green-text`.

### Action impact numbers
New `getActionCards(score: HealthScore)` function in `health-score.ts`. Replicates the same priority order as `generateActions()` to compute `25 - subScore` impact per flagged dimension. Returns `{ text: string; impact: number }[]`. Falls back to two generic growth suggestions when all scores are healthy.

### Delta tracking
Module-level `prevOverall` variable persists across route changes within a session. Local `useState` drives the pill display. Resets to null on hard reload (expected — "since last update" is a session concept).

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/app/components/HealthScoreWidget.tsx` | New — shared widget |
| `frontend/src/lib/health-score.ts` | Added `getActionCards()` export |
| `frontend/src/styles/theme.css` | Added `--green-muted` token (light + dark) |
| `frontend/src/app/screens/Dashboard.tsx` | Replaced health ring column with `<HealthScoreWidget variant="compact" />` |
| `frontend/src/app/screens/Progress.tsx` | Replaced health strip content with `<HealthScoreWidget variant="full" />` |
