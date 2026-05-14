Yes, build a backend — but for the right reasons
What's currently "backend" (it's not really)
Your only server-side code is src/server/penny-api.ts — a Vite dev middleware plugin. It only runs during pnpm run dev. It disappears in production builds. Penny AI literally won't work in production right now.
The 4 engines: keep them on the frontend AND expose on backend
Engine Pure computation? Security risk on frontend?
plan-engine.ts Yes, deterministic None
health-score.ts Yes, deterministic None
debt-strategies.ts Yes, deterministic None
tax-engine.ts Yes, deterministic None
These are pure math. No secrets, no I/O, same inputs = same outputs. Keep them on the frontend for instant UI updates. But also port them to the backend so Penny AI / LangGraph agents can call them as tools.
The real reasons you need a backend

1. Penny AI doesn't work in production — Vite middleware is dev-only. You need a real server.
2. LangGraph is Python — it can't run in a browser. You need a Python backend (FastAPI is the standard pairing).
3. Penny needs engine access — for LangGraph agents, the plan engine and health score become tools the agent can call to reason about the user's finances. Currently Penny gets a flattened text summary of the profile in the system prompt — with LangGraph, it could actually run simulations on behalf of the user.
4. Data sync — the Supabase dual-storage feature we planned needs server-side validation.
5. Production auth — your auth store is fully mocked right now.
   Recommended architecture
   ┌─────────────────────────────────────────────┐
   │ Frontend (React SPA) │
   │ - Engines stay here for instant UI │
   │ - Zustand + localStorage (local-first) │
   │ - Calls backend for Penny AI │
   └──────────────┬──────────────────────────────┘
   │ REST/WebSocket
   ┌──────────────▼──────────────────────────────┐
   │ Python Backend (FastAPI) │
   │ - Penny AI (LangGraph agent) │
   │ - Ported engines as LangGraph tools │
   │ - /api/penny, /api/plan, /api/simulate │
   │ - Data sync with Supabase │
   │ - Auth validation (verify Supabase JWTs) │
   └──────────────┬──────────────────────────────┘
   │
   ┌──────────────▼──────────────────────────────┐
   │ Supabase (BaaS) │
   │ - Auth (real, replace mock store) │
   │ - PostgreSQL: profiles table (RLS) │
   │ - Optional: pgvector for future RAG │
   └─────────────────────────────────────────────┘
   Key decisions you'd need to make

# Questions

What should the backend be built in? Since you mentioned LangGraph, Python is the natural choice for the AI layer. But do you want the whole backend in Python, or a split?
Python + FastAPI (Recommended)
The plan engine, health score, debt strategies, and tax engine are pure TypeScript functions. Should they be ported to Python for the backend, or stay as TypeScript only?
Port to Python, keep TS on frontend (Recommended)
How ambitious should Penny AI be with LangGraph? This determines how much the backend needs to do.
Autonomous financial planner
Thinking: The user chose:

1. Python + FastAPI for the entire backend
2. Port engines to Python, keep TS on frontend
3. Autonomous financial planner (most ambitious option)
   This is a significant architecture decision. Let me lay out a comprehensive plan for this. Given that the user wants an autonomous Penny AI, the LangGraph agent needs to be able to:

- Read the user's financial profile
- Run simulations (plan engine, debt strategies, tax comparison)
- Suggest actions (new goals, allocation changes, debt strategy switches)
- Execute changes (with user approval) — write back to the store/data
  This is a big undertaking. Let me create a phased plan that's practical.
  Let me also think about the structure of the Python backend, what LangGraph tools would be needed, and how the autonomous agent would interact with the frontend.
  Key considerations:
- The autonomous agent needs to be able to propose changes to the user's financial profile
- The frontend needs a way to display proposals and get user approval
- The agent needs access to all 4 engines as tools
- The agent needs to persist conversation history
- WebSocket would be ideal for real-time agent streaming
  Let me create a detailed but concise plan.
  Ambitious choice. Here's the full architecture plan:

---

