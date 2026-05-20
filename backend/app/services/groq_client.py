"""Groq client singleton."""

from __future__ import annotations

import logging
from functools import lru_cache

import httpx
from groq import Groq

from app.config import settings

log = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_groq_client() -> Groq:
    if not settings.groq_api_key:
        log.error("[Penny API] GROQ_API_KEY is not set in environment!")
    return Groq(
        api_key=settings.groq_api_key or "",
        http_client=httpx.Client(
            timeout=httpx.Timeout(connect=5.0, read=30.0, write=5.0, pool=5.0)
        ),
    )
