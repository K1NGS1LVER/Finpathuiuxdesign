"""Python port of frontend/src/lib/math/affordability.ts.

Parity notes:
- pmt/fv use js_round (Math.round semantics) to match TS outputs.
- monthsToSave / requiredMonthlySavings use math.ceil (same as JS Math.ceil).
- FOIR caps and BENCHMARK_MONTHS are identical to the TS constants.
"""

from __future__ import annotations

import math
from typing import Any, Literal

from app.engines._helpers import js_round

# ── FOIR table ───────────────────────────────────────────────────────────────

EmploymentType = Literal["salaried", "self_employed"]
LoanType = Literal["home", "personal", "vehicle", "other"]

_FOIR_CAPS: dict[str, dict[str, float]] = {
    "salaried": {"home": 0.5, "personal": 0.45, "vehicle": 0.45, "other": 0.4},
    "self_employed": {"home": 0.45, "personal": 0.4, "vehicle": 0.4, "other": 0.4},
}

BENCHMARK_MONTHS = 36


def foir_band_for(
    net_monthly: float,
    employment_type: str = "salaried",
    loan_type: str = "other",
) -> dict[str, Any]:
    cap = _FOIR_CAPS.get(employment_type, _FOIR_CAPS["salaried"]).get(
        loan_type, _FOIR_CAPS["salaried"]["other"]
    )
    return {
        "cap": cap,
        "capAmount": js_round(net_monthly * cap),
        "label": f"{round(cap * 100)}% of net income",
    }


# ── Financial math helpers ───────────────────────────────────────────────────


def _pmt(rate: float, nper: int, pv: float) -> int:
    """Monthly payment on a loan. Mirrors TS pmt()."""
    if nper <= 0:
        return 0
    if rate == 0:
        return js_round(pv / nper)
    payment = (pv * rate) / (1 - (1 + rate) ** -nper)
    return js_round(payment)


def _months_to_save(
    target_cost: float,
    monthly_surplus: float,
    monthly_rate: float,
) -> int | None:
    """Analytic months-to-afford for cash savings. Returns None when surplus ≤ 0."""
    if monthly_surplus <= 0:
        return None
    if monthly_rate == 0:
        return math.ceil(target_cost / monthly_surplus)
    n = math.log(1 + (target_cost * monthly_rate) / monthly_surplus) / math.log(1 + monthly_rate)
    return math.ceil(n)


def _required_monthly_savings(
    target_cost: float,
    months: int,
    monthly_rate: float,
) -> int:
    """Monthly savings needed to accumulate target_cost in exactly n months."""
    if months <= 0:
        return int(target_cost)
    if monthly_rate == 0:
        return math.ceil(target_cost / months)
    growth = (1 + monthly_rate) ** months
    return math.ceil((target_cost * monthly_rate) / (growth - 1))


# ── Lever builders ───────────────────────────────────────────────────────────


def _build_cash_levers(
    inp: dict[str, Any],
    surplus: float,
    months_to_afford: int | None,
    monthly_rate: float,
) -> list[dict[str, Any]]:
    if months_to_afford is not None and months_to_afford <= BENCHMARK_MONTHS:
        return []

    target_cost: float = inp["targetCost"]
    levers: list[dict[str, Any]] = []
    required36 = _required_monthly_savings(target_cost, BENCHMARK_MONTHS, monthly_rate)
    gap36 = required36 - max(0.0, surplus)

    if gap36 > 0:
        levers.append(
            {
                "type": "increaseSurplus",
                "monthlySavingsNeeded": int(gap36),
                "newMonthsToAfford": BENCHMARK_MONTHS,
            }
        )
        levers.append(
            {
                "type": "cutExpenses",
                "monthlySavingsNeeded": int(gap36),
                "newMonthsToAfford": BENCHMARK_MONTHS,
            }
        )
        target_income = (
            required36 + inp["monthlyExpenses"] + inp["monthlyReserve"] + inp["existingEmiTotal"]
        )
        if target_income > inp["netMonthlyIncome"]:
            lever: dict[str, Any] = {
                "type": "raiseIncome",
                "targetIncome": math.ceil(target_income),
                "newMonthsToAfford": BENCHMARK_MONTHS,
            }
            if surplus <= 0:
                lever["reasonIfBlocked"] = "surplus_floor"
            levers.append(lever)

    return levers


