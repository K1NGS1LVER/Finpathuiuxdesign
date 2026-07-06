"""Tests for stream_agent's event loop: streaming, caps, and retry policy.

The LangGraph graph is faked via monkeypatching `build_graph`, so these run
without any network access. They cover:
- token streaming + final `done` assembly
- tool_call / tool_result passthrough (including ok:False error payloads)
- proposal SSE emission via the queue drain
- recursion-limit and wall-clock caps ending the turn gracefully
- rate-limit policy: one same-model retry, then fallback model, then error
"""

from __future__ import annotations

import asyncio
from typing import Any

import groq
import httpx
import pytest
from langchain_core.messages import AIMessageChunk
from langgraph.errors import GraphRecursionError

from app.agents import penny as penny_mod
from app.agents.penny import stream_agent
from app.config import settings


def _rate_limit_error(retry_after: str | None = "0.01") -> groq.RateLimitError:
    headers = {"retry-after": retry_after} if retry_after else {}
    request = httpx.Request("POST", "https://api.groq.com/v1/chat/completions")
    response = httpx.Response(429, headers=headers, request=request)
    return groq.RateLimitError("rate limited", response=response, body=None)


class _FakeGraph:
    """Mimics LangGraph's `.astream_events` async generator."""

    def __init__(
        self,
        events: list[dict[str, Any]] | None = None,
        raises: list[Exception] | None = None,
    ) -> None:
        self._events = events or []
        self._raises = list(raises or [])
        self.calls = 0

    async def astream_events(self, _state: Any, version: str = "v2", config: Any = None):
        self.calls += 1
        if self._raises:
            raise self._raises.pop(0)
        for ev in self._events:
            yield ev


def _token(text: str) -> dict[str, Any]:
    return {"event": "on_chat_model_stream", "data": {"chunk": AIMessageChunk(content=text)}}


async def _collect(profile: dict[str, Any] | None = None, **kwargs: Any) -> list[dict[str, Any]]:
    queue: asyncio.Queue = kwargs.pop("proposal_queue", asyncio.Queue())
    events: list[dict[str, Any]] = []
    async for ev in stream_agent(
        profile=profile or {},
        user_message=kwargs.pop("user_message", "hi"),
        history=kwargs.pop("history", None),
        propose=kwargs.pop("propose", lambda a, p, r: {"id": "x", "status": "pending"}),
        proposal_queue=queue,
        context=None,
    ):
        events.append(ev)
    return events


