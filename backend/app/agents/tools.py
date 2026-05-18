"""LangGraph tools for Penny (Phase 3).

Tools are produced by `make_tools(profile, propose)` so each request gets
its own closures bound to the current user's anonymized financial profile
and a `propose` callback (used by `propose_change` to push a proposal
onto the SSE event queue / persist to the proposals table).

Tool surface mirrors the agreed phase-3 list:
- read_profile
- simulate_plan
- simulate_what_if
- compare_debt_strategies
- check_health
- propose_change
"""
from __future__ import annotations

import logging
from copy import deepcopy
from typing import Any, Callable

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

from app.engines.debt_strategies import compare_strategies
from app.engines.health_score import calculate_health_score
from app.engines.plan_engine import generate_plan, generate_scenario_plan

log = logging.getLogger(__name__)


ALLOWED_PROPOSAL_ACTIONS = {
    "setStrategy",
    "setEmergencyFund",
    "setSavings",
    "setInvestments",
    "updateGoal",
    "addGoal",
    "removeGoal",
    "addLumpsum",
    "addDebt",
}


# ── input schemas ───────────────────────────────────────────────
class _NoArgs(BaseModel):
    pass


class _WhatIfArgs(BaseModel):
    income_change_pct: float = Field(0, description="Income change as a percent (e.g. 10 for +10% income).")
    expense_change_pct: float = Field(0, description="Expense change as a percent (e.g. -5 for cutting expenses 5%).")
    timeline_change_months: int = Field(0, description="Months added to (or removed from) every goal's timeline.")


class _ProposeArgs(BaseModel):
    action: str = Field(description=f"Zustand setter name. Allowed: {sorted(ALLOWED_PROPOSAL_ACTIONS)}.")
    payload: dict[str, Any] = Field(description="JSON payload the frontend will pass to the setter.")
    rationale: str = Field(default="", description="Short user-facing explanation (1-2 sentences). Optional but strongly recommended.")


