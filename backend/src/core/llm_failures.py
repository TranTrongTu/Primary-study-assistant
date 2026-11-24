"""
What went wrong in a Gemini call, and how long to wait before trying again.

Running out of quota, an overloaded model and a dropped connection need different
reactions: waiting helps with the last two but not with a spent daily quota. They used
to end in the same error, which made an incident hard to diagnose.
"""

import random
import re
from dataclasses import dataclass
from enum import Enum
from typing import Any

import httpx
from google.genai import errors

# google-genai sends its requests with httpx2 when that is installed. Its exceptions are
# not subclasses of httpx's, so catching httpx.RequestError alone misses them.
_NETWORK_ERRORS: tuple[type[Exception], ...] = (httpx.RequestError,)
try:
    import httpx2

    _NETWORK_ERRORS += (httpx2.RequestError,)
except ImportError:
    pass

# The provider's own trouble: worth another try. 504 is a gateway timeout.
_OVERLOADED_CODES = (500, 502, 503, 504)


class FailureKind(str, Enum):
    DAILY_QUOTA = "daily_quota"
    RATE_LIMIT = "rate_limit"
    OVERLOADED = "overloaded"
    NETWORK = "network"


@dataclass(frozen=True)
class Failure:
    kind: FailureKind
    code: int | None = None
    # Seconds the provider asked to wait, when it said so
    retry_after: float | None = None


def classify(error: Exception) -> Failure | None:
    """The failure behind an exception, or None when retrying cannot help."""
    if isinstance(error, _NETWORK_ERRORS):
        return Failure(FailureKind.NETWORK)

    if not isinstance(error, errors.APIError):
        return None

    if error.code == 429:
        details = _error_details(error)
        if _is_daily_quota(details):
            return Failure(FailureKind.DAILY_QUOTA, code=429)
        return Failure(
            FailureKind.RATE_LIMIT, code=429, retry_after=_retry_delay(details)
        )

    if error.code in _OVERLOADED_CODES:
        return Failure(FailureKind.OVERLOADED, code=error.code)

    return None


def backoff_delay(retry: int, base: float = 2.0, cap: float = 20.0) -> float:
    """
    Exponential backoff with jitter: between half and all of base * 2^(retry - 1).
    The random part keeps requests that failed together from retrying together.
    """
    ceiling = min(cap, base * 2 ** (retry - 1))
    return ceiling / 2 + random.uniform(0, ceiling / 2)


# ----- GOOGLE ERROR DETAILS ----- #
# A 429 body carries QuotaFailure (which quota was hit) and RetryInfo (when to retry).
# The shape is not under our control, so anything unexpected is ignored.


def _error_details(error: errors.APIError) -> list[dict[str, Any]]:
    body = error.details
    if isinstance(body, dict):
        body = body.get("error", body)
    details = body.get("details") if isinstance(body, dict) else None
    if not isinstance(details, list):
        return []
    return [item for item in details if isinstance(item, dict)]


def _is_daily_quota(details: list[dict[str, Any]]) -> bool:
    for item in details:
        violations = item.get("violations")
        if not isinstance(violations, list):
            continue
        for violation in violations:
            if isinstance(violation, dict) and "PerDay" in str(
                violation.get("quotaId", "")
            ):
                return True
    return False


def _retry_delay(details: list[dict[str, Any]]) -> float | None:
    for item in details:
        match = re.fullmatch(r"(\d+(?:\.\d+)?)s", str(item.get("retryDelay", "")))
        if match:
            return float(match.group(1))
    return None
