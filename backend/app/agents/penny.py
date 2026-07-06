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
import json
import logging
import re
from collections.abc import AsyncIterator, Callable
from functools import lru_cache
from typing import Any

import groq as _groq_sdk
import httpx
from langchain_core.messages import AIMessageChunk, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.prebuilt import ToolNode, create_react_agent

from app.agents.tools import make_tools
from app.config import settings
from app.services.prompt import build_fallback_response, build_system_prompt

log = logging.getLogger(__name__)


# Llama-3.3 sometimes leaks its function-calling fine-tune syntax into the
# user-visible reply (e.g. `<function=propose_change>{...}</function>`).
# We strip both the closed and open variants from streamed tokens.
_FUNCTION_TAG_RE = re.compile(r"<function=[^>]*>(.*?</function>)?", re.DOTALL)
_FUNCTION_OPEN_RE = re.compile(r"<function=[^>]*$")

# Closed-tag matcher for *recovery*: captures the tool name, the opening-tag
# attribute area (which Groq's Llama variant stuffs JSON args into), and the
# body (the alternate variant). Either may carry the JSON payload.
_FUNCTION_FULL_RE = re.compile(
    r"<function=([A-Za-z_][A-Za-z0-9_]*)([^>]*)>(.*?)</function>",
    re.DOTALL,
)


def _first_json_object(s: str) -> str | None:
    """Find the first balanced {...} substring. Needed because propose_change
    payloads contain nested objects (e.g. {"updates": {"target": 150000}})
    that a lazy regex would truncate at the first '}'."""
    depth = 0
    start = -1
    in_str = False
    esc = False
    for i, ch in enumerate(s):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
            continue
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start != -1:
                return s[start : i + 1]
    return None


def _extract_leaked_calls(text: str) -> list[tuple[str, dict[str, Any]]]:
    """Find every closed `<function=NAME ...></function>` in text and return
    (name, parsed_args) pairs. Bad JSON / non-object args are dropped."""
    out: list[tuple[str, dict[str, Any]]] = []
    for m in _FUNCTION_FULL_RE.finditer(text):
        name = m.group(1)
        raw = _first_json_object(m.group(2) or "") or _first_json_object(m.group(3) or "")
        if not raw:
            continue
        try:
            args = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(args, dict):
            out.append((name, args))
    return out


# Open-only opener (no `</function>` required). Llama frequently emits the
# opening tag like a stop-sequence and never closes it.
_FUNCTION_OPEN_FULL_RE = re.compile(r"<function=([A-Za-z_][A-Za-z0-9_]*)([^>]*)>")

_MAX_RATE_LIMIT_RETRIES = 2
_MAX_BACKOFF_SLEEP_S = 30.0
_GPT_OSS_PREFIX = "openai/gpt-oss"
_REASONING_PREFIXES = ("deepseek-r1", "qwq", "qwen-qwq")


def _reasoning_kwargs(model: str) -> dict[str, Any]:
    m = model.lower()
    if m.startswith(_GPT_OSS_PREFIX):
        return {"model_kwargs": {"include_reasoning": False}}
    if any(m.startswith(p) for p in _REASONING_PREFIXES):
        return {"model_kwargs": {"reasoning_format": "hidden"}}
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


def _extract_leaked_open_calls(text: str) -> list[tuple[str, dict[str, Any]]]:
    """Recover OPEN-only `<function=NAME {JSON}>` leaks where Llama never
    wrote `</function>`. Safe at stream-end only — mid-stream the close may
    still be coming. Dedup vs the closed-tag pass is handled by
    `_run_recovered` via `invoked_sigs`."""
    out: list[tuple[str, dict[str, Any]]] = []
    for m in _FUNCTION_OPEN_FULL_RE.finditer(text):
        raw = _first_json_object(m.group(2) or "")
        if not raw:
            continue
        try:
            args = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(args, dict):
            out.append((m.group(1), args))
    return out


