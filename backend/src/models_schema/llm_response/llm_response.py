from datetime import datetime
from typing import TYPE_CHECKING, Annotated

from sqlmodel import Column, DateTime, Field, Relationship, SQLModel

from backend.src.core.config import settings

if TYPE_CHECKING:
    from backend.src.models_schema.interaction.interaction import Interaction

# ----- BASE ----- #


class LLMResponseBase(SQLModel):
    prompt: str


# ----- INPUT ----- #


class LLMResponseInput(LLMResponseBase):
    prompt: Annotated[str, Field(min_length=1, max_length=settings.MAX_PROMPT_CHARS)]
    document_id: int | None = None


# ----- OUTPUT ----- #


class LLMResponseOutput(LLMResponseBase):
    id: int
    answer: str
    created_at: datetime


# ----- TABLE MODEL ----- #


class LLMResponse(LLMResponseBase, table=True):
    __tablename__ = "llm_response"  # type: ignore

    id: Annotated[int | None, Field(primary_key=True, nullable=False)] = None
    interaction_id: Annotated[
        int | None,
        Field(foreign_key="interaction.id", nullable=False, ondelete="CASCADE"),
    ] = None

    answer: str

    created_at: Annotated[
        datetime,
        Field(
            sa_column=Column(DateTime(timezone=True)),
        ),
    ]

    interaction: "Interaction" = Relationship(back_populates="llm_responses")
