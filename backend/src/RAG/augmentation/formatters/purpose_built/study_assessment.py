from typing import Iterable

from backend.src.models_schema.activity.study_activity import StudyActivity
from backend.src.models_schema.document.document import Document
from backend.src.models_schema.llm_response.llm_response import LLMResponse
from backend.src.RAG.augmentation.formatters.conversations.core import (
    singular_conversation_formatter,
)
from backend.src.RAG.augmentation.formatters.documents.core import (
    singular_document_formatter,
)
from backend.src.RAG.augmentation.formatters.study_activities.core import (
    singular_study_activity_formatter,
)


def singular_progress_formatter(index: int, single_progress: LLMResponse | Document | StudyActivity) -> str:
    if isinstance(single_progress, LLMResponse):
        return singular_conversation_formatter(index, single_progress)
    elif isinstance(single_progress, Document):
        return singular_document_formatter(index, single_progress)
    else:
        return singular_study_activity_formatter(index, single_progress)
        
def progress_formatter(progress: Iterable[LLMResponse | Document | StudyActivity]) -> str:
    formatted_progress = "\n\n".join(
        singular_progress_formatter(i, single_progress) for i, single_progress in enumerate(progress, start=1)
    )
    
    return formatted_progress