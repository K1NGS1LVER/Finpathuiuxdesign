"""In-process response cache for Penny replies. 5-min TTL, scoped per user."""
from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from typing import Any

CACHE_TTL_SECONDS = 5 * 60
MAX_CACHE_ENTRIES = 100


@dataclass
class _Entry:
    reply: str
    cached_at: float


class ResponseCache:
    def __init__(self) -> None:
        self._entries: dict[str, _Entry] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> str | None:
        now = time.monotonic()
        with self._lock:
            entry = self._entries.get(key)
            if entry is None:
                return None
            if now - entry.cached_at >= CACHE_TTL_SECONDS:
                self._entries.pop(key, None)
                return None
            return entry.reply

    def set(self, key: str, reply: str) -> None:
        now = time.monotonic()
        with self._lock:
            self._entries[key] = _Entry(reply=reply, cached_at=now)
            if len(self._entries) > MAX_CACHE_ENTRIES:
                expired = [k for k, v in self._entries.items() if now - v.cached_at >= CACHE_TTL_SECONDS]
                for k in expired:
                    self._entries.pop(k, None)


def cache_key(message: str, profile: dict[str, Any], user_id: str | None = None) -> str:
    income_total = (profile.get("income") or {}).get("total", 0)
    expenses_total = (profile.get("expenses") or {}).get("total", 0)
    debts_total = (profile.get("debts") or {}).get("totalMonthly", 0)
    savings = profile.get("savings", 0)
    goals_len = len(profile.get("goals") or [])
    financial_key = f"{income_total}-{expenses_total}-{debts_total}-{savings}-{goals_len}"
    msg_part = message.strip().lower()[:200]
    # Scope cache entries per user so two users with matching aggregate numbers
    # never share a Penny reply (replies reference user-specific framing).
    uid = user_id or "anon"
    return f"{uid}|{msg_part}|{financial_key}"


response_cache = ResponseCache()
