from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from backend.src.core.config import settings
from backend.src.models_schema.document.document import Document
from backend.src.models_schema.document.document_chunk import DocumentChunk
from backend.src.models_schema.interaction.interaction import Interaction


async def vector_search(
    session: AsyncSession,
    interaction: Interaction,
    embedded_prompt: list[float],
    document_id: int | None,
) -> Sequence[DocumentChunk]:
    query_vector = (
        select(DocumentChunk)
        .join(Document)
        .where(Document.interaction_id == interaction.id)
        .order_by(DocumentChunk.content_embedded.cosine_distance(embedded_prompt))  # type: ignore
        .limit(settings.DEFAULT_N_CHUNKS_RETRIEVED * 2)
        # .options(selectinload(DocumentChunk.document))  # type: ignore
    )

    if document_id:
        query_vector = query_vector.where(Document.id == document_id)

    vector_chunks = (await session.execute(query_vector)).scalars().all()

    return vector_chunks
