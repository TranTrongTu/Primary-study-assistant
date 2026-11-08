from datetime import datetime, timedelta, timezone

from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from backend.src.core.security import get_hashed_password, verify_password
from backend.src.exceptions.core import (
    ExceptionAuthentication_401,
    ExceptionTakenInfo_409,
)
from backend.src.models_schema.user.check_in import CheckIn
from backend.src.models_schema.user.user import (
    User,
    UserInput,
    UserPasswordChange,
    UserUpdate,
)

# ----- CREATE ----- #


async def check_email_exists(session: AsyncSession, email: EmailStr):
    query = select(User).where(User.email == email)
    user = (await session.execute(query)).scalars().first()

    if user is not None:
        raise ExceptionTakenInfo_409("user", "email")


async def register_user(
    session: AsyncSession, current_datetime: datetime, user_input: UserInput
) -> User:
    await check_email_exists(session, user_input.email)
    await session.commit()

    user = User.model_validate(
        user_input.model_dump(),
        update={
            "hashed_password": get_hashed_password(user_input.password),
            "created_at": current_datetime,
        },
    )

    session.add(user)
    await session.commit()
    # await session.refresh(user)

    return user


# ----- READ ----- #


async def read_user(user: User) -> User:
    return user


# ----- UPDATE ----- #


async def update_user(
    user: User, session: AsyncSession, user_update: UserUpdate
) -> User:
    update_contents = user_update.model_dump(exclude_unset=True)

    if (
        update_contents.get("email", None)
        and update_contents.get("email", None) != user.email
    ):
        await check_email_exists(session, update_contents["email"])

    user.sqlmodel_update(update_contents)

    await session.commit()
    # await session.refresh(user)
    return user


async def update_password(
    user: User, session: AsyncSession, password_change: UserPasswordChange
) -> None:
    if not verify_password(password_change.old_password, user.hashed_password):
        raise ExceptionAuthentication_401()

    update = {"hashed_password": get_hashed_password(password_change.new_password)}
    user.sqlmodel_update(update)

    await session.commit()
