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

import json
import logging
import math
from collections.abc import Callable
from copy import deepcopy
from typing import Any

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field, field_validator

from app.engines.affordability import run_affordability
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
    income_change_pct: float = Field(
        0, description="Income change as a percent (e.g. 10 for +10% income)."
    )
    expense_change_pct: float = Field(
        0, description="Expense change as a percent (e.g. -5 for cutting expenses 5%)."
    )
    timeline_change_months: int = Field(
        0, description="Months added to (or removed from) every goal's timeline."
    )


class _ProposeArgs(BaseModel):
    action: str = Field(
        description=f"Zustand setter name. Allowed: {sorted(ALLOWED_PROPOSAL_ACTIONS)}."
    )
    payload: dict[str, Any] = Field(
        description="JSON payload the frontend will pass to the setter."
    )
    rationale: str = Field(
        default="",
        description="Short user-facing explanation (1-2 sentences). Optional but strongly recommended.",
    )

    @field_validator("payload", mode="before")
    @classmethod
    def parse_payload(cls, v: Any) -> Any:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                pass
        return v


class _SimGoalArgs(BaseModel):
    goal_id: str = Field(description="ID of the goal to simulate (from read_profile goals list).")
    extra_monthly: float = Field(
        ge=0,
        description="Extra ₹ per month to direct at this specific goal on top of its current allocation.",
    )


class _MonthOffsetArgs(BaseModel):
    month_offset: int = Field(
        0,
        ge=0,
        le=119,
        description="Month index (0 = this month, 11 = 12 months from now, 59 = 5 years, up to 119).",
    )


class _GoalPriorityItem(BaseModel):
    goal_id: str
    priority: int = Field(ge=1, description="New priority. 1 = highest urgency.")


class _ReorderArgs(BaseModel):
    new_priorities: list[_GoalPriorityItem] = Field(
        description="New priority assignment for each goal to reorder. Include only the goals you want to change."
    )


