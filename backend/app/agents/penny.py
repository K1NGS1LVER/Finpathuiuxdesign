"""LangGraph agent for Penny.

A ReAct-style tool-using agent built on `langgraph.prebuilt.create_react_agent`
over Groq-hosted gpt-oss models, which do native tool calling — there is no
leaked `<function=...>` text to recover (that machinery existed for the retired
llama-3.x models and was deleted with them).

`stream_agent` wraps `graph.astream_events` and yields normalized SSE
event dicts: token / tool_call / tool_result / proposal / done / error.

Latency guardrails:
- graph built once per model per turn (not per retry iteration)
- `recursion_limit` caps tool iterations; `asyncio.timeout` caps wall clock
- rate-limit handling: one short same-model retry, then one fallback-model
  attempt, then a user-facing error (worst-case in-request sleep ≤ 10s)
"""

from __future__ import annotations

import asyncio
import logging
import re
from collections.abc import AsyncIterator, Callable
from functools import lru_cache
from typing import Any

import groq as _groq_sdk
import httpx
from langchain_core.messages import AIMessage, AIMessageChunk, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.errors import GraphRecursionError
from langgraph.prebuilt import ToolNode, create_react_agent

from app.agents.tools import make_tools
from app.config import settings
from app.services.prompt import build_fallback_response, build_system_prompt

log = logging.getLogger(__name__)

_MAX_BACKOFF_SLEEP_S = 10.0
# ReAct spends ~2 graph super-steps per tool round (agent + tools) plus the
# final answer step: 13 ≈ 6 tool rounds.
_RECURSION_LIMIT = 13
_WALL_CLOCK_BUDGET_S = 60.0

_GPT_OSS_PREFIX = "openai/gpt-oss"
_REASONING_PREFIXES = ("deepseek-r1", "qwq", "qwen-qwq", "qwen/")


def _reasoning_kwargs(model: str) -> dict[str, Any]:
    m = model.lower()
    if m.startswith(_GPT_OSS_PREFIX):
        # Chat latency matters more than deep deliberation; keep reasoning
        # internal and short.
        return {"reasoning_effort": "low", "model_kwargs": {"include_reasoning": False}}
    if any(m.startswith(p) for p in _REASONING_PREFIXES):
        return {"reasoning_format": "hidden"}
    return {}


def _parse_rate_limit(exc: Exception) -> tuple[float, bool]:
    """Returns (sleep_seconds, is_daily_limit). is_daily_limit=True means retry won't help."""
    msg = str(exc).lower()
    is_daily = any(k in msg for k in ("per_day", "tokens_per_day", "daily", "day"))
    delay = 5.0
    try:
        headers = exc.response.headers  # type: ignore[union-attr]
        raw = headers.get("retry-after") or headers.get("x-ratelimit-reset-tokens") or ""
        if raw:
            parsed = float(raw)
            if parsed > _MAX_BACKOFF_SLEEP_S:
                is_daily = True
            delay = min(parsed, _MAX_BACKOFF_SLEEP_S)
    except (AttributeError, TypeError, ValueError):
        pass
    return delay, is_daily


def _rate_limit_msg(is_daily: bool) -> str:
    if is_daily:
        return (
            "Penny has reached her daily AI token limit. "
            "She'll be back tomorrow — try again after midnight."
        )
    return "Penny is briefly rate-limited by the AI provider. Wait a moment and try again."


