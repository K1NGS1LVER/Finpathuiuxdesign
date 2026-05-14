"""POST /api/penny — Groq proxy with PII anonymization, rate limit, response cache."""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.services.cache import cache_key, response_cache
from app.services.groq_client import get_groq_client
from app.services.prompt import build_system_prompt
from app.services.rate_limit import rate_limiter

log = logging.getLogger(__name__)
router = APIRouter()


class PennyChatRequest(BaseModel):
    message: str = Field(min_length=1)
    profile: dict[str, Any]
    context: str | None = None


class PennyChatResponse(BaseModel):
    reply: str


@router.post("/api/penny", response_model=PennyChatResponse)
async def chat(req: PennyChatRequest, request: Request) -> PennyChatResponse:
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.check(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait a moment before asking again.",
        )

    key = cache_key(req.message, req.profile)
    cached = response_cache.get(key)
    if cached is not None:
        return PennyChatResponse(reply=cached)

    messages: list[dict[str, str]] = [
        {"role": "system", "content": build_system_prompt(req.profile)},
    ]
    if req.context:
        messages.append(
            {"role": "user", "content": f"[Context: The user is currently on the {req.context} page of the app.]"}
        )
    messages.append({"role": "user", "content": req.message})

    try:
        completion = get_groq_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=500,
            stream=False,
        )
    except Exception as exc:
        log.exception("Groq API error")
        raise HTTPException(status_code=500, detail=str(exc) or "Failed to get response from Penny") from exc

    reply = ""
    if completion.choices and completion.choices[0].message:
        reply = completion.choices[0].message.content or ""
    if not reply:
        reply = "I'm having trouble thinking right now. Try again?"

    response_cache.set(key, reply)
    return PennyChatResponse(reply=reply)
