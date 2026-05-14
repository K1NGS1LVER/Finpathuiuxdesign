"""LangGraph agent for Penny (Phase 3).

A ReAct-style tool-using agent built on `langgraph.prebuilt.create_react_agent`.
We use the prebuilt graph for simplicity — it natively implements the
`ROUTER → RESEARCH → PLAN → {CHAT | PROPOSE}` flow we wanted:

- `ROUTER`: model decides whether tool use is needed.
- `RESEARCH/PLAN`: model issues `simulate_*`/`check_health`/`read_profile`
  tool calls; results feed back into the model.
- `CHAT`: free-form reply when no more tools are needed.
- `PROPOSE`: model calls `propose_change`; the tool persists the row and
  emits an SSE `proposal` event.

`stream_agent` wraps `graph.astream_events` and yields normalized SSE
event dicts: token / tool_call / tool_result / proposal / done / error.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, AsyncIterator, Callable

from langchain_core.messages import AIMessageChunk, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent

from app.agents.tools import make_tools
from app.config import settings
from app.services.prompt import build_system_prompt

log = logging.getLogger(__name__)


SYSTEM_SUFFIX = """

TOOLS AVAILABLE:
- read_profile() — pull a structured snapshot of the user's profile.
- simulate_plan() — run the 120-month plan as-is.
- simulate_what_if(income_change_pct, expense_change_pct, timeline_change_months) — scenario plan.
- compare_debt_strategies() — avalanche vs snowball.
- check_health() — recompute the 4D health score.
- propose_change(action, payload, rationale) — propose a single store mutation for user Approve/Reject.

TOOL USAGE RULES:
1. NEVER answer a numeric what-if question (e.g. "what if I raise EMI by 5k?") without first calling simulate_what_if. Don't guess outcomes.
2. NEVER call propose_change unless the math from a simulate_* / check_health tool actually supports the change.
3. Allowed propose_change actions: setStrategy, setEmergencyFund, setSavings, setInvestments, updateGoal, addGoal, removeGoal, addLumpsum.
4. propose_change.payload must be valid for the corresponding Zustand setter (e.g. updateGoal -> {"id": "...", "updates": {...}}).
5. Keep your final reply 3-5 sentences. Reference the numbers the tool returned.
"""


def _llm() -> ChatGroq:
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY not set on backend")
    return ChatGroq(
        api_key=settings.groq_api_key,
        model="llama-3.3-70b-versatile",
        temperature=0.4,
        max_tokens=700,
    )


def build_graph(
    profile: dict[str, Any],
    propose: Callable[[str, dict[str, Any], str], dict[str, Any]],
):
    tools = make_tools(profile, propose)
    return create_react_agent(_llm(), tools)


async def stream_agent(
    profile: dict[str, Any],
    user_message: str,
    history: list[dict[str, str]] | None,
    propose: Callable[[str, dict[str, Any], str], dict[str, Any]],
    proposal_queue: asyncio.Queue,
) -> AsyncIterator[dict[str, Any]]:
    """Stream normalized SSE events for one Penny turn.

    Yields dicts with shape `{"event": str, "data": dict | str}` for the SSE
    endpoint to serialize.
    """
    graph = build_graph(profile, propose)

    sys_prompt = build_system_prompt(profile) + SYSTEM_SUFFIX
    messages: list[Any] = [SystemMessage(content=sys_prompt)]
    for m in history or []:
        role = m.get("role")
        content = m.get("content") or ""
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            from langchain_core.messages import AIMessage
            messages.append(AIMessage(content=content))
    messages.append(HumanMessage(content=user_message))

    final_text_parts: list[str] = []
    tool_calls_log: list[dict[str, Any]] = []
    tool_results_log: list[dict[str, Any]] = []

    try:
        async for event in graph.astream_events({"messages": messages}, version="v2"):
            kind = event.get("event")

            if kind == "on_chat_model_stream":
                chunk = event["data"].get("chunk")
                if isinstance(chunk, AIMessageChunk):
                    text = chunk.content
                    if isinstance(text, str) and text:
                        final_text_parts.append(text)
                        yield {"event": "token", "data": text}

            elif kind == "on_tool_start":
                name = event.get("name") or ""
                tool_input = event["data"].get("input") or {}
                tool_calls_log.append({"name": name, "input": tool_input})
                yield {
                    "event": "tool_call",
                    "data": {"name": name, "input": tool_input},
                }

            elif kind == "on_tool_end":
                name = event.get("name") or ""
                output = event["data"].get("output")
                try:
                    if hasattr(output, "content"):
                        payload = output.content
                    else:
                        payload = output
                except Exception:
                    payload = str(output)
                tool_results_log.append({"name": name, "output": payload})
                yield {
                    "event": "tool_result",
                    "data": {"name": name, "output": payload},
                }

            # Drain any proposals enqueued by propose_change in the meantime.
            while not proposal_queue.empty():
                prop = proposal_queue.get_nowait()
                yield {"event": "proposal", "data": prop}

    except Exception as exc:
        log.exception("Penny agent error")
        yield {"event": "error", "data": str(exc) or "agent error"}
        return

    # Final drain in case a proposal was queued after the last LLM event.
    while not proposal_queue.empty():
        prop = proposal_queue.get_nowait()
        yield {"event": "proposal", "data": prop}

    final_text = "".join(final_text_parts).strip()
    yield {
        "event": "done",
        "data": {
            "reply": final_text,
            "tool_calls": tool_calls_log,
            "tool_results": tool_results_log,
        },
    }
