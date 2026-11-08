from backend.src.models_schema.activity.review_item import ReviewItem
from backend.src.models_schema.miscellaneous.enums import ReviewItemContentType


def gap_fill_item_formatter(item: ReviewItem) -> str:
    return f"""
Gap fill blank-filled text: {[item_content.content for item_content in item.contents if item_content.type == ReviewItemContentType.GAP_FILL_TEXT][0]}
Gap fill correct answers (in the correct order based on the black-filled text): {" - ".join([item_content.content for item_content in item.contents if item_content.type == ReviewItemContentType.GAP_FILL_CORRECT])}
Gap fill incorrect answers (surplus distractors): {", ".join([item_content.content for item_content in item.contents if item_content.type == ReviewItemContentType.GAP_FILL_DISTRACTOR])} 
"""