def _signature(name: str, args: dict[str, Any]) -> str:
    """Stable key for dedup. Sorted keys so equivalent dicts hash identically."""
    return f"{name}:{json.dumps(args, sort_keys=True, default=str)}"


SYSTEM_SUFFIX = """

TOOLS AVAILABLE:
- read_profile() — pull a structured snapshot of the user's profile (goal IDs, names, balances).
- simulate_plan() — run the 120-month plan as-is.
- simulate_what_if(income_change_pct, expense_change_pct, timeline_change_months) — scenario plan with % tweaks to income/expenses or months shift to all goals.
- simulate_goal(goal_id, extra_monthly) — how many months faster would a specific goal complete if the user adds ₹extra_monthly/month to it?
- get_month_cashflow(month_offset) — detailed cashflow for a specific future month (0 = this month, 11 = 12mo from now, 59 = 5 years).
- simulate_goal_reorder(new_priorities) — show the impact of changing goal priorities on completion dates and monthly allocations.
- compare_debt_strategies() — avalanche vs snowball.
- check_health() — recompute the 4D health score.
- check_affordability(target_cost, route, annual_interest_rate, tenure_months, loan_type) — check whether the user can afford a purchase; returns verdict (affordable_now/affordable_later/not_affordable), months to save, EMI, FOIR check, and levers.
- propose_change(action, payload, rationale) — propose a single store mutation for user Approve/Reject.

TOOL USAGE RULES:
1. NEVER answer a numeric what-if question without first calling simulate_what_if. Don't guess outcomes.
2. "How much faster if I put ₹X more into [goal]?" → ALWAYS call simulate_goal(goal_id, extra_monthly). Never estimate.
3. "What does month N look like?" / "In 6 months" / "What's my cash flow in a year?" → call get_month_cashflow(month_offset).
4. "What if I prioritise X over Y?" / "Reorder my goals" → call simulate_goal_reorder.
5. "Can I afford X?" / "How long to save for Y?" / "What EMI for Z?" → call check_affordability.
6. Call each tool AT MOST ONCE per turn.
7. NEVER call propose_change unless tool math actually supports the change.
8. Allowed propose_change actions: setStrategy, setEmergencyFund, setSavings, setInvestments, updateGoal, addGoal, removeGoal, addLumpsum, addDebt.
9. propose_change.payload must match the Zustand setter shape exactly — use camelCase field names:
   - updateGoal -> {"id": "...", "updates": {"targetAmount": <INR>, "timelineMonths": <months>, "name": "..."}} — only include fields being changed. Field names MUST be camelCase: targetAmount (not target), currentAmount (not current), timelineMonths (not timeline_months).
   - addGoal    -> {"goal": {"id": "goal-<timestamp>", "name": "...", "targetAmount": <INR>, "timelineMonths": <months>, "category": "custom", "icon": "Target", "priority": <number>, "currentAmount": 0, "status": "not-started", "monthlyAllocation": 0, "color": "var(--accent)"}}
   - removeGoal -> {"id": "..."}
   - addLumpsum -> {"goalId": "...", "amount": <positive number>} (amount > 0; never negative)
   - addDebt   -> {"debt": {"name": "...", "principal": <positive amount>, "interestRate": <annual %>, "monthlyPayment": <amount>, "category": "personalLoan|creditCard|homeLoan|carLoan|educationLoan|other"}}
     For addDebt: principal is always POSITIVE (the amount owed). If user says "I owe 10000" or "add 10000 debt", principal = 10000.
     Never use addLumpsum to model a new debt — use addDebt.
10. ALWAYS include a one-sentence `rationale` in every propose_change call (e.g. "User requested adding a personal debt of ₹10,000."). Empty rationale is allowed by the tool but worsens the user experience.
11. Tool calls happen via the API only. NEVER write `<function=...>`, `</function>`, JSON tool-call blocks, or any literal tool-invocation syntax in your reply text. Use the function-calling API to invoke tools; the reply is plain prose for the user.
12. Do NOT instruct the user to call a function or suggest "calling X". Either call the tool yourself via the API now, or omit the suggestion. The user does not see tool names — phrases like "call propose_change", "consider calling addDebt", "Call simulate_plan" are forbidden.
13. ACTION INTENT — when the user says "do it", "do that", "do iy", "apply", "go ahead", "yes do it", "make it happen", "change it", "update it", they are authorising the change you just discussed. Call propose_change with the values you computed earlier in the conversation. Do NOT call simulate_plan again unless the user explicitly asks to re-simulate.
14. AMBIGUOUS REFERENT — if the user asks to change something that doesn't exist in the snapshot (e.g. "update the education loan" but there is no education loan), ask ONE plain-English clarifying question ("You don't have an education loan — do you want me to add one, or did you mean your education savings goal?"). Do NOT suggest tool names and do NOT call any tool until the user answers.
15. TWO-STEP CONFIRMATION — When the user asks for a change ("increase my goal by 50%", "add ₹10k to my emergency fund", "switch to snowball"), do NOT call propose_change in the same turn. Instead: (a) Call read_profile (and optionally simulate_plan / simulate_goal) to understand the current state. (b) Reply with the IMPACT of the change: show the current value, the proposed new value, and any downstream effects. (c) Wait for the user to confirm ("do it", "yes", "go ahead", "apply", "make the change"). (d) ONLY THEN call propose_change. Exception: if the user already confirmed in the same message ("increase my goal by 50% and apply it"), you may call propose_change immediately.
16. PROPOSAL LANGUAGE — propose_change creates a PENDING proposal. The change is NOT applied until the user clicks Approve on the proposal card. NEVER say "updated", "changed", "done", or "applied" after calling propose_change. Instead say "I've proposed this change — review and approve it in the card below." or similar phrasing that makes clear the change is pending.
17. addDebt MANDATORY FLOW — NEVER claim to have added, recorded, logged, or saved a debt without having called propose_change with action="addDebt" in this same turn. After propose_change runs, the ONLY allowed phrasing is: "I've proposed adding this debt — review and approve it in the card below." Any other phrasing ("I've added", "done", "recorded", "saved") is forbidden. If propose_change has not yet been called, you have NOT added the debt.

FINAL REPLY FORMAT — STRICT:
- Two short paragraphs separated by a blank line. 4-6 sentences total.
- Paragraph 1 (TL;DR): 2-3 sentences. Lead with the answer + the key number from the tool result.
- Paragraph 2 (Why + next step): 2-3 sentences. Brief reasoning + one concrete action in plain English (no tool names, no code).
- Every ₹ amount, % and month count wrapped in markdown bold: **₹12,500**, **8 months**, **+15%**.
- Do NOT repeat the same scenario twice. Do NOT restate the user's question. No greetings, no filler.
- Plain prose only. No XML, no JSON, no `<function=...>` tags.

DISAMBIGUATION:
- If the user refers to a goal by ordinal or priority ("p1", "the first goal", "highest priority", "the top one", "second goal"), call read_profile FIRST in the same turn to resolve the goal_id. Do NOT propose_change against a guessed id.
- For percent-based changes ("increase X by 50%", "halve Y"), compute the new value from the resolved current value, then propose_change with the absolute new value in the payload.
- If the resolved goal has status="complete", do NOT call propose_change with updateGoal. Tell the user in one sentence that the goal is already done and ask whether they want to addGoal a new target or move on.
"""