def _build_emi_levers(
    inp: dict[str, Any],
    surplus: float,
    emi: int,
    foir_ok: bool,
    foir_cap_amount: int,
    effective_tenure: int,
    monthly_rate: float,
) -> list[dict[str, Any]]:
    levers: list[dict[str, Any]] = []
    loan_type = inp.get("loanType") or "other"
    employment_type = inp.get("employmentType") or "salaried"
    age_years: int | None = inp.get("ageYears")

    if not foir_ok:
        max_tenure = (60 - age_years) * 12 if age_years else 360
        extended_tenure: int | None = None
        t = effective_tenure + 12
        while t <= max_tenure:
            ext_emi = _pmt(monthly_rate, t, inp["targetCost"])
            band = foir_band_for(inp["netMonthlyIncome"], employment_type, loan_type)
            if inp["existingEmiTotal"] + ext_emi <= band["capAmount"]:
                extended_tenure = t
                break
            t += 12

        if extended_tenure is not None:
            reason: str = "foir_cap"
            if age_years and extended_tenure >= (60 - age_years) * 12:
                reason = "retirement_cap"
            levers.append(
                {
                    "type": "extendTenure",
                    "newTenureMonths": extended_tenure,
                    "reasonIfBlocked": reason,
                }
            )

        emp_foir_cap = _FOIR_CAPS.get(employment_type, _FOIR_CAPS["salaried"]).get(
            loan_type, _FOIR_CAPS["salaried"]["other"]
        )
        income_needed = math.ceil((inp["existingEmiTotal"] + emi) / emp_foir_cap)
        if income_needed > inp["netMonthlyIncome"]:
            levers.append(
                {
                    "type": "raiseIncome",
                    "targetIncome": income_needed,
                    "reasonIfBlocked": "foir_cap",
                }
            )

    elif emi > surplus:
        surplus_gap = emi - surplus
        levers.append({"type": "cutExpenses", "monthlySavingsNeeded": math.ceil(surplus_gap)})
        levers.append(
            {
                "type": "raiseIncome",
                "targetIncome": math.ceil(inp["netMonthlyIncome"] + surplus_gap),
            }
        )

    return levers


# ── Main engine ──────────────────────────────────────────────────────────────


def run_affordability(inp: dict[str, Any]) -> dict[str, Any]:
    """Port of runAffordability() in frontend/src/lib/math/affordability.ts.

    Input keys (camelCase, matching TS AffordabilityInput):
      targetCost, route, netMonthlyIncome, monthlyExpenses, monthlyReserve,
      existingEmiTotal, investmentReturnRate, annualInterestRate (default 9),
      tenureMonths (default 60), ageYears?, employmentType?, loanType?

    Returns dict matching AffordabilityResult shape.
    """
    target_cost: float = float(inp["targetCost"])
    route: str = inp.get("route", "cash")
    net_monthly_income: float = float(inp["netMonthlyIncome"])
    monthly_expenses: float = float(inp["monthlyExpenses"])
    monthly_reserve: float = float(inp.get("monthlyReserve", 0))
    existing_emi_total: float = float(inp.get("existingEmiTotal", 0))
    investment_return_rate: float = float(inp.get("investmentReturnRate", 8))
    annual_interest_rate: float = float(inp.get("annualInterestRate", 9))
    tenure_months: int = int(inp.get("tenureMonths", 60))
    age_years: int | None = inp.get("ageYears")
    employment_type: str = inp.get("employmentType") or "salaried"
    loan_type: str = inp.get("loanType") or "other"

    monthly_surplus = net_monthly_income - monthly_expenses - existing_emi_total - monthly_reserve
    monthly_rate = investment_return_rate / 12 / 100

    if route == "cash":
        mta = _months_to_save(target_cost, monthly_surplus, monthly_rate)
        if mta is not None and mta <= 1:
            verdict = "affordable_now"
        elif mta is not None:
            verdict = "affordable_later"
        else:
            verdict = "not_affordable"

        if verdict == "affordable_now":
            gap = 0
        elif monthly_surplus <= 0:
            gap = abs(monthly_surplus) + _required_monthly_savings(
                target_cost, BENCHMARK_MONTHS, monthly_rate
            )
        else:
            gap = max(
                0,
                _required_monthly_savings(target_cost, BENCHMARK_MONTHS, monthly_rate)
                - monthly_surplus,
            )

        levers = _build_cash_levers(inp, monthly_surplus, mta, monthly_rate)

        return {
            "verdict": verdict,
            "monthsToAfford": mta,
            "monthlySurplus": monthly_surplus,
            "emi": None,
            "foirOk": None,
            "foirCapAmount": None,
            "gap": gap,
            "levers": levers,
        }

    # EMI route
    if age_years:
        max_tenure = max(1, (60 - age_years) * 12)
    else:
        max_tenure = tenure_months
    effective_tenure = min(tenure_months, max_tenure)
    emi_rate = annual_interest_rate / 12 / 100
    emi = _pmt(emi_rate, effective_tenure, target_cost)

    band = foir_band_for(net_monthly_income, employment_type, loan_type)
    foir_cap_amount: int = band["capAmount"]
    foir_ok = (existing_emi_total + emi) <= foir_cap_amount

    if foir_ok:
        gap = max(0, emi - monthly_surplus)
    else:
        gap = max(0, existing_emi_total + emi - foir_cap_amount)

    if foir_ok and emi <= monthly_surplus:
        verdict = "affordable_now"
    elif foir_ok or gap > 0:
        verdict = "affordable_later"
    else:
        verdict = "not_affordable"

    levers = _build_emi_levers(
        inp, monthly_surplus, emi, foir_ok, foir_cap_amount, effective_tenure, emi_rate
    )

    # not_affordable only when FOIR blocked AND no lever can fix it
    final_verdict = "not_affordable" if not foir_ok and len(levers) == 0 else verdict

    return {
        "verdict": final_verdict,
        "monthsToAfford": None,
        "monthlySurplus": monthly_surplus,
        "emi": emi,
        "foirOk": foir_ok,
        "foirCapAmount": foir_cap_amount,
        "gap": gap,
        "levers": levers,
    }
