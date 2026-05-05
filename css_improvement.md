FinPath — Design Language & Hierarchy Improvement Plan

> Primary Goal: Financial goal setting. Every screen, component, and color decision must serve that mission. The user opens FinPath to set, track, and achieve financial goals.

1. UNIFIED BACKGROUND GRADIENT — ALL SCREENS

Problem: Different screens have different or no background gradients. The landing page has a multi-blob, but app screens don't. This undermines the "airy but trustworthy" promise and makes the app feel disjointed.

Solution: One canonical gradient, used on every screen. No exceptions.
1.1 Light Mode — All Screens

body::before {
content: "";
position: fixed; inset: 0; z-index: 0; pointer-events: none;
background:
radial-gradient(ellipse 70% 45% at 15% 20%, rgba(73,91,255,0.12), transparent),
radial-gradient(ellipse 50% 50% at 85% 35%, rgba(172,73,255,0.07), transparent),
radial-gradient(ellipse 50% 40% at 50% 85%, rgba(176,255,9,0.05), transparent),
radial-gradient(ellipse 35% 35% at 65% 18%, rgba(73,91,255,0.04), transparent);
}

Rationale: Three blobs — blue (trustworthy, top-left), violet (secondary, top-right), lime (growth, bottom-center). Opacities kept low (0.04-0.12) so blobs are felt, not seen. No single blob dominates. Fourth smaller blue blob at 65% x 18% adds depth. Same for Dashboard, Journey, Cashflow, Debt, Progress, Tax, Month, Scenarios, Celebrate.
1.2 Dark Mode — All Screens

[data-theme="dark"] body::before {
background:
radial-gradient(ellipse 70% 45% at 15% 20%, rgba(123,140,255,0.06), transparent),
radial-gradient(ellipse 50% 50% at 85% 35%, rgba(199,125,255,0.04), transparent),
radial-gradient(ellipse 50% 40% at 50% 85%, rgba(176,255,9,0.03), transparent),
radial-gradient(ellipse 35% 35% at 65% 18%, rgba(123,140,255,0.02), transparent);
}

