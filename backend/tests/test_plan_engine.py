"""Parity tests for the Python plan engine vs TS fixtures.

Strips `date` keys (months[].date) and `goalCompletionDates` values
which are presentational and depend on `now()`. The integer `month`
index and the keys of `goalCompletionDates` are canonical.
"""

from __future__ import annotations

import pytest

from app.engines.plan_engine import generate_plan, generate_scenario_plan
from tests.conftest import list_cases, load_fixture, strip_completion_dates, strip_dates


@pytest.mark.parametrize("case", [n for n in list_cases("plan") if not n.startswith("scenario__")])
def test_plan_parity(case: str) -> None:
    fix = load_fixture("plan", case)
    got = generate_plan(fix["input"])
    a = strip_completion_dates(strip_dates(got))
    b = strip_completion_dates(strip_dates(fix["expected"]))
    assert a == b, f"plan mismatch for {case}"


@pytest.mark.parametrize("case", [n for n in list_cases("plan") if n.startswith("scenario__")])
def test_scenario_plan_parity(case: str) -> None:
    fix = load_fixture("plan", case)
    got = generate_scenario_plan(fix["input"]["base"], fix["input"]["modifications"])
    a = strip_completion_dates(strip_dates(got))
    b = strip_completion_dates(strip_dates(fix["expected"]))
    assert a == b, f"scenario plan mismatch for {case}"
