"""FastAPI application entrypoint."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.penny import router as penny_router
from app.api.profile import router as profile_router
from app.api.simulate import router as simulate_router
from app.config import settings
from app.services.supabase_db import close_client, expire_stale_proposals

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)

_PROPOSAL_EXPIRY_INTERVAL_S = 60 * 60  # 1 hour
_PROPOSAL_MAX_AGE_HOURS = 24


async def _proposal_expiry_loop() -> None:
    # First tick immediately so stale rows from a previous run clear on boot.
    while True:
        try:
            expired = await expire_stale_proposals(_PROPOSAL_MAX_AGE_HOURS)
            if expired:
                log.info("Expired %d stale proposal(s).", expired)
        except Exception:
            log.exception("proposal expiry job error")
        await asyncio.sleep(_PROPOSAL_EXPIRY_INTERVAL_S)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Background expiry runs only when a service role key is configured.
    task: asyncio.Task | None = None
    if settings.supabase_service_role_key and settings.supabase_url:
        task = asyncio.create_task(_proposal_expiry_loop())
        log.info("Proposal expiry job started.")
    yield
    if task is not None:
        task.cancel()
        try:
            await task
        except (asyncio.CancelledError, Exception):
            pass
    try:
        await close_client()
    except Exception:
        log.exception("supabase_db close_client error")


app = FastAPI(title="FinPath Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    max_age=600,
)

app.include_router(penny_router)
app.include_router(profile_router)
app.include_router(simulate_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