Rationale: Half the light mode opacities. Deep navy (#060b1e) already feels premium. Blobs add just enough depth to avoid flatness.
1.3 Exceptions

Never deviate. Only two exceptions: (1) Celebrate screen gets a slightly greener tint (lime blob at 0.10 light / 0.06 dark). (2) Landing page uses a more dramatic version (opacities at 0.20, 0.12, 0.08, 0.06). 2. IMPROVED COLOR PALETTE
2.1 Blue (Primary Accent) — #495bff / #7b8cff

Narrow role to "action" and "active":

    Primary CTA buttons
    Active navigation item
    Health score ring fill
    Selected/active toggle states

Stop using for: Decorative card blobs, metric icons, goal bar fills.
2.2 Violet (Secondary Accent) — #ac49ff / #c77dff

"Growth and ambition":

    Investment goal bars
    Net worth indicators
    Scenario impact badges (positive change)
    Education/upskilling category chips

2.3 Lime (Tertiary Accent) — #b0ff09

THE most important accent — goal progress IS the app's mission. "Progress and insight":

    Goal progress bar fills (DEFAULT)
    Penny insight card borders + bullets
    "On Track" / "Completed" badges
    Celebration moments
    Savings rate indicators

Critical: Goal progress bars should default to LIME, not blue. Lime = "my money is growing." Blue = "I should do something."
2.4 Color Hierarchy Rule

| Color  | Meaning                       | Use                  |
| ------ | ----------------------------- | -------------------- |
| Lime   | Progress, savings, goals      | PRIMARY data color   |
| Blue   | Actions, CTAs, active states  | PRIMARY action color |
| Violet | Growth, investments, ambition | SECONDARY data color |
| Green  | Confirmed positive news       | SEMANTIC             |
| Amber  | Warnings, approaching limits  | SEMANTIC             |
| Red    | Negative, over budget         | SEMANTIC             |

Rule of thumb: What the user HAS achieved → lime. What the user SHOULD do → blue. What COULD grow → violet.
3-13. SCREEN-BY-SCREEN REDESIGN
DASHBOARD — Priority: Goals > Health > Metrics > Everything else

Layout (Top to Bottom):

    Hero row — Income + Surplus. De-emphasize: shrink to 34px, no decorative blobs. User knows their salary.
    — GOALS PROGRESS — PRIMARY zone. Full-width. 12px tall bars. Lime fill default. Hatched overlay. Per-goal colors (see Section 16). "+ ADD GOAL" button inside this card, bottom-center, blue accent.
    — FINANCIAL HEALTH — SECONDARY zone. Health ring (1/3, blue fill) + metrics grid (2/3). 2x2 compact metrics.
    — ACTIONS — TERTIARY zone. Quick Actions + Recent Activity side by side. Small fonts.
    — PENNY'S INSIGHTS — DISTINCT card. Lime-tinted border. Lime blob. Lime bullets.

JOURNEY — Priority: Goal Nodes > Income Node > Lines > Hint

    P1 node: Lime border + 40px glow + 200x120px + bold percentage
    P2 node: Violet border + 26px glow
    P3+ nodes: Standard border + 16px glow
    Income node: Blue pulse animation (1.5s)
    Connection lines: Solid for P1, dashed for P2+, green for completed
    Completed goals: Green accent border + checkmark icon
    Add floating controls: [Zoom to Fit] [Reset View] [-] [+] — bottom-right, glass card

CASHFLOW — Priority: Sankey > Breakdown > Penny

    Sankey diagram: FIRST. Full-width. 520px tall. Let it breathe.
    Stat cards: BELOW Sankey. 2x2 grid. Compact. Lime=goals, green=free, amber=essentials, red=debt.
    Breakdown detail: Collapsible "See Detailed Breakdown" section.
    Penny insight: Below breakdown.

DEBT — Priority: Strategy Comparison > Extra Payment > Debt List > Penny

    Stat cards (4): Shrink to compact strip below title.
    Strategy cards: Winner gets LIME border + glow + star badge. Loser gets muted.
    Extra payment slider: Lime gradient fill. Dynamic "X months saved" label.
    Payoff timeline: BETWEEN strategy cards and debt list.
    Debt table: Before Penny.
    Penny insight: Last.

PROGRESS — Priority: Net Worth Chart > Health Breakdown > Badges

    Net worth chart: FIRST. Full-width. Area chart with accent gradient fill.
    Stat strip: BELOW chart. Compact. No icons — just numbers + labels.
    Health breakdown: Keep position. Make mini-bars 6px. Per-dimension coloring: Income=blue, Debt=amber, Savings=lime, Emergency=violet.
    Badges: BOTTOM. Fun but least important.

TAX — Priority: Regime Comparison > Savings > Deductions

    Winner regime: LIME border (not blue). Lime = "this saves you money."
    Savings card: Lime blob behind the number.
    Deduction guide: Add "used / max" progress bars per deduction.

MONTH — Priority: Mission > Budget > Checklist > Stats

    Mission card: BIGGER. Center-aligned. 36px numbers. Full-width. Add "Month progress: 52%" bar.
    Budget tracker: FULL WIDTH. 12px bars. Red when over, lime when under. Labeled amounts.
    Checklist: BELOW budget. Items are buttons. Done = strikethrough + green check.
    Strategy + Lumpsum: MERGE into one "This Month's Strategy" card.
    Stats strip: Very bottom. No icons.

SCENARIOS — Priority: Impact Analysis > Selector > Slider > Penny

    Scenario selector: Move to LEFT SUB-NAV strip. Active = lime left-border.
    Impact cards: LARGER. "Current → After" with lime-to-blue gradient arrow.
    Add second slider: "How quickly?" (1-36 months) for timeline impact.

CELEBRATE — Priority: Trophy > Goals > Journey

    Trophy: 120px. LIME tinted background (not blue).
    Headline: Lime-to-blue gradient. "Congratulations!"
    Completed goals: Lime-bordered + green checkmark.
    Confetti replay button: "Celebrate Again."

LANDING — Priority: Hero > CTA > Features > Testimonials

    Hero gradient: More dramatic (opacities 0.20, 0.12, 0.08, 0.06).
    Hero preview: Animated goal bar from 0% to 68% over 2s. Shows what FinPath does.
    Feature icons: Subtle float/pulse animation.

AUTH / ONBOARDING / LOADING

    Auth: Add unified background gradient.
    Onboarding: Per-step SVG illustrations. "Continue" = LIME button (onboarding IS progress).
    Loading: LIME progress bar (0%→100%). LIME background pulse circle.

14. COMPONENT STANDARDS
    14.1 Bento Card Variants — Use All Three

| Class          | Desktop Padding | Where                                         |
| -------------- | --------------- | --------------------------------------------- |
| .bento-card-lg | 40px            | Hero cards, Mission card, Net worth chart     |
| .bento-card    | 32px            | Most cards (metrics, goals, strategy, charts) |
| .bento-card-sm | 24px            | Stat strips, activity feed, compact lists     |

14.2 Section Separators

Use consistently on EVERY screen:

<div class="section-sep">
  <span class="section-sep-label">— SECTION NAME —</span>
</div>

14.3 Penny Card Standard

.penny-card {
border: 1px solid rgba(176, 255, 9, 0.18);
}
.penny-card::before {
content: "";
position: absolute; bottom: -30px; right: -30px;
width: 100px; height: 100px; border-radius: 50%;
background: var(--tertiary-accent); opacity: 0.06;
filter: blur(var(--blur-lg)); pointer-events: none;
}

Lime border + lime blob on ALL 5 Penny cards. No variation. 15. TYPOGRAPHY

| Element                  | Current | Improved                     |
| ------------------------ | ------- | ---------------------------- |
| Page titles (H1)         | 26px    | 28px, -0.03em, weight 700    |
| Section labels           | 11px    | 12px, 0.07em letter-spacing  |
| Hero numbers (secondary) | 38-42px | 34px (Income, Surplus)       |
| Hero numbers (primary)   | 38-42px | 44px (Goal amounts, Savings) |
| Body descriptions        | 13px    | 14px                         |
| Body lists               | 13px    | 13px (keep)                  |
| Goal bar labels          | 13px    | 14px, weight 600             |

16. GOAL-SPECIFIC COLOR ASSIGNMENTS

Add 4 new tokens to the palette:

--teal: #14b8a6; --teal-text: #0f766e;
--terracotta: #d97757; --terracotta-text: #9a4a2e;
--cobalt: #3b82f6; --cobalt-text: #1d4ed8;
--rose: #f43f5e; --rose-text: #be123c;

| Goal Type            | Color      | Hex     |
| -------------------- | ---------- | ------- |
| Vehicle (bike, car)  | Lime       | #b0ff09 |
| Emergency Fund       | Teal       | #14b8a6 |
| Investments          | Violet     | #ac49ff |
| Housing/Property     | Terracotta | #d97757 |
| Education/Upskilling | Cobalt     | #3b82f6 |
| Wedding/Family       | Rose       | #f43f5e |
| Travel/Vacation      | Amber      | #f59e0b |

7 goal-category colors eliminates "all goals look the same." 17. IMPLEMENTATION ORDER

    Unified background gradient — 5 min
    Dashboard hierarchy reorder — 30 min
    Goal color assignments (4 new tokens + per-goal colors) — 20 min
    Penny card standardization (lime border + blob on all 5) — 15 min
    Section separators on every screen — 20 min
    Debt strategy winner highlighting (lime border + badge) — 10 min
    Journey node priority colors — 15 min
    Cashflow Sankey-first layout — 20 min
    Progress net-worth-first layout — 10 min
    Tax regime winner highlighting — 5 min
    Month mission card enlargement — 10 min
    Scenarios impact-first layout — 20 min
    Celebrate trophy restyle — 10 min
    Landing hero gradient — 5 min
    Bento card variants (lg/sm usage) — 15 min
    Typography adjustments — 10 min

Total: ~3.5 hours. 18. DO NOT CHANGE

    Glassmorphism effect — signature
    Lufga font — working
    8px spacing grid — consistent
    Shadow scale — well-tuned
    Border radius scale — correct
    Sidebar layout — works
    Penny Panel AI chat — keep
    Lucide-react icons — keep
    Hatching pattern on goal bars — keep

Note: This document was delivered as inline text because the Write tool encountered path escaping issues with the long project directory. Save this as finpath-design-improvements.md in your project root
