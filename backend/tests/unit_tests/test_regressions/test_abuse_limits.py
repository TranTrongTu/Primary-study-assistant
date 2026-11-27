"""
Limits that stop one person, or one script, from spending the AI quota or guessing
passwords: failed logins per email, new accounts per hour, AI requests per user, and
the size of what is uploaded or sent to the model.
"""

import io

import pytest
from httpx import AsyncClient
from pypdf import PdfWriter

from backend.src.core import rate_limit
from backend.src.core.config import settings
from backend.src.core.rate_limit import SlidingWindowLimiter
from backend.src.exceptions.core import ExceptionType
from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.models_schema.user.user import User
from backend.tests.utils.validators import (
    validate_response_contents,
    validate_status_code,
)


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now


# ----- THE COUNTER ----- #


def test_the_window_counts_only_recent_events():
    clock = Clock()
    limiter = SlidingWindowLimiter(lambda: 2, window_seconds=60, clock=clock)

    limiter.record("a")
    clock.now += 30
    limiter.record("a")
    assert limiter.retry_after("a") == pytest.approx(30)
    assert limiter.retry_after("b") is None  # keys are counted apart

    clock.now += 31  # the first event leaves the window
    assert limiter.retry_after("a") is None


def test_a_limit_of_zero_refuses_without_failing():
    limiter = SlidingWindowLimiter(lambda: 0, window_seconds=60, clock=Clock())

    assert limiter.retry_after("a") == 60


def test_reset_forgets_a_key():
    limiter = SlidingWindowLimiter(lambda: 1, window_seconds=60, clock=Clock())
    limiter.record("a")
    limiter.reset("a")

    assert limiter.retry_after("a") is None


def test_idle_keys_are_dropped_when_there_are_many(monkeypatch):
    clock = Clock()
    monkeypatch.setattr(rate_limit, "_MAX_KEYS", 3)
    limiter = SlidingWindowLimiter(lambda: 5, window_seconds=60, clock=clock)
    for key in "abc":
        limiter.record(key)
    clock.now += 61
    limiter.record("d")

    assert set(limiter._events) == {"d"}


# ----- LOGIN ----- #


def _login(client: AsyncClient, password: str):
    return client.post(
        "/api/login", data={"username": "test@gmail.com", "password": password}
    )


async def test_repeated_failed_logins_lock_the_email_for_a_while(
    client: AsyncClient, register_user_test: User, monkeypatch
):
    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_FAILURES", 3)
    for _ in range(3):
        validate_status_code(await _login(client, "wrong-password"), 401)

    # Even the right password waits: otherwise guessing would only need a pause
    response = await _login(client, "test-password")

    validate_status_code(response, 429)
    validate_response_contents(
        response, {"exception_type": ExceptionType.RATE_LIMITED.value}
    )
    assert int(response.headers["Retry-After"]) > 0


async def test_a_successful_login_clears_the_failures(
    client: AsyncClient, register_user_test: User, monkeypatch
):
    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_FAILURES", 2)
    validate_status_code(await _login(client, "wrong-password"), 401)
    validate_status_code(await _login(client, "test-password"), 200)

    validate_status_code(await _login(client, "wrong-password"), 401)
    validate_status_code(await _login(client, "test-password"), 200)


async def test_the_email_is_counted_whatever_its_case(
    client: AsyncClient, register_user_test: User, monkeypatch
):
    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_FAILURES", 1)
    await client.post(
        "/api/login", data={"username": "TEST@gmail.com", "password": "wrong"}
    )

    validate_status_code(await _login(client, "test-password"), 429)


# ----- REGISTRATION ----- #


async def test_new_accounts_are_capped_per_hour(client: AsyncClient, monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_REGISTRATIONS_PER_HOUR", 2)

    def register(number: int):
        return client.post(
            "/api/user/register",
            json={
                "username": f"user{number}",
                "email": f"user{number}@gmail.com",
                "password": "long-enough-password",
            },
        )

    validate_status_code(await register(1), 200)
    validate_status_code(await register(2), 200)
    validate_status_code(await register(3), 429)


# ----- AI REQUESTS ----- #


async def test_ai_requests_are_capped_per_user(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
    monkeypatch,
):
    monkeypatch.setattr(settings, "RATE_LIMIT_AI_REQUESTS_PER_10_MINUTES", 0)

    response = await client.post(
        f"/api/llm-response/{create_interaction_test.id}/chat",
        json={"prompt": "Cu Đỏ gáy lúc mấy giờ?"},
    )

    validate_status_code(response, 429)
    validate_response_contents(
        response, {"exception_type": ExceptionType.RATE_LIMITED.value}
    )


async def test_the_daily_cap_applies_too(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
    monkeypatch,
):
    monkeypatch.setattr(settings, "RATE_LIMIT_AI_REQUESTS_PER_DAY", 0)

    response = await client.post(
        f"/api/study-activity/{create_interaction_test.id}/create",
        json={
            "prompt": "Tạo bài tập",
            "activity_type": "EXERCISE",
            "activity_format": "MULTIPLE_CHOICE_QUESTIONS",
            "subject_type": "MATHS",
        },
    )

    validate_status_code(response, 429)


async def test_reading_does_not_use_the_ai_allowance(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
    monkeypatch,
):
    monkeypatch.setattr(settings, "RATE_LIMIT_AI_REQUESTS_PER_10_MINUTES", 0)

    response = await client.get(f"/api/llm-response/{create_interaction_test.id}/")

    validate_status_code(response, 200)


async def test_a_prompt_longer_than_the_limit_is_refused(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
):
    response = await client.post(
        f"/api/llm-response/{create_interaction_test.id}/chat",
        json={"prompt": "a" * (settings.MAX_PROMPT_CHARS + 1)},
    )

    validate_status_code(response, 400)


# ----- UPLOADS ----- #


async def test_a_file_over_the_size_limit_is_refused_before_any_ai_call(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
    monkeypatch,
):
    monkeypatch.setattr(settings, "MAX_UPLOAD_BYTES", 100)

    response = await client.post(
        f"/api/document/{create_interaction_test.id}/upload",
        params={"subject_type": "VIETNAMESE", "subject_type_overwrite": "false"},
        files={"file": ("bai.txt", "Cu Đỏ gáy ò ó o. " * 20, "text/plain")},
    )

    validate_status_code(response, 400)
    assert "too large" in response.json()["message"]


async def test_a_pdf_with_too_many_pages_is_refused(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
    monkeypatch,
):
    monkeypatch.setattr(settings, "MAX_PDF_PAGES", 2)
    writer = PdfWriter()
    for _ in range(3):
        writer.add_blank_page(width=200, height=200)
    pdf = io.BytesIO()
    writer.write(pdf)

    response = await client.post(
        f"/api/document/{create_interaction_test.id}/upload",
        params={"subject_type": "VIETNAMESE", "subject_type_overwrite": "false"},
        files={"file": ("sach.pdf", pdf.getvalue(), "application/pdf")},
    )

    validate_status_code(response, 400)
    assert "3 pages" in response.json()["message"]
