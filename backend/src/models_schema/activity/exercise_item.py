from typing import TYPE_CHECKING, Annotated, Self

from pydantic import ValidationInfo, model_validator
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from backend.src.models_schema.activity.exercise_item_content import (
        ExerciseItemContent,
        ExerciseItemContentOutput,
    )
    from backend.src.models_schema.activity.study_activity import StudyActivity

# ----- BASE ----- #


class ExerciseItemBase(SQLModel):
    max_score: float
    question: str


# ----- OUTPUT ----- #


class ExerciseItemOutput(ExerciseItemBase):
    id: int
    user_score: float | None = None
    explanation: str | None = None
    attempt: str | None
    contents: list["ExerciseItemContentOutput"]

    @model_validator(mode="after")
    def scrub_score(self, info: ValidationInfo) -> Self:
        if not info.context or info.context.get("show_answers") is not True:
            self.user_score = None
            self.explanation = None
        return self


# ----- UPDATE ----- #


class ExerciseItemUpdate(SQLModel):
    attempt: int | str


# ----- TABLE MODEL ----- #


class ExerciseItem(ExerciseItemBase, table=True):
    __tablename__ = "exercise_item"  # type: ignore

    id: Annotated[int | None, Field(primary_key=True, nullable=False)] = None
    study_activity_id: Annotated[
        int | None,
        Field(foreign_key="study_activity.id", nullable=False),
    ] = None

    user_score: float = 0
    attempt: str | None = None
    explanation: str | None = None  # Only for open-ended questions

    is_deleted: bool = False

    study_activity: "StudyActivity" = Relationship(back_populates="exercise_items")
    contents: list["ExerciseItemContent"] = Relationship(
        back_populates="exercise_item", cascade_delete=True
    )


from backend.src.models_schema.activity.exercise_item_content import (
    ExerciseItemContentOutput,
)
