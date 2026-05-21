# FinPath — Design Handoff

## Overview
This package contains high-fidelity HTML prototype designs for two major FinPath surfaces:
1. **Landing Page** (`FinPath Landing.html`) — Full marketing landing page redesign
2. **Dashboard Redesign** (`FinPath Dashboard.html`) — Three layout variations for the main dashboard
3. **Logo Mark** (`FinPath Logos v4.html`) — Hybrid logo mark (V1 body + V4 dotted connector)

> **Important:** The HTML files in this bundle are **design references built in plain HTML/React**. They are prototypes showing intended look, feel, and interactions — not production code to copy directly. Your task is to **recreate these designs in the existing React + TypeScript + Tailwind v4 codebase**, using its established patterns, components, and CSS custom property tokens from `theme.css`.

## Fidelity
**High-fidelity.** These are pixel-level mockups with final colors, typography, spacing, and micro-interactions. The developer should recreate the UI as closely as possible using the existing design system tokens.

---

## Design System Reference

All values below map directly to existing CSS custom properties in `frontend/src/styles/theme.css`.

### Color Tokens (Dark Mode)
```
--accent:              #7b8cff   (primary blue — CTAs, active states, rings)
--secondary-accent:    #c77dff   (violet — secondary actions, gradients)
--tertiary-accent:     #b0ff09   (lime — positive moments, goal completions)
--foreground:          #f1f5f9
--secondary:           #94a3b8
--tertiary:            #64748b
--card:                rgba(17,24,39,0.65)
--border:              rgba(255,255,255,0.09)
--surface-tint:        rgba(255,255,255,0.03)
--surface-hover:       rgba(255,255,255,0.07)
--green:               #22c55e   --green-text: #4ade80
--amber:               #f59e0b
--red:                 #ef4444
```

### Color Tokens (Light Mode)
```
--accent:              #495bff
--secondary-accent:    #ac49ff
--foreground:          #050f1c
--secondary:           #1e293b
--tertiary:            #475569
--card:                rgba(255,255,255,0.88)
--border:              rgba(5,15,28,0.09)
--green-text:          #16853d
```

### Typography
```
Font family: 'Lufga' (all weights 400–700, loaded from styles/fonts/)
Display sizes: clamp(44px,5vw,72px) for hero H1
Section headings: clamp(32px,4vw,52px)
Body: 15px (--text-base), line-height 1.5
Labels: 10–11px, uppercase, letter-spacing 0.1em
```

### Gradients
```
Primary CTA button:  linear-gradient(135deg, var(--accent) 40%, var(--secondary-accent) 140%)
Health ring:         linearGradient accent → secondary-accent (SVG)
Background (dark):   linear-gradient(135deg,#0f1422,#161a33,#181533,#131022,#080a14)
Background (light):  linear-gradient(135deg,#eef4f8,#e8edff,#edeaff,#f0ebff,#f6f4ff)
```

### Spacing / Radius
```
Section padding:  100px 48px (desktop) → 64px 20px (mobile ≤768px)
Card radius:      var(--radius-xl) = 32px
Section radius:   var(--radius-lg) = 24px
Pill radius:      var(--radius-full) = 9999px
Card backdrop:    blur(32px)
Card shadow:      var(--shadow-md) = 0 12px 32px rgba(0,0,0,0.08 light / 0.4 dark)
```

---

## Screen 1: Landing Page

### Nav (fixed, sticky)
- **Height:** ~56px
- **Layout:** `justify-content: space-between`, `align-items: center`, `padding: 14px 48px`
- **Background:** `transparent` when at top → `var(--card)` + `backdrop-filter: blur(20px)` + `border-bottom: 1px solid var(--border)` on scroll
- **Left:** Logo mark (28px) + "fin**path**" wordmark (18px semibold, "path" in `var(--accent)`)
- **Center:** "Features" | "How it works" | "Testimonials" anchor links (14px medium, `var(--secondary)` → `var(--foreground)` on hover)
- **Right:**
  - "Start My Journey" pill button — `linear-gradient(135deg, accent 40%, violet 140%)`, `box-shadow: 0 4px 16px var(--accent-glow)`, lifts `translateY(-1px)` on hover
  - Sun/Moon toggle button — 36px circle, `var(--surface-tint)` bg, `var(--border)` border
- **Mobile (≤768px):** Hide center links. Keep logo + CTA + toggle. Reduce padding to `12px 20px`.

### Hero Section
- **Layout:** `min-height: 100vh`, 2-column grid (`1fr 1fr`, gap 60px), `align-items: center`, `padding: 100px 48px 60px`
- **Mobile:** Single column, gap 32px, padding `80px 20px 48px`. All text centered.

