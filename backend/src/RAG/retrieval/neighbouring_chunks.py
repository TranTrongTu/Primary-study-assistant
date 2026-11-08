from typing import Iterable

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import and_, col, or_, select

from backend.src.core.config import settings
from backend.src.models_schema.document.document_chunk import DocumentChunk


async def neighbouring_chunks(
    session: AsyncSession, core_chunks: list[DocumentChunk]
) -> Iterable[DocumentChunk]:
    """
    Fetches the proximate chunks to the core_chunks (calculated by settings.N_CHUNKS_WINDOW).
    """
    final_chunks = []

    if core_chunks:
        adjacency_conditions = []

        for chunk in core_chunks:
            if chunk.document_chunk_index is not None:
                # For PDF and text files
                adjacency_conditions.append(
                    and_(
                        DocumentChunk.document_id == chunk.document_id,
                        DocumentChunk.document_chunk_index  # type: ignore
                        >= chunk.document_chunk_index - settings.DEFAULT_N_CHUNKS_WINDOW,
                        DocumentChunk.document_chunk_index  # type: ignore
                        <= chunk.document_chunk_index + settings.DEFAULT_N_CHUNKS_WINDOW,
                    )
                )
            else:
                # For image files
                adjacency_conditions.append(DocumentChunk.id == chunk.id)

        query_final = (
            select(DocumentChunk)
            .where(or_(*adjacency_conditions))
            .order_by(
                col(DocumentChunk.document_id).asc(),
                col(DocumentChunk.document_chunk_index).asc(),
            )
            .options(selectinload(DocumentChunk.document))  # type: ignore
        )

        final_chunks = (await session.execute(query_final)).scalars().all()

    return final_chunks
