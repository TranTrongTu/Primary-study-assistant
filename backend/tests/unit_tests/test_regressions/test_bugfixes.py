"""
Regression tests for bugs fixed on branch fix/security-and-data-bugs.
These tests need no database and no external API.
"""

import json
from datetime import date
from unittest.mock import AsyncMock, patch

import pytest
from starlette.requests import Request

from backend.src.core import dependencies
from backend.src.core.ai_api import GlobalAPI
from backend.src.exceptions import handlers
from backend.src.exceptions.core import (
    ExceptionLLMError_502,
    ExceptionRequestValidation_400,
)
from backend.src.models_schema.activity.llm_return_json_schema import (
    MCQGradedCrossValidation,
    MCQGradedSchema,
)
from backend.src.services import study_activity

# ----- Bug 1: overwritten_day must be dev-only ----- #


def test_overwritten_day_rejected_in_production(monkeypatch):
    monkeypatch.setattr(dependencies.settings, "DEV_MODE", False)

    with pytest.raises(ExceptionRequestValidation_400):
        dependencies.get_current_datetime(overwritten_day=date(2999, 1, 1))


def test_overwritten_day_allowed_in_dev(monkeypatch):
    monkeypatch.setattr(dependencies.settings, "DEV_MODE", True)

    now = dependencies.get_current_datetime(overwritten_day=date(2030, 5, 17))

    assert now.date() == date(2030, 5, 17)


def test_no_overwritten_day_works_in_production(monkeypatch):
    monkeypatch.setattr(dependencies.settings, "DEV_MODE", False)

    # Normal requests (no parameter) must keep working
    assert dependencies.get_current_datetime() is not None


# ----- Bug 2: 500 responses must not leak exception details ----- #


def _fake_request() -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/api/x",
            "headers": [],
            "query_string": b"",
        }
    )


async def test_generic_handler_hides_details_in_production(monkeypatch):
    monkeypatch.setattr(handlers.settings, "DEV_MODE", False)
    secret = 'duplicate key value violates unique constraint "user_email_key"'

    response = await handlers.generic_exceptions_handler(
        _fake_request(), RuntimeError(secret)
    )

    body = json.loads(response.body)
    assert response.status_code == 500
    assert secret not in body["message"]
    assert body["message"] == "Internal server error."


async def test_generic_handler_shows_details_in_dev(monkeypatch):
    monkeypatch.setattr(handlers.settings, "DEV_MODE", True)

    response = await handlers.generic_exceptions_handler(
        _fake_request(), RuntimeError("boom")
    )

    assert "boom" in json.loads(response.body)["message"]


# ----- Bug 4: invalid JSON from the grading LLM must be retried ----- #


@pytest.mark.parametrize(
    "bad_output", ["not json at all", '{"truncated": ', "[1, 2, 3]"]
)
@patch.object(GlobalAPI, "grade_answers", new_callable=AsyncMock)
async def test_grading_retries_on_malformed_json(
    mock_grade_answers, bad_output, monkeypatch
):
    monkeypatch.setattr(study_activity.settings, "DEFAULT_N_GENERATION_RETRIES", 3)
    mock_grade_answers.return_value = bad_output

    # Before the fix, json.JSONDecodeError escaped on the first attempt as a 500.
    with pytest.raises(ExceptionLLMError_502):
        await study_activity.grade_with_retries(
            final_prompt="prompt",
            graded_schema=MCQGradedSchema,
            cross_validation_schema=MCQGradedCrossValidation,
            grading_input={},
        )

    assert mock_grade_answers.await_count == 3
