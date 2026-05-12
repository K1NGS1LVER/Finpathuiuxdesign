# FinPath — Your Financial Journey, Planned

**FinPath** is a premium financial planning app that transforms static budgeting into a dynamic, goal-driven roadmap. Instead of just tracking where your money went, FinPath shows you where it *could* go — and how to get there faster.

---

## ✨ What Makes It Different

| Feature | Why It Matters |
|---|---|
| **Health Score** | A 0–100 composite score across income stability, debt load, savings rate, and emergency fund — so you always know where you stand |
| **Goal-Centric Planning** | Add goals (home, bike, education, travel, debt freedom) and the engine auto-allocates your monthly surplus across them by priority |
| **Avalanche vs. Snowball** | Switch debt payoff strategies with one click and instantly see the timeline difference |
| **Scenario Explorer** | Simulate real-life events — salary hikes, property purchases, education costs, family planning — and see their impact on savings, timelines, and emergency runway in real-time |
| **Lumpsum Simulator** | What happens if you put a bonus toward a goal? See exactly how many months you save |
| **Interactive Cashflow** | A custom Sankey diagram mapping income → expenses → goal allocations |
| **Penny AI** | An in-app financial companion that gives contextual advice based on your actual numbers |
| **Month-by-Month Checklist** | A live feedback loop that shows how today's actions affect long-term goal progress |

---

## 🎯 Who It's For

Young professionals in India who:
- Have multiple financial goals but don't know how to prioritize them
- Want to see the *second-order effects* of financial decisions before making them
- Need a plan that adapts when life changes (new job, new EMI, new family member)

---

## 🏗 Under the Hood

- **Single Source of Truth** — All state in one Zustand store, persisted to localStorage
- **Auto-Regenerating Plan** — Every income/expense/goal change triggers `plan-engine.ts` to re-project month-by-month forecasts
- **React 18 + TypeScript + Tailwind CSS v4** — Modern, type-safe, theme-driven
- **Glassmorphism Design** — Semi-transparent cards with backdrop-blur over a unified gradient background
- **Dual Light/Dark Mode** — Full theme system via CSS custom properties

---

## 📱 The Screens

1. **Dashboard** — Health score, net worth, upcoming milestones, Penny insights
2. **Journey** — Interactive goal map with progress visualization
3. **Month** — Monthly checklist with live impact feedback
4. **Scenarios** — What-if simulation engine
5. **Cashflow** — Sankey diagram of money flow
6. **Debt** — Strategy comparison (Avalanche vs. Snowball) with timeline
7. **Tax** — Old vs. New regime comparison (FY 2024-25)
8. **Progress** — Timeline of milestones and celebrations

---

*Plan smarter. Adapt faster. Reach your goals sooner.*