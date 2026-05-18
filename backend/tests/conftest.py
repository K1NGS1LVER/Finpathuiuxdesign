"""Shared pytest fixtures for engine parity tests."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURES_ROOT = REPO_ROOT / "tests" / "fixtures"


def fixture_dir(engine: str) -> Path:
    d = FIXTURES_ROOT / engine
    if not d.exists():
        raise FileNotFoundError(
            f"Fixture dir missing: {d}. Run `pnpm fixtures` from the repo root to regenerate."
        )
    return d


def load_fixture(engine: str, name: str) -> dict[str, Any]:
    path = fixture_dir(engine) / f"{name}.json"
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def list_cases(engine: str) -> list[str]:
    return sorted(p.stem for p in fixture_dir(engine).glob("*.json"))


def strip_dates(value: Any) -> Any:
    """Remove any `date` key recursively. Used by parity tests where the
    TS engine's `monthToDate()` and the Python equivalent both use `now()`
    — the integer `month` index is canonical; the string label is not."""
    if isinstance(value, dict):
        return {k: strip_dates(v) for k, v in value.items() if k != "date"}
    if isinstance(value, list):
        return [strip_dates(v) for v in value]
    return value


def strip_completion_dates(value: Any) -> Any:
    """Remove `goalCompletionDates` (string-valued) for parity. Same reason
    as strip_dates — values are presentational date strings."""
    if isinstance(value, dict):
        return {
            k: strip_completion_dates(v) for k, v in value.items() if k != "goalCompletionDates"
        }
    if isinstance(value, list):
        return [strip_completion_dates(v) for v in value]
    return value
