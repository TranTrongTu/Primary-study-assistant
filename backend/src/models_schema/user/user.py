from datetime import datetime, timezone
from typing import TYPE_CHECKING, Annotated

from pydantic import BeforeValidator, EmailStr
from sqlmodel import Column, DateTime, Field, Relationship, SQLModel

from backend.src.models_schema.miscellaneous.utils import beva_forbid_none

if TYPE_CHECKING:
    from backend.src.models_schema.interaction.interaction import Interaction
    from backend.src.models_schema.study_progress.assessment import StudyAssessment
    from backend.src.models_schema.user.check_in import CheckIn

# ----- BASE ----- #


class UserBase(SQLModel):
    username: Annotated[str, Field(min_length=1)]
    email: EmailStr
    description: str


# ----- INPUT ----- #


class UserInput(UserBase):
    password: Annotated[str, Field(min_length=1)]
    description: str = ""


# ----- OUTPUT ----- #


class UserOutput(UserBase):
    id: int
    created_at: datetime

    login_streak: int
    longest_login_streak: int


# ----- UPDATE ----- #


class UserUpdate(UserBase):
    username: Annotated[
        str | None, BeforeValidator(beva_forbid_none), Field(min_length=1)
    ] = None
    email: Annotated[EmailStr | None, BeforeValidator(beva_forbid_none)] = None
    description: Annotated[
        str | None, BeforeValidator(beva_forbid_none), Field(min_length=1)
    ] = None


class UserPasswordChange(SQLModel):
    old_password: str
    new_password: str


# ----- TABLE MODEL ----- #


class User(UserBase, table=True):
    id: Annotated[int | None, Field(primary_key=True, nullable=False)] = None

    hashed_password: str
    login_streak: int = 0
    longest_login_streak: int = 0

    created_at: Annotated[
        datetime,
        Field(
            sa_column=Column(DateTime(timezone=True)),
        ),
    ]

    interactions: list["Interaction"] = Relationship(back_populates="user")
    check_ins: list["CheckIn"] = Relationship(back_populates="user")
    assessments: list["StudyAssessment"] = Relationship(back_populates="user")
