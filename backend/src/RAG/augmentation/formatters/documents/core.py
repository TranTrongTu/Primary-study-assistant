from typing import Iterable

from backend.src.models_schema.document.document import Document


def singular_document_formatter(index: int, document: Document) -> str:
    return f"""Document #{index} (created at {document.created_at}, in interaction #{document.interaction_id}):
Document name: {document.name} (provided by the user and therefore subjective)
Document subject type: {document.subject_type} (provided by the user and therefore subjective)
Document type: {document.type}
Document content summary: {document.document_analysis.summary if document.document_analysis else None}
"""


def documents_formatter(documents: Iterable[Document]) -> str:
    formatted_documents = "\n\n".join(
        singular_document_formatter(i, doc) for i, doc in enumerate(documents, start=1)
    )

    return formatted_documents