**Left column (text):**
- Headline: `clamp(44px,5vw,72px)` bold, `letter-spacing: -0.03em`, `line-height: 1.05`. Last word of headline has `background-clip: text` gradient (accent→violet→lime, `backgroundImage` not `background` shorthand)
- Subtitle: 18px, `var(--secondary)`, `line-height: 1.7`, `max-width: 480px`
- Buttons row (flex, gap 12px, wrap):
  - Primary: `padding: 14px 28px`, pill, gradient, glow shadow, `translateY(-2px)` + stronger glow on hover
  - Secondary: `padding: 14px 28px`, pill, transparent bg, `var(--border)` border, hover: `translateY(-2px)` + border brightens to `var(--accent-glow)`
- Social proof: 5 small avatar circles (22px, `var(--accent-subtle)` bg) stacked with -6px overlap + 5 filled star icons + "Trusted by **12,000+**..." (10px, `var(--secondary)`)

**Right column (health card):**
- Glassmorphism card: `max-width: 560px`, `border-radius: 32px`, `backdrop-filter: blur(32px)`
- Two soft background blobs: accent top-right, violet bottom-left (180×180px, `blur(40px)`)
- Window chrome: red/amber/green 10px dots, `border-bottom: 1px solid var(--border)`
- Body `padding: 36px 40px`:
  - Health ring (152×152px SVG, `viewBox="0 0 160 160"`, r=70, strokeWidth=12): gradient stroke (accent 0%→40%, violet 100%), dashed track, animates `strokeDashoffset` on mount (1500ms cubic-bezier(0.4,0,0.2,1)), score "78" at 36px bold center
  - Stats column (flex, gap 16px): Monthly Income ₹1,20,000 · Surplus ₹34,500 · Savings Rate 28.8% (green) · Emergency Fund 62% with animated progress bar

### Stats Bar
- Background: `var(--surface)`, `border-top/bottom: 1px solid var(--border)`, `padding: 28px 48px`
- 3 items (flex, space-around, wrap): icon + large number (28px bold, accent) + small label
- Numbers count up with `requestAnimationFrame` easing when section enters viewport (IntersectionObserver)
- Items: `₹450Cr tracked` (Coins icon, accent) · `12,000+ active users` (Target icon, violet) · `4.9 rating` (Star filled, amber)

### Features Section (`id="features"`)
- Section padding: `100px 48px`
- Centered heading block: eyebrow 12px uppercase accent + H2 + subtitle
- **Layout:** 2-column grid (`2fr 3fr`, gap 28px), `align-items: stretch`
- **Mobile:** Single column (feature list on top, visual below)

**Left: Feature tabs (flex-col, gap 6px)**
4 clickable buttons, each:
- Inactive: transparent bg, transparent border, `var(--secondary)` text
- Active: `var(--accent-subtle)` bg, `var(--accent-glow)` border, `var(--foreground)` text
- Active state shows description text at 13px below the title
- Transition: `all 200ms ease`

Features: 🎯 Goal-first planning | ⚡ Debt payoff intelligence | ✨ Penny AI | 📈 Scenarios
(Use Lucide icons: `Target`, `Zap`, `Sparkles`, `TrendingUp`)

**Right: Visual panel**
Glassmorphism card with window chrome (traffic lights). Content swaps per active tab:
1. **Goals:** 3 cards (flex row) each with IcoBox (goal icon) + circular progress ring + name + monthly
2. **Debt:** Avalanche card (accent-subtle bg, "Recommended" badge) + Snowball card (surface bg), each showing interest saved + debt-free date
3. **Penny:** 2 chat bubbles (user right/blue, Penny left/surface) + input row
4. **Scenarios:** SVG line chart, 3 lines (current/raise/home) with legend

### How It Works Section (`id="how"`)
- Background: `var(--surface)`, bordered top/bottom
- Centered heading block
- 3-column grid, gap 28px, `position: relative`
- Connector line: absolute, `top: 40`, `left: 16.5%`, `right: 16.5%`, `height: 1`, gradient accent→violet, `opacity: 0.25` — **hidden on mobile**
- Each card: `padding: 28px`, `border-radius: 20px`, glassmorphism card, step number (11px uppercase tertiary), 44×44 gradient icon box (no shadow), H3 (18px bold), description (14px secondary)
- Steps: FileText "Fill in your numbers" · Sparkles "Penny builds your plan" · CalendarCheck "Check in monthly"
- Cards fade-up on scroll with stagger (0.12s delay each)

