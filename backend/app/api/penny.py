"""Penny API — Phase 0 chat proxy + Phase 3 LangGraph SSE stream + chat/proposal CRUD."""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Path, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agents.penny import stream_agent
from app.auth import CurrentUser, get_current_user
from app.services.cache import cache_key, response_cache
from app.services.groq_client import get_groq_client
from app.services.prompt import build_system_prompt
from app.services.rate_limit import rate_limiter
from app.services.supabase_db import (
    get_proposal,
    insert_chat_message,
    insert_proposal,
    list_chat_history,
    update_proposal_status,
)

log = logging.getLogger(__name__)
router = APIRouter()


class PennyChatRequest(BaseModel):
    message: str = Field(min_length=1)
    profile: dict[str, Any]
    context: str | None = None


class PennyChatResponse(BaseModel):
    reply: str


@router.post("/api/penny", response_model=PennyChatResponse)
async def chat(
    req: PennyChatRequest,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
) -> PennyChatResponse:
    # Rate-limit per authenticated user (falls back to IP only if uid unknown).
    rl_key = user.user_id or (request.client.host if request.client else "unknown")
    if not rate_limiter.check(rl_key):
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


# ── Phase 3: SSE streaming agent ─────────────────────────────────
class PennyStreamRequest(BaseModel):
    message: str = Field(min_length=1)
    profile: dict[str, Any]
    history: list[dict[str, str]] | None = None


def _sse_format(event: str, data: Any) -> str:
    payload = data if isinstance(data, str) else json.dumps(data, default=str)
    # SSE: each `data:` line followed by blank line; multiline data must be
    # split per spec — JSON has no raw newlines so single-line is fine.
    return f"event: {event}\ndata: {payload}\n\n"


@router.post("/api/penny/stream")
async def chat_stream(
    req: PennyStreamRequest,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
) -> StreamingResponse:
    rl_key = user.user_id or (request.client.host if request.client else "unknown")
    if not rate_limiter.check(rl_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait a moment before asking again.",
        )

    import uuid

    proposal_queue: asyncio.Queue = asyncio.Queue()
    loop = asyncio.get_running_loop()

    # propose_change tool callback. Tools run synchronously (possibly off-loop
    # in a worker thread), so we use loop.call_soon_threadsafe to enqueue and
    # asyncio.run_coroutine_threadsafe to fire DB persistence without waiting.
    def _propose(action: str, payload: dict[str, Any], rationale: str) -> dict[str, Any]:
        proposal_id = str(uuid.uuid4())
        row = {
            "id": proposal_id,
            "user_id": user.user_id,
            "action": action,
            "payload": payload,
            "rationale": rationale,
            "status": "pending",
        }
        loop.call_soon_threadsafe(proposal_queue.put_nowait, row)
        # Fire-and-forget DB persistence with the same id (no await).
        asyncio.run_coroutine_threadsafe(
            insert_proposal(
                user_jwt=user.access_token,
                user_id=user.user_id,
                action=action,
                payload=payload,
                rationale=rationale,
                proposal_id=proposal_id,
            ),
            loop,
        )
        return row

    async def event_source() -> AsyncIterator[bytes]:
        # Persist the incoming user message up-front so chat history is correct
        # even if the agent fails mid-stream.
        await insert_chat_message(
            user_jwt=user.access_token,
            user_id=user.user_id,
            role="user",
            content=req.message,
        )

        assistant_reply = ""
        tool_calls_log: list[dict[str, Any]] = []
        tool_results_log: list[dict[str, Any]] = []

        try:
            async for ev in stream_agent(
                profile=req.profile,
                user_message=req.message,
                history=req.history,
                propose=_propose,
                proposal_queue=proposal_queue,
            ):
                if ev["event"] == "done":
                    payload = ev["data"]
                    assistant_reply = payload.get("reply") or ""
                    tool_calls_log = payload.get("tool_calls") or []
                    tool_results_log = payload.get("tool_results") or []
                yield _sse_format(ev["event"], ev["data"]).encode("utf-8")
        except Exception as exc:
            log.exception("SSE stream error")
            yield _sse_format("error", str(exc) or "stream failed").encode("utf-8")
            return
        finally:
            if assistant_reply:
                await insert_chat_message(
                    user_jwt=user.access_token,
                    user_id=user.user_id,
                    role="assistant",
                    content=assistant_reply,
                    tool_calls=tool_calls_log or None,
                    tool_results=tool_results_log or None,
                )

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Phase 3: chat history ─────────────────────────────────────────
class ChatHistoryItem(BaseModel):
    id: str
    role: str
    content: str
    tool_calls: list[dict[str, Any]] | None = None
    tool_results: list[dict[str, Any]] | None = None
    created_at: str


@router.get("/api/chat/history", response_model=list[ChatHistoryItem])
async def chat_history(
    limit: int = 50,
    user: CurrentUser = Depends(get_current_user),
) -> list[dict[str, Any]]:
    rows = await list_chat_history(user.access_token, user.user_id, limit=max(1, min(limit, 200)))
    return rows


# ── Phase 3: proposal status update ───────────────────────────────
class ProposalPatch(BaseModel):
    status: str = Field(pattern="^(approved|rejected)$")


@router.patch("/api/proposals/{proposal_id}")
async def patch_proposal(
    body: ProposalPatch,
    proposal_id: str = Path(min_length=1),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    existing = await get_proposal(user.access_token, proposal_id)
    if existing is None:
        # No Supabase configured (or row never persisted in mock mode) — echo.
        from app.config import settings as _s
        if not (_s.supabase_url and _s.supabase_anon_key):
            return {"id": proposal_id, "status": body.status, "_ephemeral": True}
        raise HTTPException(status_code=404, detail="Proposal not found.")
    if existing.get("status") != "pending":
        raise HTTPException(
            status_code=409,
            detail=f"Proposal already {existing.get('status')}.",
        )
    updated = await update_proposal_status(user.access_token, proposal_id, body.status)
    if updated is None:
        raise HTTPException(status_code=500, detail="Failed to update proposal.")
    return updated
