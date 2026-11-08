from typing import TYPE_CHECKING, Annotated

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from backend.src.models_schema.activity.review_item_content import (
        ReviewItemContent,
        ReviewItemContentOutput,
    )
    from backend.src.models_schema.activity.study_activity import StudyActivity

# ----- BASE ----- #


class ReviewItemBase(SQLModel):
    pass


# ----- INPUT ----- #


class FlashcardInput(SQLModel):
    front: str
    back: str


# ----- OUTPUT ----- #


class ReviewItemOutput(ReviewItemBase):
    id: int
    contents: list["ReviewItemContentOutput"]


# ----- UPDATE ----- #


class FlashcardUpdate(SQLModel):
    front: str
    back: str


# ----- TABLE MODEL ----- #


class ReviewItem(ReviewItemBase, table=True):
    __tablename__ = "review_item"  # type: ignore

    id: Annotated[int | None, Field(primary_key=True, nullable=False)] = None
    study_activity_id: Annotated[
        int | None,
        Field(foreign_key="study_activity.id", nullable=False),
    ] = None

    is_deleted: bool = False

    study_activity: "StudyActivity" = Relationship(back_populates="review_items")
    contents: list["ReviewItemContent"] = Relationship(
        back_populates="review_item", cascade_delete=True
    )


from backend.src.models_schema.activity.review_item_content import (
    ReviewItemContentOutput,
)
