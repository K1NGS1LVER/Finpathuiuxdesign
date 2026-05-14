"""Financial health score — port of src/lib/health-score.ts.

Produces a 0–100 composite score across 4 dimensions plus up to
3 actionable recommendations.
"""
from __future__ import annotations

from typing import Any

from app.engines._helpers import js_round


def _score_savings_rate(income: float, expenses: float, debt_payments: float) -> int:
    if income <= 0:
        return 0
    surplus = income - expenses - debt_payments
    rate = (surplus / income) * 100
    if rate >= 30:
        return 25
    if rate >= 20:
        return 20
    if rate >= 10:
        return 12
    if rate >= 0:
        return 5
    return 0


def _score_debt_load(income: float, debt_payments: float) -> int:
    if income <= 0:
        return 0
    dti = (debt_payments / income) * 100
    if dti == 0:
        return 25
    if dti < 20:
        return 22
    if dti < 35:
        return 18
    if dti < 50:
        return 10
    return 3


def _score_emergency_fund(emergency_fund: float, monthly_expenses: float) -> int:
    if monthly_expenses <= 0:
        return 25
    months = emergency_fund / monthly_expenses
    if months >= 6:
        return 25
    if months >= 3:
        return 18
    if months >= 1:
        return 10
    return 3


def _score_income_stability(income: dict[str, Any]) -> int:
    if (income.get("total") or 0) <= 0:
        return 0
    sources = sum(
        1 for v in (
            income.get("primary", 0),
            income.get("secondary", 0),
            income.get("passive", 0),
            income.get("variable", 0),
        ) if v and v > 0
    )
    if sources >= 4:
        return 25
    if sources >= 3:
        return 25
    if sources >= 2:
        return 20
    if (income.get("primary") or 0) > 0:
        return 15
    return 10


def _generate_actions(
    savings_score: int,
    debt_score: int,
    emergency_score: int,
    income_score: int,
    income: float,
    expenses: float,
    debt_payments: float,
    emergency_fund: float,
) -> list[str]:
    actions: list[str] = []

    if emergency_score < 18:
        monthly_expense = expenses + debt_payments
        target = monthly_expense * 3
        needed = max(0, target - emergency_fund)
        actions.append(
            f"Build your emergency fund — save ₹{js_round(needed / 1000)}K more to reach 3 months' expenses"
        )

    if debt_score < 18:
        actions.append(
            "Reduce debt payments below 35% of income — consider the avalanche method to save on interest"
        )

    if savings_score < 20:
        target_savings = income * 0.2
        current_savings = income - expenses - debt_payments
        gap = max(0, target_savings - current_savings)
        actions.append(
            f"Increase monthly savings by ₹{js_round(gap / 1000)}K to hit the 20% target"
        )

    if income_score < 20:
        actions.append(
            "Explore a side income source to diversify — freelancing or passive income can boost stability"
        )

    if not actions:
        actions.append(
            "You're in great shape! Consider increasing SIP contributions for long-term wealth building"
        )

    return actions[:3]


def calculate_health_score(input_: dict[str, Any]) -> dict[str, Any]:
    income = input_.get("income") or {}
    expenses = input_.get("expenses") or {}
    debts = input_.get("debts") or {}
    emergency_fund = input_.get("emergencyFund") or 0

    expenses_total = expenses.get("total") or 0
    debts_total_monthly = debts.get("totalMonthly") or 0

    monthly_expenses_deduplicated = max(0, expenses_total - debts_total_monthly)
    income_total = income.get("total") or 0

    income_stability = _score_income_stability(income)
    savings_rate = _score_savings_rate(income_total, monthly_expenses_deduplicated, debts_total_monthly)
    debt_load = _score_debt_load(income_total, debts_total_monthly)
    emergency_fund_score = _score_emergency_fund(
        emergency_fund, monthly_expenses_deduplicated + debts_total_monthly
    )

    overall = income_stability + savings_rate + debt_load + emergency_fund_score

    actions = _generate_actions(
        savings_rate,
        debt_load,
        emergency_fund_score,
        income_stability,
        income_total,
        monthly_expenses_deduplicated,
        debts_total_monthly,
        emergency_fund,
    )

    return {
        "overall": min(100, max(0, overall)),
        "incomeStability": income_stability,
        "debtLoad": debt_load,
        "savingsRate": savings_rate,
        "emergencyFund": emergency_fund_score,
        "actions": actions,
    }
