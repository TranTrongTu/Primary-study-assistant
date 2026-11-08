from datetime import date, datetime, timezone
from typing import Annotated

from sqlmodel import Column, DateTime, Field, Index, Relationship, SQLModel

from backend.src.models_schema.user.user import User

# ----- BASE ----- #


class StudyAssessmentBase(SQLModel):
    assessment_of: date
    content: str


# ----- OUTPUT ----- #


class StudyAssessmentOutput(StudyAssessmentBase):
    created_at: datetime


# ----- TABLE MODEL ----- #


class StudyAssessment(StudyAssessmentBase, table=True):
    __tablename__ = "study_assessment"  # type: ignore

    id: Annotated[int | None, Field(primary_key=True, nullable=False)] = None
    user_id: Annotated[int | None, Field(foreign_key="user.id", nullable=False)] = None

    created_at: Annotated[
        datetime,
        Field(
            sa_column=Column(DateTime(timezone=True)),
        ),
    ]

    user: "User" = Relationship(back_populates="assessments")

    __table_args__ = (
        Index(
            "UQ_USER_ASSESSMENT_OF",
            "user_id",
            "assessment_of",
            unique=True,
        ),
    )
