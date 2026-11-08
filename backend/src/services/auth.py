from datetime import datetime

from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from backend.src.core.security import create_token, verify_password
from backend.src.exceptions.core import ExceptionAuthentication_401
from backend.src.models_schema.auth.auth import Token
from backend.src.models_schema.user.user import User

DUMMY_PASSWORD_HASH = "$argon2id$v=19$m=65536,t=3,p=4$G2cBxzF8vfN1DcBl8MKqhA$MeuvTNFv+5KpsyY6cxegwP1P2UbrWLq6Xyaq/S+h8v0"


async def authenticate_user(
    session: AsyncSession, email: EmailStr, password: str
) -> User:
    query = select(User).where(User.email == email)
    user = (await session.execute(query)).scalars().first()

    await session.close()

    if user is None:
        # Mimics password check delay
        verify_password("WRONG PASSWORD", DUMMY_PASSWORD_HASH)
        raise ExceptionAuthentication_401()

    if not verify_password(password, user.hashed_password):
        raise ExceptionAuthentication_401()

    return user


async def login_for_token(
    session: AsyncSession,
    current_datetime: datetime,
    email: EmailStr,
    password: str,
) -> Token:
    user = await authenticate_user(session, email, password)

    await session.close()

    data = {"sub": str(user.id)}

    token_str = create_token(data, current_datetime)

    return Token(access_token=token_str, token_type="bearer")
