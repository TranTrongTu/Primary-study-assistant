"""Sends requests to an AI provider: retries, fallback models and one log line each."""

import asyncio
import logging
import time
from typing import Any, Awaitable, Callable, Protocol

from google.genai import errors

from backend.src.core.config import settings
from backend.src.core.llm_failures import (
    Failure,
    FailureKind,
    backoff_delay,
    classify,
    status_code,
)
from backend.src.exceptions.core import (
    ExceptionAIQuota_503,
    ExceptionExternalService_503,
    ExceptionInternalError_500,
)

logger = logging.getLogger(__name__)

# Called before every request. The evaluation uses it to count requests and to stop
# before a limit; whatever it raises reaches the caller unchanged.
before_request: Callable[[], None] | None = None

_FAILURE_EXCEPTIONS: dict[FailureKind, Callable[[], Exception]] = {
    FailureKind.QUOTA: lambda: ExceptionAIQuota_503(
        "The AI service has reached its usage limit. Please come back later."
    ),
    FailureKind.RATE_LIMIT: lambda: ExceptionExternalService_503(
        "The AI service is receiving too many requests. Please try again in a minute."
    ),
    FailureKind.OVERLOADED: lambda: ExceptionExternalService_503(
        "The AI service is overloaded. Please try again in a few minutes."
    ),
    FailureKind.NETWORK: lambda: ExceptionExternalService_503(
        "The AI service could not be reached. Please try again in a few minutes."
    ),
    FailureKind.TIMEOUT: lambda: ExceptionExternalService_503(
        "The AI service took too long to answer. Please try again in a few minutes."
    ),
}


class KeyRing(Protocol):
    keys: list[str]
    current_key_index: int

    def rotate_from(self, failed_key_index: int) -> None: ...


async def call_with_retries(
    func: Callable[[str], Awaitable[Any]],
    models: list[str],
    provider: str,
    operation: str,
    keys: KeyRing | None = None,
) -> Any:
    """
    Calls `func(model)` and handles the failures of the provider:
    - rate limit or spent quota: try the other keys first, if there are any;
    - rate limit, overload, network error: wait (the time the provider asks for,
      otherwise exponential backoff) and retry, within LLM_MAX_RETRY_WAIT_SECONDS;
    - no answer in time: do not ask the same model again, the caller has already
      waited for the whole timeout;
    - still failing: move on to the next model in `models`.
    """
    started = time.monotonic()
    wait_left = settings.LLM_MAX_RETRY_WAIT_SECONDS
    attempts = 0
    failure: Failure | None = None

    for model in models:
        retries = 0
        keys_tried = 1

        while True:
            if before_request is not None:
                before_request()

            key_index = keys.current_key_index if keys else 0
            attempts += 1

            try:
                response = await func(model)
            except Exception as e:
                failure = classify(e)
                _log_call(
                    provider,
                    operation,
                    model,
                    attempts,
                    started,
                    outcome=failure.kind.value if failure else type(e).__name__,
                    code=status_code(e),
                )
                if failure is None:
                    replacement = _not_retryable(e)
                    if replacement is None:
                        raise
                    raise replacement from e
            else:
                _log_call(
                    provider,
                    operation,
                    model,
                    attempts,
                    started,
                    outcome="ok",
                    response=response,
                )
                return response

            quota_related = failure.kind in (FailureKind.QUOTA, FailureKind.RATE_LIMIT)
            if keys and quota_related and keys_tried < len(keys.keys):
                keys.rotate_from(key_index)
                keys_tried += 1
                continue

            retries += 1
            if (
                failure.kind in (FailureKind.QUOTA, FailureKind.TIMEOUT)
                or retries >= settings.DEFAULT_N_API_CALL_RETRIES
            ):
                break

            delay = failure.retry_after or backoff_delay(retries)
            if delay > wait_left:
                break
            wait_left -= delay
            await asyncio.sleep(delay)
            keys_tried = 1

        # Every model is behind the same host
        if failure.kind is FailureKind.NETWORK:
            break

    assert failure is not None
    raise _FAILURE_EXCEPTIONS[failure.kind]()


def _not_retryable(error: Exception) -> Exception | None:
    """
    What to raise for a request the provider rejected (wrong key, wrong model). None
    when the error did not come from the provider and should be raised unchanged.
    """
    if isinstance(error, errors.APIError):
        return ExceptionInternalError_500(
            error.message if error.message else "Google API error"
        )
    if status_code(error) is None:
        return None
    # The provider's text may quote the request, so it stays out of the response
    return ExceptionInternalError_500(
        f"The AI provider rejected the request ({status_code(error)})."
    )


def _tokens(response: Any) -> tuple[int | None, int | None]:
    """Input and output tokens, from a Gemini response or an OpenAI-style body."""
    if isinstance(response, dict):
        usage = response.get("usage")
        if not isinstance(usage, dict):
            return None, None
        return usage.get("prompt_tokens"), usage.get("completion_tokens")
    usage = getattr(response, "usage_metadata", None)
    return (
        getattr(usage, "prompt_token_count", None),
        getattr(usage, "candidates_token_count", None),
    )


def _log_call(
    provider: str,
    operation: str,
    model: str,
    attempt: int,
    started: float,
    outcome: str,
    code: int | None = None,
    response: Any = None,
) -> None:
    """
    One line per request, enough to add up the cost of each feature. Never the prompt,
    the answer or the provider's error text: they hold what students wrote.
    """
    input_tokens, output_tokens = _tokens(response)
    logger.log(
        logging.INFO if outcome == "ok" else logging.WARNING,
        "llm_call provider=%s operation=%s model=%s attempt=%d outcome=%s code=%s "
        "elapsed_ms=%d input_tokens=%s output_tokens=%s",
        provider,
        operation,
        model,
        attempt,
        outcome,
        code,
        (time.monotonic() - started) * 1000,
        input_tokens,
        output_tokens,
    )