FinPath Backend + Autonomous Penny AI — Complete Plan
Architecture Overview
┌──────────────────────────────────────────────────┐
│ Frontend (React SPA — existing) │
│ - TS engines for instant UI recalculation │
│ - Zustand + localStorage (local-first) │
│ - WebSocket connection for Penny streaming │
│ - Proposal cards: Penny suggests, user approves │
└──────────┬──────────────────┬────────────────────┘
│ REST │ WebSocket
┌──────────▼──────────────────▼────────────────────┐
│ Python Backend (FastAPI) │
│ ┌─────────────────────────────────────────────┐ │
│ │ LangGraph Agent (Penny) │ │
│ │ - Conversational memory (Postgres/Supa) │ │
│ │ - Tools: simulate_plan, compare_debt, │ │
│ │ compare_tax, health_check, propose_change │ │
│ │ - Can propose store mutations │ │
│ │ - Streams thoughts + actions via WebSocket │ │
│ └─────────────────────────────────────────────┘ │
│ - /api/penny (WebSocket) │
│ - /api/profile (REST CRUD) │
│ - /api/simulate (REST — what-if engine calls) │
│ - Auth: verifies Supabase JWTs │
│ - Python-ported engines as modules │
└──────────┬───────────────────────────────────────┘
│
┌──────────▼───────────────────────────────────────┐
│ Supabase │
│ - Auth (replace mock) │
│ - PostgreSQL: profiles, chat_history, proposals │
│ - RLS on all tables │
└──────────────────────────────────────────────────┘
Phase 1: Foundation (Week 1-2)
1.1 FastAPI project scaffold
backend/
├── app/
│ ├── main.py # FastAPI app, CORS, lifespan
│ ├── config.py # Settings from env vars
│ ├── auth.py # Supabase JWT verification middleware
│ ├── models/
│ │ ├── profile.py # FinancialProfile Pydantic models
│ │ ├── chat.py # ChatMessage, Proposal models
│ │ └── goals.py # Goal, DebtItem Pydantic models
│ ├── engines/
│ │ ├── plan_engine.py # Ported from plan-engine.ts
│ │ ├── health_score.py # Ported from health-score.ts
│ │ ├── debt_strategies.py # Ported from debt-strategies.ts
│ │ └── tax_engine.py # Ported from tax-engine.ts
│ ├── api/
│ │ ├── profile.py # CRUD /api/profile
│ │ ├── simulate.py # /api/simulate endpoints
│ │ └── penny.py # WebSocket + REST for Penny
│ └── db/
│ └── supabase.py # Supabase client (service_role key)
├── requirements.txt
├── .env.example
└── Dockerfile
1.2 Port the 4 engines to Python
Each engine is a direct translation — same logic, same inputs/outputs, but as Python functions with Pydantic models. Write shared test fixtures (JSON snapshots of FinancialProfile) that both TS and Python tests use, so you can verify parity.
1.3 Real Supabase auth in frontend
Replace the mocked auth-store.ts with real supabase.auth.\* calls. This is a prerequisite for everything else — the backend validates JWTs, so the frontend must produce real ones.
1.4 Supabase DB schema
-- profiles: full FinancialProfile as JSONB
create table profiles (
user_id uuid primary key references auth.users(id) on delete cascade,
data jsonb not null default '{}',
storage_mode text not null default 'local',
schema_version integer not null default 3,
updated_at timestamptz default now()
);
-- chat_history: persistent Penny conversations
create table chat_history (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete cascade,
role text not null check (role in ('user', 'assistant', 'system', 'tool')),
content text not null,
tool_calls jsonb,
tool_results jsonb,
created_at timestamptz default now()
);
-- proposals: Penny's suggested store mutations (pending user approval)
create table proposals (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete cascade,
action text not null, -- e.g. "update_goal", "set_strategy"
payload jsonb not null, -- the store mutation args
rationale text, -- why Penny suggests this
status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
created_at timestamptz default now(),
resolved_at timestamptz
);
-- RLS policies for all three tables
alter table profiles enable row level security;
alter table chat_history enable row level security;
alter table proposals enable row level security;
create policy "Users can CRUD own profile" on profiles for all using (auth.uid() = user_id);
create policy "Users can CRUD own chat" on chat_history for all using (auth.uid() = user_id);
create policy "Users can CRUD own proposals" on proposals for all using (auth.uid() = user_id);
Phase 2: Autonomous Penny with LangGraph (Week 3-5)
2.1 LangGraph agent definition

