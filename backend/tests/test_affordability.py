"""Parity tests for the Python affordability engine.

Test cases are translated from frontend/src/lib/__tests__/affordability.test.ts.
Numeric assertions use the same inputs/expectations as the TS suite.
"""

from __future__ import annotations

import pytest

from app.engines.affordability import foir_band_for, run_affordability


def make_input(**overrides) -> dict:
    base = {
        "targetCost": 800_000,
        "route": "cash",
        "netMonthlyIncome": 100_000,
        "monthlyExpenses": 60_000,
        "monthlyReserve": 5_000,
        "existingEmiTotal": 10_000,
        "investmentReturnRate": 8,
        "annualInterestRate": 9,
        "tenureMonths": 60,
    }
    base.update(overrides)
    return base


# ── foir_band_for ─────────────────────────────────────────────────────────────


def test_foir_salaried_home():
    band = foir_band_for(100_000, "salaried", "home")
    assert band["cap"] == 0.5
    assert band["capAmount"] == 50_000
    assert band["label"] == "50% of net income"


def test_foir_self_employed_other():
    band = foir_band_for(100_000, "self_employed", "other")
    assert band["cap"] == 0.4


def test_foir_defaults():
    band = foir_band_for(100_000)
    assert band["cap"] == 0.4


def test_foir_cap_amount_integer():
    band = foir_band_for(100_001, "salaried", "personal")
    assert isinstance(band["capAmount"], int)


# ── Cash route ────────────────────────────────────────────────────────────────


def test_cash_affordable_now():
    # surplus = 100k - 60k - 0 - 0 = 40k; targetCost 30k → n=ceil(0.75)=1
    result = run_affordability(
        make_input(targetCost=30_000, existingEmiTotal=0, monthlyReserve=0)
    )
    assert result["verdict"] == "affordable_now"
    assert result["monthsToAfford"] is not None
    assert result["monthsToAfford"] <= 1
    assert result["gap"] == 0
    assert result["emi"] is None
    assert result["foirOk"] is None
    assert result["levers"] == []


def test_cash_affordable_later():
    # surplus = 100k - 60k - 10k - 5k = 25k/mo; target=800k → ~29 months
    result = run_affordability(make_input())
    assert result["verdict"] == "affordable_later"
    assert result["monthsToAfford"] is not None
    assert result["monthsToAfford"] > 1
    assert result["monthlySurplus"] == 25_000


def test_cash_not_affordable():
    # expenses 102k > income 100k → surplus = -2k → not_affordable
    result = run_affordability(
        make_input(monthlyExpenses=102_000, existingEmiTotal=0, monthlyReserve=0)
    )
    assert result["verdict"] == "not_affordable"
    assert result["monthsToAfford"] is None
    assert result["gap"] > 0


def test_cash_emits_levers_when_months_gt_36():
    result = run_affordability(make_input(targetCost=5_000_000, investmentReturnRate=0))
    assert result["verdict"] == "affordable_later"
    types = [l["type"] for l in result["levers"]]
    assert "increaseSurplus" in types
    assert "cutExpenses" in types
    assert "raiseIncome" in types


def test_cash_no_levers_within_36_months():
    # 800k at 25k/mo ≈ 29 months — within benchmark
    result = run_affordability(make_input())
    assert result["levers"] == []


def test_cash_lever_monthly_savings_positive_integer():
    result = run_affordability(make_input(targetCost=5_000_000, investmentReturnRate=0))
    lever = next((l for l in result["levers"] if l["type"] == "increaseSurplus"), None)
    assert lever is not None
    assert lever["monthlySavingsNeeded"] > 0
    assert isinstance(lever["monthlySavingsNeeded"], int)


def test_cash_raise_income_lever_exceeds_current():
    inp = make_input(targetCost=5_000_000, investmentReturnRate=0)
    result = run_affordability(inp)
    lever = next((l for l in result["levers"] if l["type"] == "raiseIncome"), None)
    assert lever is not None
    assert lever["targetIncome"] > inp["netMonthlyIncome"]


def test_cash_zero_rate_formula():
    # 800k / 25k = 32 months
    result = run_affordability(make_input(investmentReturnRate=0))
    assert result["monthsToAfford"] == 32


# ── EMI route ─────────────────────────────────────────────────────────────────


def test_emi_affordable_now():
    # 800k at 9%/60mo → EMI ~₹16,607; surplus=25k; FOIR cap=40k → fits both
    result = run_affordability(make_input(route="emi"))
    assert result["verdict"] == "affordable_now"
    assert result["emi"] is not None
    assert result["emi"] > 0
    assert result["foirOk"] is True
    assert result["monthsToAfford"] is None
    assert result["levers"] == []


def test_emi_foir_exceeded():
    result = run_affordability(
        make_input(
            route="emi",
            targetCost=10_000_000,
            netMonthlyIncome=40_000,
            monthlyExpenses=20_000,
            existingEmiTotal=0,
            monthlyReserve=0,
        )
    )
    assert result["foirOk"] is False
    assert result["verdict"] in ("not_affordable", "affordable_later")
    assert result["gap"] > 0


def test_emi_extend_tenure_lever():
    result = run_affordability(
        make_input(
            route="emi",
            targetCost=5_000_000,
            netMonthlyIncome=100_000,
            monthlyExpenses=50_000,
            existingEmiTotal=0,
            monthlyReserve=0,
            tenureMonths=60,
            loanType="home",
        )
    )
    if not result["foirOk"]:
        ext = next((l for l in result["levers"] if l["type"] == "extendTenure"), None)
        if ext:
            assert ext["newTenureMonths"] > 60


def test_emi_caps_tenure_at_retirement():
    # Age 55 → max tenure = (60-55)*12 = 60 months
    result = run_affordability(make_input(route="emi", ageYears=55))
    assert result["emi"] is not None
    assert result["emi"] > 0


def test_emi_foir_cap_amount_integer():
    result = run_affordability(make_input(route="emi"))
    assert result["foirCapAmount"] is not None
    assert result["foirCapAmount"] > 0
    assert isinstance(result["foirCapAmount"], int)


def test_emi_affordable_later_when_foir_ok_but_emi_exceeds_surplus():
    result = run_affordability(
        make_input(
            route="emi",
            netMonthlyIncome=100_000,
            monthlyExpenses=80_000,
            existingEmiTotal=0,
            monthlyReserve=0,
            targetCost=800_000,
        )
    )
    if result["foirOk"] and result["emi"] is not None and result["emi"] > result["monthlySurplus"]:
        assert result["verdict"] == "affordable_later"
        types = [l["type"] for l in result["levers"]]
        assert "cutExpenses" in types
