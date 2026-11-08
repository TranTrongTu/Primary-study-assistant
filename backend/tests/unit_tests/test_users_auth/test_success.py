from datetime import datetime, timedelta

import time_machine
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models_schema.auth.auth import Token
from backend.src.models_schema.user.user import (
    User,
    UserInput,
    UserOutput,
    UserPasswordChange,
)
from backend.src.routes.user import UserUpdate
from backend.tests.utils.validators import (
    validate_model,
    validate_object_contents,
    validate_response_contents,
    validate_status_code,
)

# ----- CREATE ----- #


async def test_register_user(client: AsyncClient):
    """
    Registers a user.
    """

    user = UserInput(username="test", email="test@gmail.com", password="test-password")

    response = await client.post(
        "/api/user/register",
        json=user.model_dump(),
    )

    validate_status_code(response, 200)
    validate_model(response, UserOutput)
    validate_response_contents(response, user.model_dump(exclude={"password"}))


# ----- AUTH ----- #


async def test_login_read_user(client: AsyncClient, register_user_test: User):
    """
    Logs in an account and uses the token to read the account information.
    """

    response_login = await client.post(
        "/api/login",
        data={
            "username": "test@gmail.com",
            "password": "test-password",
        },
    )

    validate_status_code(response_login, 200)
    validate_model(response_login, Token)

    token = response_login.json().get("access_token")

    response_read_user = await client.get(
        "/api/user/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    validate_status_code(response_read_user, 200)
    validate_model(response_read_user, UserOutput)
    validate_response_contents(
        response_read_user,
        {
            "username": "test-user",
            "email": "test@gmail.com",
        },
    )


# ----- READ ----- #


async def test_read_login_streak(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
):
    """
    Tests login streak record.
    """
    today = datetime.now().date()

    # Logins today
    response1 = await client.get(
        "/api/user/me",
    )

    validate_status_code(response1, 200)
    validate_model(response1, UserOutput)
    validate_response_contents(
        response1,
        {
            "login_streak": 1,
            "longest_login_streak": 1,
        },
    )

    # Logins tomorrow
    with time_machine.travel(today + timedelta(days=1)):
        response2 = await client.get(
            "/api/user/me",
        )

        validate_status_code(response2, 200)
        validate_model(response2, UserOutput)
        validate_response_contents(
            response2,
            {
                "login_streak": 2,
                "longest_login_streak": 2,
            },
        )

    # Logins 2 days after tomorrow
    with time_machine.travel(today + timedelta(days=3)):
        response3 = await client.get(
            "/api/user/me",
        )

        validate_status_code(response3, 200)
        validate_model(response3, UserOutput)
        validate_response_contents(
            response3,
            {
                "login_streak": 1,
                "longest_login_streak": 2,
            },
        )


# ----- UPDATE ----- #


async def test_update_user(
    session: AsyncSession,
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
):
    """
    Updates user account.
    """
    user_update = UserUpdate(
        username="updated",
        email="updated@gmail.com",
    )

    response = await client.patch(
        "/api/user/me",
        json=user_update.model_dump(exclude_unset=True),
    )

    validate_status_code(response, 200)
    validate_model(response, UserOutput)
    validate_response_contents(response, user_update.model_dump(exclude_unset=True))

    await session.refresh(register_user_test)

    validate_object_contents(
        register_user_test, user_update.model_dump(exclude_unset=True)
    )


async def test_change_password(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
):
    """
    Changes user password.
    """
    user_password_change = UserPasswordChange(
        old_password="test-password", new_password="test-password-updated"
    )

    response_update = await client.patch(
        "/api/user/change-password",
        json=user_password_change.model_dump(),
    )

    validate_status_code(response_update, 204)

    response_login = await client.post(
        "/api/login",
        data={
            "username": "test@gmail.com",
            "password": "test-password-updated",
        },
    )

    validate_status_code(response_login, 200)
