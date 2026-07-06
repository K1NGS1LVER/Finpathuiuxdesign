"""Tests for leaked `<function=...>` tool-call recovery in stream_agent."""

from __future__ import annotations

import asyncio
from typing import Any

import pytest
from langchain_core.messages import AIMessageChunk

from app.agents import penny as penny_mod
from app.agents.penny import (
    _extract_leaked_calls,
    _extract_leaked_open_calls,
    _first_json_object,
    _signature,
    stream_agent,
)
from app.agents.tools import make_tools

# ── unit: parser ──────────────────────────────────────────────────


def test_extract_leaked_calls_attribute_form() -> None:
    text = (
        '<function=propose_change {"action": "updateGoal", "payload": '
        '{"id": "goal-1", "updates": {"target": 150000}}, '
        '"rationale": "bump"}></function>'
    )
    calls = _extract_leaked_calls(text)
    assert len(calls) == 1
    name, args = calls[0]
    assert name == "propose_change"
    assert args["action"] == "updateGoal"
    assert args["payload"] == {"id": "goal-1", "updates": {"target": 150000}}
    assert args["rationale"] == "bump"


def test_extract_leaked_calls_body_form() -> None:
    text = (
        "<function=propose_change>"
        '{"action":"updateGoal","payload":'
        '{"id":"goal-1","updates":{"target":150000}},"rationale":"bump"}'
        "</function>"
    )
    calls = _extract_leaked_calls(text)
    assert len(calls) == 1
    name, args = calls[0]
    assert name == "propose_change"
    assert args["payload"]["updates"]["target"] == 150000


def test_extract_leaked_calls_nested_braces_preserved() -> None:
    text = '<function=foo {"a": {"b": {"c": 1}}}></function>'
    assert _extract_leaked_calls(text) == [("foo", {"a": {"b": {"c": 1}}})]


def test_extract_leaked_calls_malformed_json_dropped() -> None:
    assert _extract_leaked_calls("<function=foo {not json}></function>") == []


def test_extract_leaked_calls_no_json_dropped() -> None:
    assert _extract_leaked_calls("<function=foo></function>") == []


def test_extract_leaked_calls_open_only_ignored() -> None:
    # Unclosed tags must NOT be recovered — the stream may still be mid-tag.
    assert _extract_leaked_calls('<function=foo {"a": 1}>') == []


def test_first_json_object_with_string_braces() -> None:
    # Braces inside JSON strings must not terminate the object.
    assert _first_json_object('{"k": "}"} trailing') == '{"k": "}"}'


def test_signature_stable_across_key_order() -> None:
    assert _signature("x", {"a": 1, "b": 2}) == _signature("x", {"b": 2, "a": 1})


# ── integration: stream_agent end-to-end recovery ─────────────────


class _FakeGraph:
    """Mimics LangGraph's `.astream_events` async generator."""

    def __init__(self, events: list[dict[str, Any]]) -> None:
        self._events = events

    async def astream_events(self, _state: Any, version: str = "v2"):
        for ev in self._events:
            yield ev


