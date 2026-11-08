from datetime import date, datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, Path, Query
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from backend.src.core.config import settings
from backend.src.core.database import get_async_session
from backend.src.exceptions.core import (
    ExceptionAuthentication_401,
    ExceptionNotFound_404,
)
from backend.src.models_schema.auth.auth import TokenData
from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.models_schema.user.check_in import CheckIn
from backend.src.models_schema.user.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# ----- SESSION DEPENDENCY ----- #

SessionDep = Annotated[AsyncSession, Depends(get_async_session)]

# ----- DATETIME DEPENDENCY ----- #


def get_current_datetime(
    overwritten_day: Annotated[date | None, Query()] = None,
) -> datetime:
    now = datetime.now(timezone.utc)

    if overwritten_day:
        now = now.replace(
            year=overwritten_day.year,
            month=overwritten_day.month,
            day=overwritten_day.day,
        )

    return now


DatetimeDep = Annotated[datetime, Depends(get_current_datetime)]

# ----- USER DEPENDENCY ----- #


async def get_current_user(
    session: SessionDep,
    token: Annotated[str, Depends(oauth2_scheme)],
    current_datetime: DatetimeDep,
):
    # No token failure
    if token is None:
        raise ExceptionAuthentication_401()

    try:
        contents = jwt.decode(
            jwt=token,
            key=settings.PRIVATE_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        validated_contents = TokenData.model_validate(contents)

    # Invalid token failure
    except jwt.InvalidTokenError:
        raise ExceptionAuthentication_401()

    # Token with wrong format failure
    except ValidationError:
        raise ExceptionAuthentication_401()

    # Fetches user
    query = (
        select(User, CheckIn)
        .select_from(User)
        .outerjoin(CheckIn)
        .where(User.id == validated_contents.sub)
        .order_by(col(CheckIn.time).desc())
        .limit(1)
    )
    row = (await session.execute(query)).first()
    if row is None:
        raise ExceptionAuthentication_401()

    # Updates login status
    user, last_check_in = row
    assert isinstance(user, User)
    assert isinstance(last_check_in, CheckIn | None)

    today = current_datetime.date()

    # If user has never logged in or didn't log in today
    if last_check_in is None or last_check_in.time < today:
        # If user has never logged in
        if last_check_in is None:
            user.login_streak = 1
            user.longest_login_streak = 1
        else:
            time_between = today - last_check_in.time

            # If user last logged in yesterday
            if time_between == timedelta(days=1):
                user.login_streak += 1
                if user.login_streak > user.longest_login_streak:
                    user.longest_login_streak = user.login_streak

            # If user didn't log in yesterday
            elif time_between > timedelta(days=1):
                user.login_streak = 1

        # Inserting with race condition check
        query_insert = (
            insert(CheckIn)
            .values({"time": today, "user_id": user.id})
            .on_conflict_do_nothing(index_elements=["user_id", "time"])
        )

        await session.execute(query_insert)
        await session.commit()

    return user


UserDep = Annotated[User, Depends(get_current_user)]

# ----- INTERACTION DEPENDENCY ----- #


async def get_interaction_id(
    user: UserDep, session: SessionDep, interaction_id: Annotated[int, Path()]
) -> Interaction:
    query = select(Interaction).where(
        Interaction.user_id == user.id,
        Interaction.id == interaction_id,
        Interaction.is_deleted == False,
    )

    interaction = (await session.execute(query)).scalars().first()

    await session.commit()

    if interaction is None:
        raise ExceptionNotFound_404(
            "Interaction",
            {"user_id": user.id, "id": interaction_id, "is_deleted": False},
        )

    return interaction


InteractionDep = Annotated[Interaction, Depends(get_interaction_id)]
