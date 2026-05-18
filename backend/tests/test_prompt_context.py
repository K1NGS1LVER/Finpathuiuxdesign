"""Tests for screen-context injection in build_system_prompt."""
from __future__ import annotations

from app.services.prompt import ROUTE_HINTS, build_system_prompt

EMPTY_PROFILE = {
    "income": {"primary": 50000, "secondary": 0, "passive": 0, "variable": 0, "total": 50000},
    "expenses": {"rent": 15000, "food": 8000, "transport": 3000, "utilities": 2000, "entertainment": 2000, "other": 2000, "total": 32000},
    "debts": {"totalMonthly": 5000, "items": []},
    "goals": [],
    "savings": 10000,
    "investments": 0,
    "emergencyFund": 0,
    "monthlySurplusReserve": 0,
    "strategy": "avalanche",
}


def test_no_context_leaves_prompt_unchanged() -> None:
    prompt = build_system_prompt(EMPTY_PROFILE)
    # Header block only appears when context is injected; BOUNDARIES copy
    # references it by name but is not the injected block itself.
    assert "CURRENT SCREEN: The user is RIGHT NOW" not in prompt


def test_known_route_injects_hint() -> None:
    prompt = build_system_prompt(EMPTY_PROFILE, context="debt")
    assert "CURRENT SCREEN: The user is RIGHT NOW" in prompt
    assert "**debt**" in prompt
    # Hint copy from ROUTE_HINTS should appear verbatim.
    assert ROUTE_HINTS["debt"] in prompt


def test_unknown_route_is_dropped() -> None:
    prompt = build_system_prompt(EMPTY_PROFILE, context="some-bogus-route")
    assert "CURRENT SCREEN: The user is RIGHT NOW" not in prompt


def test_route_is_case_insensitive() -> None:
    prompt = build_system_prompt(EMPTY_PROFILE, context="DEBT")
    assert "CURRENT SCREEN: The user is RIGHT NOW" in prompt
    assert ROUTE_HINTS["debt"] in prompt


def test_all_app_routes_have_hints() -> None:
    """Sanity: every app-shell route in the SPA should be mapped."""
    expected = {"dashboard", "journey", "month", "debt", "scenarios", "progress", "cashflow", "celebrate", "settings"}
    assert expected.issubset(set(ROUTE_HINTS))
