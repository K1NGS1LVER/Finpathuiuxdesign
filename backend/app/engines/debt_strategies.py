"""Debt payoff strategy calculators — port of src/lib/debt-strategies.ts.

Avalanche: highest interest first.
Snowball: smallest balance first.

`date` strings on each step are produced for presentational parity with
the TS engine but are runtime-dependent. Parity tests strip them before
comparing — `month` is the canonical time index.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Callable, Literal

from app.engines._helpers import js_round

_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
_MAX_MONTHS = 360  # 30-year safety cap


def _month_to_date(offset: int) -> str:
    now = datetime.now()
    year = now.year
    month_index = now.month - 1 + offset
    year += month_index // 12
    month_index = month_index % 12
    return f"{_MONTHS_SHORT[month_index]} {year}"


def _monthly_interest(balance: float, annual_rate: float) -> float:
    return balance * (annual_rate / 100 / 12)


def _simulate(
    debts: list[dict[str, Any]],
    extra_payment: float,
    sort_fn: Callable[[dict[str, Any]], Any],
) -> dict[str, Any]:
    if not debts:
        return {
            "strategy": "avalanche",
            "totalMonths": 0,
            "totalInterestPaid": 0,
            "totalPaid": 0,
            "steps": [],
            "payoffDates": {},
        }

    active = [
        {
            "id": d["id"],
            "name": d["name"],
            "balance": d["principal"],
            "interestRate": d["interestRate"],
            "minPayment": d["monthlyPayment"],
        }
        for d in debts
    ]

    steps: list[dict[str, Any]] = []
    payoff_dates: dict[str, int] = {}
    total_interest_paid = 0.0
    total_paid = 0.0
    month = 0

    while active and month < _MAX_MONTHS:
        month += 1
        active.sort(key=sort_fn)

        total_min = sum(d["minPayment"] for d in active)
        available = total_min + extra_payment

        for debt in active:
            interest = _monthly_interest(debt["balance"], debt["interestRate"])
            debt["balance"] += interest
            total_interest_paid += interest

            payment = min(debt["balance"], debt["minPayment"])
            debt["balance"] -= payment
            available -= payment
            total_paid += payment

            steps.append({
                "month": month,
                "date": _month_to_date(month),
                "debtId": debt["id"],
                "debtName": debt["name"],
                "payment": payment,
                "remainingBalance": max(0, debt["balance"]),
                "interestPaid": interest,
                "isPaidOff": debt["balance"] <= 0.01,
            })

        # Apply extra payment waterfall to the top-priority debt
        if available > 0 and active:
            target = active[0]
            extra_pay = min(target["balance"], available)
            target["balance"] -= extra_pay
            total_paid += extra_pay

            # Update the last step for this debt
            for step in reversed(steps):
                if step["month"] == month and step["debtId"] == target["id"]:
                    step["payment"] += extra_pay
                    step["remainingBalance"] = max(0, target["balance"])
                    step["isPaidOff"] = target["balance"] <= 0.01
                    break

        # Remove paid-off debts
        new_active = []
        for d in active:
            if d["balance"] <= 0.01:
                payoff_dates[d["id"]] = month
            else:
                new_active.append(d)
        active = new_active

    return {
        "strategy": "avalanche",
        "totalMonths": month,
        "totalInterestPaid": js_round(total_interest_paid),
        "totalPaid": js_round(total_paid),
        "steps": steps,
        "payoffDates": payoff_dates,
    }


def avalanche(debts: list[dict[str, Any]], extra_monthly_payment: float = 0) -> dict[str, Any]:
    result = _simulate(debts, extra_monthly_payment, sort_fn=lambda d: -d["interestRate"])
    result["strategy"] = "avalanche"
    return result


def snowball(debts: list[dict[str, Any]], extra_monthly_payment: float = 0) -> dict[str, Any]:
    result = _simulate(debts, extra_monthly_payment, sort_fn=lambda d: d["balance"])
    result["strategy"] = "snowball"
    return result


def compare_strategies(debts: list[dict[str, Any]], extra_monthly_payment: float = 0) -> dict[str, Any]:
    a = avalanche(debts, extra_monthly_payment)
    s = snowball(debts, extra_monthly_payment)
    recommendation: Literal["avalanche", "snowball"] = (
        "avalanche" if a["totalInterestPaid"] < s["totalInterestPaid"] else "snowball"
    )
    return {
        "avalanche": a,
        "snowball": s,
        "interestSaved": s["totalInterestPaid"] - a["totalInterestPaid"],
        "monthsDifference": s["totalMonths"] - a["totalMonths"],
        "recommendation": recommendation,
    }
