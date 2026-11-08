from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from backend.src.core.config import settings

password_hasher = PasswordHash.recommended()

DUMMY_PASSWORD_HASH = "$argon2id$v=19$m=65536,t=3,p=4$G2cBxzF8vfN1DcBl8MKqhA$MeuvTNFv+5KpsyY6cxegwP1P2UbrWLq6Xyaq/S+h8v0"


def get_hashed_password(password: str):
    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str):
    return password_hasher.verify(password, hashed_password)


def create_token(data: dict, current_datetime: datetime) -> str:
    data = data.copy()

    data.update(
        {
            "iat": current_datetime,
            "exp": current_datetime + timedelta(hours=settings.TOKEN_EXPIRY_HOURS),
        }
    )

    token = jwt.encode(
        payload=data,
        key=settings.PRIVATE_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    return token