### Penny AI Section
- 2-column grid (`1fr 1fr`, gap 64px), `align-items: center`
- **Mobile:** Single column, gap 32px, text centered

**Left (text):**
- Eyebrow badge: Sparkles icon + "Meet Penny" (accent, accent-subtle bg, accent-glow border)
- H2 clamp(28px,3.5vw,44px)
- Subtitle 16px secondary
- 3 checklist items with green checkmark circles

**Right (chat window):**
- Glassmorphism card, `border-radius: 24px`
- Header: Penny avatar (36px circle gradient) + name + "● Online" green dot
- Messages area (`min-height: 256px`): plays animated conversation on loop when in viewport
  - User bubbles: right-aligned, accent bg, `border-radius: 18px 18px 4px 18px`
  - Penny bubbles: left-aligned with avatar, surface bg, `border-radius: 4px 18px 18px 18px`
  - Typing indicator: 3 bouncing dots
  - Animation: msgIn keyframe (fadeUp 10px + scale 0.97→1, 350ms)
  - Loop sequence: user msg → typing → Penny reply → user msg → typing → Penny reply → 4s pause → reset
- Input row: fake input pill + send button (gradient circle)

**Chat script:**
- User: "When can I afford the Royal Enfield?"
- Penny: "At ₹8,500/month you'll hit your ₹2L target by July 2027 — 13 months away. A ₹2K top-up gets you there by May 2027. Want me to update the plan?"
- User: "Yes please — update it!"
- Penny: "Done! I've bumped your allocation to ₹10,500/month. You'll save ₹4,200 in total. New goal date: May 2027."

### Testimonials Section (`id="testimonials"`)
- Background: `var(--surface)`, bordered
- 3-column grid, gap 20px
- **Mobile:** Single column
- Each card: `padding: 28px`, `border-radius: 22px`, glassmorphism, overflow hidden
- Soft color blob top-left (100×100px, 0.07 opacity, blur 30px)
- MessageCircle icon (color per card) + quote text (14px secondary, line-height 1.7) + separator + avatar initials circle + name/role
- Cards: AK (accent) / RV (violet) / PS (lime)
- Stagger fade-up on scroll (0.12s delay each)

### CTA Section
- Centered, `padding: 120px 48px`
- Large accent blob background (500×500px, 0.06 opacity, blur 80px)
- Eyebrow + H2 clamp(32px,4vw,56px) + subtitle + big CTA button + "Free forever..." fine print
- Button: `padding: 16px 40px`, gradient, glow shadow, lifts + stronger shadow on hover

### Footer
- `border-top: 1px solid var(--border)`, `padding: 28px 48px`
- Flex space-between: logo+wordmark+tagline left · copyright right
- **Mobile:** Stack to column, `padding: 20px`

---

## Screen 2: Dashboard Redesign (3 Layout Modes)

The dashboard has **3 switchable layout modes** — all use the same sidebar and header.

### Sidebar
- Width: 232px expanded / 76px collapsed (smooth 420ms cubic-bezier)
- Background: `var(--card)`, `backdrop-filter: blur(32px)`, `border-right: 1px solid var(--border)`
- **Logo row:** Logo mark + "fin**path**" wordmark, collapses wordmark on collapse
- **Collapse button:** 24px circle, positioned at right edge (`right: -12px`), floats on border
- **Nav sections:** "Overview" (Dashboard, Goals, Month) / "Money" (Cashflow, Debt, Scenarios) / "Wins" (Progress)
  - Section labels fade out when collapsed
  - Active item: `var(--accent-subtle)` bg + 2px left accent bar + glow
  - Inactive: transparent, `var(--tertiary)` text, hover: `var(--surface-hover)`
- **Bottom:** "Export Plan" button (gradient border, transparent bg) + "Ask Penny" button (full gradient, pill)

### Dashboard Header
- `margin-bottom: 22px`, flex space-between
- Left: eyebrow label + "Dashboard" H1 (34px, -0.03em tracking)
- Right: Period pills (This month / Quarter / YTD) + separator + sun/moon toggle

### Focus Layout (default)
Vertical flex, gap 14px:

1. **Hero card** (full width, gradient tinted bg): Health ring (116px) left + "Good morning, Arjun 👋" + 3 metrics (Income/Surplus/Savings) + 4 sub-score bars (right)
2. **Goals + Next Step** (2-col grid, `1fr 220px`):
   - Goals card: Header + 3 goal rows. Each row: 52px ring + name/sub + expanded details on click (animated)
   - Next Step card (220px): goal emoji + name + amount/mo + "Mark as done" button (full gradient, toggles green on click + confetti)
