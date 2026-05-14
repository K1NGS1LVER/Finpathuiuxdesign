# FinPath Backend + Autonomous Penny — Status

**Approved plan**: `~/.claude/plans/i-have-plan-in-parallel-fiddle.md` (full execution detail; don't re-derive).
**High-level summary**: also in `CLAUDE.md` → "Backend + Penny Roadmap".

## Architecture (locked)

```
Frontend (React, existing)
  - TS engines stay (instant UI)
  - Zustand + localStorage (local-first)
  - EventSource (SSE) → Penny           [Phase 3]
  - ProposalCard approve/reject UI       [Phase 3]
       │
       │ /api/* (Vite dev proxy → 127.0.0.1:8000)
       ▼
Python FastAPI (backend/)
  - Penny Groq proxy                     [DONE — Phase 0]
  - LangGraph agent + tools              [Phase 3]
  - Ported engines                       [Phase 2]
  - SSE /api/penny/stream                [Phase 3]
  - Supabase JWT verification            [Phase 1]
       │
       ▼
Supabase: Auth + Postgres (RLS)          [Phase 1]
```

## Locked decisions (don't re-debate)

- Backend = **Python + FastAPI**. (LangGraph is Python-first.)
- TS engines remain the source of truth on the frontend for instant UI. Python ports are for Penny's tools and are kept in parity via shared JSON fixtures.
- Streaming = **SSE** (not WebSocket). Proposals are named SSE events on the same `/api/penny/stream` stream.
- localStorage → cloud migration is **automatic** on first real sign-in. If both local and remote exist, keep cloud and archive local under `finpath-store.local-backup-{date}`.
- **No deploy** yet. `vite.config.ts` proxies `/api/*` → `http://127.0.0.1:8000`. Run both halves via `pnpm dev:all`.
- Penny **proposes, never writes directly**. Every change goes through the `proposals` table + SSE event + user Approve/Reject in `<ProposalCard>`.

## Phase 0 — Ship prod Penny — **DONE**

What landed:

- `backend/` scaffold: `pyproject.toml`, `.env.example`, `README.md`, `app/{main,config}.py`, `app/api/penny.py`, `app/services/{anonymize,cache,groq_client,prompt,rate_limit}.py`.
- Python port of `src/server/penny-api.ts`:
  - `POST /api/penny` request shape unchanged: `{ message, profile, context? } → { reply }`.
  - PII anonymization (`services/anonymize.py`): only aggregate numbers + goal names sent to Groq.
  - Rate limit (`services/rate_limit.py`): 15 req / 60s / IP, in-process, thread-safe.
  - Response cache (`services/cache.py`): 5-min TTL keyed on `message[:200].lower() | income.total - expenses.total - debts.totalMonthly - savings - goals.length`.
  - Groq call (`services/groq_client.py`): `llama-3.3-70b-versatile`, temp 0.7, max_tokens 500, stream false.
- `vite.config.ts` — removed `pennyApiPlugin` import + plugin registration; added `server.proxy { '/api': process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000' }`.
- `src/server/penny-api.ts` and `src/server/` directory deleted.
- `package.json`:
  - Added `dev:backend` (`cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`).
  - Added `dev:all` using `concurrently` to run uvicorn + vite together.
  - New devDep: `concurrently@9.x`.
- `CLAUDE.md` updated: commands, directory tree, Penny section, testing section, Tech Stack, new Roadmap section.

Verification done in Phase 0:

- `pnpm build` → 0 errors.
- `pnpm test` → 83/83 vitest pass.
- `python -m uvicorn app.main:app` boots; `GET /health` → `{"status":"ok"}`.
- `POST /api/penny` with empty message → 422 (Pydantic validation).
- 16th rapid `POST /api/penny` → 429 (rate limiter works).
- Without a Groq key set, valid POST → 500 with `"Connection error."` (expected; user must set `backend/.env`).

**User action to finish Phase 0 in browser** (one-time setup):

1. `cp backend/.env.example backend/.env` and paste `GROQ_API_KEY=...`.
2. From `backend/`: `py -m venv .venv && .\.venv\Scripts\Activate.ps1 && pip install -e ".[dev]"` (already done on the workstation Phase 0 ran on, but new clones must repeat).
3. `pnpm dev:all` — chat with Penny in `/dashboard`. Should behave identically to the old dev middleware.

## Phase 1 — Real Supabase auth + migration — **DONE (code)**

Live test still pending Supabase project setup. See `CLAUDE.md` → "Auth requires Supabase setup" gotcha.

`feat(auth): VITE_AUTH_MOCK + AUTH_MOCK dev escape hatches` (commit 193c6a4): both halves of the stack honor a mock toggle so dev work doesn't burn Supabase free-tier auth quotas.

Originally planned sub-tasks:

Goal: replace mocked `auth-store.ts` with real Supabase auth, add DB schema (profiles/chat_history/proposals tables + RLS), backend JWT verification, and auto-migrate existing localStorage data on first sign-in.

Sub-tasks:

1. Create Supabase project → capture `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Add to root `.env` + extend `backend/.env.example` with `SUPABASE_URL`, `SUPABASE_JWT_SECRET` (or JWKS URL).
2. SQL migration `backend/db/migrations/001_init.sql`:
   - `profiles(user_id uuid PK references auth.users, data jsonb, storage_mode text default 'local', schema_version int default 3, updated_at timestamptz)`
   - `chat_history(id, user_id, role, content, tool_calls jsonb, tool_results jsonb, created_at)`
   - `proposals(id, user_id, action, payload jsonb, rationale, status, created_at, resolved_at)`
   - RLS: `auth.uid() = user_id` on all three.
3. Replace mock body of `src/lib/auth-store.ts`:
   - `signUp`, `signIn`, `signOut`, `initialize` use `supabase.auth.*` from `src/lib/supabase.ts`.
   - Subscribe to `onAuthStateChange` in `initialize`.
   - On sign-in success, run `migrateLocalToCloud()`:
     - Read `localStorage["finpath-store"]`.
     - If local onboarded AND remote `profiles.data` empty → upload local, set `storage_mode = 'cloud'`.
     - If both non-empty → keep cloud, archive local under `finpath-store.local-backup-{YYYY-MM-DD}`.
4. Backend `app/auth.py`:
   - `Depends(get_current_user)` parses `Authorization: Bearer …`, verifies via Supabase JWKS, returns `user_id`.
   - Apply to `/api/penny` (and all future endpoints).
5. Frontend: create `src/lib/api.ts` with `apiFetch()` that attaches `Authorization: Bearer <access_token>` from Supabase session. Replace raw `fetch('/api/penny')` in `PennyPanel.tsx`.
6. Update `CLAUDE.md` "Mocked Auth" gotcha → removed once landed.

Gate: real sign-up → onboarding → dashboard. Existing local data preserved. Backend rejects unauthenticated `/api/penny` with 401.

## Phase 2 — Port engines + parity tests — **DONE**

What landed:

- `scripts/dump-fixtures.ts` — curated input set per engine; runs the TS engine and writes `{ input, expected }` JSON to `tests/fixtures/{health,debt,plan}/*.json`. Added `pnpm fixtures` script. `tsx` added as devDep.
- Python ports in `backend/app/engines/`:
  - `_helpers.py` — `js_round()` shim (JS half-up vs Python banker's rounding).
  - `health_score.py` (4-dim 0–100 score + 3 actionable recs).
  - `debt_strategies.py` (avalanche, snowball, compare; full amortization with extra-payment waterfall).
  - `plan_engine.py` (120-month sim, weighted allocation, per-stream increments, step-up modes, scenario plan).
- Parity tests at `backend/tests/` (28 total):
  - `test_health_score.py` — 6 exact-equal tests.
  - `test_debt_strategies.py` — 15 tests with `date` fields stripped.
  - `test_plan_engine.py` — 7 tests with `date` and `goalCompletionDates` values stripped.
- REST endpoints in `backend/app/api/simulate.py` (auth-required): `/api/simulate/plan`, `/scenario`, `/debt/{avalanche,snowball,compare}`, `/health`.

Verification gate: `pnpm build` 0 errors, `pnpm test` 83/83, `pytest` 58/58.

## Phase 3 — LangGraph autonomous Penny + Proposals — **NEXT**

1. Deps: `langgraph`, `langchain-core`, `langchain-groq` in `backend/pyproject.toml`.
2. `backend/app/agents/penny.py` graph: `ROUTER → RESEARCH → PLAN → {CHAT | PROPOSE}`.
3. Tools (`backend/app/agents/tools.py`): `simulate_plan`, `simulate_what_if`, `compare_debt_strategies`, `check_health`, `read_profile`, `propose_change`.
4. SSE `/api/penny/stream`: events = `token | tool_call | tool_result | proposal | done | error`. Persist user msg + assistant msg + tool calls to `chat_history`.
5. Frontend `PennyPanel.tsx`: replace `fetch` with SSE (POST + ReadableStream, or `EventSource` for GET). New `src/app/components/ProposalCard.tsx` for Approve/Reject. Approve = apply Zustand setter + `PATCH /api/proposals/:id`.
6. Chat history hydration on mount: `GET /api/chat/history?limit=50`.
7. Proposal expiry: backend `asyncio` startup task marks 24h-old proposals as `expired`.

Gate: Penny can answer "what if I increase EMI by ₹5k?" using `simulate_what_if`, and can `propose_change` (e.g. raise Emergency Fund allocation) that user approves in the panel and sees applied.

## Phase 4 — Dual storage

1. Add `storageMode: 'local' | 'cloud'` to Zustand store.
2. Custom persist adapter: always write local; if `cloud`, debounced `PUT /api/profile` with `lastUpdated`.
3. Settings panel toggle. Default `local` for new users.
4. Export / import JSON for local-only users; import merges by `lastUpdated`.
5. Last-write-wins on `lastUpdated`; warn on hydrate if remote newer.

Gate: toggle storage mode, sign out, sign in on another browser → profile syncs.

## Phase 5 — Hardening (defer until deploying)

Dockerfile, CORS allowlist, per-user rate limits, structured logging, error monitoring, `.env` audit.

## Critical file map

| Touched by | Files |
|---|---|
| Phase 0 (done) | `vite.config.ts`, `package.json`, `CLAUDE.md`, `backend/**` |
| Phase 1 | `src/lib/auth-store.ts`, `src/lib/supabase.ts`, `src/lib/api.ts` (new), `backend/app/auth.py` (new), `backend/db/migrations/001_init.sql` (new), `src/app/components/PennyPanel.tsx` |
| Phase 2 | `scripts/dump-fixtures.ts` (new), `tests/fixtures/**` (new), `backend/app/engines/**` (new), `backend/app/models/**` (new), `backend/tests/test_engines.py` (new) |
| Phase 3 | `backend/app/agents/**` (new), `backend/app/api/penny.py` (extend to SSE), `src/app/components/PennyPanel.tsx`, `src/app/components/ProposalCard.tsx` (new) |
| Phase 4 | `src/lib/store.ts` (persist adapter), `src/app/screens/Settings.tsx` (new or existing) |

## Do not touch

- `src/lib/{plan-engine,health-score,debt-strategies}.ts` — TS remains source of truth on frontend. Python is a port, not a replacement.
- `src/lib/__tests__/*.test.ts` semantics — fixture extraction is additive, must not change expectations.
