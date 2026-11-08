from datetime import datetime, timezone
from typing import TYPE_CHECKING, Annotated

from pydantic import BeforeValidator
from sqlmodel import Column, DateTime, Field, Relationship, SQLModel

from backend.src.models_schema.miscellaneous.utils import beva_forbid_none

if TYPE_CHECKING:
    from backend.src.models_schema.activity.study_activity import StudyActivity
    from backend.src.models_schema.document.document import Document
    from backend.src.models_schema.llm_response.llm_response import LLMResponse
    from backend.src.models_schema.note.note import Note
    from backend.src.models_schema.user.user import User

# ----- BASE ----- #


class InteractionBase(SQLModel):
    name: str
    description: str = ""


# ----- INPUT ----- #


class InteractionInput(InteractionBase):
    pass


# ----- OUTPUT ----- #


class InteractionOutput(InteractionBase):
    id: int
    created_at: datetime


# ----- UPDATE ----- #


class InteractionUpdate(SQLModel):
    name: Annotated[str | None, BeforeValidator(beva_forbid_none)] = (
        None  # User không được enter giá trị None
    )
    description: str = ""


# ----- TABLE MODEL ----- #


class Interaction(InteractionBase, table=True):
    id: Annotated[int | None, Field(primary_key=True, nullable=False)] = None
    user_id: Annotated[int | None, Field(foreign_key="user.id", nullable=False)] = None

    created_at: Annotated[
        datetime,
        Field(
            sa_column=Column(DateTime(timezone=True)),
        ),
    ]

    is_deleted: bool = False

    user: "User" = Relationship(back_populates="interactions")
    documents: list["Document"] = Relationship(
        back_populates="interaction",
        cascade_delete=True,
    )
    llm_responses: list["LLMResponse"] = Relationship(
        back_populates="interaction",
        cascade_delete=True,
    )
    notes: list["Note"] = Relationship(
        back_populates="interaction",
        cascade_delete=True,
    )
    study_activities: list["StudyActivity"] = Relationship(
        back_populates="interaction",
    )  # Uses soft delete