3. **Penny + Activity** (2-col grid `1fr 1fr`):
   - Penny card: gradient border, accent glow, 3 insight tiles
   - Activity + Sparkline: activity list with colored dots + net worth sparkline with "↑ 14.2%" badge

### Command Layout
1. **4 KPI cards** (4-col grid): Income / Surplus / Net Worth / Health Score — each with large number + trend text, hover lifts
2. **2-col grid** (`3fr 2fr`): Goals tracker (progress bars + sparkline) | Health breakdown (ring + sub-scores) + Penny top pick
3. **Activity bar** (4-col grid): 4 activity items with colored dots

### Journey Layout
1. **Narrative hero**: "May 2026 · Week 3" + "You're on track" + animated progress bar + 3 stats
2. **3-col goal cards**: Each with category icon + 88px ring + name/amount + monthly bar, hover lifts
3. **2-col**: Interactive checklist (click to check/uncheck, green fill + strikethrough) | Penny insights + achievements mini-grid

---

## Logo Mark

### Construction
```
Viewbox: 0 0 80 80
Left arm:  M12 60 L38 30  strokeWidth=11, round caps
Right arm: M38 30 L64 60  strokeWidth=11, round caps
Connector: M51 44 L66 16  strokeWidth=2.5, dashed (2 4), opacity 0.38–0.4
Dot:       cx=68 cy=13 r=6 (solid fill) + r=2.8 inner circle (bg color)
Stroke:    linearGradient accent→violet (x1=0 y1=1 x2=1 y2=0)
Dark inner dot: #0f1422  |  Light inner dot: #ffffff
```

Existing component: `FinPathLogo.tsx` — update this file with the new mark construction above.

---

## Interactions Summary

| Interaction | Duration | Easing |
|---|---|---|
| Health ring mount animation | 1500ms | cubic-bezier(0.4,0,0.2,1) |
| Goal ring mount animation | 1200ms | cubic-bezier(0.22,1,0.36,1) |
| Emergency Fund bar | 1200ms | cubic-bezier(0.22,1,0.36,1) |
| Number count-up | 1600ms | ease-out cubic |
| Sidebar collapse | 420ms | cubic-bezier(0.22,1,0.36,1) |
| Card hover lift | 350ms | cubic-bezier(0.22,1,0.36,1) |
| Section scroll fade-up | 650ms | cubic-bezier(0.22,1,0.36,1) |
| Penny chat message in | 350ms | cubic-bezier(0.22,1,0.36,1) |
| Feature tab switch | 200ms | ease |
| Button hover | 200ms | ease |

**Scroll animations:** Use `IntersectionObserver` (threshold 0.15) to trigger `.appear → .appear.in` class addition (opacity 0→1, translateY 24px→0). Stagger children with `transition-delay`.

---

## Responsive Breakpoints

| Breakpoint | Changes |
|---|---|
| ≤768px | Nav: hide center links. Hero: 1-col, centered text. All sections: padding `64px 20px`. Features/Penny/Testimonials: 1-col. How-it-works: 1-col, hide connector. |

---

## Files in this Package

| File | Description |
|---|---|
| `FinPath Landing.html` | Full landing page prototype (open in browser) |
| `FinPath Dashboard.html` | Dashboard 3-layout prototype with Tweaks panel |
| `FinPath Logos v4.html` | Logo mark system — light/dark/brand backgrounds |
| `README.md` | This document |

**Fonts:** The prototypes reference local `fonts/Lufga-*.ttf` files. The real codebase already loads Lufga from `frontend/src/styles/fonts/`.

---

## Implementation Notes

1. **Re-use existing components**: `Sidebar.tsx`, `Header.tsx`, `PennyPanel.tsx` are already built. The dashboard layouts are **additive redesigns** — focus on updating the grid layout and card hierarchy.
2. **`FinPathLogo.tsx`**: Update with the new SVG path construction from the Logo Mark section above.
3. **`Landing.tsx`**: Full replacement. The existing file has roughly the same section structure — hero / features / testimonials / CTA — with the same Tailwind token system.
4. **Framer Motion**: The existing codebase already uses `motion/react`. Use `variants` + `staggerChildren` for card grid animations (same pattern as existing `Dashboard.tsx`).
5. **Lucide React**: Already installed. All icons referenced above are standard Lucide icons.
6. **`theme.css`**: Do not change. All color values in this handoff map to existing CSS custom properties.
