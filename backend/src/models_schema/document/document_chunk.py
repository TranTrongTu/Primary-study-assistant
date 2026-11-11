from typing import TYPE_CHECKING, Annotated

from pgvector.sqlalchemy import Vector
from sqlmodel import Column, Field, Index, Relationship, SQLModel

if TYPE_CHECKING:
    from backend.src.models_schema.document.document import Document


# Output size of the embedding model used in production (Cloudflare bge-m3). It is part of
# the schema on purpose: the database rejects a vector of any other size instead of letting
# a provider switch silently mix sizes in one column. Changing the embedding model means a
# new migration and re-embedding every document.
EMBEDDING_DIMENSIONS = 1024


class DocumentChunk(SQLModel, table=True):
    __tablename__ = "document_chunk"  # type: ignore
    # Trigram index for keyword search
    __table_args__ = (
        Index(
            "ix_document_chunk_content_trgm",
            "content_original",
            postgresql_using="gin",
            postgresql_ops={"content_original": "gin_trgm_ops"},
        ),
    )

    id: Annotated[int | None, Field(primary_key=True, nullable=False)] = None
    document_id: Annotated[
        int | None, Field(foreign_key="document.id", nullable=False, ondelete="CASCADE")
    ] = None

    content_original: str
    content_embedded: Annotated[
        list[float], Field(sa_column=Column(Vector(EMBEDDING_DIMENSIONS)))
    ]
    document_page_num: int | None = None  # What page current chunk is in
    document_chunk_index: int | None = None  # Chunk id in a document

    document: "Document" = Relationship(back_populates="document_chunks")
