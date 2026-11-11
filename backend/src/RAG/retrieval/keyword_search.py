from typing import Sequence

from sqlalchemy import func, literal
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
    # Two choices here were measured with scripts/rag_eval.py (see evals/retrieval):
    #
    # - `<<<->` (strict word similarity) scores the part of the chunk that best matches
    #   the question. Plain `<->` compares the question with the whole 500-character
    #   chunk, so a short question scores low against every chunk and ranks poorly.
    # - unaccent() on both sides, because pupils often type without tone marks
    #   ("phan so la gi"), which shares almost no trigram with "phân số là gì".
    distance = func.unaccent(literal(raw_prompt)).op("<<<->")(
        func.unaccent(col(DocumentChunk.content_original))
    )

    query_keyword = (
        select(DocumentChunk)
        .join(Document)
        .where(Document.interaction_id == interaction.id)
        .order_by(distance)
        .limit(settings.DEFAULT_N_CHUNKS_RETRIEVED * 2)
    )

    if document_id:
        query_keyword = query_keyword.where(Document.id == document_id)

    keyword_chunks = (await session.execute(query_keyword)).scalars().all()

    return keyword_chunks
