from typing import Iterable

from backend.src.models_schema.document.document_chunk import DocumentChunk
from backend.src.models_schema.miscellaneous.enums import DocumentType


def stitch(
    chunks: list[DocumentChunk], stitched_contents: list[tuple[DocumentChunk, int, str]]
) -> None:
    """
    Stitches all chunks in ONE document, watching for gaps.
    """
    # Set up current stitched content container (current_doc_text)
    head_chunk = chunks[0]
    is_pdf = head_chunk.document.type.value == "PDF"
    current_doc_text = []

    if is_pdf:
        start_page = (
            head_chunk.document_page_num + head_chunk.document.page_starts_at  # type: ignore
        )
        current_doc_text.append(f"[--- Page {start_page} ---]\n\n")  # type: ignore
    current_doc_text.append(head_chunk.content_original)

    # Loops over chunks, watching out for gaps
    for j in range(1, len(chunks)):
        # If gap, finalize and append
        if chunks[j].document_chunk_index != chunks[j - 1].document_chunk_index + 1:  # type: ignore
            block_content = "".join(current_doc_text)
            end_page = (
                chunks[j - 1].document_page_num + head_chunk.document.page_starts_at  # type: ignore
                if head_chunk.document.type.value == "PDF"
                else 0
            )
            stitched_contents.append((head_chunk, end_page, block_content))

            head_chunk = chunks[j]
            current_doc_text = []

            if is_pdf:
                start_page = (
                    head_chunk.document_page_num  # type: ignore
                    + head_chunk.document.page_starts_at
                )
                current_doc_text.append(f"[--- Page {start_page} ---]\n\n")

        # If no gap, but we just crossed a page
        elif is_pdf and chunks[j].document_page_num != chunks[j - 1].document_page_num:
            new_page = (
                chunks[j].document_page_num + head_chunk.document.page_starts_at  # type: ignore
            )
            current_doc_text.append(f"\n\n[--- Page {new_page} ---]\n\n")

        current_doc_text.append(chunks[j].content_original)

    # Final save
    block_content = "".join(current_doc_text)
    end_page = (
        chunks[-1].document_page_num + head_chunk.document.page_starts_at  # type: ignore
        if head_chunk.document.type.value == "PDF"
        else 0
    )
    stitched_contents.append((head_chunk, end_page, block_content))


def chunks_stitcher(
    document_chunks: Iterable[DocumentChunk],
) -> list[tuple[DocumentChunk, int, str]]:
    """
    Receives an ordered list of document chunks, stitch them together.
    Returns a list of content blocks containing: The header chunk, the page end number (offset considered), the stitched together contents.
    """
    stitched_contents: list[tuple[DocumentChunk, int, str]] = []

    grouped_docs: dict[int, list[DocumentChunk]] = dict()  # Groups non-image chunks
    for chunk in document_chunks:
        # Document is image
        if chunk.document.type == DocumentType.IMAGE:
            stitched_contents.append((chunk, 0, chunk.content_original))

        # Document is not image
        else:
            grouped_docs.setdefault(chunk.document.id, []).append(chunk)  # type: ignore

    # Stitch adjacent chunks in a document, watches for gaps
    for chunks in grouped_docs.values():
        stitch(chunks, stitched_contents)

    return stitched_contents
