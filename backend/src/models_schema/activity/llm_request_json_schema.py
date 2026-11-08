from typing import Any

from pydantic import model_validator
from sqlmodel import SQLModel

# ----- GRADING SCHEMAS ----- #

# === Base models === #


class ForGradingItemSchema(SQLModel):
    id: int
    question: str
    attempt: Any


class ForGradingSchema(SQLModel):
    items: list[ForGradingItemSchema]


# === Open ended === #


class OpenEndedForGradingItemContentSchema(SQLModel):
    content: str


class OpenEndedForGradingItemSchema(ForGradingItemSchema):
    max_score: float
    attempt: str | None
    contents: list[OpenEndedForGradingItemContentSchema] | str

    @model_validator(mode="after")
    def reinitiate_contents(self):
        if isinstance(self.contents, list):
            self.contents = self.contents[0].content
        return self


class OpenEndedForGradingSchema(ForGradingSchema):
    items: list[OpenEndedForGradingItemSchema]


# === MCQ === #


class MCQForGradingItemContentSchema(SQLModel):
    id: int
    content: str
    is_correct: bool


class MCQForGradingItemSchema(ForGradingItemSchema):
    attempt: int | None
    contents: list[MCQForGradingItemContentSchema]
    user_score: float


class MCQForGradingSchema(ForGradingSchema):
    items: list[MCQForGradingItemSchema]
