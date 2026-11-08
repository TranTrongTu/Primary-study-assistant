from backend.src.models_schema.document.document_chunk import DocumentChunk
from backend.src.models_schema.miscellaneous.enums import DocumentType
from backend.src.RAG.augmentation.formatters.chunks.base import (
    ContentFormatter,
)


class ImageFormatter(ContentFormatter):
    @classmethod
    def format(
        cls, index: int, head_chunk: DocumentChunk, page_end: int, stitched_content: str
    ) -> str:
        return f"""Context {index}:
Source:
- Document name: {head_chunk.document.name}
- Type: {DocumentType.IMAGE.value}
Contents:
{stitched_content}
"""
