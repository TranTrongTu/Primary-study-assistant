from typing import Any, Callable, Iterable

from backend.src.models_schema.activity.study_activity import StudyActivity
from backend.src.models_schema.miscellaneous.enums import (
    StudyActivityFormat,
)
from backend.src.RAG.augmentation.formatters.study_activities.flashcard_item import (
    flashcard_item_formatter,
)
from backend.src.RAG.augmentation.formatters.study_activities.gap_fill_item import (
    gap_fill_item_formatter,
)
from backend.src.RAG.augmentation.formatters.study_activities.MCQ_item import (
    MCQ_item_formatter,
)
from backend.src.RAG.augmentation.formatters.study_activities.open_ended_item import (
    open_ended_item_formatter,
)


def singular_study_activity_formatter(index: int, study_activity: StudyActivity) -> str:
    formatter_map: dict[StudyActivityFormat, Callable[[Any], str]] = {
        StudyActivityFormat.MULTIPLE_CHOICE_QUESTIONS: MCQ_item_formatter,
        StudyActivityFormat.OPEN_ENDED: open_ended_item_formatter,
        StudyActivityFormat.FLASHCARDS: flashcard_item_formatter,
        StudyActivityFormat.GAP_FILL: gap_fill_item_formatter,
    }

    return f"""Study activity #{index} (created at {study_activity.created_at}, in interaction #{study_activity.interaction_id}):
Study activity submission time (only applied to exercises): {study_activity.submitted_at}
Study activity format: {study_activity.activity_format}
Study activity subject type: {study_activity.subject_type}
Study activity contents:
{"\n".join(formatter_map[study_activity.activity_format](item) for item in study_activity.items)} # type: ignore
"""


def study_activities_formatter(study_activities: Iterable[StudyActivity]) -> str:
    formatted_study_activities = "\n\n".join(
        singular_study_activity_formatter(i, act)
        for i, act in enumerate(study_activities, start=1)
    )

    return formatted_study_activities
