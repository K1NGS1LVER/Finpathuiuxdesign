# FinPath — Precision Financial Planning

FinPath is a premium, state-of-the-art financial planning and journey-tracking application. It empowers users to move beyond static budgeting by providing a dynamic, goal-focused roadmap that adapts to real-time financial changes.

![FinPath Dashboard Mockup](https://raw.githubusercontent.com/K1NGS1LVER/Finpathuiuxdesign/main/public/dashboard_preview.png)

## 🚀 Key Features

- **Unified Financial Dashboard**: A high-level overview of your financial health, including real-time health scores and personalized AI insights.
- **Goal-Centric Journey**: Track multiple financial goals (Savings, Debt, Lifestyle) with beautiful, interactive visualizations.
- **Strategy Engine**: Switch between **Avalanche** (interest-optimized) and **Snowball** (momentum-optimized) debt payoff strategies instantly.
- **Dynamic "This Month's Impact"**: A live feedback loop in the monthly checklist that visualizes exactly how today's actions affect your long-term goal progress.
- **Interactive Cashflow**: A custom Sankey diagram mapping your income, expenses, and goal allocations.
- **Scenario Simulation**: Predict the future impact of salary increments, lumpsum payments, or adjusted spending.
- **Penny AI**: An intelligent financial companion that provides tailored advice based on your specific store state.

## 🛠 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4 & Vanilla CSS (Theme-driven with Dual Light/Dark mode)
- **State Management**: Zustand v5 with LocalStorage persistence
- **Routing**: React Router v7
- **Charts & Flow**: Recharts (Sankey, Area, Line charts)
- **Icons**: Lucide React
- **Animations**: Framer Motion & Canvas Confetti
- **Backend/Auth**: Supabase (Auth only)
- **AI Engine**: Groq SDK (Penny AI)

## 🏗 Architecture

FinPath follows a **Single Source of Truth** architecture. All financial logic is centralized in the Zustand store (`src/lib/store.ts`), which automatically triggers the `plan-engine.ts` to regenerate projections whenever state changes.

### Directory Structure

| Path | Purpose |
|---|---|
| `src/app/App.tsx` | Main router and layout shell |
| `src/app/screens/` | individual page components (Dashboard, Journey, Month, etc.) |
| `src/lib/store.ts` | Centralized state management |
| `src/lib/plan-engine.ts` | Core financial projection and allocation logic |
| `src/lib/debt-strategies.ts`| Simulators for Avalanche and Snowball methods |
| `src/styles/theme.css` | Global design tokens and unified background system |

## 🚦 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- pnpm (Recommended)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/K1NGS1LVER/Finpathuiuxdesign.git
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the development server:
   ```bash
   pnpm run dev
   ```
4. Build for production:
   ```bash
   pnpm run build
   ```

## 🎨 Design Philosophy

FinPath is built with a **Premium & Structured** aesthetic. It uses:
- **Unified Backgrounds**: A global blue-and-purple radial gradient system for professional consistency.
- **Glassmorphism**: `.bento-card` components with backdrop-blur and subtle borders.
- **Micro-animations**: Pulsing progress bars and animated transitions that make the data feel "alive."

---
*Created by the FinPath Team.*