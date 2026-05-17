# Journey Screen — Real Animations Design Spec

**Date:** 2026-05-17  
**Status:** Approved — ready for implementation plan

---

## Context

The Journey canvas is the hero feature of FinPath — a draggable node graph showing income flowing into goals. Currently it is static: nodes have spring entrance but no ambient life, edges are inert SVG lines, and the only feedback on completion is full-screen confetti fired from `y: 0.6`. This spec adds six targeted animations that make the canvas feel alive while respecting the glassmorphism design language.

---

## Decisions

| Animation | Decision |
|-----------|----------|
| Float | Subtle stagger per node index |
| Bounce | Spring on click via motion/react |
| Ripple | From click point, contained within node card |
| Traveling dot | Priority-weighted: lime P1 fast+large, amber P2 medium, blue P3 slow+small; subtle opacity |
| Completion burst | Radial ring behind node cards (z-index below nodes); targeted confetti from node viewport position |

---

## Critical Files

- `frontend/src/app/screens/Journey.tsx` — traveling dots + completion ring layer
- `frontend/src/app/screens/journey/JourneyGoalNode.tsx` — float, bounce, ripple
- `frontend/src/app/screens/journey/useJourneyGoals.ts` — completion trigger, targeted confetti
- `frontend/src/styles/theme.css` — new `@keyframes node-float` if needed

---

## 1. Float Animation

**Where:** `JourneyGoalNode.tsx`

Wrap the inner bento-card `<div>` in a second `motion.div` dedicated to floating. The outer `motion.div` keeps existing enter/exit spring variants. The inner handles continuous Y oscillation.

```tsx
// outer: handles position, enter/exit, hover, drag
<motion.div variants={nodeVariants} initial="hidden" animate="visible" exit="exit" ...>
  // inner: float only, starts after mount
  <motion.div
    animate={{ y: [0, -5, 0] }}
    transition={{
      duration: 3.5 + index * 0.4,   // 3.5s for index 0, longer for each
      repeat: Infinity,
      ease: "easeInOut",
      delay: index * 0.35,            // stagger offset per node
    }}
  >
    <div className="p-4 rounded-2xl bento-card" ...>
```

**Props change:** Add `index: number` to `JourneyGoalNodeProps`. Pass `i` from `Journey.tsx` map.

**Amplitude:** 5px up only (not ±10). Avoids layout shift. Does not affect dragging.

**Dragging:** Pause float during drag — conditionally set `animate={isDragging ? { y: 0 } : { y: [0, -5, 0] }}`.

---

## 2. Spring Bounce on Click

**Where:** `JourneyGoalNode.tsx`

Use `useAnimation()` from `motion/react` on the inner float `motion.div`. On click (not drag), fire a keyframe sequence:

```tsx
const bounceControls = useAnimation();

const handleClick = () => {
  if (isDragging) return;
  bounceControls.start({
    scale: [1, 0.92, 1.07, 1],
    transition: { duration: 0.38, ease: [0.34, 1.56, 0.64, 1] }
  });
  onClick();
};
```

Apply `animate={bounceControls}` to the inner `motion.div`, merged with the float animation via `useAnimationControls` or a combined `animate` object.

**Alternative (simpler):** Use `whileTap={{ scale: 0.93 }}` on the outer motion.div, letting spring return naturally (`type: "spring", stiffness: 300, damping: 20`). This is the fallback if merging two animate targets proves complex.

---

## 3. Ripple Effect on Click

**Where:** `JourneyGoalNode.tsx`

State: `const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null)`

On `onMouseDown`, record click position relative to node:
```tsx
const rect = e.currentTarget.getBoundingClientRect();
setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, key: Date.now() });
```

Render inside the bento-card `<div>` (which already has `overflow: hidden` from `.bento-card`):
```tsx
<AnimatePresence>
  {ripple && (
    <motion.div
      key={ripple.key}
      className="absolute rounded-full pointer-events-none"
      style={{
        left: ripple.x,
        top: ripple.y,
        translateX: '-50%',
        translateY: '-50%',
        background: `radial-gradient(circle, ${statusColor}30, transparent 70%)`,
      }}
      initial={{ width: 0, height: 0, opacity: 0.7 }}
      animate={{ width: 180, height: 180, opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onAnimationComplete={() => setRipple(null)}
    />
  )}
</AnimatePresence>
```

Color uses `statusColor` (accent/amber/lime) at 30% opacity — matches node border color. Contained by `overflow: hidden`.

---

## 4. Traveling Dots

**Where:** `Journey.tsx` — inside the SVG `<g transform="scale(zoom)">`, alongside existing `<line>` elements.

### SVG filter (add to `<defs>`):
```svg
<filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="1.2" result="blur"/>
  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
```

