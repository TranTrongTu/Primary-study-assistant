from typing import Sequence

from backend.src.core.config import settings
from backend.src.models_schema.document.document_chunk import DocumentChunk


def RRF(
    vector_chunks: Sequence[DocumentChunk],
    keyword_chunks: Sequence[DocumentChunk],
) -> list[DocumentChunk]:
    """
    Selects a few best chunks from the vector search and keyword search chunks.
    """
    fused_scores: dict[int, float] = {}
    chunk_map: dict[int, DocumentChunk] = {}
    k = 60

    # Score vector chunks
    for rank, chunk in enumerate(vector_chunks):
        assert chunk.id is not None
        chunk_map[chunk.id] = chunk
        fused_scores[chunk.id] = 1.0 / (rank + 1 + k)

    # Score keyword chunks
    for rank, chunk in enumerate(keyword_chunks):
        assert chunk.id is not None
        if chunk.id not in chunk_map:
            chunk_map[chunk.id] = chunk
            fused_scores[chunk.id] = 0.0
        fused_scores[chunk.id] += 1.0 / (rank + 1 + k)

    sorted_chunk_ids = sorted(fused_scores, key=lambda k: fused_scores[k], reverse=True)
    top_chunk_ids = sorted_chunk_ids[: settings.DEFAULT_N_CHUNKS_RETRIEVED]

    core_chunks = [chunk_map[i] for i in top_chunk_ids]

    return core_chunks
