from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from backend.src.core.dependencies import DatetimeDep, SessionDep
from backend.src.exceptions.core import Responses
from backend.src.models_schema.auth.auth import Token
from backend.src.services import auth as auth_service

router = APIRouter()


@router.post(
    "/login",
    response_model=Token,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
    },
)
async def login_for_token(
    user: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep,
    current_datetime: DatetimeDep,
):
    """
    Login endpoint. Returns a token when user enters correct credentials. Tokens have an expiration time.
    """
    token = await auth_service.login_for_token(
        session=session,
        current_datetime=current_datetime,
        email=user.username,
        password=user.password,
    )
    return token
