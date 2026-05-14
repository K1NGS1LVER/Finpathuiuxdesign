# FinPath — Precision Financial Planning

FinPath is a premium financial planning and journey-tracking application for Indian professionals. It moves beyond static budgeting with a dynamic, goal-focused roadmap that adapts to real-time financial changes, backed by a LangGraph-bound AI companion (Penny).

## Key Features

- **Unified Financial Dashboard** — real-time health scores and personalized AI insights.
- **Goal-Centric Journey** — track Savings, Debt, and Lifestyle goals with interactive visualizations.
- **Strategy Engine** — Avalanche (interest-optimized) vs Snowball (momentum) debt payoff.
- **Dynamic "This Month's Impact"** — live feedback loop showing how today's actions affect long-term progress.
- **Interactive Cashflow** — Sankey diagram mapping income → expenses → goals.
- **Scenario Simulation** — salary increments, lumpsum payments, expense adjustments.
- **Penny AI** — Groq-backed financial companion that reads your full anonymized profile.

## Tech Stack

- **Frontend** — React 18 + TypeScript, Vite 6, Tailwind v4, Zustand v5, react-router v7, recharts, framer-motion
- **Backend** — Python 3.11+ / FastAPI / uvicorn, Groq SDK, Supabase auth (JWT/JWKS)
- **Engines** — TS engines on frontend (instant UI), Python ports on backend (LangGraph tools in Phase 3)
- **Auth / DB** — Supabase (email/password, PostgreSQL with RLS)

## Repository Layout

```
.
├── frontend/                # React SPA (Vite + TypeScript)
│   ├── src/                 # Application code
│   ├── scripts/             # dev:backend launcher + fixture dumper
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/                 # FastAPI (Python)
│   ├── app/
│   │   ├── api/             # Route modules (penny, simulate)
│   │   ├── engines/         # Python ports of the TS engines
│   │   ├── services/        # Anonymize, cache, prompt, rate-limit, Groq
│   │   ├── auth.py          # Supabase JWT (HS256 / RS256 / ES256 via JWKS)
│   │   ├── config.py        # Pydantic settings
│   │   └── main.py          # FastAPI app
│   ├── db/migrations/       # SQL schema
│   ├── tests/               # pytest parity tests
│   └── pyproject.toml
├── tests/fixtures/          # Shared JSON fixtures (TS dumper → Python pytest)
├── todo.md                  # Phased roadmap + status
└── README.md
```

## Getting Started

### Prerequisites

- Node.js LTS (≥18) + pnpm
- Python 3.11+
- Supabase project (free tier OK) — needed for auth in production; dev can use mock toggles

### Frontend setup

```bash
cd frontend
pnpm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (or set VITE_AUTH_MOCK=true)
```

### Backend setup

```bash
cd backend
python -m venv .venv
# Windows
.\.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install -e ".[dev]"
cp .env.example .env
# Fill in GROQ_API_KEY + SUPABASE_URL (+ optionally SUPABASE_JWT_SECRET for HS256 projects)
```

### Run both servers

From `frontend/`:

```bash
pnpm dev:all
```

Boots:
- Backend → `http://127.0.0.1:8000`
- Frontend → `http://localhost:5173` (proxies `/api/*` to the backend)

Or run separately in two terminals: `pnpm dev:backend` and `pnpm dev`.

### Verification gates

```bash
# From frontend/
pnpm test       # 61 vitest cases across the 3 engines
pnpm build      # production build (0 errors required)

# From backend/
pytest          # 28 parity tests vs the TS fixtures
```

### Regenerating cross-language fixtures

From `frontend/`:

```bash
pnpm fixtures   # runs TS engines, writes <repo>/tests/fixtures/{health,debt,plan}/*.json
```

Python parity tests load those JSON files; TS = source of truth.

## Design Philosophy

Premium, structured aesthetic:
- **Unified backgrounds** — global blue / purple radial gradient.
- **Glassmorphism** — `.bento-card` with backdrop-blur and subtle borders.
- **Micro-animations** — pulsing progress, animated transitions.

---
*Created by the FinPath Team.*
