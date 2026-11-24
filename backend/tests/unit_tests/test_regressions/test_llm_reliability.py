"""
How the Gemini client reacts to a spent quota, a rate limit, an overloaded model and a
broken connection. No request leaves the machine: the failures are simulated.
"""

import logging
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from google import genai
from google.genai import errors

from backend.src.core import ai_api
from backend.src.core.ai_api import GeminiKeysManager, GoogleAPI
from backend.src.core.config import settings
from backend.src.core.llm_failures import FailureKind, backoff_delay, classify
from backend.src.exceptions.core import (
    ExceptionAIQuota_503,
    ExceptionExternalService_503,
    ExceptionInternalError_500,
    ExceptionType,
)

OK = SimpleNamespace(
    text="Cu Đỏ.",
    usage_metadata=SimpleNamespace(prompt_token_count=120, candidates_token_count=8),
)


def quota_error(quota_id: str | None = None, retry_delay: str | None = None):
    details = []
    if quota_id:
        details.append(
            {
                "@type": "type.googleapis.com/google.rpc.QuotaFailure",
                "violations": [{"quotaId": quota_id}],
            }
        )
    if retry_delay:
        details.append(
            {
                "@type": "type.googleapis.com/google.rpc.RetryInfo",
                "retryDelay": retry_delay,
            }
        )
    return errors.ClientError(
        429,
        {
            "error": {
                "code": 429,
                "message": "You exceeded your current quota",
                "status": "RESOURCE_EXHAUSTED",
                "details": details,
            }
        },
    )


DAILY = quota_error("GenerateRequestsPerDayPerProjectPerModel-FreeTier", "40s")
PER_MINUTE = quota_error("GenerateRequestsPerMinutePerProjectPerModel-FreeTier", "7s")
BUSY = errors.ServerError(503, {"error": {"code": 503, "message": "high demand"}})


@pytest.fixture
def sleeps():
    with patch.object(ai_api.asyncio, "sleep", AsyncMock()) as sleep:
        yield lambda: [call.args[0] for call in sleep.await_args_list]


@pytest.fixture(autouse=True)
def one_key(monkeypatch):
    manager = GeminiKeysManager(["key-a"])
    monkeypatch.setattr(ai_api, "keys_manager", manager)
    monkeypatch.setattr(settings, "DEFAULT_N_API_CALL_RETRIES", 3)
    monkeypatch.setattr(settings, "LLM_MAX_RETRY_WAIT_SECONDS", 20)
    monkeypatch.setattr(settings, "ANSWER_MODEL_GOOGLE", "main")
    monkeypatch.setattr(settings, "ANSWER_MODEL_GOOGLE_FALLBACK", "")
    return manager


async def call(*outcomes, models=("main",)):
    func = AsyncMock(side_effect=list(outcomes))
    try:
        return await GoogleAPI.wrapper(func, list(models), "test"), func
    except Exception as error:
        return error, func


# ----- CLASSIFICATION ----- #


def test_a_spent_daily_quota_and_a_rate_limit_are_told_apart():
    assert classify(DAILY).kind is FailureKind.DAILY_QUOTA
    assert classify(PER_MINUTE).kind is FailureKind.RATE_LIMIT
    assert classify(PER_MINUTE).retry_after == 7


@pytest.mark.parametrize(
    "body", [{}, {"error": {"details": "text"}}, {"error": {"details": [{}, "x"]}}, []]
)
def test_a_429_with_unexpected_details_is_a_plain_rate_limit(body):
    error = errors.ClientError(429, body)

    assert classify(error).kind is FailureKind.RATE_LIMIT
    assert classify(error).retry_after is None


def test_a_bad_request_is_not_worth_retrying():
    assert classify(errors.ClientError(400, {"error": {"message": "bad"}})) is None
    assert classify(ValueError("a bug in our code")) is None


async def test_the_sdk_connection_error_is_recognised():
    # google-genai uses httpx2 when installed, whose errors are not httpx errors:
    # this is the real SDK failing to connect, not a hand-made exception.
    client = genai.Client(
        api_key="placeholder", http_options={"base_url": "http://127.0.0.1:9"}
    )
    with pytest.raises(Exception) as caught:
        await client.aio.models.generate_content(model="m", contents="hi")

    assert classify(caught.value).kind is FailureKind.NETWORK
    assert classify(httpx.ConnectError("down")).kind is FailureKind.NETWORK


def test_backoff_grows_is_capped_and_stays_in_range():
    for retry, ceiling in [(1, 2), (2, 4), (3, 8), (10, 20)]:
        for _ in range(50):
            assert ceiling / 2 <= backoff_delay(retry) <= ceiling


# ----- RETRIES ----- #