SYSTEM_SUFFIX = """

TOOL USAGE:
1. Never answer a numeric what-if from memory — call the matching tool first:
   simulate_what_if for income/expense/timeline tweaks; simulate_goal for "how much
   faster if I add ₹X to [goal]"; get_month_cashflow for point-in-time questions
   ("what does month 6 look like"); simulate_goal_reorder for priority changes;
   check_affordability for "can I afford X" / "how long to save for Y" / EMI questions;
   compare_debt_strategies for avalanche vs snowball.
2. Call each tool at most once per turn.
3. Only call propose_change when tool math actually supports the change. Payload
   shapes are documented in the tool's schema — follow them exactly (camelCase).
4. ACTION INTENT — "do it", "apply", "go ahead", "yes do it", "change it" authorise
   the change just discussed: call propose_change with the values already computed.
   Do not re-simulate unless the user asks.
5. AMBIGUOUS REFERENT — if the user references something that doesn't exist in the
   snapshot (e.g. "the education loan" when there is none), ask ONE plain-English
   clarifying question. No tool names, and no tool calls until they answer.
6. TWO-STEP CONFIRMATION — for change requests, first show the impact (current value,
   proposed value, downstream effects — using tools as needed) and wait for the user
   to confirm; only then call propose_change. Exception: the user already confirmed
   in the same message ("increase it by 50% and apply it").
7. PROPOSAL LANGUAGE — propose_change creates a PENDING proposal; nothing is applied
   until the user clicks Approve on the card. Never say "updated", "changed", "done",
   or "applied" after proposing — say "I've proposed this change — review and approve
   it in the card below." Never claim a debt or goal was added unless propose_change
   ran in this same turn.
8. Goals in the snapshot carry their real ids — use them directly in tool calls.
   If the resolved goal is already complete, don't updateGoal; say so in one sentence
   and offer addGoal instead. For percent changes, compute the absolute new value
   from the current value and send that.

REPLY FORMAT — STRICT:
- Two short paragraphs separated by a blank line, 4-6 sentences total.
- Paragraph 1 (TL;DR): lead with the answer + the key number from the tool result.
- Paragraph 2: brief reasoning + one concrete next step in plain English.
- Bold every ₹ amount, % and month count: **₹12,500**, **8 months**, **+15%**.
- Plain prose only — no tool names, no code, no JSON. Don't restate the question;
  no greetings, no filler.
"""

_PROPOSAL_LANGUAGE = re.compile(
    r"card below|approve.*proposal|proposal.*approve|review.*card|approve.*card",
    re.IGNORECASE,
)


# Cached base instance. LangGraph's bind_tools() returns a fresh Runnable per request,
# so per-turn tool isolation is preserved while the underlying httpx pool stays warm.
@lru_cache(maxsize=4)
def _llm(model: str) -> ChatGroq:
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY not set on backend")
    return ChatGroq(
        api_key=settings.groq_api_key,
        model=model,
        temperature=0,
        max_tokens=1500,
        timeout=httpx.Timeout(connect=5.0, read=60.0, write=5.0, pool=5.0),
        **_reasoning_kwargs(model),
    )


def clear_llm_cache() -> None:
    _llm.cache_clear()


def build_graph(
    profile: dict[str, Any],
    propose: Callable[[str, dict[str, Any], str], dict[str, Any]],
    model: str | None = None,
):
    model = model or settings.groq_primary_model
    tools = make_tools(profile, propose)
    return create_react_agent(_llm(model), ToolNode(tools, handle_tool_errors=True)), tools


def _build_messages(
    profile: dict[str, Any],
    user_message: str,
    history: list[dict[str, str]] | None,
    context: str | None,
) -> list[Any]:
    sys_prompt = build_system_prompt(profile, context) + SYSTEM_SUFFIX
    messages: list[Any] = [SystemMessage(content=sys_prompt)]
    for m in (history or [])[-20:]:
        role = m.get("role")
        content = m.get("content") or ""
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))
    messages.append(HumanMessage(content=user_message))
    return messages


