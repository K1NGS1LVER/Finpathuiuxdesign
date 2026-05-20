"""Request-scoped logging context.

Pure stdlib leaf — no app.* imports. Importing this module attaches
RequestIdFilter to the root logger as a side effect, populating
%(request_id)s in any log format string.
"""

from __future__ import annotations

import contextvars
import logging

request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar(
    "request_id", default="-"
)


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()  # type: ignore[attr-defined]
        return True


# Attach to root logger once on import so %(request_id)s resolves everywhere.
logging.getLogger().addFilter(RequestIdFilter())


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


__all__ = ["request_id_var", "get_logger", "RequestIdFilter"]
