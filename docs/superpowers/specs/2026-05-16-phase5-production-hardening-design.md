# Phase 5: Production Hardening — Design Spec

**Date:** 2026-05-16
**Status:** Approved

## Scope

Backend Dockerfile + `.dockerignore`. Unblocks future deployment to any container host without committing to a specific platform.

**Out of scope (deferred):**
- Docker Compose (deferred until deployment target chosen)
- Frontend container (Vite `dist/` served via CDN or nginx later)
- gunicorn multi-worker (uvicorn sufficient for initial deploy)
- Structured JSON logging (can add when connecting a log aggregator)
- Security headers middleware (can add alongside nginx reverse proxy)

**Already done (not repeated):**
- CORS allowlist — env-driven `allowed_origins`, explicit methods/headers, `max_age=600`
- Per-user rate limiting — 15 req/60s, keyed on `user_id` or client IP, pruned every 256 calls
- Input validation — Penny message capped at 4,000 chars; regex ReDoS fix in document-extractor
- Connection pooling — process-wide `httpx.AsyncClient` for Supabase, closed on shutdown

## Files

### `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir -e .
COPY app/ ./app/
ENV HOST=0.0.0.0
ENV PORT=8000
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Key decisions:
- `python:3.11-slim` — matches `requires-python = ">=3.11"` in pyproject.toml
- `pip install -e .` — base deps only (not `.[dev]`); skips pytest and ruff
- `HOST=0.0.0.0` default so uvicorn binds to all interfaces inside the container
- `settings.host` in `config.py` already reads `HOST` from env, so no code change needed
- Secrets (`GROQ_API_KEY`, `SUPABASE_*`) injected at runtime via platform secrets or `docker run --env-file` — never baked into image

### `backend/.dockerignore`

Excludes:
- `.venv/` — venv rebuilt inside container
- `tests/` — not needed in production image
- `__pycache__/`, `*.pyc`, `*.egg-info`
- `.env` — secrets never in image
- `.pytest_cache/`, `.ruff_cache/`

## Build & Run

```bash
# Build
docker build -t finpath-backend ./backend

# Run (dev-style, env from file)
docker run --env-file backend/.env -p 8000:8000 finpath-backend

# Run (production, secrets injected by platform)
docker run -e GROQ_API_KEY=... -e SUPABASE_URL=... -p 8000:8000 finpath-backend
```

## Future upgrade path

When deployment target is chosen:
- **PaaS (Railway/Render/Fly):** Dockerfile already works. Point the platform at `backend/` as build context.
- **VPS:** Add `docker-compose.yml` at repo root with nginx service + frontend static serving.
- **Multi-stage:** Wrap current single-stage in a build stage; copy only venv + app to a second `python:3.11-slim` stage. Cuts image from ~400MB to ~200MB.
