from backend.src.models_schema.document.document_chunk import DocumentChunk
from backend.src.models_schema.miscellaneous.enums import DocumentType
from backend.src.RAG.augmentation.formatters.chunks.base import (
    ContentFormatter,
)


class PDFFormatter(ContentFormatter):
    @classmethod
    def format(
        cls, index: int, head_chunk: DocumentChunk, page_end: int, stitched_content: str
    ) -> str:
        assert head_chunk.document_page_num is not None

        return f"""Context {index}:
Source: 
- Document name: {head_chunk.document.name}
- Type: {DocumentType.PDF.value}
- Page: {head_chunk.document_page_num + head_chunk.document.page_starts_at} -> {page_end}
Contents:
{stitched_content}
"""