### Per-goal dot (after each `<line>`):
```tsx
{goal.status !== 'complete' && (() => {
  const dur = goal.priority === 1 ? '1.8s' : goal.priority === 2 ? '2.8s' : '4.2s';
  const r   = goal.priority === 1 ? 3     : goal.priority === 2 ? 2.5   : 2;
  const dotColor = getStatusColor(goal.status); // 'var(--tertiary-accent)' | 'var(--amber)' | 'var(--accent)'
  const path = `M ${x1},${y1} L ${x2},${y2}`;
  return (
    <circle key={`dot-${goal.id}`} r={r} fill={dotColor} opacity="0.55" filter="url(#dot-glow)">
      <animateMotion dur={dur} repeatCount="indefinite" path={path} />
    </circle>
  );
})()}
```

`opacity: 0.55` keeps it subtle — visible but not distracting.  
`getStatusColor` is already defined in `JourneyGoalNode.tsx` — extract to a shared util or duplicate inline.

**Complete goals:** No dot. The solid line already signals completion.

---

## 5. Completion Ring (Behind Cards)

### Layer structure in `Journey.tsx`

Add a new layer between the SVG background and the nodes `<div>`. z-index order:
1. SVG dot-grid (background, z-index implicit)
2. **Completion rings div** — `zIndex: 1, position: absolute, inset: 0, pointerEvents: none`
3. Nodes `<div>` — `position: absolute, zIndex: 2`

### Completion ring state

In `useJourneyGoals.ts`, track completing goal IDs:
```ts
const [completingIds, setCompletingIds] = useState<string[]>([]);

// in handleComplete, before existing confetti call:
setCompletingIds(prev => [...prev, goal.id]);
setTimeout(() => setCompletingIds(prev => prev.filter(id => id !== goal.id)), 900);
```

Expose `completingIds` from the hook.

### Ring render in `Journey.tsx`

```tsx
<div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
  <div style={{ transform: `scale(${canvas.zoom})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
    <AnimatePresence>
      {goals.completingIds.map((id, i) => {
        const idx = goals.sortedGoals.findIndex(g => g.id === id);
        const pos = canvas.getNodePos(id, idx);
        const cx = pos.x + 80 + canvas.panOffset.x;  // node center X
        const cy = pos.y + 80 + canvas.panOffset.y;  // node center Y
        return (
          <motion.div
            key={id}
            className="absolute rounded-full"
            style={{
              left: cx, top: cy,
              translateX: '-50%', translateY: '-50%',
              border: '1.5px solid var(--accent)',
              boxShadow: '0 0 16px var(--accent-glow)',
              background: 'transparent',
            }}
            initial={{ width: 0, height: 0, opacity: 0.9 }}
            animate={{ width: 240, height: 240, opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}
    </AnimatePresence>
  </div>
</div>
```

Ring expands to 240px — large enough to feel dramatic, fades before reaching neighbor nodes.

---

## 6. Targeted Confetti

**Where:** `useJourneyGoals.ts` — replace existing `confetti({ ... })` call.

Pass `canvasRef` from `useJourneyCanvas` into `useJourneyGoals`, or accept a `getNodeEl` callback.

Simpler: accept a `getNodeViewportRect: (goalId: string) => DOMRect | null` callback from `Journey.tsx`.

In `Journey.tsx`:
```tsx
const getNodeViewportRect = (goalId: string) => {
  // Node is rendered as motion.div absolute at (pos.x + panOffset.x) * zoom
  // Easier: just query the DOM
  const el = canvasRef.current?.querySelector(`[data-goal-id="${goalId}"]`);
  return el?.getBoundingClientRect() ?? null;
};
```

Add `data-goal-id={goal.id}` to the outer `motion.div` in `JourneyGoalNode.tsx`.

In `useJourneyGoals.ts`:
```ts
const rect = getNodeViewportRect?.(goal.id);
const origin = rect
  ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight }
  : { x: 0.5, y: 0.4 };

confetti({
  particleCount: 55,
  spread: 50,
  startVelocity: 22,
  ticks: 80,
  origin,
  colors: ['#7b8cff', '#b0ff09', '#c77dff', '#f59e0b'],
  scalar: 0.85,
  gravity: 1.2,
});
```

`scalar: 0.85` — smaller particles. `gravity: 1.2` — falls faster, stays local. `ticks: 80` — shorter lifetime.

---

## Verification

1. `pnpm build` — 0 TypeScript errors
2. `pnpm test` — 61 tests pass
3. Manual: open Journey, observe nodes floating with staggered offset
4. Manual: click a node — see ripple + bounce
5. Manual: observe dots traveling edges (P1 lime fast, P2 amber medium, P3 blue slow)
6. Manual: mark goal complete — ring expands behind cards, confetti bursts from node position
7. Manual: drag a node — float pauses, resumes on release
8. Manual: zoom/pan — dots track correctly (they're in the scaled SVG `<g>`)
