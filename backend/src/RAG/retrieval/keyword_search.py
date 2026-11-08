from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from backend.src.core.config import settings
from backend.src.models_schema.document.document import Document
from backend.src.models_schema.document.document_chunk import DocumentChunk
from backend.src.models_schema.interaction.interaction import Interaction


async def keyword_search(
    session: AsyncSession,
    interaction: Interaction,
    raw_prompt: str,
    document_id: int | None,
) -> Sequence[DocumentChunk]:
    query_keyword = (
        select(DocumentChunk)
        .join(Document)
        .where(Document.interaction_id == interaction.id)
        .order_by(col(DocumentChunk.content_original).op("<->")(raw_prompt))
        .limit(settings.DEFAULT_N_CHUNKS_RETRIEVED * 2)
    )

    if document_id:
        query_keyword = query_keyword.where(Document.id == document_id)

    keyword_chunks = (await session.execute(query_keyword)).scalars().all()

    return keyword_chunks