class _AffordabilityArgs(BaseModel):
    target_cost: float = Field(description="Purchase price or loan principal in INR.")
    route: str = Field(
        default="cash",
        description="'cash' (save up) or 'emi' (monthly loan payments).",
    )
    annual_interest_rate: float = Field(
        default=9.0,
        description="Annual loan interest rate % (EMI route only). Default 9.",
    )
    tenure_months: int = Field(
        default=60,
        description="Loan tenure in months (EMI route only). Default 60.",
    )
    loan_type: str = Field(
        default="other",
        description="'home', 'personal', 'vehicle', or 'other'. Affects FOIR cap.",
    )


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
                    "targetAmount": g.get("targetAmount"),
                    "currentAmount": g.get("currentAmount"),
                    "priority": g.get("priority"),
                    "status": g.get("status"),
                    "timelineMonths": g.get("timelineMonths"),
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

    def _check_affordability(
        target_cost: float,
        route: str = "cash",
        annual_interest_rate: float = 9.0,
        tenure_months: int = 60,
        loan_type: str = "other",
    ) -> dict[str, Any]:
        income = profile.get("income") or {}
        expenses = profile.get("expenses") or {}
        debts = profile.get("debts") or {}
        net_monthly = float(income.get("total") or 0)
        monthly_expenses = float(expenses.get("total") or 0)
        existing_emi = float(debts.get("totalMonthly") or 0)
        reserve = float(profile.get("monthlySurplusReserve") or 0)
        return_rate = float(profile.get("investmentReturnRate") or 8)

        result = run_affordability(
            {
                "targetCost": target_cost,
                "route": route,
                "netMonthlyIncome": net_monthly,
                "monthlyExpenses": monthly_expenses,
                "monthlyReserve": reserve,
                "existingEmiTotal": existing_emi,
                "investmentReturnRate": return_rate,
                "annualInterestRate": annual_interest_rate,
                "tenureMonths": tenure_months,
                "loanType": loan_type,
                "ageYears": profile.get("ageYears"),
                "employmentType": profile.get("employmentType") or "salaried",
            }
        )
        return result

    def _simulate_goal(goal_id: str, extra_monthly: float = 0) -> dict[str, Any]:
        goals_list = profile.get("goals") or []
        goal = next((g for g in goals_list if g.get("id") == goal_id), None)
        if goal is None:
            return {
                "error": f"Goal '{goal_id}' not found. Call read_profile to get valid goal IDs."
            }

        target = float(goal.get("targetAmount") or 0)
        current = float(goal.get("currentAmount") or 0)
        remaining = max(0.0, target - current)
        if remaining == 0:
            return {"goal_id": goal_id, "name": goal.get("name"), "status": "already_complete"}

        plan = generate_plan(deepcopy(base_plan_input))
        alloc = float((plan.get("recommendedAllocations") or {}).get(goal_id, 0))

        if alloc <= 0:
            return {
                "goal_id": goal_id,
                "name": goal.get("name"),
                "note": "Goal has no current monthly allocation (no surplus or goal deprioritised). Adding extra_monthly would be the only funding.",
                "remaining": remaining,
                "baseline_monthly_allocation": 0,
                "extra_monthly": extra_monthly,
                "new_monthly_allocation": extra_monthly,
                "estimated_baseline_months": None,
                "estimated_new_months": math.ceil(remaining / extra_monthly)
                if extra_monthly > 0
                else None,
                "months_saved": None,
            }

        baseline_months = math.ceil(remaining / alloc)
        new_alloc = alloc + extra_monthly
        new_months = math.ceil(remaining / new_alloc)
        months_saved = baseline_months - new_months

        return {
            "goal_id": goal_id,
            "name": goal.get("name"),
            "remaining": remaining,
            "baseline_monthly_allocation": alloc,
            "extra_monthly": extra_monthly,
            "new_monthly_allocation": new_alloc,
            "estimated_baseline_months": baseline_months,
            "estimated_new_months": new_months,
            "months_saved": months_saved,
        }

    def _get_month_cashflow(month_offset: int = 0) -> dict[str, Any]:
        plan = generate_plan(deepcopy(base_plan_input))
        months = plan.get("months") or []
        if month_offset >= len(months):
            return {"error": f"Plan only has {len(months)} months. Requested month {month_offset}."}
        m = months[month_offset]
        goals_list = profile.get("goals") or []
        goal_names = {g.get("id"): g.get("name", g.get("id")) for g in goals_list}
        allocs = {
            goal_names.get(gid, gid): amt
            for gid, amt in (m.get("goalAllocations") or {}).items()
            if amt > 0
        }
        return {
            "month_offset": month_offset,
            "date": m.get("date"),
            "income": m.get("income"),
            "expenses": m.get("expenses"),
            "debt_payments": m.get("debtPayments"),
            "surplus": m.get("surplus"),
            "reserved_surplus": m.get("reservedSurplus"),
            "goal_allocations": allocs,
            "net_worth": m.get("netWorth"),
            "milestones": m.get("milestones") or [],
        }

    def _simulate_goal_reorder(new_priorities: list[dict[str, Any]]) -> dict[str, Any]:
        goals_list = profile.get("goals") or []
        if not goals_list:
            return {"error": "No goals found."}

        # Build priority update map. Items are _GoalPriorityItem Pydantic objects.
        priority_map: dict[str, int] = {
            (item.goal_id if hasattr(item, "goal_id") else item.get("goal_id", "")): int(
                item.priority if hasattr(item, "priority") else item.get("priority", 1)
            )
            for item in new_priorities
        }

        # Baseline plan
        baseline_plan = generate_plan(deepcopy(base_plan_input))
        baseline_dates = baseline_plan.get("goalCompletionDates") or {}
        baseline_allocs = baseline_plan.get("recommendedAllocations") or {}

        # Modified goals with new priorities
        modified_input = deepcopy(base_plan_input)
        for g in modified_input.get("goals") or []:
            if g.get("id") in priority_map:
                g["priority"] = priority_map[g["id"]]
        new_plan = generate_plan(modified_input)
        new_dates = new_plan.get("goalCompletionDates") or {}
        new_allocs = new_plan.get("recommendedAllocations") or {}

        goal_names = {g.get("id"): g.get("name", g.get("id")) for g in goals_list}
        deltas = []
        for g in goals_list:
            gid = g.get("id")
            old_priority = g.get("priority")
            new_priority = priority_map.get(gid, old_priority)
            deltas.append(
                {
                    "goal_id": gid,
                    "name": goal_names.get(gid, gid),
                    "old_priority": old_priority,
                    "new_priority": new_priority,
                    "baseline_completion_date": baseline_dates.get(gid),
                    "new_completion_date": new_dates.get(gid),
                    "baseline_monthly_allocation": baseline_allocs.get(gid, 0),
                    "new_monthly_allocation": new_allocs.get(gid, 0),
                }
            )

        return {"goal_deltas": deltas}

    # Goal field normalization. Llama sometimes (a) flattens fields to top level,
    # (b) uses snake_case aliases, or (c) stringifies numbers. Normalize here so
    # the frontend contract is rigid before the proposal leaves the backend.
    _GOAL_NUM_FIELDS = {"targetAmount", "currentAmount", "timelineMonths", "priority"}
    _GOAL_FIELD_ALIASES = {
        "target": "targetAmount",
        "current": "currentAmount",
        "timeline_months": "timelineMonths",
    }

    def _coerce_num(v: Any) -> Any:
        if isinstance(v, (int, float)):
            return v
        if isinstance(v, str):
            try:
                f = float(v.replace(",", ""))
                return int(f) if f.is_integer() else f
            except ValueError:
                return v
        return v

    def _normalize_update_goal_payload(p: dict[str, Any]) -> dict[str, Any]:
        """Guarantee `{"id": str, "updates": {camelCase + numeric-typed fields}}`."""
        out_id = p.get("id") or p.get("goalId") or p.get("goal_id")
        src: dict[str, Any] = dict(p.get("updates") or {})
        # Pull recognized top-level fields into updates (the model often flattens).
        for k, v in p.items():
            if k in ("id", "goalId", "goal_id", "updates"):
                continue
            target_key = _GOAL_FIELD_ALIASES.get(k, k)
            src.setdefault(target_key, v)
        # Rename aliases inside the original updates dict too.
        for alias, canonical in _GOAL_FIELD_ALIASES.items():
            if alias in src and canonical not in src:
                src[canonical] = src.pop(alias)
        # Coerce numerics.
        cleaned: dict[str, Any] = {}
        for k, v in src.items():
            cleaned[k] = _coerce_num(v) if k in _GOAL_NUM_FIELDS else v
        return {"id": out_id, "updates": cleaned}

    def _propose_change(
        action: str, payload: dict[str, Any], rationale: str = ""
    ) -> dict[str, Any]:
        if action not in ALLOWED_PROPOSAL_ACTIONS:
            return {
                "ok": False,
                "error": f"Action '{action}' not allowed. Allowed: {sorted(ALLOWED_PROPOSAL_ACTIONS)}",
            }

        if action == "addDebt":
            debt = payload.get("debt") if isinstance(payload.get("debt"), dict) else payload
            name = str(debt.get("name") or "").strip()
            raw_principal = debt.get("principal") or debt.get("amount") or 0
            try:
                principal = abs(float(raw_principal))
            except (TypeError, ValueError):
                principal = 0.0
            if not name or principal <= 0:
                return {
                    "ok": False,
                    "error": (
                        "addDebt requires debt.name (non-empty string) and debt.principal "
                        "(positive number). Re-read the user's message and retry with the correct values."
                    ),
                }
            interest_rate = debt.get("interestRate", 12)
            try:
                interest_rate = float(interest_rate)
            except (TypeError, ValueError):
                interest_rate = 12.0
            monthly_payment = debt.get("monthlyPayment", 0)
            try:
                monthly_payment = float(monthly_payment)
            except (TypeError, ValueError):
                monthly_payment = 0.0
            if monthly_payment <= 0:
                monthly_payment = round(principal / 12, 2)
            payload = {
                "debt": {
                    "name": name,
                    "principal": principal,
                    "interestRate": interest_rate,
                    "monthlyPayment": monthly_payment,
                    "category": str(debt.get("category", "other")),
                }
            }
            log.info("penny: addDebt payload normalized name=%s principal=%s", name, principal)

        if action == "updateGoal":
            normalized = _normalize_update_goal_payload(payload or {})
            if normalized != (payload or {}):
                log.info(
                    "penny: updateGoal payload normalized raw=%s normalized=%s",
                    payload,
                    normalized,
                )
            payload = normalized

            goal_id = payload.get("id")
            goals_list = profile.get("goals") or []
            target_goal = next((g for g in goals_list if g.get("id") == goal_id), None)
            if target_goal is None:
                return {
                    "ok": False,
                    "error": (
                        f"Goal id '{goal_id}' not found. Call read_profile to get valid ids."
                    ),
                }
            if target_goal.get("status") == "complete":
                name = target_goal.get("name") or goal_id
                return {
                    "ok": False,
                    "error": (
                        f"Goal '{name}' is already complete; updateGoal is rejected. "
                        "If the user wants to keep saving, propose addGoal with a new "
                        "target instead."
                    ),
                }

        result = propose(action, payload, rationale)
        return {
            "status": "pending_user_approval",
            "message": (
                "A proposal card has been sent to the user for approval. "
                "The change has NOT been applied yet. Do NOT say 'updated' or 'changed'. "
                "Say 'I\u2019ve proposed this change \u2014 please review and approve it in the card below.'"
            ),
            "proposal_id": result.get("id"),
        }

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
        StructuredTool.from_function(
            func=_simulate_goal,
            name="simulate_goal",
            description=(
                "Show how many months faster a specific goal completes if the user adds ₹extra_monthly/month to it. "
                "Use when the user asks 'how much faster if I put more into X goal' or 'I want to accelerate my [goal]'."
            ),
            args_schema=_SimGoalArgs,
        ),
        StructuredTool.from_function(
            func=_get_month_cashflow,
            name="get_month_cashflow",
            description=(
                "Return detailed cashflow for a specific future month: income, expenses, debt payments, surplus, "
                "per-goal allocations, net worth. Use when the user asks about a specific point in time "
                "('what does month 6 look like', 'in a year', 'when I hit my emergency fund')."
            ),
            args_schema=_MonthOffsetArgs,
        ),
        StructuredTool.from_function(
            func=_simulate_goal_reorder,
            name="simulate_goal_reorder",
            description=(
                "Simulate the impact of changing goal priorities. Returns new vs baseline completion dates and "
                "monthly allocation changes per goal. Use when the user wants to know 'what if I prioritise X over Y'."
            ),
            args_schema=_ReorderArgs,
        ),
        StructuredTool.from_function(
            func=_check_affordability,
            name="check_affordability",
            description=(
                "Check whether the user can afford a purchase. Returns verdict (affordable_now / affordable_later / "
                "not_affordable), months to save, EMI amount, FOIR check, monthly surplus, and actionable levers. "
                "Use when the user asks 'can I afford X', 'how long to save for Y', or 'what EMI for Z'."
            ),
            args_schema=_AffordabilityArgs,
        ),
    ]


def _summarize_plan(plan: dict[str, Any]) -> dict[str, Any]:
    """Trim the 120-month plan to a Groq-friendly summary."""
    months = plan.get("months") or []
    sample_idx = (
        [0, 11, 35, 59, 119]
        if len(months) >= 120
        else list(range(0, len(months), max(1, len(months) // 5)))
    )
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
