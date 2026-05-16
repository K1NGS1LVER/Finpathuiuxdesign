# Phase 5: Backend Dockerfile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Containerize the FastAPI backend with a single-stage Dockerfile so it can be deployed to any container host without platform lock-in.

**Architecture:** Single-stage `python:3.11-slim` image. Deps installed via `pip install -e .` (base deps only, no dev extras). Secrets injected at runtime via env vars — never baked into image. uvicorn bound to `0.0.0.0` inside the container.

**Tech Stack:** Docker, Python 3.11-slim, uvicorn, FastAPI (pyproject.toml as dep manifest)

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `backend/Dockerfile` | Container build instructions |
| Create | `backend/.dockerignore` | Exclude venv, secrets, test artifacts |

---

### Task 1: Create `.dockerignore`

**Files:**
- Create: `backend/.dockerignore`

- [ ] **Step 1: Create the file**

`backend/.dockerignore`:
```
.venv/
__pycache__/
*.pyc
*.pyo
*.egg-info/
.env
.pytest_cache/
.ruff_cache/
tests/
dist/
build/
```

- [ ] **Step 2: Verify it excludes the right things**

Run from repo root:
```bash
docker build --dry-run ./backend 2>/dev/null || true
# If docker not available, just inspect the file contents manually:
cat backend/.dockerignore
```

Expected: File exists, lists the exclusions above.

- [ ] **Step 3: Commit**

```bash
git add backend/.dockerignore
git commit -m "chore(docker): add .dockerignore for backend"
```

---

### Task 2: Create `Dockerfile`

**Files:**
- Create: `backend/Dockerfile`

- [ ] **Step 1: Create the file**

`backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy dep manifest first so pip layer is cached independently of app code.
COPY pyproject.toml .

# Install base deps only — skip [dev] extras (pytest, ruff not needed in prod).
RUN pip install --no-cache-dir -e .

# Copy application source after deps are cached.
COPY app/ ./app/

# Bind to 0.0.0.0 so uvicorn is reachable from outside the container.
# PORT and all secrets (GROQ_API_KEY, SUPABASE_*) are injected at runtime.
ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Build the image**

Run from repo root:
```bash
docker build -t finpath-backend ./backend
```

Expected output ends with:
```
Successfully built <image-id>
Successfully tagged finpath-backend:latest
```

No errors. Build should complete in ~60s on first run (downloading base image + installing deps).

- [ ] **Step 3: Smoke-test the container**

Run with mock auth so no real Supabase keys needed:
```bash
docker run --rm \
  -e AUTH_MOCK=true \
  -e GROQ_API_KEY=dummy \
  -p 8000:8000 \
  finpath-backend
```

In a second terminal:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "ok"}
```

Stop the container with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add backend/Dockerfile
git commit -m "feat(docker): single-stage backend Dockerfile"
```

---

## Notes for future upgrades

- **Multi-stage:** When pushing to a registry regularly, wrap the current stage in a build stage and copy only the venv + `app/` to a second `python:3.11-slim` stage. Cuts image from ~400 MB to ~200 MB.
- **Docker Compose:** Add at repo root when deployment target is decided. Will include nginx service for frontend static serving + proxy to this container.
- **gunicorn:** Replace uvicorn CMD with `gunicorn -k uvicorn.workers.UvicornWorker app.main:app -w 4` when multi-worker is needed under load.
