"""Per-IP rate limiter. Mirrors src/server/penny-api.ts: 15 requests / 60s."""
from __future__ import annotations

import threading
import time
from dataclasses import dataclass

RATE_LIMIT_MAX = 15
RATE_LIMIT_WINDOW_SECONDS = 60.0


@dataclass
class _Entry:
    count: int
    reset_at: float


class RateLimiter:
    def __init__(self) -> None:
        self._entries: dict[str, _Entry] = {}
        self._lock = threading.Lock()

    def check(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            entry = self._entries.get(key)
            if entry is None or now > entry.reset_at:
                self._entries[key] = _Entry(count=1, reset_at=now + RATE_LIMIT_WINDOW_SECONDS)
                return True
            if entry.count >= RATE_LIMIT_MAX:
                return False
            entry.count += 1
            return True


rate_limiter = RateLimiter()
