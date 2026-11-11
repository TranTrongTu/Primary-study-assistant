"""Unit tests for scripts/smoke_test.py using httpx.MockTransport.

Validates that SmokeTestRunner correctly checks:
1. Happy path with pre-configured credentials
2. Happy path with auto-registration enabled
3. Failure when credentials are missing and auto-registration is disabled
4. Failure when quiz generation returns 0 items (catching false passes)
5. Failure when quiz item has empty/missing question text
6. Failure when AI chat returns 502 Bad Gateway
7. Failure when health check returns 503
8. Verbose logging functionality
"""

import httpx

from scripts.smoke_test import SmokeTestRunner


def create_mock_transport(
    *,
    health_status: int = 200,
    chat_status: int = 200,
    quiz_status: int = 200,
    quiz_items: list | None = None,
) -> httpx.MockTransport:
    if quiz_items is None:
        quiz_items = [
            {
                "id": 1,
                "question": "2 x 3 = ?",
                "max_score": 1.0,
                "contents": [],
            },
            {
                "id": 2,
                "question": "2 x 4 = ?",
                "max_score": 1.0,
                "contents": [],
            },
        ]

    def handler(request: httpx.Request) -> httpx.Response:
        method = request.method
        path = request.url.path

        if method == "GET" and path == "/health":
            if health_status != 200:
                return httpx.Response(health_status, json={"status": "unavailable"})
            return httpx.Response(200, json={"status": "ok"})

        if method == "POST" and path == "/api/user/register":
            return httpx.Response(
                200,
                json={"id": 1, "username": "mock_user", "email": "mock@example.com"},
            )

        if method == "POST" and path == "/api/login":
            return httpx.Response(
                200,
                json={"access_token": "mock_token_123", "token_type": "bearer"},
            )

        if method == "POST" and path == "/api/interaction/create":
            return httpx.Response(
                200,
                json={
                    "id": 99,
                    "name": "Mock Session",
                    "created_at": "2026-01-01T00:00:00",
                },
            )

        if method == "POST" and path.startswith("/api/document/99/upload"):
            return httpx.Response(
                200,
                json=[
                    {
                        "id": 42,
                        "name": "smoke_test_math.txt",
                        "subject_type": "MATHS",
                    },
                    None,
                ],
            )

        if method == "POST" and path == "/api/llm-response/99/chat":
            if chat_status != 200:
                return httpx.Response(chat_status, json={"detail": "AI Provider error"})
            return httpx.Response(
                200,
                json={
                    "id": 10,
                    "answer": "2 x 3 = 6 theo bảng cửu chương 2.",
                    "created_at": "2026-01-01T00:00:00",
                },
            )

        if method == "POST" and path == "/api/study-activity/99/create":
            if quiz_status != 200:
                return httpx.Response(
                    quiz_status, json={"detail": "Quiz generation error"}
                )
            return httpx.Response(
                200,
                json={
                    "id": 88,
                    "prompt": "Test prompt",
                    "activity_format": "MULTIPLE_CHOICE_QUESTIONS",
                    "items": quiz_items,
                },
            )

        if method == "DELETE" and path.startswith("/api/interaction/"):
            return httpx.Response(204)

        return httpx.Response(404, json={"detail": f"Not Found: {method} {path}"})

    return httpx.MockTransport(handler)


def test_smoke_test_happy_path_with_credentials():
    transport = create_mock_transport()
    runner = SmokeTestRunner(
        base_url="http://testserver",
        email="user@example.com",
        password="secretpassword",
        timeout=5.0,
        transport=transport,
    )
    assert runner.run() is True


def test_smoke_test_happy_path_with_auto_register():
    transport = create_mock_transport()
    runner = SmokeTestRunner(
        base_url="http://testserver",
        allow_auto_register=True,
        timeout=5.0,
        transport=transport,
    )
    assert runner.run() is True


def test_smoke_test_fails_without_credentials_and_without_auto_register():
    transport = create_mock_transport()
    runner = SmokeTestRunner(
        base_url="http://testserver",
        allow_auto_register=False,
        timeout=5.0,
        transport=transport,
    )
    assert runner.run() is False


def test_smoke_test_fails_when_quiz_returns_zero_items():
    transport = create_mock_transport(quiz_items=[])
    runner = SmokeTestRunner(
        base_url="http://testserver",
        email="user@example.com",
        password="secretpassword",
        timeout=5.0,
        transport=transport,
    )
    assert runner.run() is False


def test_smoke_test_fails_when_quiz_item_has_empty_question():
    transport = create_mock_transport(
        quiz_items=[{"id": 1, "question": "   ", "contents": []}]
    )
    runner = SmokeTestRunner(
        base_url="http://testserver",
        email="user@example.com",
        password="secretpassword",
        timeout=5.0,
        transport=transport,
    )
    assert runner.run() is False


def test_smoke_test_fails_when_chat_returns_502():
    transport = create_mock_transport(chat_status=502)
    runner = SmokeTestRunner(
        base_url="http://testserver",
        email="user@example.com",
        password="secretpassword",
        timeout=5.0,
        transport=transport,
    )
    assert runner.run() is False


def test_smoke_test_fails_when_health_returns_503():
    transport = create_mock_transport(health_status=503)
    runner = SmokeTestRunner(
        base_url="http://testserver",
        email="user@example.com",
        password="secretpassword",
        timeout=5.0,
        transport=transport,
    )
    assert runner.run() is False


def test_smoke_test_verbose_mode(capsys):
    transport = create_mock_transport()
    runner = SmokeTestRunner(
        base_url="http://testserver",
        email="user@example.com",
        password="secretpassword",
        timeout=5.0,
        verbose=True,
        transport=transport,
    )
    assert runner.run() is True
    captured = capsys.readouterr()
    assert "[VERBOSE]" in captured.out
    assert ">>> GET http://testserver/health" in captured.out
