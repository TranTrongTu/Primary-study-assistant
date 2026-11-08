from typing import TYPE_CHECKING, Annotated, Self

from pydantic import ValidationInfo, model_validator
from sqlmodel import Field, Relationship, SQLModel

from backend.src.models_schema.miscellaneous.enums import ExerciseItemContentType

if TYPE_CHECKING:
    from backend.src.models_schema.activity.exercise_item import ExerciseItem

# ----- BASE ----- #


class ExerciseItemContentBase(SQLModel):
    content: str | None
    type: ExerciseItemContentType


# ----- OUTPUT ----- #


class ExerciseItemContentOutput(ExerciseItemContentBase):
    id: int
    is_correct: bool | None = None

    @model_validator(mode="after")
    def scrub_answers(self, info: ValidationInfo) -> Self:
        if not info.context or not info.context.get("show_answers"):
            if self.type == ExerciseItemContentType.MULTIPLE_CHOICE_QUESTIONS_CHOICE:
                self.is_correct = None
            elif self.type == ExerciseItemContentType.OPEN_ENDED_CORRECT:
                self.content = None

        return self


# ----- TABLE MODEL ----- #


class ExerciseItemContent(ExerciseItemContentBase, table=True):
    __tablename__ = "exercise_item_content"  # type: ignore

    id: Annotated[int | None, Field(primary_key=True, nullable=False)] = None
    exercise_item_id: Annotated[
        int | None,
        Field(foreign_key="exercise_item.id", nullable=False, ondelete="CASCADE"),
    ] = None

    is_correct: bool

    exercise_item: "ExerciseItem" = Relationship(back_populates="contents")
