from typing import Iterable

from backend.src.models_schema.document.document_chunk import DocumentChunk
from backend.src.models_schema.miscellaneous.enums import DocumentType
from backend.src.RAG.augmentation.formatters.chunks.base import (
    ContentFormatter,
)
from backend.src.RAG.augmentation.formatters.chunks.image import ImageFormatter
from backend.src.RAG.augmentation.formatters.chunks.PDF import PDFFormatter
from backend.src.RAG.augmentation.formatters.chunks.text import TextFormatter
from backend.src.RAG.augmentation.stitcher.core import chunks_stitcher

FORMATTERS: dict[DocumentType, type[ContentFormatter]] = {
    DocumentType.PDF: PDFFormatter,
    DocumentType.IMAGE: ImageFormatter,
    DocumentType.TEXT: TextFormatter,
}


def stitched_content_formatter(
    index: int, head_chunk: DocumentChunk, page_end: int, stitched_content: str
) -> str:
    """
    Converts a content block (a stitched block of chunks) into text depending on its document type.
    """
    document = head_chunk.document

    formatter_class = FORMATTERS[document.type]

    return formatter_class.format(index, head_chunk, page_end, stitched_content)


def chunks_formatter(chunks: Iterable[DocumentChunk]) -> str:
    """
    Converts document chunks into text (through stitching and formatting).
    """
    stitched_contents = chunks_stitcher(chunks)

    formatted_chunks = "\n\n".join(
        stitched_content_formatter(i, *content_block)
        for i, content_block in enumerate(stitched_contents, start=1)
    )

    return formatted_chunks
