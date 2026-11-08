from datetime import datetime, timezone
from types import CoroutineType
from typing import Any, Callable

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from backend.src.models_schema.interaction.interaction import (
    Interaction,
)
from backend.src.models_schema.user.user import User


@pytest.fixture(name="create_interaction_custom")
async def create_interaction_custom_fixture(
    session: AsyncSession,
) -> Callable[[User, str], CoroutineType[Any, Any, Interaction]]:
    """
    Returns a function that creates an interaction with a custom name attached to a custom user.
    """

    async def create_interaction_custom(
        user: User, interaction_name: str
    ) -> Interaction:
        interaction = Interaction(
            name=f"{interaction_name}-interaction",
            description=f"{interaction_name}-description",
            created_at=datetime.now(timezone.utc),
            user=user,
        )

        session.add(interaction)
        await session.commit()

        return interaction

    return create_interaction_custom


@pytest.fixture(name="create_interaction_test")
async def create_interaction_test_fixture(
    session: AsyncSession,
    create_interaction_custom: Callable[
        [User, str], CoroutineType[Any, Any, Interaction]
    ],
) -> Interaction:
    """
    Automatically creates an interaction with the name "test-interaction", attached to the user "test-user".
    """
    user = (
        (await session.execute(select(User).where(User.email == "test@gmail.com")))
        .scalars()
        .first()
    )
    assert user is not None

    interaction = await create_interaction_custom(user, "test")
    return interaction
