"""Anonymize FinancialProfile.

Returns only aggregate numbers + goal metadata for the Groq system prompt.
Mirrors the v3 IncomeProfile shape on the frontend store (primary/secondary/
passive/variable). Legacy `salary`/`freelance` keys removed.
"""

from __future__ import annotations

from typing import Any


def anonymize_profile(profile: dict[str, Any]) -> dict[str, Any]:
    income = profile.get("income") or {}
    expenses = profile.get("expenses") or {}
    debts = profile.get("debts") or {}
    goals = profile.get("goals") or []
    health = profile.get("healthScore")

    return {
        "income": {
            "primary": income.get("primary", 0),
            "secondary": income.get("secondary", 0),
            "passive": income.get("passive", 0),
            "variable": income.get("variable", 0),
            "total": income.get("total", 0),
        },
        "expenses": {
            "rent": expenses.get("rent", 0),
            "food": expenses.get("food", 0),
            "transport": expenses.get("transport", 0),
            "utilities": expenses.get("utilities", 0),
            "entertainment": expenses.get("entertainment", 0),
            "other": expenses.get("other", 0),
            "total": expenses.get("total", 0),
        },
        "debts": {
            "totalMonthly": debts.get("totalMonthly", 0),
            "itemCount": len(debts.get("items") or []),
        },
        "savings": profile.get("savings", 0),
        "investments": profile.get("investments", 0),
        "emergencyFund": profile.get("emergencyFund", 0),
        # Goal ids and names pass through unchanged: read_profile already
        # returns both to the model, so aliasing them here only created a
        # split-brain where the model quoted prompt ids ("goal-1") that no
        # tool or store setter could resolve. Anonymization still applies to
        # everything else (aggregates only; no account numbers or line items).
        "goals": [
            {
                "id": g.get("id"),
                "name": g.get("name"),
                "targetAmount": g.get("targetAmount", 0),
                "currentAmount": g.get("currentAmount", 0),
                "timelineMonths": g.get("timelineMonths", 0),
                "priority": g.get("priority"),
                "status": g.get("status"),
                "category": g.get("category"),
            }
            for g in goals
        ],
        "healthScore": (
            {
                "overall": health.get("overall", 0),
                "incomeStability": health.get("incomeStability", 0),
                "debtLoad": health.get("debtLoad", 0),
                "savingsRate": health.get("savingsRate", 0),
                "emergencyFund": health.get("emergencyFund", 0),
            }
            if isinstance(health, dict)
            else None
        ),
        "monthlySurplusReserve": profile.get("monthlySurplusReserve", 0),
        "strategy": profile.get("strategy", "avalanche"),
    }
