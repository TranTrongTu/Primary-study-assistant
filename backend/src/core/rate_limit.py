"""
How often one user, one email or everyone together may do something expensive.

The counters live in the memory of the process: they reset on a restart and are not
shared between processes. That fits the deployment (one Render instance). With several
instances the limits would have to move to a shared store such as Redis.
"""

import time
from collections import deque
from typing import Callable

from fastapi import Depends

from backend.src.core.config import settings
from backend.src.core.dependencies import UserDep
from backend.src.exceptions.core import ExceptionTooManyRequests_429

# Stop tracking keys that have been idle this long once this many are tracked
_MAX_KEYS = 10_000


class SlidingWindowLimiter:
    """At most `limit` events per key in any `window_seconds`."""

    def __init__(
        self,
        limit: Callable[[], int],
        window_seconds: float,
        clock: Callable[[], float] = time.monotonic,
    ):
        # A callable, so a change of the setting (in tests, say) is seen at once
        self._limit = limit
        self.window_seconds = window_seconds
        self._clock = clock
        self._events: dict[str, deque[float]] = {}

    def retry_after(self, key: str) -> float | None:
        """Seconds until `key` may act again, or None when it may act now."""
        events = self._recent(key)
        if len(events) < self._limit():
            return None
        if not events:  # a limit of 0 turns the action off
            return self.window_seconds
        return max(events[0] + self.window_seconds - self._clock(), 1)

    def record(self, key: str) -> None:
        self._recent(key).append(self._clock())
        if len(self._events) > _MAX_KEYS:
            self._forget_idle()

    def reset(self, key: str) -> None:
        self._events.pop(key, None)

    def clear(self) -> None:
        self._events.clear()

    def _recent(self, key: str) -> deque[float]:
        events = self._events.setdefault(key, deque())
        oldest_allowed = self._clock() - self.window_seconds
        while events and events[0] <= oldest_allowed:
            events.popleft()
        return events

    def _forget_idle(self) -> None:
        oldest_allowed = self._clock() - self.window_seconds
        for key in [
            k for k, v in self._events.items() if not v or v[-1] <= oldest_allowed
        ]:
            del self._events[key]


def _too_many(retry_after: float, message: str) -> ExceptionTooManyRequests_429:
    return ExceptionTooManyRequests_429(message, retry_after=retry_after)


# ----- LOGIN ----- #

# Failed logins per email: slows down password guessing on one account
failed_logins = SlidingWindowLimiter(
    lambda: settings.RATE_LIMIT_LOGIN_FAILURES, window_seconds=15 * 60
)


def check_login_allowed(email: str) -> None:
    wait = failed_logins.retry_after(email.strip().lower())
    if wait is not None:
        raise _too_many(wait, "Too many failed logins. Please wait a few minutes.")


def record_failed_login(email: str) -> None:
    failed_logins.record(email.strip().lower())


def record_successful_login(email: str) -> None:
    failed_logins.reset(email.strip().lower())


# ----- REGISTRATION ----- #

# New accounts per hour, for everyone together. Each account gets its own AI allowance,
# so without this cap a script could create accounts until the AI quota is spent.
registrations = SlidingWindowLimiter(
    lambda: settings.RATE_LIMIT_REGISTRATIONS_PER_HOUR, window_seconds=60 * 60
)


def limit_registrations() -> None:
    wait = registrations.retry_after("all")
    if wait is not None:
        raise _too_many(
            wait, "Too many new accounts right now. Please try again later."
        )
    registrations.record("all")


# ----- AI REQUESTS ----- #

ai_requests_short = SlidingWindowLimiter(
    lambda: settings.RATE_LIMIT_AI_REQUESTS_PER_10_MINUTES, window_seconds=10 * 60
)
ai_requests_daily = SlidingWindowLimiter(
    lambda: settings.RATE_LIMIT_AI_REQUESTS_PER_DAY, window_seconds=24 * 60 * 60
)


def limit_ai_requests(user: UserDep) -> None:
    """For every route that calls an AI model: counted per user, whatever the outcome."""
    key = str(user.id)
    for limiter, message in (
        (ai_requests_short, "You are asking very fast. Please wait a few minutes."),
        (
            ai_requests_daily,
            "You have used today's AI requests. Please come back tomorrow.",
        ),
    ):
        wait = limiter.retry_after(key)
        if wait is not None:
            raise _too_many(wait, message)
    ai_requests_short.record(key)
    ai_requests_daily.record(key)


AILimit = Depends(limit_ai_requests)
RegistrationLimit = Depends(limit_registrations)

ALL_LIMITERS = (failed_logins, registrations, ai_requests_short, ai_requests_daily)
