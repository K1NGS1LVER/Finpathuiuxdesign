FROM python:3.11-slim

WORKDIR /app

# Copy dep manifest first so the dependency layer is cached independently of
# app code. `pip install .` (editable or not) before COPY app/ would build a
# package with no modules — setuptools' packages.find targets app* — so we
# extract and install only the dependency list here.
COPY pyproject.toml .
RUN python - <<'PY' > /tmp/requirements.txt
import tomllib

with open("pyproject.toml", "rb") as f:
    deps = tomllib.load(f)["project"]["dependencies"]
print("\n".join(deps))
PY
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Application source after deps are cached. uvicorn resolves `app` from the
# WORKDIR; no package install needed.
COPY app/ ./app/

# Bind to 0.0.0.0 so uvicorn is reachable from outside the container.
# PORT and all secrets (GROQ_API_KEY, SUPABASE_*) are injected at runtime;
# render.yaml declares port 8000, matching the default here.
ENV HOST=0.0.0.0

EXPOSE 8000

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
