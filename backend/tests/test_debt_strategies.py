"""Parity tests for the Python debt-strategies engine vs TS fixtures.

`date` strings on each step are stripped before comparing — both engines
generate them from runtime `now()`; the `month` integer is canonical.
"""

from __future__ import annotations

import pytest

from app.engines.debt_strategies import avalanche, compare_strategies, snowball
from tests.conftest import list_cases, load_fixture, strip_dates


@pytest.mark.parametrize("case", [n for n in list_cases("debt") if n.startswith("avalanche__")])
def test_avalanche_parity(case: str) -> None:
    fix = load_fixture("debt", case)
    got = avalanche(fix["input"]["debts"], fix["input"]["extra"])
    assert strip_dates(got) == strip_dates(fix["expected"]), f"avalanche mismatch for {case}"


@pytest.mark.parametrize("case", [n for n in list_cases("debt") if n.startswith("snowball__")])
def test_snowball_parity(case: str) -> None:
    fix = load_fixture("debt", case)
    got = snowball(fix["input"]["debts"], fix["input"]["extra"])
    assert strip_dates(got) == strip_dates(fix["expected"]), f"snowball mismatch for {case}"


@pytest.mark.parametrize("case", [n for n in list_cases("debt") if n.startswith("compare__")])
def test_compare_parity(case: str) -> None:
    fix = load_fixture("debt", case)
    got = compare_strategies(fix["input"]["debts"], fix["input"]["extra"])
    assert strip_dates(got) == strip_dates(fix["expected"]), f"compare mismatch for {case}"
