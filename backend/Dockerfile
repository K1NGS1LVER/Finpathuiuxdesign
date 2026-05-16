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
