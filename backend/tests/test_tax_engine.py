"""Parity tests for the Python tax engine vs TS-generated fixtures."""
from __future__ import annotations

import pytest

from app.engines.tax_engine import (
    calculate_new_regime,
    calculate_old_regime,
    compare_tax_regimes,
)
from tests.conftest import list_cases, load_fixture


@pytest.mark.parametrize("case", [n for n in list_cases("tax") if n.startswith("old__")])
def test_old_regime_parity(case: str) -> None:
    fix = load_fixture("tax", case)
    got = calculate_old_regime(fix["input"]["grossIncome"], fix["input"]["deductions"])
    assert got == fix["expected"], f"old regime mismatch for {case}"


@pytest.mark.parametrize("case", [n for n in list_cases("tax") if n.startswith("new__")])
def test_new_regime_parity(case: str) -> None:
    fix = load_fixture("tax", case)
    got = calculate_new_regime(fix["input"]["grossIncome"])
    assert got == fix["expected"], f"new regime mismatch for {case}"


@pytest.mark.parametrize("case", [n for n in list_cases("tax") if n.startswith("compare__")])
def test_compare_parity(case: str) -> None:
    fix = load_fixture("tax", case)
    got = compare_tax_regimes(fix["input"]["grossIncome"], fix["input"]["deductions"])
    assert got == fix["expected"], f"compare mismatch for {case}"
