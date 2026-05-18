"""Profile API — Phase 4 dual storage.

GET /api/profile  → read remote profile (cloud).
PUT /api/profile  → upsert remote profile. Last-write-wins on `data.lastUpdated`.

When Supabase isn't configured (or AUTH_MOCK + no anon key), endpoints
return an ephemeral echo so the frontend can still operate locally.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import CurrentUser, get_current_user
from app.services.supabase_db import get_profile, upsert_profile

log = logging.getLogger(__name__)
router = APIRouter()


class ProfileBody(BaseModel):
    data: dict[str, Any]
    storage_mode: str = Field(default="cloud", pattern="^(local|cloud)$")
    schema_version: int = 3
    # When true, skip the last-write-wins guard. Used by explicit "force push
    # local → cloud" flows from the Settings panel.
    force: bool = False


def _extract_ts(data: Any) -> float | None:
    if not isinstance(data, dict):
        return None
    ts = data.get("lastUpdated")
    return ts if isinstance(ts, (int, float)) else None


@router.get("/api/profile")
async def read_profile(user: CurrentUser = Depends(get_current_user)) -> dict[str, Any]:
    row = await get_profile(user.access_token, user.user_id)
    if row is None:
        return {
            "user_id": user.user_id,
            "data": None,
            "storage_mode": "local",
            "schema_version": 3,
            "updated_at": None,
            "_ephemeral": True,
        }
    return row


@router.put("/api/profile")
async def write_profile(
    body: ProfileBody,
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    if not body.force:
        existing = await get_profile(user.access_token, user.user_id)
        existing_ts = _extract_ts((existing or {}).get("data"))
        new_ts = _extract_ts(body.data)
        if existing_ts is not None and new_ts is not None and existing_ts > new_ts:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Remote profile is newer. Refresh and retry.",
            )

    row = await upsert_profile(
        user.access_token,
        user.user_id,
        body.data,
        body.storage_mode,
        body.schema_version,
    )
    if row is None:
        # Supabase not configured — echo ephemerally so dev still works.
        return {
            "user_id": user.user_id,
            "data": body.data,
            "storage_mode": body.storage_mode,
            "schema_version": body.schema_version,
            "updated_at": datetime.now(UTC).isoformat(),
            "_ephemeral": True,
        }
    return row