# ── builder ─────────────────────────────────────────────────────
def make_tools(
    profile: dict[str, Any],
    propose: Callable[[str, dict[str, Any], str], dict[str, Any]],
) -> list[StructuredTool]:
    """Return per-request tool list bound to the user's profile + proposal callback.

    `profile` should already be the *unanonymized* full FinancialProfile sent
    by the frontend (it carries goals/debts arrays needed by the engines).
    Engines never leave the backend so PII isn't a concern here — the
    anonymization layer only applies to data leaving in the Groq system prompt.
    """

    base_plan_input: dict[str, Any] = {
        "income": profile.get("income") or {},
        "expenses": profile.get("expenses") or {},
        "debts": profile.get("debts") or {"items": [], "totalMonthly": 0},
        "goals": profile.get("goals") or [],
        "savings": profile.get("savings", 0),
        "investments": profile.get("investments", 0),
        "strategy": profile.get("strategy", "avalanche"),
        "monthlySurplusReserve": profile.get("monthlySurplusReserve", 0),
        "stepUpEnabled": profile.get("stepUpEnabled", False),
        "investmentReturnRate": profile.get("investmentReturnRate", 12),
    }

    # ── tool implementations ────────────────────────────────────
    def _read_profile() -> dict[str, Any]:
        income = profile.get("income") or {}
        expenses = profile.get("expenses") or {}
        debts = profile.get("debts") or {}
        return {
            "income": income.get("total", 0),
            "expenses": expenses.get("total", 0),
            "debt_monthly": debts.get("totalMonthly", 0),
            "savings": profile.get("savings", 0),
            "investments": profile.get("investments", 0),
            "emergency_fund": profile.get("emergencyFund", 0),
            "strategy": profile.get("strategy", "avalanche"),
            "monthly_surplus_reserve": profile.get("monthlySurplusReserve", 0),
            "goals": [
                {
                    "id": g.get("id"),
                    "name": g.get("name"),
                    "target": g.get("targetAmount"),
                    "current": g.get("currentAmount"),
                    "priority": g.get("priority"),
                    "status": g.get("status"),
                    "timeline_months": g.get("timelineMonths"),
                }
                for g in (profile.get("goals") or [])
            ],
        }

    def _simulate_plan() -> dict[str, Any]:
        plan = generate_plan(deepcopy(base_plan_input))
        return _summarize_plan(plan)

    def _simulate_what_if(
        income_change_pct: float = 0,
        expense_change_pct: float = 0,
        timeline_change_months: int = 0,
    ) -> dict[str, Any]:
        mods: dict[str, Any] = {}
        if income_change_pct:
            mods["incomeChange"] = float(income_change_pct)
        if expense_change_pct:
            mods["expenseChange"] = float(expense_change_pct)
        if timeline_change_months:
            mods["timelineChange"] = int(timeline_change_months)
        plan = generate_scenario_plan(deepcopy(base_plan_input), mods)
        summary = _summarize_plan(plan)
        summary["modifications"] = mods
        return summary

    def _compare_debt_strategies() -> dict[str, Any]:
        debts = (profile.get("debts") or {}).get("items") or []
        if not debts:
            return {"note": "No debts found. Nothing to compare."}
        return compare_strategies(deepcopy(debts), 0)

    def _check_health() -> dict[str, Any]:
        return calculate_health_score(
            {
                "income": profile.get("income") or {},
                "expenses": profile.get("expenses") or {},
                "debts": profile.get("debts") or {"items": [], "totalMonthly": 0},
                "savings": profile.get("savings", 0),
                "investments": profile.get("investments", 0),
                "emergencyFund": profile.get("emergencyFund", 0),
            }
        )

    def _propose_change(action: str, payload: dict[str, Any], rationale: str = "") -> dict[str, Any]:
        if action not in ALLOWED_PROPOSAL_ACTIONS:
            return {
                "ok": False,
                "error": f"Action '{action}' not allowed. Allowed: {sorted(ALLOWED_PROPOSAL_ACTIONS)}",
            }
        result = propose(action, payload, rationale)
        return {"ok": True, "proposal": result}

    return [
        StructuredTool.from_function(
            func=_read_profile,
            name="read_profile",
            description="Return the user's current financial snapshot (income/expenses/debts/goals/strategy).",
            args_schema=_NoArgs,
        ),
        StructuredTool.from_function(
            func=_simulate_plan,
            name="simulate_plan",
            description="Run the 120-month plan simulation against the user's current profile. Returns net-worth trajectory + goal completion months.",
            args_schema=_NoArgs,
        ),
        StructuredTool.from_function(
            func=_simulate_what_if,
            name="simulate_what_if",
            description=(
                "Run a scenario plan with percentage tweaks against the user's current profile. "
                "Use to answer 'what if I get a 10% raise', 'cut expenses 5%', or 'push every goal 6 months later'."
            ),
            args_schema=_WhatIfArgs,
        ),
        StructuredTool.from_function(
            func=_compare_debt_strategies,
            name="compare_debt_strategies",
            description="Compare avalanche vs snowball debt payoff strategies on the user's debts.",
            args_schema=_NoArgs,
        ),
        StructuredTool.from_function(
            func=_check_health,
            name="check_health",
            description="Recompute the 4D financial health score (0-100) with top-3 recommendations.",
            args_schema=_NoArgs,
        ),
        StructuredTool.from_function(
            func=_propose_change,
            name="propose_change",
            description=(
                "Propose a single store mutation for the user to Approve/Reject. "
                "NEVER call this without first checking with a simulate_* or check_health "
                "tool that the change is actually beneficial."
            ),
            args_schema=_ProposeArgs,
        ),
    ]


def _summarize_plan(plan: dict[str, Any]) -> dict[str, Any]:
    """Trim the 120-month plan to a Groq-friendly summary."""
    months = plan.get("months") or []
    sample_idx = [0, 11, 35, 59, 119] if len(months) >= 120 else list(range(0, len(months), max(1, len(months) // 5)))
    snapshots = []
    for i in sample_idx:
        if i < len(months):
            m = months[i]
            snapshots.append(
                {
                    "month": i + 1,
                    "income": m.get("income"),
                    "expenses": m.get("expenses"),
                    "net_worth": m.get("netWorth"),
                    "surplus": m.get("surplus"),
                }
            )
    return {
        "horizon_months": len(months),
        "snapshots": snapshots,
        "goal_completion_months": plan.get("goalCompletionMonths"),
        "total_debt_payoff_month": plan.get("totalDebtPayoffMonth"),
        "recommended_allocations": plan.get("recommendedAllocations"),
    }
