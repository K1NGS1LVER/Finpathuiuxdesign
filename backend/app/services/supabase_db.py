"""PostgREST helpers for chat_history + proposals (Phase 3).

Writes go through Supabase PostgREST using the *user's* JWT so RLS
(`auth.uid() = user_id`) is enforced automatically.

When `AUTH_MOCK=true` or Supabase isn't configured, all writes/reads
become no-ops returning empty data — the agent still works locally
without a real Supabase project.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.config import settings

log = logging.getLogger(__name__)


def _rest_base() -> str | None:
    url = (settings.supabase_url or "").rstrip("/")
    if not url or not settings.supabase_anon_key:
        return None
    return f"{url}/rest/v1"


def _user_headers(user_jwt: str | None) -> dict[str, str]:
    headers = {
        "apikey": settings.supabase_anon_key,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if user_jwt:
        headers["Authorization"] = f"Bearer {user_jwt}"
    return headers


def _service_headers() -> dict[str, str]:
    return {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


# ── chat_history ────────────────────────────────────────────────
async def insert_chat_message(
    user_jwt: str | None,
    user_id: str,
    role: str,
    content: str,
    tool_calls: list[dict[str, Any]] | None = None,
    tool_results: list[dict[str, Any]] | None = None,
) -> None:
    base = _rest_base()
    if base is None or not user_jwt:
        return
    body = {
        "user_id": user_id,
        "role": role,
        "content": content,
        "tool_calls": tool_calls,
        "tool_results": tool_results,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{base}/chat_history",
                headers=_user_headers(user_jwt),
                json=body,
            )
            if r.status_code >= 400:
                log.warning("insert_chat_message failed %s %s", r.status_code, r.text)
    except Exception:
        log.exception("insert_chat_message error")


async def list_chat_history(
    user_jwt: str | None,
    user_id: str,
    limit: int = 50,
) -> list[dict[str, Any]]:
    base = _rest_base()
    if base is None or not user_jwt:
        return []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"{base}/chat_history",
                headers=_user_headers(user_jwt),
                params={
                    "user_id": f"eq.{user_id}",
                    "order": "created_at.desc",
                    "limit": str(limit),
                    "select": "id,role,content,tool_calls,tool_results,created_at",
                },
            )
            if r.status_code >= 400:
                log.warning("list_chat_history failed %s %s", r.status_code, r.text)
                return []
            rows = r.json() or []
            rows.reverse()  # oldest → newest for UI replay
            return rows
    except Exception:
        log.exception("list_chat_history error")
        return []


# ── proposals ──────────────────────────────────────────────────
async def insert_proposal(
    user_jwt: str | None,
    user_id: str,
    action: str,
    payload: dict[str, Any],
    rationale: str | None,
    proposal_id: str | None = None,
) -> dict[str, Any] | None:
    base = _rest_base()
    if base is None or not user_jwt:
        return None
    body: dict[str, Any] = {
        "user_id": user_id,
        "action": action,
        "payload": payload,
        "rationale": rationale,
        "status": "pending",
    }
    if proposal_id:
        body["id"] = proposal_id
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{base}/proposals",
                headers=_user_headers(user_jwt),
                json=body,
            )
            if r.status_code >= 400:
                log.warning("insert_proposal failed %s %s", r.status_code, r.text)
                return None
            rows = r.json()
            return rows[0] if isinstance(rows, list) and rows else None
    except Exception:
        log.exception("insert_proposal error")
        return None


async def get_proposal(user_jwt: str | None, proposal_id: str) -> dict[str, Any] | None:
    base = _rest_base()
    if base is None or not user_jwt:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"{base}/proposals",
                headers=_user_headers(user_jwt),
                params={"id": f"eq.{proposal_id}", "select": "*"},
            )
            if r.status_code >= 400:
                return None
            rows = r.json() or []
            return rows[0] if rows else None
    except Exception:
        log.exception("get_proposal error")
        return None


async def update_proposal_status(
    user_jwt: str | None,
    proposal_id: str,
    status: str,
) -> dict[str, Any] | None:
    if status not in {"approved", "rejected", "expired"}:
        return None
    base = _rest_base()
    if base is None or not user_jwt:
        return None
    body = {
        "status": status,
        "resolved_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.patch(
                f"{base}/proposals",
                headers=_user_headers(user_jwt),
                params={"id": f"eq.{proposal_id}", "status": "eq.pending"},
                json=body,
            )
            if r.status_code >= 400:
                log.warning("update_proposal_status failed %s %s", r.status_code, r.text)
                return None
            rows = r.json() or []
            return rows[0] if rows else None
    except Exception:
        log.exception("update_proposal_status error")
        return None


async def expire_stale_proposals(max_age_hours: int = 24) -> int:
    """Service-role job — marks any pending proposal older than `max_age_hours` as expired."""
    base = _rest_base()
    if base is None or not settings.supabase_service_role_key:
        return 0
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=max_age_hours)).isoformat()
    body = {
        "status": "expired",
        "resolved_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.patch(
                f"{base}/proposals",
                headers=_service_headers(),
                params={
                    "status": "eq.pending",
                    "created_at": f"lt.{cutoff}",
                },
                json=body,
            )
            if r.status_code >= 400:
                log.warning("expire_stale_proposals failed %s %s", r.status_code, r.text)
                return 0
            rows = r.json() or []
            return len(rows)
    except Exception:
        log.exception("expire_stale_proposals error")
        return 0
