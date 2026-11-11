"""
Regression test for bug 3: another user's assessment on the same day must not
stop this user's assessment from being created. Needs the test database.
"""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from backend.src.core.ai_api import GlobalAPI
from backend.src.models_schema.study_progress.assessment import StudyAssessment
from backend.src.models_schema.user.check_in import CheckIn
from backend.src.services.study_progress import create_study_assessment


@patch.object(GlobalAPI, "generate_study_assessment", new_callable=AsyncMock)
async def test_assessment_not_blocked_by_other_users_assessment(
    mock_generate: AsyncMock,
    session: AsyncSession,
    register_user_custom,
):
    mock_generate.return_value = "Mock assessment"

    now = datetime.now(timezone.utc)
    yesterday = (now - timedelta(days=1)).date()

    alice = await register_user_custom("alice")
    bob = await register_user_custom("bob")

    # Both users checked in yesterday; only Alice already has an assessment for it
    session.add_all(
        [
            CheckIn(time=yesterday, user_id=alice.id),
            CheckIn(time=yesterday, user_id=bob.id),
            StudyAssessment(
                assessment_of=yesterday,
                content="Alice's assessment",
                user_id=alice.id,
                created_at=now,
            ),
        ]
    )
    await session.commit()

    result = await create_study_assessment(
        user=bob, session=session, current_datetime=now
    )

    # Before the fix the join matched Alice's row, so Bob got None
    assert result is not None
    assert result.user_id == bob.id
    assert result.assessment_of == yesterday

    bob_rows = (
        (
            await session.execute(
                select(StudyAssessment).where(StudyAssessment.user_id == bob.id)
            )
        )
        .scalars()
        .all()
    )
    assert len(bob_rows) == 1
