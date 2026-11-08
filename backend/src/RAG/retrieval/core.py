import asyncio
from typing import Iterable

from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models_schema.document.document_chunk import DocumentChunk
from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.RAG.retrieval.keyword_search import keyword_search
from backend.src.RAG.retrieval.neighbouring_chunks import neighbouring_chunks
from backend.src.RAG.retrieval.RRF import RRF
from backend.src.RAG.retrieval.vector_search import vector_search


async def retrieval(
    session: AsyncSession,
    interaction: Interaction,
    raw_prompt: str,
    embedded_prompt: list[float],
    document_id: int | None,
) -> Iterable[DocumentChunk]:
    """
    Retrieves relevant core chunks AND their surrounding chunks
    """

    # Hybrid search
    vector_chunks = await vector_search(
        session, interaction, embedded_prompt, document_id
    )
    keyword_chunks = await keyword_search(session, interaction, raw_prompt, document_id)

    # Merge
    core_chunks = RRF(vector_chunks, keyword_chunks)

    # Get adjacent chunks
    final_chunks = await neighbouring_chunks(session, core_chunks)

    return final_chunks
