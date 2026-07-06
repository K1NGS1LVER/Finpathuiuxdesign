"""Regression tests for the Penny tool layer (make_tools closures).

These exercise the tools directly (no LLM) and cover bugs that engine-level
tests could never see:
- simulate_plan summarizing keys the plan engine never produced (always-None)
- compare_debt_strategies dumping full per-debt-per-month step arrays at the model
- check_affordability feeding gross income into math specified for take-home
"""

from __future__ import annotations

import json
from typing import Any

from app.agents.tools import make_tools


def _noop_propose(action: str, payload: dict[str, Any], rationale: str) -> dict[str, Any]:
    return {"id": "prop-test", "status": "pending", "action": action, "payload": payload}


def make_profile(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "income": {"total": 120_000, "netMonthly": 100_000, "primary": 120_000},
        "expenses": {"total": 60_000},
        "debts": {"items": [], "totalMonthly": 0},
        "goals": [
            {
                "id": "goal-1700000000000-0",
                "name": "Emergency Fund",
                "category": "savings",
                "targetAmount": 300_000,
                "currentAmount": 100_000,
                "priority": 1,
                "status": "active",
                "timelineMonths": 24,
            }
        ],
        "savings": 200_000,
        "investments": 0,
        "emergencyFund": 100_000,
        "strategy": "avalanche",
        "monthlySurplusReserve": 0,
        "investmentReturnRate": 12,
        "ageYears": 30,
        "employmentType": "salaried",
    }
    base.update(overrides)
    return base


def get_tool(profile: dict[str, Any], name: str):
    tools = make_tools(profile, _noop_propose)
    tool = next((t for t in tools if t.name == name), None)
    assert tool is not None, f"tool {name} not registered"
    return tool


# ── simulate_plan summary ─────────────────────────────────────────────────────


def test_simulate_plan_reports_goal_completion_dates():
    # Surplus is large relative to the single goal, so it completes well
    # within the 120-month horizon and must show up in the summary.
    result = get_tool(make_profile(), "simulate_plan").invoke({})
    dates = result["goal_completion_dates"]
    assert dates, "expected at least one goal completion date"
    assert "goal-1700000000000-0" in dates


def test_simulate_plan_summary_drops_phantom_keys():
    # These keys were never produced by generate_plan and always read None.
    result = get_tool(make_profile(), "simulate_plan").invoke({})
    assert "goal_completion_months" not in result
    assert "total_debt_payoff_month" not in result


# ── compare_debt_strategies payload ───────────────────────────────────────────


def _debt(i: int, principal: float, rate: float, payment: float) -> dict[str, Any]:
    return {
        "id": f"debt-{i}",
        "name": f"Loan {i}",
        "principal": principal,
        "interestRate": rate,
        "monthlyPayment": payment,
    }


def test_compare_debt_strategies_payload_is_bounded():
    # 5 long-tenure debts: the raw engine output would contain thousands of
    # per-month steps across both strategies. The tool must stay compact.
    debts = {
        "items": [_debt(i, 2_000_000, 8 + i, 18_000) for i in range(5)],
        "totalMonthly": 90_000,
    }
    profile = make_profile(debts=debts, expenses={"total": 150_000})
    result = get_tool(profile, "compare_debt_strategies").invoke({})

    assert "steps" not in result["avalanche"]
    assert "steps" not in result["snowball"]
    assert result["recommendation"] in ("avalanche", "snowball")
    assert result["avalanche"]["totalMonths"] > 0
    assert len(json.dumps(result)) < 4_000


def test_compare_debt_strategies_tolerates_malformed_debt():
    debts = {
        "items": [
            {"name": "no principal or payment"},
            _debt(1, 100_000, 12, 10_000),
        ],
        "totalMonthly": 10_000,
    }
    profile = make_profile(debts=debts)
    result = get_tool(profile, "compare_debt_strategies").invoke({})
    # Must not raise; the malformed item is skipped, the valid one simulated.
    assert result["avalanche"]["totalMonths"] > 0


# ── check_affordability income + surplus semantics ────────────────────────────


def test_check_affordability_uses_net_income_not_gross():
    # gross 120k, net 100k, expenses 60k -> surplus must be 40k (net-based),
    # not 60k (gross-based).
    result = get_tool(make_profile(), "check_affordability").invoke({"target_cost": 500_000})
    assert result["monthlySurplus"] == 40_000


def test_check_affordability_falls_back_to_gross_for_legacy_profiles():
    profile = make_profile(income={"total": 120_000, "primary": 120_000})
    result = get_tool(profile, "check_affordability").invoke({"target_cost": 500_000})
    assert result["monthlySurplus"] == 60_000


def test_check_affordability_does_not_double_count_emis():
    # expenses.total includes EMIs by contract; debts.totalMonthly must only
    # affect FOIR headroom, never the surplus.
    profile = make_profile(debts={"items": [_debt(1, 500_000, 10, 15_000)], "totalMonthly": 15_000})
    result = get_tool(profile, "check_affordability").invoke({"target_cost": 500_000})
    assert result["monthlySurplus"] == 40_000
