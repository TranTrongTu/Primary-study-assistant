from typing import Annotated, Any

from pydantic import model_validator
from sqlmodel import Field, SQLModel

from backend.src.exceptions.core import ExceptionLLMError_502
from backend.src.models_schema.activity.llm_request_json_schema import (
    MCQForGradingSchema,
    OpenEndedForGradingSchema,
)

# ----- ACTIVITY BASE SCHEMA ----- #


class StudyActivityValidationBase(SQLModel):
    name: str
    description: str
    activity_items: list[Any]


# ----- ACTIVITY CREATION SCHEMAS ----- #

# === Exercise === #

# ++ MCQ ++ #


class MCQItemSchema(SQLModel):
    question: str
    answers: Annotated[list[str], Field(min_length=4, max_length=4)]
    correct: Annotated[int, Field(ge=0, le=3)]


class MCQSchema(StudyActivityValidationBase):
    activity_items: list[MCQItemSchema]


# ++ Open Ended ++ #


class OpenEndedItemSchema(SQLModel):
    question: str
    correct: str


class OpenEndedCreationSchema(StudyActivityValidationBase):
    activity_items: list[OpenEndedItemSchema]


# === Review === #

# ++ Flashcards ++ #


class FlashcardItemSchema(SQLModel):
    front: str
    back: str


class FlashcardsSchema(StudyActivityValidationBase):
    activity_items: list[FlashcardItemSchema]


# ++ Gap Fill ++ #


class GapFillItemSchema(SQLModel):
    text: str
    corrects: list[str]
    distractors: list[str]

    @model_validator(mode="after")
    def validate_output(self):
        blank_count = self.text.count("$!BLANK!$")
        if blank_count == 0:
            raise ExceptionLLMError_502("Text had no blank.")
        elif len(self.corrects) != blank_count:
            raise ExceptionLLMError_502(
                "The number of correct answers doesn't match the number of blanks."
            )
        return self


class GapFillSchema(StudyActivityValidationBase):
    activity_items: list[GapFillItemSchema]


# ----- GRADING SCHEMAS ----- #

# === Base schema === #


class GradedItemSchema(SQLModel):
    id: int
    explanation: str


class GradedSchema(SQLModel):
    grading_input: SQLModel
    grading_results: list[GradedItemSchema]


# === Open Ended === #


class OpenEndedGradedItemSchema(GradedItemSchema):
    user_score: float


class OpenEndedGradedSchema(GradedSchema):
    grading_results: list[OpenEndedGradedItemSchema]


class OpenEndedGradedCrossValidation(OpenEndedGradedSchema):
    """
    Cross validates the graded results with the inputs.
    """

    grading_input: OpenEndedForGradingSchema

    @model_validator(mode="after")
    def validate_output(self):
        """
        Validates grading results' ids and scores.
        """
        grading_scores = {item.id: item.user_score for item in self.grading_results}

        for item in self.grading_input.items:
            grading_score = grading_scores.get(item.id)
            if grading_score is None:
                raise ExceptionLLMError_502(
                    f"Missing grade for item with id {item.id}."
                )

            if grading_score < 0 or grading_score > item.max_score:
                raise ExceptionLLMError_502(
                    "Graded score fell outside of acceptable range."
                )

        return self


# === MCQ === #


class MCQGradedItemSchema(GradedItemSchema):
    pass


class MCQGradedSchema(GradedSchema):
    grading_results: list[MCQGradedItemSchema]


class MCQGradedCrossValidation(MCQGradedSchema):
    """
    Cross validates the graded results with the inputs.
    """

    grading_input: MCQForGradingSchema

    @model_validator(mode="after")
    def validate_output(self):
        """
        Validates grading results' ids.
        """
        results = {item.id: item.explanation for item in self.grading_results}

        for item in self.grading_input.items:
            result = results.get(item.id)

            if result is None:
                raise ExceptionLLMError_502(
                    f"Missing grade for item with id {item.id}."
                )

        return self
