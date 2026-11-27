"""
The answer must not expose how the retrieved context is organised. Students saw
"theo Context 3", the number of an excerpt in a list only the model receives.
"""

import re
from types import SimpleNamespace

import pytest

from backend.src.models_schema.miscellaneous.enums import DocumentType
from backend.src.RAG.augmentation.formatters.chunks.core import (
    stitched_content_formatter,
)
from backend.src.RAG.augmentation.prompts_formatting.base_prompts import (
    ANSWER_GENERATION_BASE_PROMPT,
)


@pytest.mark.parametrize("document_type", list(DocumentType))
def test_excerpts_are_not_numbered(document_type):
    chunk = SimpleNamespace(
        document=SimpleNamespace(name="bai_doc", type=document_type, page_starts_at=1),
        document_page_num=0,
    )

    formatted = stitched_content_formatter(chunk, 2, "Cu Do gay luc nam gio.")

    assert not re.search(r"context\s*\d", formatted, re.IGNORECASE)
    assert "bai_doc" in formatted
    assert "Cu Do gay luc nam gio." in formatted


def test_answer_prompt_forbids_internal_labels_and_file_names():
    assert "NEVER write its internal labels" in ANSWER_GENERATION_BASE_PROMPT
    assert "NEVER write file names" in ANSWER_GENERATION_BASE_PROMPT
