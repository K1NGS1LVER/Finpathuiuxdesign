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
import re
from typing import Any, AsyncIterator, Callable

from langchain_core.messages import AIMessageChunk, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent

from app.agents.tools import make_tools
from app.config import settings
from app.services.prompt import build_system_prompt

log = logging.getLogger(__name__)


# Llama-3.3 sometimes leaks its function-calling fine-tune syntax into the
# user-visible reply (e.g. `<function=propose_change>{...}</function>`).
# We strip both the closed and open variants from streamed tokens.
_FUNCTION_TAG_RE = re.compile(r"<function=[^>]*>(.*?</function>)?", re.DOTALL)
_FUNCTION_OPEN_RE = re.compile(r"<function=[^>]*$")


SYSTEM_SUFFIX = """

TOOLS AVAILABLE:
- read_profile() — pull a structured snapshot of the user's profile.
- simulate_plan() — run the 120-month plan as-is.
- simulate_what_if(income_change_pct, expense_change_pct, timeline_change_months) — scenario plan.
- compare_debt_strategies() — avalanche vs snowball.
- check_health() — recompute the 4D health score.
- propose_change(action, payload, rationale) — propose a single store mutation for user Approve/Reject.

TOOL USAGE RULES:
1. NEVER answer a numeric what-if question without first calling simulate_what_if. Don't guess outcomes.
2. Call each tool AT MOST ONCE per turn. If you already called simulate_what_if, do not call it again with the same args.
3. NEVER call propose_change unless tool math actually supports the change.
4. Allowed propose_change actions: setStrategy, setEmergencyFund, setSavings, setInvestments, updateGoal, addGoal, removeGoal, addLumpsum, addDebt.
5. propose_change.payload must match the Zustand setter shape:
   - updateGoal -> {"id": "...", "updates": {...}}
   - addLumpsum -> {"goalId": "...", "amount": <positive number>} (amount > 0; never negative)
   - addDebt   -> {"debt": {"name": "...", "principal": <positive amount>, "interestRate": <annual %>, "monthlyPayment": <amount>, "category": "personalLoan|creditCard|homeLoan|carLoan|educationLoan|other"}}
     For addDebt: principal is always POSITIVE (the amount owed). If user says "I owe 10000" or "add 10000 debt", principal = 10000.
     Never use addLumpsum to model a new debt — use addDebt.
6. ALWAYS include a one-sentence `rationale` in every propose_change call (e.g. "User requested adding a personal debt of ₹10,000."). Empty rationale is allowed by the tool but worsens the user experience.
7. Tool calls happen via the API only. NEVER write `<function=...>`, `</function>`, JSON tool-call blocks, or any literal tool-invocation syntax in your reply text. Use the function-calling API to invoke tools; the reply is plain prose for the user.
8. Do NOT instruct the user to call a function or suggest "calling X". Either call the tool yourself via the API, or omit the suggestion. The user does not see tool names.

FINAL REPLY FORMAT — STRICT:
- Two short paragraphs separated by a blank line. 4-6 sentences total.
- Paragraph 1 (TL;DR): 2-3 sentences. Lead with the answer + the key number from the tool result.
- Paragraph 2 (Why + next step): 2-3 sentences. Brief reasoning + one concrete action in plain English (no tool names, no code).
- Every ₹ amount, % and month count wrapped in markdown bold: **₹12,500**, **8 months**, **+15%**.
- Do NOT repeat the same scenario twice. Do NOT restate the user's question. No greetings, no filler.
- Plain prose only. No XML, no JSON, no `<function=...>` tags.
"""


def _llm() -> ChatGroq:
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY not set on backend")
    return ChatGroq(
        api_key=settings.groq_api_key,
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        max_tokens=350,
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
    token_buffer = ""  # holds tail across chunks so we can detect split tags

    try:
        async for event in graph.astream_events({"messages": messages}, version="v2"):
            kind = event.get("event")

            if kind == "on_chat_model_stream":
                chunk = event["data"].get("chunk")
                if isinstance(chunk, AIMessageChunk):
                    text = chunk.content
                    if isinstance(text, str) and text:
                        token_buffer += text
                        cleaned = _FUNCTION_TAG_RE.sub("", token_buffer)
                        # If a `<function=` tag opens but hasn't closed yet, hold the
                        # tail back until the next chunk so we don't leak partial markup.
                        open_match = _FUNCTION_OPEN_RE.search(cleaned)
                        if open_match:
                            emit = cleaned[: open_match.start()]
                            token_buffer = cleaned[open_match.start() :]
                        else:
                            emit = cleaned
                            token_buffer = ""
                        if emit:
                            final_text_parts.append(emit)
                            yield {"event": "token", "data": emit}

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

    # If the stream ended while we were holding back text behind an unclosed
    # `<function=` tag, strip and emit what's left so the user isn't left mid-sentence.
    if token_buffer:
        leftover = _FUNCTION_TAG_RE.sub("", token_buffer)
        leftover = _FUNCTION_OPEN_RE.sub("", leftover)
        if leftover:
            final_text_parts.append(leftover)
            yield {"event": "token", "data": leftover}

    final_text = "".join(final_text_parts).strip()
    yield {
        "event": "done",
        "data": {
            "reply": final_text,
            "tool_calls": tool_calls_log,
            "tool_results": tool_results_log,
        },
    }
