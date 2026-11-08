from backend.src.models_schema.activity.review_item import ReviewItem
from backend.src.models_schema.miscellaneous.enums import ReviewItemContentType


def flashcard_item_formatter(item: ReviewItem) -> str:
    return f"""
Flashcard front content: {[item_content.content for item_content in item.contents if item_content.type == ReviewItemContentType.FLASHCARDS_FRONT][0]}
Flashcard back content: {[item_content.content for item_content in item.contents if item_content.type == ReviewItemContentType.FLASHCARDS_BACK][0]}
"""