@pytest.mark.asyncio
async def test_stream_agent_streams_tokens_and_done(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeGraph(events=[_token("Hello "), _token("world.")])
    monkeypatch.setattr(penny_mod, "build_graph", lambda p, cb, model=None: (fake, []))

    events = await _collect()
    tokens = [ev["data"] for ev in events if ev["event"] == "token"]
    assert tokens == ["Hello ", "world."]
    done = events[-1]
    assert done["event"] == "done"
    assert done["data"]["reply"] == "Hello world."


@pytest.mark.asyncio
async def test_stream_agent_passes_tool_events_through(monkeypatch: pytest.MonkeyPatch) -> None:
    error_output = {"ok": False, "error": "Goal id 'goal-1' not found."}
    fake = _FakeGraph(
        events=[
            {"event": "on_tool_start", "name": "propose_change", "data": {"input": {"a": 1}}},
            {"event": "on_tool_end", "name": "propose_change", "data": {"output": error_output}},
            _token("Sorry, that goal does not exist."),
        ]
    )
    monkeypatch.setattr(penny_mod, "build_graph", lambda p, cb, model=None: (fake, []))

    events = await _collect()
    kinds = [ev["event"] for ev in events]
    assert "tool_call" in kinds
    assert "tool_result" in kinds
    tr = next(ev for ev in events if ev["event"] == "tool_result")
    # Error payloads flow back verbatim so the model can self-correct.
    assert tr["data"]["output"] == error_output
    done = events[-1]
    assert done["data"]["tool_calls"] == [{"name": "propose_change", "input": {"a": 1}}]


@pytest.mark.asyncio
async def test_stream_agent_emits_proposals_from_queue(monkeypatch: pytest.MonkeyPatch) -> None:
    row = {"id": "prop-1", "action": "updateGoal", "payload": {}, "status": "pending"}
    queue: asyncio.Queue = asyncio.Queue()
    queue.put_nowait(row)
    fake = _FakeGraph(events=[_token("I've proposed this change — approve it in the card below.")])
    monkeypatch.setattr(penny_mod, "build_graph", lambda p, cb, model=None: (fake, []))

    events = await _collect(proposal_queue=queue)
    proposals = [ev for ev in events if ev["event"] == "proposal"]
    assert proposals == [{"event": "proposal", "data": row}]
    # A proposal was emitted, so the phantom-proposal guard must NOT fire.
    assert not any(ev["event"] == "error" for ev in events)


@pytest.mark.asyncio
async def test_stream_agent_phantom_proposal_guard(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeGraph(events=[_token("Done! Review and approve it in the card below.")])
    monkeypatch.setattr(penny_mod, "build_graph", lambda p, cb, model=None: (fake, []))

    events = await _collect()
    # Proposal language without any proposal event => correction + error.
    assert any(ev["event"] == "error" for ev in events)
    done = events[-1]
    assert "wasn't created" in done["data"]["reply"]


@pytest.mark.asyncio
async def test_stream_agent_recursion_limit_ends_gracefully(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake = _FakeGraph(raises=[GraphRecursionError("too deep")])
    monkeypatch.setattr(penny_mod, "build_graph", lambda p, cb, model=None: (fake, []))

    events = await _collect()
    kinds = [ev["event"] for ev in events]
    assert kinds[-1] == "done"
    assert "error" in kinds


@pytest.mark.asyncio
async def test_stream_agent_wall_clock_budget(monkeypatch: pytest.MonkeyPatch) -> None:
    class _SlowGraph:
        async def astream_events(self, _state: Any, version: str = "v2", config: Any = None):
            await asyncio.sleep(5)
            yield _token("too late")

    monkeypatch.setattr(penny_mod, "_WALL_CLOCK_BUDGET_S", 0.05)
    monkeypatch.setattr(penny_mod, "build_graph", lambda p, cb, model=None: (_SlowGraph(), []))

    events = await _collect()
    kinds = [ev["event"] for ev in events]
    assert kinds[-1] == "done"
    assert "error" in kinds
    assert not any(ev["event"] == "token" for ev in events)


@pytest.mark.asyncio
async def test_stream_agent_rate_limit_retries_then_falls_back(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """First two attempts on the primary 429 -> one same-model retry, then the
    fallback model streams the reply."""
    primary = _FakeGraph(raises=[_rate_limit_error(), _rate_limit_error()])
    fallback = _FakeGraph(events=[_token("fallback answer")])
    built_models: list[str | None] = []

    def fake_build_graph(profile: dict, propose, model=None):
        built_models.append(model)
        return (fallback if model == settings.groq_fallback_model else primary), []

    monkeypatch.setattr(penny_mod, "build_graph", fake_build_graph)

    events = await _collect()
    done = events[-1]
    assert done["data"]["reply"] == "fallback answer"
    assert primary.calls == 2  # initial + one retry
    assert built_models == [settings.groq_primary_model, settings.groq_fallback_model]


@pytest.mark.asyncio
async def test_stream_agent_rate_limit_exhausted_yields_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Primary retries exhausted AND fallback rate-limited -> user-facing error."""
    always_limited = _FakeGraph(
        raises=[_rate_limit_error(), _rate_limit_error(), _rate_limit_error()]
    )
    monkeypatch.setattr(penny_mod, "build_graph", lambda p, cb, model=None: (always_limited, []))

    events = await _collect()
    kinds = [ev["event"] for ev in events]
    assert "error" in kinds
    assert kinds[-1] == "done"
    assert "rate-limited" in events[-1]["data"]["reply"]


@pytest.mark.asyncio
async def test_stream_agent_daily_limit_skips_retry(monkeypatch: pytest.MonkeyPatch) -> None:
    """A daily-quota 429 must not burn a retry sleep on the same model — it
    goes straight to the fallback model."""
    daily = groq.RateLimitError(
        "tokens_per_day exhausted",
        response=httpx.Response(429, request=httpx.Request("POST", "https://api.groq.com")),
        body=None,
    )
    primary = _FakeGraph(raises=[daily])
    fallback = _FakeGraph(events=[_token("ok")])

    def fake_build_graph(profile: dict, propose, model=None):
        return (fallback if model == settings.groq_fallback_model else primary), []

    monkeypatch.setattr(penny_mod, "build_graph", fake_build_graph)

    events = await _collect()
    assert events[-1]["data"]["reply"] == "ok"
    assert primary.calls == 1  # no same-model retry on daily limits
