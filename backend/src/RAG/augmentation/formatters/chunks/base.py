from abc import ABC, abstractmethod

from backend.src.models_schema.document.document_chunk import DocumentChunk


class ContentFormatter(ABC):
    @classmethod
    @abstractmethod
    def format(
        cls, index: int, head_chunk: DocumentChunk, page_end: int, stitched_content: str
    ) -> str:
        pass
