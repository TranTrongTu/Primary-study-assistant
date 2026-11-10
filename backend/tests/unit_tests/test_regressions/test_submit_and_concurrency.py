"""
Regression tests for concurrency problems:

- Submitting the same exercise twice at the same time used to pass the "already
  submitted" check in both requests, so grading ran (and was paid for) twice.
- One request could start an unbounded number of LLM calls at once.
"""

import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from backend.src.core.ai_api import GlobalAPI
from backend.src.core.concurrency import gather_limited
from backend.tests.conftest import SessionLocal  # bound to the test database
from backend.src.exceptions.core import (
    ExceptionLLMError_502,
    ExceptionSubmittedExercise_409,
)
from backend.src.models_schema.activity.exercise_item import ExerciseItem
from backend.src.models_schema.activity.exercise_item_content import (
    ExerciseItemContent,
)
from backend.src.models_schema.activity.study_activity import StudyActivity
from backend.src.models_schema.miscellaneous.enums import (
    ExerciseItemContentType,
    StudyActivityFormat,
    StudyActivityType,
    SubjectType,
)
from backend.src.services.study_activity import submit_exercise_activity

# ----- gather_limited ----- #


async def test_gather_limited_never_exceeds_the_limit_and_keeps_order():
    running = 0
    peak = 0

    async def work(value: int) -> int:
        nonlocal running, peak
        running += 1
        peak = max(peak, running)
        await asyncio.sleep(0.01)
        running -= 1
        return value

    results = await gather_limited(2, *(work(i) for i in range(6)))

    assert results == [0, 1, 2, 3, 4, 5]
    assert peak == 2


async def test_gather_limited_propagates_the_first_error():
    async def boom() -> int:
        raise RuntimeError("boom")

    async def fine() -> int:
        return 1

    with pytest.raises(RuntimeError, match="boom"):
        await gather_limited(2, fine(), boom())


async def test_gather_limited_rejects_a_non_positive_limit():
    with pytest.raises(ValueError):
        await gather_limited(0)


# ----- submit_exercise_activity ----- #


async def _create_exercise(session: AsyncSession, interaction_id: int) -> int:
    activity = StudyActivity(
        interaction_id=interaction_id,
        activity_type=StudyActivityType.EXERCISE,
        activity_format=StudyActivityFormat.OPEN_ENDED,
        subject_type=SubjectType.ENGLISH,
        prompt="Explain recursion",
        name="Exercise",
        description="d",
        created_at=datetime.now(timezone.utc),
    )
    session.add(activity)
    await session.flush()
    assert activity.id is not None
    item = ExerciseItem(
        study_activity_id=activity.id,
        max_score=10,
        question="What is recursion?",
        attempt="A function calling itself",
    )
    session.add(item)
    await session.flush()
    assert item.id is not None
    session.add(
        ExerciseItemContent(
            exercise_item_id=item.id,
            content="A function that calls itself",
            type=ExerciseItemContentType.OPEN_ENDED_CORRECT,
            is_correct=True,
        )
    )
    await session.commit()
    return activity.id


async def _is_submitted(session: AsyncSession, activity_id: int) -> bool:
    # Reads the column directly so the session's identity map cannot hide the value
    query = select(StudyActivity.is_submitted).where(StudyActivity.id == activity_id)
    return (await session.execute(query)).scalar_one()


async def test_failed_grading_gives_the_submission_claim_back(
    session: AsyncSession,
    register_user_custom,
    create_interaction_custom,
):
    user = await register_user_custom("submit-owner")
    interaction = await create_interaction_custom(user, "submit")
    activity_id = await _create_exercise(session, interaction.id)

    with patch.object(
        GlobalAPI, "grade_answers", AsyncMock(return_value="this is not json")
    ):
        with pytest.raises(ExceptionLLMError_502):
            await submit_exercise_activity(
                user, session, datetime.now(timezone.utc), activity_id
            )

    # The user must be able to try again
    assert await _is_submitted(session, activity_id) is False


async def test_second_submit_during_grading_is_rejected_without_grading_again(
    session: AsyncSession,
    register_user_custom,
    create_interaction_custom,
):
    user = await register_user_custom("submit-race")
    interaction = await create_interaction_custom(user, "race")
    activity_id = await _create_exercise(session, interaction.id)

    grading_started = asyncio.Event()
    release_grading = asyncio.Event()

    async def slow_grading(*args, **kwargs):
        grading_started.set()
        await release_grading.wait()
        return "this is not json"  # fails after the retries, releasing the claim

    grade_mock = AsyncMock(side_effect=slow_grading)

    with patch.object(GlobalAPI, "grade_answers", grade_mock):
        first = asyncio.create_task(
            submit_exercise_activity(
                user, session, datetime.now(timezone.utc), activity_id
            )
        )
        await asyncio.wait_for(grading_started.wait(), timeout=10)

        # A different request (own DB session) arrives while the first is grading
        # (the timeout turns "second request also started grading" into a failure
        # instead of a hang, since that grading call would wait forever)
        try:
            async with SessionLocal() as other_session:
                with pytest.raises(ExceptionSubmittedExercise_409):
                    await asyncio.wait_for(
                        submit_exercise_activity(
                            user,
                            other_session,
                            datetime.now(timezone.utc),
                            activity_id,
                        ),
                        timeout=10,
                    )

            # The second request never reached grading
            assert grade_mock.await_count == 1
        finally:
            release_grading.set()

        with pytest.raises(ExceptionLLMError_502):
            await first

    assert await _is_submitted(session, activity_id) is False