async def test_a_daily_quota_fails_at_once_with_its_own_error(sleeps):
    error, func = await call(DAILY)

    assert isinstance(error, ExceptionAIQuota_503)
    assert error.exception_type is ExceptionType.AI_QUOTA
    assert error.status_code == 503
    assert func.await_count == 1
    assert sleeps() == []


async def test_a_rate_limit_waits_as_long_as_the_provider_asks(sleeps):
    response, func = await call(PER_MINUTE, OK)

    assert response is OK
    assert sleeps() == [7]


async def test_a_wait_longer_than_the_budget_becomes_an_error(sleeps):
    error, func = await call(quota_error(retry_delay="59s"))

    assert isinstance(error, ExceptionExternalService_503)
    assert not isinstance(error, ExceptionAIQuota_503)
    assert func.await_count == 1
    assert sleeps() == []


async def test_the_waits_of_one_call_share_the_budget(sleeps):
    slow = quota_error(retry_delay="15s")
    error, func = await call(slow, slow, OK)

    assert isinstance(error, ExceptionExternalService_503)
    assert sleeps() == [15]


async def test_an_overloaded_model_is_retried_with_backoff(sleeps):
    response, func = await call(BUSY, BUSY, OK)

    assert response is OK
    first, second = sleeps()
    assert 1 <= first <= 2 <= second <= 4


async def test_retries_stop_and_do_not_sleep_after_the_last_attempt(sleeps):
    error, func = await call(BUSY, BUSY, BUSY)

    assert error.exception_type is ExceptionType.EXTERNAL_SERVICE
    assert "overloaded" in error.message
    assert func.await_count == 3
    assert len(sleeps()) == 2


async def test_a_bad_request_is_raised_without_retrying(sleeps):
    error, func = await call(errors.ClientError(400, {"error": {"message": "bad"}}))

    assert isinstance(error, ExceptionInternalError_500)
    assert func.await_count == 1


# ----- KEYS ----- #


async def test_other_keys_are_tried_before_giving_up(monkeypatch, sleeps):
    manager = GeminiKeysManager(["key-a", "key-b"])
    monkeypatch.setattr(ai_api, "keys_manager", manager)

    response, func = await call(DAILY, OK)

    assert response is OK
    assert manager.current_key_index == 1
    assert sleeps() == []


async def test_concurrent_failures_rotate_only_once():
    manager = GeminiKeysManager(["key-a", "key-b"])

    manager.rotate_from(0)
    manager.rotate_from(0)  # a second request that had also failed with key-a

    assert manager.current_key_index == 1


# ----- FALLBACK MODEL ----- #


async def test_the_fallback_model_answers_when_the_first_is_out_of_quota(
    monkeypatch, sleeps
):
    monkeypatch.setattr(settings, "ANSWER_MODEL_GOOGLE_FALLBACK", "backup")
    generate = AsyncMock(side_effect=[DAILY, OK])
    monkeypatch.setattr(
        ai_api.keys_manager.client.aio.models, "generate_content", generate
    )

    assert await GoogleAPI.generate_content("Con gà tên gì?") == "Cu Đỏ."
    assert [c.kwargs["model"] for c in generate.await_args_list] == ["main", "backup"]


async def test_without_a_fallback_only_the_main_model_is_called(monkeypatch, sleeps):
    generate = AsyncMock(side_effect=DAILY)
    monkeypatch.setattr(
        ai_api.keys_manager.client.aio.models, "generate_content", generate
    )

    with pytest.raises(ExceptionAIQuota_503):
        await GoogleAPI.generate_content("Con gà tên gì?")
    assert generate.await_count == 1


async def test_a_network_failure_does_not_try_the_fallback(sleeps):
    down = httpx.ConnectError("down")
    error, func = await call(down, down, down, OK, models=("main", "backup"))

    assert "could not be reached" in error.message
    assert func.await_count == 3


# ----- LOGS AND HOOK ----- #


async def test_each_request_is_logged_without_its_content(caplog, sleeps):
    caplog.set_level(logging.INFO, logger=ai_api.__name__)
    await call(BUSY, OK)

    lines = [r.getMessage() for r in caplog.records if "llm_call" in r.getMessage()]
    assert "outcome=overloaded code=503" in lines[0]
    assert "attempt=2 outcome=ok" in lines[1]
    assert "input_tokens=120 output_tokens=8" in lines[1]
    assert "Cu Đỏ" not in " ".join(lines)
    assert "high demand" not in " ".join(lines)


async def test_the_hook_runs_before_every_request_and_can_stop_it(monkeypatch, sleeps):
    class Stop(Exception):
        pass

    seen = []

    def hook():
        seen.append(1)
        if len(seen) == 2:
            raise Stop

    monkeypatch.setattr(GoogleAPI, "before_request", hook)
    error, func = await call(BUSY, OK)

    assert isinstance(error, Stop)
    assert func.await_count == 1
