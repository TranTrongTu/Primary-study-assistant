from datetime import datetime, timezone
from typing import TYPE_CHECKING, Annotated

from pydantic import BeforeValidator
from sqlmodel import Column, DateTime, Field, Relationship, SQLModel

from backend.src.models_schema.miscellaneous.utils import beva_forbid_none

if TYPE_CHECKING:
    from backend.src.models_schema.interaction.interaction import Interaction

# ----- BASE ----- #


class NoteBase(SQLModel):
    name: str
    description: str = ""
    content: str = ""


# ----- INPUT ----- #


class NoteInput(NoteBase):
    pass


# ----- OUTPUT ----- #


class NoteOutput(NoteBase):
    id: int
    created_at: datetime


# ----- UPDATE ----- #


class NoteUpdate(SQLModel):
    name: Annotated[
        str | None, BeforeValidator(beva_forbid_none), Field(min_length=1)
    ] = None
    description: Annotated[str | None, BeforeValidator(beva_forbid_none)] = None
    content: Annotated[str | None, BeforeValidator(beva_forbid_none)] = None


# ----- TABLE MODEL ----- #


class Note(NoteBase, table=True):
    id: Annotated[int | None, Field(primary_key=True, nullable=False)] = None
    interaction_id: Annotated[
        int | None,
        Field(foreign_key="interaction.id", nullable=False, ondelete="CASCADE"),
    ] = None

    created_at: Annotated[
        datetime,
        Field(
            sa_column=Column(DateTime(timezone=True)),
        ),
    ]

    interaction: "Interaction" = Relationship(back_populates="notes")