@pytest.mark.asyncio
async def test_stream_agent_recovers_leaked_propose_change(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A leaked `<function=propose_change ...></function>` in chat content
    must fire tool_call + tool_result + proposal SSE events as if it had
    been a real tool call, and must NOT appear in the final visible reply."""
    leaked = (
        '<function=propose_change {"action": "updateGoal", '
        '"payload": {"id": "goal-1", "updates": {"target": 150000}}, '
        '"rationale": "User asked to bump target."}></function>'
    )
    fake_events = [
        {
            "event": "on_chat_model_stream",
            "data": {"chunk": AIMessageChunk(content=leaked)},
        },
    ]

    def fake_build_graph(profile: dict, propose, model=None):
        return _FakeGraph(fake_events), make_tools(profile, propose)

    monkeypatch.setattr(penny_mod, "build_graph", fake_build_graph)

    proposal_queue: asyncio.Queue = asyncio.Queue()
    captured: list[tuple[str, dict, str]] = []

    def propose_cb(action: str, payload: dict, rationale: str) -> dict:
        row = {
            "id": "prop-1",
            "user_id": "u",
            "action": action,
            "payload": payload,
            "rationale": rationale,
            "status": "pending",
        }
        proposal_queue.put_nowait(row)
        captured.append((action, payload, rationale))
        return row

    events: list[dict] = []
    async for ev in stream_agent(
        profile={"goals": [{"id": "goal-1", "name": "Bike", "status": "in-progress"}]},
        user_message="increase the p1 goal by 50%",
        history=None,
        propose=propose_cb,
        proposal_queue=proposal_queue,
        context=None,
    ):
        events.append(ev)

    # propose() callback fires with the *normalized* payload — `target` was
    # renamed to `targetAmount` by _propose_change before being forwarded.
    assert captured == [
        (
            "updateGoal",
            {"id": "goal-1", "updates": {"targetAmount": 150000}},
            "User asked to bump target.",
        )
    ]

    kinds = [ev["event"] for ev in events]
    assert "tool_call" in kinds
    assert "tool_result" in kinds
    assert "proposal" in kinds

    tc = next(ev for ev in events if ev["event"] == "tool_call")
    tr = next(ev for ev in events if ev["event"] == "tool_result")
    pr = next(ev for ev in events if ev["event"] == "proposal")
    assert tc["data"]["name"] == "propose_change"
    assert tc["data"].get("_recovered") is True
    assert tr["data"].get("_recovered") is True
    assert pr["data"]["action"] == "updateGoal"
    assert pr["data"]["payload"] == {"id": "goal-1", "updates": {"targetAmount": 150000}}

    done = next(ev for ev in events if ev["event"] == "done")
    assert "<function=" not in done["data"]["reply"]


@pytest.mark.asyncio
async def test_stream_agent_unknown_tool_name_dropped(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Leaked tag with an unknown tool name must NOT raise, NOT emit tool_call,
    and NOT call the propose callback."""
    leaked = '<function=nonexistent_tool {"x": 1}></function>'
    fake_events = [
        {
            "event": "on_chat_model_stream",
            "data": {"chunk": AIMessageChunk(content=leaked)},
        },
    ]

    def fake_build_graph(profile: dict, propose, model=None):
        return _FakeGraph(fake_events), make_tools(profile, propose)

    monkeypatch.setattr(penny_mod, "build_graph", fake_build_graph)

    proposal_queue: asyncio.Queue = asyncio.Queue()

    def propose_cb(action: str, payload: dict, rationale: str) -> dict:
        raise AssertionError("propose must not be called for unknown tools")

    events: list[dict] = []
    async for ev in stream_agent(
        profile={},
        user_message="anything",
        history=None,
        propose=propose_cb,
        proposal_queue=proposal_queue,
        context=None,
    ):
        events.append(ev)

    kinds = [ev["event"] for ev in events]
    assert "tool_call" not in kinds
    assert "proposal" not in kinds


@pytest.mark.asyncio
async def test_stream_agent_dedup_recovered_call_not_refired(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """If the model leaks the exact same tag in two consecutive chunks (or the
    same buffer is re-scanned), the dedup signature must prevent a second
    invocation."""
    leaked = (
        '<function=propose_change {"action": "setSavings", '
        '"payload": {"amount": 10000}, "rationale": "x"}></function>'
    )
    fake_events = [
        {
            "event": "on_chat_model_stream",
            "data": {"chunk": AIMessageChunk(content=leaked)},
        },
        # second chunk: same tag again (simulates Groq's chunk-replay quirk)
        {
            "event": "on_chat_model_stream",
            "data": {"chunk": AIMessageChunk(content=leaked)},
        },
    ]

    def fake_build_graph(profile: dict, propose, model=None):
        return _FakeGraph(fake_events), make_tools(profile, propose)

    monkeypatch.setattr(penny_mod, "build_graph", fake_build_graph)

    proposal_queue: asyncio.Queue = asyncio.Queue()
    call_count = 0

    def propose_cb(action: str, payload: dict, rationale: str) -> dict:
        nonlocal call_count
        call_count += 1
        row = {
            "id": f"prop-{call_count}",
            "user_id": "u",
            "action": action,
            "payload": payload,
            "rationale": rationale,
            "status": "pending",
        }
        proposal_queue.put_nowait(row)
        return row

    async for _ in stream_agent(
        profile={},
        user_message="save 10k",
        history=None,
        propose=propose_cb,
        proposal_queue=proposal_queue,
        context=None,
    ):
        pass

    assert call_count == 1


@pytest.mark.asyncio
async def test_propose_change_rejects_updategoal_on_completed_goal(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A leaked propose_change/updateGoal targeting a completed goal must
    return ok:False, enqueue NO proposal, and emit a tool_result that
    surfaces the error to the model (no `proposal` SSE event)."""
    leaked = (
        '<function=propose_change {"action": "updateGoal", '
        '"payload": {"id": "goal-done", "updates": {"target": 150000}}, '
        '"rationale": "bump"}></function>'
    )
    fake_events = [
        {
            "event": "on_chat_model_stream",
            "data": {"chunk": AIMessageChunk(content=leaked)},
        },
    ]

    profile_with_completed_goal: dict[str, Any] = {
        "income": {"total": 100000},
        "expenses": {"total": 50000},
        "debts": {"totalMonthly": 0, "items": []},
        "savings": 0,
        "investments": 0,
        "emergencyFund": 0,
        "strategy": "avalanche",
        "monthlySurplusReserve": 0,
        "goals": [
            {
                "id": "goal-done",
                "name": "Upskill Course",
                "targetAmount": 100000,
                "currentAmount": 100000,
                "timelineMonths": 12,
                "priority": 1,
                "status": "complete",
                "category": "education",
            }
        ],
    }

    def fake_build_graph(profile: dict, propose, model=None):
        return _FakeGraph(fake_events), make_tools(profile, propose)

    monkeypatch.setattr(penny_mod, "build_graph", fake_build_graph)

    proposal_queue: asyncio.Queue = asyncio.Queue()

    def propose_cb(action: str, payload: dict, rationale: str) -> dict:
        raise AssertionError("propose must not be called for completed goals")

    events: list[dict] = []
    async for ev in stream_agent(
        profile=profile_with_completed_goal,
        user_message="increase the top goal by 50%",
        history=None,
        propose=propose_cb,
        proposal_queue=proposal_queue,
        context=None,
    ):
        events.append(ev)

    kinds = [ev["event"] for ev in events]
    assert "proposal" not in kinds  # no proposal emitted

    # tool_result is emitted with ok:False + the error string for the model
    tool_results = [ev for ev in events if ev["event"] == "tool_result"]
    assert len(tool_results) == 1
    output = tool_results[0]["data"]["output"]
    assert output["ok"] is False
    assert "already complete" in output["error"]
    assert "Upskill Course" in output["error"]


def test_extract_leaked_open_calls_attribute_form() -> None:
    """Open-only tag (no `</function>`) must yield (name, args)."""
    text = (
        '<function=propose_change {"action":"setSavings",'
        '"payload":{"amount":10000},"rationale":"x"}>'
    )
    calls = _extract_leaked_open_calls(text)
    assert calls == [
        ("propose_change", {"action": "setSavings", "payload": {"amount": 10000}, "rationale": "x"})
    ]


def test_extract_leaked_open_calls_no_json_dropped() -> None:
    assert _extract_leaked_open_calls("<function=foo>") == []


@pytest.mark.asyncio
async def test_stream_agent_recovers_open_only_propose_change(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Llama leaks `<function=NAME {JSON}>` without ever writing `</function>`.
    The mid-stream strip removes the markup but recovery should still fire at
    final-drain via the open-only fallback."""
    leaked = (
        '<function=propose_change {"action": "updateGoal", '
        '"payload": {"id": "goal-1", "updates": {"target": 200000}}, '
        '"rationale": "bump"}>'
    )
    fake_events = [
        {
            "event": "on_chat_model_stream",
            "data": {"chunk": AIMessageChunk(content=leaked)},
        },
    ]

    def fake_build_graph(profile: dict, propose, model=None):
        return _FakeGraph(fake_events), make_tools(profile, propose)

    monkeypatch.setattr(penny_mod, "build_graph", fake_build_graph)

    proposal_queue: asyncio.Queue = asyncio.Queue()
    captured: list[tuple[str, dict, str]] = []

    def propose_cb(action: str, payload: dict, rationale: str) -> dict:
        row = {
            "id": "prop-x",
            "user_id": "u",
            "action": action,
            "payload": payload,
            "rationale": rationale,
            "status": "pending",
        }
        proposal_queue.put_nowait(row)
        captured.append((action, payload, rationale))
        return row

    events: list[dict] = []
    async for ev in stream_agent(
        profile={"goals": [{"id": "goal-1", "name": "Bike", "status": "in-progress"}]},
        user_message="bump it",
        history=None,
        propose=propose_cb,
        proposal_queue=proposal_queue,
        context=None,
    ):
        events.append(ev)

    # Normalized: `target` → `targetAmount`.
    assert captured == [
        ("updateGoal", {"id": "goal-1", "updates": {"targetAmount": 200000}}, "bump")
    ]
    kinds = [ev["event"] for ev in events]
    assert "tool_call" in kinds
    assert "proposal" in kinds
    done = next(ev for ev in events if ev["event"] == "done")
    assert "<function=" not in done["data"]["reply"]


@pytest.mark.asyncio
async def test_stream_agent_dedup_across_closed_and_open_passes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A closed tag's opening also satisfies the open-only regex. Both passes
    run at final-drain; signature dedup must ensure only ONE proposal fires."""
    leaked = (
        '<function=propose_change {"action":"setSavings",'
        '"payload":{"amount":5000},"rationale":"y"}></function>'
    )
    fake_events = [
        {
            "event": "on_chat_model_stream",
            "data": {"chunk": AIMessageChunk(content=leaked)},
        },
    ]

    def fake_build_graph(profile: dict, propose, model=None):
        return _FakeGraph(fake_events), make_tools(profile, propose)

    monkeypatch.setattr(penny_mod, "build_graph", fake_build_graph)

    proposal_queue: asyncio.Queue = asyncio.Queue()
    call_count = 0

    def propose_cb(action: str, payload: dict, rationale: str) -> dict:
        nonlocal call_count
        call_count += 1
        row = {
            "id": f"p{call_count}",
            "user_id": "u",
            "action": action,
            "payload": payload,
            "rationale": rationale,
            "status": "pending",
        }
        proposal_queue.put_nowait(row)
        return row

    async for _ in stream_agent(
        profile={},
        user_message="save 5k",
        history=None,
        propose=propose_cb,
        proposal_queue=proposal_queue,
        context=None,
    ):
        pass

    assert call_count == 1
