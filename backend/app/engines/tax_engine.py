"""Indian Income Tax Calculator — port of src/lib/tax-engine.ts.

FY 2025-26 (AY 2026-27) slabs for Old & New regime.
"""
from __future__ import annotations

import math
from typing import Any, Literal, TypedDict

from app.engines._helpers import js_round


class _Slab(TypedDict):
    min: int
    max: float  # math.inf for open-ended top slab
    rate: int


_OLD_SLABS: list[_Slab] = [
    {"min": 0, "max": 250000, "rate": 0},
    {"min": 250000, "max": 500000, "rate": 5},
    {"min": 500000, "max": 1000000, "rate": 20},
    {"min": 1000000, "max": math.inf, "rate": 30},
]

_NEW_SLABS: list[_Slab] = [
    {"min": 0, "max": 400000, "rate": 0},
    {"min": 400000, "max": 800000, "rate": 5},
    {"min": 800000, "max": 1200000, "rate": 10},
    {"min": 1200000, "max": 1600000, "rate": 15},
    {"min": 1600000, "max": 2000000, "rate": 20},
    {"min": 2000000, "max": 2400000, "rate": 25},
    {"min": 2400000, "max": math.inf, "rate": 30},
]

STANDARD_DEDUCTION_OLD = 50000
STANDARD_DEDUCTION_NEW = 75000
REBATE_THRESHOLD_OLD = 500000
REBATE_THRESHOLD_NEW = 1200000


def _format_lakh(value: float) -> str:
    # Mirror JS Number#toFixed(1). At /100000 with integer slab edges,
    # values are exact multiples of 0.1 so plain Python format suffices.
    return f"{value / 100000:.1f}"


def _calc_slab_tax(taxable_income: float, slabs: list[_Slab]) -> tuple[int, list[dict[str, Any]]]:
    remaining = taxable_income
    total_tax = 0.0
    breakdown: list[dict[str, Any]] = []

    for slab in slabs:
        if remaining <= 0:
            break
        if math.isinf(slab["max"]):
            slab_width = remaining
            range_str = f"Above ₹{_format_lakh(slab['min'])}L"
        else:
            slab_width = slab["max"] - slab["min"]
            range_str = f"₹{_format_lakh(slab['min'])}L – ₹{_format_lakh(slab['max'])}L"

        taxable_in_slab = min(remaining, slab_width)
        tax_for_slab = taxable_in_slab * (slab["rate"] / 100)

        breakdown.append({
            "range": range_str,
            "rate": slab["rate"],
            "tax": js_round(tax_for_slab),
        })
        total_tax += tax_for_slab
        remaining -= taxable_in_slab

    return js_round(total_tax), breakdown


def calculate_old_regime(gross_income: float, deductions: float) -> dict[str, Any]:
    total_deductions = STANDARD_DEDUCTION_OLD + deductions
    taxable_income = max(0, gross_income - total_deductions)

    tax, slab_breakdown = _calc_slab_tax(taxable_income, _OLD_SLABS)

    applicable_tax = tax
    if taxable_income <= REBATE_THRESHOLD_OLD:
        applicable_tax = max(0, tax - 12500)

    cess = js_round(applicable_tax * 0.04)
    total_tax = applicable_tax + cess

    effective_rate = (
        js_round((total_tax / gross_income) * 10000) / 100 if gross_income > 0 else 0
    )

    return {
        "regime": "old",
        "grossIncome": gross_income,
        "deductions": total_deductions,
        "taxableIncome": taxable_income,
        "tax": applicable_tax,
        "cess": cess,
        "totalTax": total_tax,
        "effectiveRate": effective_rate,
        "slabs": slab_breakdown,
    }


def calculate_new_regime(gross_income: float) -> dict[str, Any]:
    deductions = STANDARD_DEDUCTION_NEW
    taxable_income = max(0, gross_income - deductions)

    tax, slab_breakdown = _calc_slab_tax(taxable_income, _NEW_SLABS)

    applicable_tax = tax
    if taxable_income <= REBATE_THRESHOLD_NEW:
        applicable_tax = 0  # Full rebate

    cess = js_round(applicable_tax * 0.04)
    total_tax = applicable_tax + cess

    effective_rate = (
        js_round((total_tax / gross_income) * 10000) / 100 if gross_income > 0 else 0
    )

    return {
        "regime": "new",
        "grossIncome": gross_income,
        "deductions": deductions,
        "taxableIncome": taxable_income,
        "tax": applicable_tax,
        "cess": cess,
        "totalTax": total_tax,
        "effectiveRate": effective_rate,
        "slabs": slab_breakdown,
    }


def compare_tax_regimes(gross_income: float, deductions: float) -> dict[str, Any]:
    old = calculate_old_regime(gross_income, deductions)
    new = calculate_new_regime(gross_income)

    better: Literal["old", "new"] = "old" if old["totalTax"] <= new["totalTax"] else "new"

    return {
        "old": old,
        "new": new,
        "savings": abs(old["totalTax"] - new["totalTax"]),
        "betterRegime": better,
    }
