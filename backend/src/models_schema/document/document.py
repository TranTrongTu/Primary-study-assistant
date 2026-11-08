from datetime import datetime, timezone
from typing import TYPE_CHECKING, Annotated, Optional

from pydantic import BeforeValidator, model_validator
from sqlmodel import Column, DateTime, Field, Relationship, SQLModel

from backend.src.exceptions.core import (
    ExceptionRequest_400,
    ExceptionRequestValidation_400,
)
from backend.src.models_schema.miscellaneous.enums import DocumentType, SubjectType
from backend.src.models_schema.miscellaneous.utils import beva_forbid_none

if TYPE_CHECKING:
    from backend.src.models_schema.document.document_analysis import DocumentAnalysis
    from backend.src.models_schema.document.document_chunk import DocumentChunk
    from backend.src.models_schema.interaction.interaction import Interaction


# ----- BASE ----- #


class DocumentBase(SQLModel):
    name: str
    page_starts_at: int = 1
    subject_type: SubjectType | None


# ----- INPUT ----- #


class DocumentInput(DocumentBase):
    name: Annotated[str | None, BeforeValidator(beva_forbid_none)] = None
    subject_type: SubjectType | None = None
    subject_type_overwrite: bool

    @model_validator(mode="after")
    def validate_subject_type_overwrite(self):
        if self.subject_type_overwrite and self.subject_type is not None:
            raise ExceptionRequestValidation_400(
                "Automatic subject categorization only available if input subject type is null."
            )
        return self


# ----- OUTPUT ----- #


class DocumentOutput(DocumentBase):
    id: int
    created_at: datetime
    type: DocumentType


# ----- UPDATE ----- #


class DocumentUpdate(DocumentBase):
    name: Annotated[str | None, BeforeValidator(beva_forbid_none)] = None
    page_starts_at: Annotated[int | None, BeforeValidator(beva_forbid_none)] = None


# ----- TABLE MODEL ----- #


class Document(DocumentBase, table=True):
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
    type: DocumentType
    text: Annotated[str | None, Field(nullable=False)]

    interaction: "Interaction" = Relationship(back_populates="documents")
    document_chunks: list["DocumentChunk"] = Relationship(
        back_populates="document", cascade_delete=True
    )
    document_analysis: Optional["DocumentAnalysis"] = Relationship(
        back_populates="document", cascade_delete=True
    )