async def stream_agent(
    profile: dict[str, Any],
    user_message: str,
    history: list[dict[str, str]] | None,
    propose: Callable[[str, dict[str, Any], str], dict[str, Any]],
    proposal_queue: asyncio.Queue,
    context: str | None = None,
) -> AsyncIterator[dict[str, Any]]:
    """Stream normalized SSE events for one Penny turn.

    Yields dicts with shape `{"event": str, "data": dict | str}` for the SSE
    endpoint to serialize.
    """
    final_text_parts: list[str] = []
    tool_calls_log: list[dict[str, Any]] = []
    tool_results_log: list[dict[str, Any]] = []

    current_model = settings.groq_primary_model
    used_fallback = False
    retried_same_model = False
    any_tokens_emitted = False
    proposals_emitted = 0

    messages = _build_messages(profile, user_message, history, context)
    graph, _tools = build_graph(profile, propose, current_model)

    def _reset_turn_state() -> None:
        nonlocal proposals_emitted
        final_text_parts.clear()
        tool_calls_log.clear()
        tool_results_log.clear()
        proposals_emitted = 0
        while not proposal_queue.empty():
            proposal_queue.get_nowait()

    while True:
        try:
            async with asyncio.timeout(_WALL_CLOCK_BUDGET_S):
                async for event in graph.astream_events(
                    {"messages": messages},
                    version="v2",
                    config={"recursion_limit": _RECURSION_LIMIT},
                ):
                    kind = event.get("event")

                    if kind == "on_chat_model_stream":
                        chunk = event["data"].get("chunk")
                        if isinstance(chunk, AIMessageChunk):
                            text = chunk.content
                            if isinstance(text, str) and text:
                                any_tokens_emitted = True
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
                        proposals_emitted += 1
                        yield {"event": "proposal", "data": prop}

            break  # stream completed successfully

        except TimeoutError:
            log.warning(
                "penny: wall-clock budget (%.0fs) exceeded (model=%s)",
                _WALL_CLOCK_BUDGET_S,
                current_model,
            )
            err = "That one took too long to compute. Try a simpler question, or ask again."
            yield {"event": "error", "data": err}
            yield {
                "event": "done",
                "data": {
                    "reply": "".join(final_text_parts).strip() or err,
                    "tool_calls": tool_calls_log,
                    "tool_results": tool_results_log,
                },
            }
            return

        except GraphRecursionError:
            log.warning(
                "penny: recursion limit %d hit (model=%s) — tool loop did not converge",
                _RECURSION_LIMIT,
                current_model,
            )
            err = (
                "I ran too many simulations without reaching an answer. "
                "Try breaking the question into smaller parts."
            )
            yield {"event": "error", "data": err}
            yield {
                "event": "done",
                "data": {
                    "reply": "".join(final_text_parts).strip() or err,
                    "tool_calls": tool_calls_log,
                    "tool_results": tool_results_log,
                },
            }
            return

        except _groq_sdk.RateLimitError as exc:
            delay, is_daily = _parse_rate_limit(exc)

            # One short retry on the same model (no tokens emitted yet).
            if not is_daily and not any_tokens_emitted and not retried_same_model:
                sleep_s = min(delay, _MAX_BACKOFF_SLEEP_S)
                log.warning(
                    "penny: rate-limited (model=%s); retrying once in %.1fs",
                    current_model,
                    sleep_s,
                )
                await asyncio.sleep(sleep_s)
                retried_same_model = True
                _reset_turn_state()
                continue

            # One switch to the fallback model.
            if not used_fallback and not any_tokens_emitted:
                log.warning(
                    "penny: switching to fallback model %s (daily=%s)",
                    settings.groq_fallback_model,
                    is_daily,
                )
                # Note: retried_same_model stays True — the fallback gets one
                # attempt, not its own retry budget (3 attempts max per turn).
                current_model = settings.groq_fallback_model
                used_fallback = True
                _reset_turn_state()
                graph, _tools = build_graph(profile, propose, current_model)
                continue

            log.warning(
                "penny: rate-limit unrecoverable (model=%s daily=%s tokens_emitted=%s): %s",
                current_model,
                is_daily,
                any_tokens_emitted,
                exc,
            )
            err = _rate_limit_msg(is_daily)
            yield {"event": "error", "data": err}
            yield {
                "event": "done",
                "data": {
                    "reply": err,
                    "tool_calls": tool_calls_log,
                    "tool_results": tool_results_log,
                },
            }
            return

        except Exception:
            log.exception("Penny agent error")
            fallback_text = build_fallback_response(profile)
            yield {"event": "token", "data": fallback_text}
            yield {
                "event": "done",
                "data": {
                    "reply": fallback_text,
                    "tool_calls": [],
                    "tool_results": [],
                },
            }
            return

    # Final drain in case a proposal was queued after the last LLM event.
    while not proposal_queue.empty():
        prop = proposal_queue.get_nowait()
        proposals_emitted += 1
        yield {"event": "proposal", "data": prop}

    final_text = "".join(final_text_parts).strip()

    if proposals_emitted == 0 and _PROPOSAL_LANGUAGE.search(final_text):
        log.warning(
            "penny: phantom proposal detected (model=%s) — model implied a proposal but none was emitted",
            current_model,
        )
        correction = (
            "\n\n⚠️ Something went wrong — the proposal card wasn't created. Please try again."
        )
        final_text_parts.append(correction)
        final_text = "".join(final_text_parts).strip()
        yield {"event": "token", "data": correction}
        yield {"event": "error", "data": correction.strip()}

    if tool_calls_log:
        log.info(
            "penny turn complete",
            extra={
                "tool_calls": tool_calls_log,
                "tool_results": tool_results_log,
                "model": current_model,
            },
        )
    yield {
        "event": "done",
        "data": {
            "reply": final_text,
            "tool_calls": tool_calls_log,
            "tool_results": tool_results_log,
        },
    }
