"""Parity tests for the Python health-score engine vs TS-generated fixtures."""

from __future__ import annotations

import pytest

from app.engines.health_score import calculate_health_score
from tests.conftest import list_cases, load_fixture


@pytest.mark.parametrize("case", list_cases("health"))
def test_health_score_parity(case: str) -> None:
    fix = load_fixture("health", case)
    got = calculate_health_score(fix["input"])
    assert got == fix["expected"], f"health score mismatch for {case}"
