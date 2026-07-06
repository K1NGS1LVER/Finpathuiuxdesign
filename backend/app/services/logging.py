"""Request-scoped logging context.

Pure stdlib leaf — no app.* imports. Provides:
- `request_id_var` ContextVar for request-scoped IDs.
- `RequestIdFilter` that injects request_id onto LogRecords.
- `RequestIdFormatter` that safely defaults request_id if missing.
- `_install_filter()` to attach the filter to all root handlers.
- `setup_logging()` single-call logging configuration for main.py.
"""

from __future__ import annotations

import contextvars
import logging

request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")

LOG_FORMAT = "%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s"


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()  # type: ignore[attr-defined]
        return True


class RequestIdFormatter(logging.Formatter):
    """Formatter that safely defaults request_id if the filter hasn't run.

    This is the ultimate safety net: even if a handler somehow bypasses
    all filters, the format string won't raise KeyError.
    """

    def format(self, record: logging.LogRecord) -> str:
        if not hasattr(record, "request_id"):
            record.request_id = request_id_var.get()  # type: ignore[attr-defined]
        return super().format(record)


_filter = RequestIdFilter()
_formatter = RequestIdFormatter(LOG_FORMAT)


def _install_filter() -> None:
    """Attach the filter to the root logger AND all its handlers.

    Logger-level filters only run for records logged directly on that logger,
    NOT for records propagated from child loggers (httpx, uvicorn, etc.).
    Attaching the filter to handlers ensures every record gets request_id
    before the format string is applied.

    Also replaces each handler's formatter with our RequestIdFormatter
    so even if filters are bypassed, request_id never raises KeyError.
    """
    root = logging.getLogger()
    root.addFilter(_filter)
    for handler in root.handlers:
        handler.addFilter(_filter)
        handler.setFormatter(_formatter)


def setup_logging() -> None:
    """Configure root logging with request_id support.

    Call once from main.py. Uses basicConfig to create the root StreamHandler,
    then installs our filter + formatter on it.
    """
    logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
    _install_filter()


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


__all__ = [
    "request_id_var",
    "get_logger",
    "RequestIdFilter",
    "RequestIdFormatter",
    "_install_filter",
    "setup_logging",
]
