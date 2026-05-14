# FinPath Backend

FastAPI proxy for Penny AI. Phase 0 — replaces the Vite dev middleware so Penny works in production.

## Requirements

- Python 3.11+
- A Groq API key

## Setup

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install -e .[dev]
cp .env.example .env
# edit .env and set GROQ_API_KEY
```

## Run

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The Vite dev server proxies `/api/*` to `http://localhost:8000` (see root `vite.config.ts`).

From the project root you can run both at once:

```bash
pnpm dev:all
```

## Endpoints

- `GET /health` — liveness check (no auth).
- `POST /api/penny` — Penny chat. Body: `{ message, profile, context? }` → `{ reply }`.
  - **Requires** `Authorization: Bearer <Supabase access token>` (Phase 1).
  - Rate-limited 15 req / 60s, keyed on user id when authenticated.
  - 5-minute response cache keyed on message + financial summary.
  - PII-anonymized profile before hitting Groq.

## Supabase setup (Phase 1)

1. Create a Supabase project. Note the project URL and anon key for the frontend.
2. In Supabase SQL editor, run `backend/db/migrations/001_init.sql` to create the `profiles`, `chat_history`, and `proposals` tables with RLS.
3. Copy the project JWT secret from **Settings → API → JWT Settings → "JWT Secret"** and put it in `backend/.env` as `SUPABASE_JWT_SECRET`. This is what the backend uses to verify Bearer tokens.
4. Frontend: copy root `.env.example` to `.env` at the project root and fill in `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.

## Layout

```
backend/
  app/
    main.py           # FastAPI app + CORS + router include
    config.py         # Pydantic settings
    api/penny.py      # /api/penny route
    services/
      anonymize.py    # PII stripping
      cache.py        # 5-min response cache
      groq_client.py  # Groq SDK singleton
      prompt.py       # System prompt builder
      rate_limit.py   # Per-IP token bucket
  tests/              # pytest (Phase 2+)
  pyproject.toml
```
