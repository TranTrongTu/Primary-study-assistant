from fastapi import APIRouter, status

from backend.src.core.dependencies import DatetimeDep, SessionDep, UserDep
from backend.src.exceptions.core import Responses
from backend.src.models_schema.user.user import (
    UserInput,
    UserOutput,
    UserPasswordChange,
    UserUpdate,
)
from backend.src.services import user as user_service

router = APIRouter()

# ----- CREATE ----- #


@router.post(
    "/register",
    response_model=UserOutput,
    responses={
        409: Responses.RESPONSE_409_CONFLICT,
    },
)
async def register_user(
    session: SessionDep, current_datetime: DatetimeDep, user_input: UserInput
):
    """
    Creates a user account.
    """
    user_output = await user_service.register_user(
        session=session,
        current_datetime=current_datetime,
        user_input=user_input,
    )
    return user_output


# ----- READ ----- #


@router.get(
    "/me",
    response_model=UserOutput,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
    },
)
async def read_user(user: UserDep):
    """
    Reads current user's public information.
    """
    user_output = await user_service.read_user(
        user=user,
    )
    return user_output


# ----- UPDATE ----- #


@router.patch(
    "/me",
    response_model=UserOutput,
    responses={
        400: Responses.RESPONSE_400_BAD_REQUEST,
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        409: Responses.RESPONSE_409_CONFLICT,
    },
)
async def update_user(user: UserDep, session: SessionDep, user_update: UserUpdate):
    """
    Updates current user's public information.
    """
    user_output = await user_service.update_user(
        user=user,
        session=session,
        user_update=user_update,
    )
    return user_output


@router.patch(
    "/change-password",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
    },
)
async def update_password(
    user: UserDep, session: SessionDep, password_change: UserPasswordChange
):
    """
    Updates current user's password.
    """
    await user_service.update_password(
        user=user,
        session=session,
        password_change=password_change,
    )