FALLBACK_SYSTEM_SUFFIX = """

TOOLS AVAILABLE:
- read_profile() — get profile snapshot (goal IDs, names, balances, debts).
- simulate_plan() — run 120-month cashflow plan.
- simulate_what_if(income_change_pct, expense_change_pct, timeline_change_months) — scenario.
- compare_debt_strategies() — avalanche vs snowball comparison.
- check_health() — recompute health score.
- propose_change(action, payload, rationale) — propose a store mutation for user Approve/Reject.

MANDATORY RULES — FOLLOW EXACTLY:
1. ALWAYS call read_profile before propose_change. Never guess IDs.
2. ALWAYS call propose_change when the user requests any change. Never claim to have proposed without calling it.
3. propose_change actions: removeGoal, addGoal, updateGoal, addDebt, setStrategy, setEmergencyFund, setSavings, setInvestments, addLumpsum.
4. payload shapes (camelCase only):
   - removeGoal  -> {"id": "<goal_id>"}
   - addGoal     -> {"goal": {"id": "goal-<timestamp>", "name": "...", "targetAmount": N, "timelineMonths": N, "category": "custom", "icon": "Target", "priority": N, "currentAmount": 0, "status": "not-started", "monthlyAllocation": 0, "color": "var(--accent)"}}
   - updateGoal  -> {"id": "...", "updates": {"targetAmount": N}}
   - addDebt     -> {"debt": {"name": "...", "principal": N, "interestRate": N, "monthlyPayment": N, "category": "other"}}
5. After propose_change: say ONLY "I've proposed this — review and approve it in the card below." Nothing else about the change.
6. NEVER say "I've proposed" or "approve it in the card" unless propose_change was actually called this turn.
7. Reply in 2-3 sentences. Bold all ₹ amounts and % values.
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
    token_buffer = ""  # holds tail across chunks so we can detect split tags
    invoked_sigs: set[str] = set()  # dedup between real tool_calls and recovered ones

    def _run_recovered(name: str, args: dict[str, Any]) -> list[dict[str, Any]]:
        """Invoke a leaked tool call by name. Returns SSE event dicts to yield.
        Empty list on duplicate, unknown name, or invocation failure (logged)."""
        sig = _signature(name, args)
        if sig in invoked_sigs:
            return []
        tool = tools_by_name.get(name)
        if tool is None:
            log.warning("penny: leaked tool '%s' not in registry", name)
            return []
        invoked_sigs.add(sig)
        try:
            output = tool.invoke(args)
        except Exception:
            log.exception("penny: recovered tool '%s' invocation failed", name)
            return []
        payload = output.content if hasattr(output, "content") else output
        tool_calls_log.append({"name": name, "input": args})
        tool_results_log.append({"name": name, "output": payload})
        return [
            {"event": "tool_call", "data": {"name": name, "input": args, "_recovered": True}},
            {"event": "tool_result", "data": {"name": name, "output": payload, "_recovered": True}},
        ]

    current_model = settings.groq_primary_model
    used_fallback = False
    attempt = 0
    any_tokens_emitted = False
    proposals_emitted = 0

    while True:
        graph, tools = build_graph(profile, propose, current_model)
        tools_by_name = {t.name: t for t in tools}

        suffix = (
            FALLBACK_SYSTEM_SUFFIX
            if current_model == settings.groq_fallback_model
            else SYSTEM_SUFFIX
        )
        sys_prompt = build_system_prompt(profile, context) + suffix
        messages: list[Any] = [SystemMessage(content=sys_prompt)]
        for m in (history or [])[-20:]:
            role = m.get("role")
            content = m.get("content") or ""
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                from langchain_core.messages import AIMessage

                messages.append(AIMessage(content=content))
        messages.append(HumanMessage(content=user_message))

        try:
            async for event in graph.astream_events({"messages": messages}, version="v2"):
                kind = event.get("event")

                if kind == "on_chat_model_stream":
                    chunk = event["data"].get("chunk")
                    if isinstance(chunk, AIMessageChunk):
                        text = chunk.content
                        if isinstance(text, str) and text:
                            token_buffer += text
                            # Recover any closed `<function=...></function>` leaks before
                            # the strip wipes them. propose_change pushes onto
                            # proposal_queue inside its body, so the drain loop below
                            # emits the `proposal` SSE event on its own.
                            for _name, _args in _extract_leaked_calls(token_buffer):
                                for _ev in _run_recovered(_name, _args):
                                    yield _ev
                            # Open-only fallback — Llama frequently emits
                            # `<function=NAME {JSON}>` without ever closing it. Safe
                            # to fire as soon as the opening `>` arrives because the
                            # JSON sits inside the attribute area. Dedup by signature
                            # protects against re-fire when the close finally arrives.
                            for _name, _args in _extract_leaked_open_calls(token_buffer):
                                for _ev in _run_recovered(_name, _args):
                                    yield _ev
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
                                any_tokens_emitted = True
                                final_text_parts.append(emit)
                                yield {"event": "token", "data": emit}

                elif kind == "on_tool_start":
                    name = event.get("name") or ""
                    tool_input = event["data"].get("input") or {}
                    if isinstance(tool_input, dict):
                        invoked_sigs.add(_signature(name, tool_input))
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

        except _groq_sdk.RateLimitError as exc:
            delay, is_daily = _parse_rate_limit(exc)

            # Transient retry on same model (no tokens emitted yet)
            if not is_daily and not any_tokens_emitted and attempt < _MAX_RATE_LIMIT_RETRIES:
                sleep_s = min(delay * (attempt + 1), _MAX_BACKOFF_SLEEP_S)
                log.warning(
                    "penny: rate-limited (attempt %d/%d model=%s); retrying in %.1fs",
                    attempt + 1,
                    _MAX_RATE_LIMIT_RETRIES,
                    current_model,
                    sleep_s,
                )
                await asyncio.sleep(sleep_s)
                attempt += 1
                token_buffer = ""
                final_text_parts.clear()
                tool_calls_log.clear()
                tool_results_log.clear()
                invoked_sigs.clear()
                while not proposal_queue.empty():
                    proposal_queue.get_nowait()
                continue

            # Switch to fallback model if primary exhausted and no tokens yet
            if not used_fallback and not any_tokens_emitted:
                log.warning(
                    "penny: switching to fallback model %s (daily=%s attempt=%d)",
                    settings.groq_fallback_model,
                    is_daily,
                    attempt,
                )
                current_model = settings.groq_fallback_model
                used_fallback = True
                attempt = 0
                token_buffer = ""
                final_text_parts.clear()
                tool_calls_log.clear()
                tool_results_log.clear()
                invoked_sigs.clear()
                while not proposal_queue.empty():
                    proposal_queue.get_nowait()
                continue

            log.warning(
                "penny: rate-limit unrecoverable (model=%s daily=%s attempt=%d tokens_emitted=%s): %s",
                current_model,
                is_daily,
                attempt,
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

    # If the stream ended while we were holding back text behind an unclosed
    # `<function=` tag, strip and emit what's left so the user isn't left mid-sentence.
    if token_buffer:
        for _name, _args in _extract_leaked_calls(token_buffer):
            for _ev in _run_recovered(_name, _args):
                yield _ev
        # Open-only fallback — recover `<function=NAME {JSON}>` the model never closed.
        for _name, _args in _extract_leaked_open_calls(token_buffer):
            for _ev in _run_recovered(_name, _args):
                yield _ev
        while not proposal_queue.empty():
            proposals_emitted += 1
            yield {"event": "proposal", "data": proposal_queue.get_nowait()}
        leftover = _FUNCTION_TAG_RE.sub("", token_buffer)
        leftover = _FUNCTION_OPEN_RE.sub("", leftover)
        if leftover:
            final_text_parts.append(leftover)
            yield {"event": "token", "data": leftover}

    final_text = "".join(final_text_parts).strip()

    if proposals_emitted == 0 and _PROPOSAL_LANGUAGE.search(final_text):
        log.warning(
            "penny: phantom proposal detected (model=%s) — model implied a proposal but none was emitted",
            current_model,
        )
        if used_fallback:
            correction = (
                "\n\n⚠️ Penny has hit her daily AI limit — the backup model can answer "
                "questions but can't create proposal cards. Changes (add/update/remove goals, "
                "debts) will work again tomorrow."
            )
        else:
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