# Penny's LangGraph state graph

#

# ┌──────────┐ ┌──────────┐ ┌──────────┐

# │ ROUTER │───►│ RESEARCH │───►│ PLAN │───┐

# │ (intent) │ │ (tools) │ │ (reason) │ │

# └────┬─────┘ └──────────┘ └──────────┘ │

# │ │

# ▼ ▼

# ┌──────────┐ ┌──────────┐

# │ CHAT │ │ PROPOSE │

# │ (answer) │ │ (action) │

# └──────────┘ └──────────┘

2.2 Penny's tools (LangGraph tool-calling)
Tool What it does
simulate_plan Runs generatePlan() with current profile, returns month-by-month projections
simulate_what_if Runs generateScenarioPlan() with modifications (income bump, new goal, etc.)
compare_debt_strategies Runs compareStrategies()
compare_tax_regimes Runs compareTaxRegimes()
check_health Runs calculateHealthScore()
propose_change Creates a Proposal row in DB — a suggested mutation to the user's store
read_profile Reads current profile from Supabase
2.3 The propose_change tool — this is the autonomous part
When Penny determines the user would benefit from a change (e.g., "your emergency fund is only 1 month of expenses, I recommend allocating ₹5,000/month more to it"), it calls propose_change which:

1. Creates a Proposal row: { action: "update_goal", payload: { goalId: "goal-emergency-fund", field: "monthlyAllocation", value: 5000 }, rationale: "..." }
2. Sends the proposal to the frontend via WebSocket
3. Frontend renders a proposal card in the PennyPanel: "Penny suggests increasing your Emergency Fund allocation by ₹5,000/mo. Approve Reject"
4. If approved → frontend applies the mutation to Zustand store + syncs to Supabase
5. Penny gets the approval/rejection as a tool result and responds accordingly
   2.4 Frontend: WebSocket connection + Proposal cards

- PennyPanel.tsx switches from fetch('/api/penny') to a WebSocket connection
- New ProposalCard component renders pending proposals with Approve/Reject buttons
- On approve: call the relevant store setter (updateGoal, setStrategy, etc.) and mark proposal as approved via API
- On reject: mark proposal as rejected, Penny gets feedback
  Phase 3: Data Sync + Privacy (Week 5-6)
  This is the dual-storage feature from our earlier plan, now integrated with the real backend:
- storageMode: "local" | "cloud" in the store
- Privacy toggle on sign-up form + settings
- Custom Zustand persist adapter: local-first writes, cloud sync when storageMode === "cloud"
- Export/import JSON for local-only users
- Last-write-wins conflict resolution using lastUpdated
  Phase 4: Production Hardening (Week 6-7)
- Dockerize the FastAPI backend
- Deploy: Vercel (frontend) + Railway/Fly.io (backend) + Supabase (auth + DB)
- Add auth middleware to all backend endpoints (verify Supabase JWT)
- Rate limiting on Penny AI (per-user, not just per-IP)
- Proposal expiry (auto-reject after 24h)
- Monitoring / error tracking
  Key design decisions to lock in

1. Frontend engines stay — instant UI, works offline. Backend engines are for Penny's tools only.
2. Proposals, not direct writes — Penny never mutates user data directly. It proposes, user approves. This is critical for trust.
3. WebSocket for Penny — enables streaming tokens, real-time proposals, and tool-call visibility.
4. Chat history in Supabase — persistent across sessions, per-user, RLS-protected.
5. Shared test fixtures — same JSON profiles tested against both TS and Python engines to ensure parity.
   What to build first?
   The dependency chain is:
   Real Supabase auth → Backend scaffold + engine ports → LangGraph agent → Proposal system → Data sync
   Start with auth. Everything else depends on real user IDs and JWTs.
