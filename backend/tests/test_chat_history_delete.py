"""Tests for DELETE /api/chat/history endpoint + supabase helper."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.services import supabase_db


@pytest.mark.asyncio
async def test_delete_returns_false_without_supabase(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(supabase_db.settings, "supabase_url", "")
    monkeypatch.setattr(supabase_db.settings, "supabase_anon_key", "")
    ok = await supabase_db.delete_chat_history("jwt-token", "user-1")
    assert ok is False


@pytest.mark.asyncio
async def test_delete_returns_false_without_jwt(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(supabase_db.settings, "supabase_url", "https://x.supabase.co")
    monkeypatch.setattr(supabase_db.settings, "supabase_anon_key", "anon-key")
    ok = await supabase_db.delete_chat_history(None, "user-1")
    assert ok is False


@pytest.mark.asyncio
async def test_delete_calls_postgrest_with_user_filter(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(supabase_db.settings, "supabase_url", "https://x.supabase.co")
    monkeypatch.setattr(supabase_db.settings, "supabase_anon_key", "anon-key")

    class FakeResp:
        status_code = 204
        text = ""

    client = AsyncMock()
    client.delete = AsyncMock(return_value=FakeResp())

    with patch.object(supabase_db, "get_client", AsyncMock(return_value=client)):
        ok = await supabase_db.delete_chat_history("jwt-token", "user-1")

    assert ok is True
    args, kwargs = client.delete.call_args
    assert args[0].endswith("/chat_history")
    assert kwargs["params"] == {"user_id": "eq.user-1"}
    assert kwargs["headers"]["Authorization"] == "Bearer jwt-token"


@pytest.mark.asyncio
async def test_delete_returns_false_on_4xx(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(supabase_db.settings, "supabase_url", "https://x.supabase.co")
    monkeypatch.setattr(supabase_db.settings, "supabase_anon_key", "anon-key")

    class FakeResp:
        status_code = 403
        text = "forbidden"

    client = AsyncMock()
    client.delete = AsyncMock(return_value=FakeResp())

    with patch.object(supabase_db, "get_client", AsyncMock(return_value=client)):
        ok = await supabase_db.delete_chat_history("jwt-token", "user-1")

    assert ok is False
