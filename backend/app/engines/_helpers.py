"""Shared helpers ported from TS engines.

`js_round` mirrors JavaScript's `Math.round` semantics, which rounds
half-values toward +inf (e.g. 0.5 → 1, -0.5 → 0). Python's built-in
`round` uses banker's rounding (0.5 → 0, 1.5 → 2), so we need a tiny
shim to keep parity with the TS engines.
"""
from __future__ import annotations

import math


def js_round(value: float) -> int:
    """Match JavaScript `Math.round` (round half toward +infinity)."""
    return int(math.floor(value + 0.5))
