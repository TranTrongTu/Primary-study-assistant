from datetime import datetime, timezone
from types import CoroutineType
from typing import Any, Callable

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.security import get_hashed_password
from backend.src.models_schema.user.user import User

# ----- REGISTER ----- #


@pytest.fixture(name="register_user_custom")
async def register_user_custom_fixture(
    session: AsyncSession,
) -> Callable[[str], CoroutineType[Any, Any, User]]:
    """
    Returns a function that registers a user with a custom name.
    """

    async def register_user_custom(username: str) -> User:
        user = User(
            username=f"{username}-user",
            email=f"{username}@gmail.com",
            description=f"{username}-description",
            hashed_password=get_hashed_password(f"{username}-password"),
            created_at=datetime.now(timezone.utc),
        )

        session.add(user)
        await session.commit()

        return user

    return register_user_custom


@pytest.fixture(name="register_user_test")
async def register_user_test_fixture(
    register_user_custom: Callable[[str], CoroutineType[Any, Any, User]],
) -> User:
    """
    Automatically registers a user with the username "test-user".
    """

    return await register_user_custom("test")


# ----- LOGIN ----- #


@pytest.fixture(name="login_user_custom")
async def login_user_custom_fixture(
    client: AsyncClient,
) -> Callable[[str], CoroutineType[Any, Any, None]]:
    """
    Returns a function that logins a user with a custom name.
    """

    async def login_user_custom(username: str) -> None:
        response = await client.post(
            "/api/login",
            data={
                "username": f"{username}@gmail.com",
                "password": f"{username}-password",
            },
        )
        token = response.json().get("access_token")

        client.headers.update({"Authorization": f"Bearer {token}"})

    return login_user_custom


@pytest.fixture(name="login_user_test")
async def login_user_test_fixture(
    login_user_custom: Callable[[str], CoroutineType[Any, Any, None]],
) -> None:
    """
    Automatically logins a user with the username "test-user".
    """

    await login_user_custom("test")
