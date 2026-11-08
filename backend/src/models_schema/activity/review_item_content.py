from typing import TYPE_CHECKING, Annotated

from sqlmodel import Field, Relationship, SQLModel

from backend.src.models_schema.miscellaneous.enums import ReviewItemContentType

if TYPE_CHECKING:
    from backend.src.models_schema.activity.review_item import ReviewItem

# ----- BASE ----- #


class ReviewItemContentBase(SQLModel):
    content: str
    type: ReviewItemContentType


# ----- OUTPUT ----- #


class ReviewItemContentOutput(ReviewItemContentBase):
    id: int


# ----- TABLE MODEL ----- #


class ReviewItemContent(ReviewItemContentBase, table=True):
    __tablename__ = "review_item_content"  # type: ignore

    id: Annotated[int | None, Field(primary_key=True, nullable=False)] = None
    review_item_id: Annotated[
        int | None,
        Field(foreign_key="review_item.id", nullable=False, ondelete="CASCADE"),
    ] = None

    review_item: "ReviewItem" = Relationship(back_populates="contents")
