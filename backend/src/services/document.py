from datetime import datetime

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import col, delete, select

from backend.src.exceptions.core import (
    ExceptionNotFound_404,
    ExceptionRequestValidation_400,
)
from backend.src.models_schema.document.document import (
    Document,
    DocumentInput,
    DocumentUpdate,
)
from backend.src.models_schema.document.document_analysis import DocumentAnalysis
from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.models_schema.miscellaneous.enums import DocumentType
from backend.src.models_schema.user.user import User
from backend.src.RAG.chunking.base import DocumentExtractor
from backend.src.RAG.chunking.image import ImageExtractor
from backend.src.RAG.chunking.PDF import PdfExtractor
from backend.src.RAG.chunking.text import TextExtractor

# ----- CREATE ----- #


async def save_document(
    user: User,
    session: AsyncSession,
    current_datetime: datetime,
    file: UploadFile,
    interaction: Interaction,
    document_input: DocumentInput,
) -> tuple[Document, DocumentAnalysis | None]:

    # Verifies document type and picks extractor
    EXTRACTORS: dict[DocumentType, type[DocumentExtractor]] = {
        DocumentType.PDF: PdfExtractor,
        DocumentType.IMAGE: ImageExtractor,
        DocumentType.TEXT: TextExtractor,
    }

    selected_type = None
    selected_extractor = None

    for doc_type, extractor in EXTRACTORS.items():
        if extractor.verify(file):
            selected_type = doc_type
            selected_extractor = extractor
            break

    if selected_type is None or selected_extractor is None:
        raise ExceptionRequestValidation_400(
            "Invalid file format.\nAllowed formats are:\n- PDF\n- JPEG, PNGM, WEBP\n- Text files\nPlease recheck file extension and file contents."
        )

    # Name check
    if document_input.name is None:
        name = file.filename if file.filename else ""
    else:
        name = document_input.name

    # Page start check
    page_starts_at = document_input.page_starts_at
    if selected_type not in (DocumentType.PDF):
        page_starts_at = 0

    # Saves document
    document = Document(
        name=name,
        interaction=interaction,
        page_starts_at=page_starts_at,
        type=selected_type,
        subject_type=document_input.subject_type,
        text=None,  # Will get updated in extract function
        created_at=current_datetime,
    )

    session.add(document)

    # Saves document contents
    document_analysis = await selected_extractor.extract(
        user=user,
        session=session,
        file=file,
        document=document,
        subject_type_overwrite=document_input.subject_type_overwrite,
    )

    await session.commit()
    # await session.refresh(document)

    return document, document_analysis


# ----- READ ----- #


async def read_all_documents(
    session: AsyncSession, interaction: Interaction
) -> list[Document]:
    query = select(Document).where(Document.interaction_id == interaction.id)
    documents = (await session.execute(query)).scalars().all()

    return list(documents)


async def read_document_complete(
    session: AsyncSession, interaction: Interaction, document_id: int
) -> tuple[Document, DocumentAnalysis | None]:
    query = query = (
        select(Document)
        .where(
            Document.interaction_id == interaction.id,
            Document.id == document_id,
        )
        .options(
            selectinload(Document.document_analysis).selectinload(  # type: ignore
                DocumentAnalysis.material_recommendations  # type: ignore
            )
        )  # type: ignore
        .options(
            selectinload(Document.document_analysis).selectinload(  # type: ignore
                DocumentAnalysis.question_recommendations  # type: ignore
            )
        )
    )
    document = (await session.execute(query)).scalars().first()

    if document is None:
        raise ExceptionNotFound_404(
            "Document",
            {
                "id": document_id,
                "interaction_id": interaction.id,
            },
        )

    return document, document.document_analysis


# ----- UPDATE ----- #


async def update_document(
    user: User,
    session: AsyncSession,
    document_id: int,
    document_update: DocumentUpdate,
) -> Document:

    query = (
        select(Document)
        .join(Interaction)
        .where(
            Document.id == document_id,
            Interaction.user_id == user.id,
        )
    )
    document = (await session.execute(query)).scalars().first()

    if document is None:
        raise ExceptionNotFound_404(
            "Document",
            {
                "id": document_id,
                "interaction.user_id": user.id,
            },
        )

    # Update logic
    update_data = document_update.model_dump(exclude_unset=True)

    if document.type == DocumentType.IMAGE:
        update_data["page_starts_at"] = 0

    document.sqlmodel_update(update_data)

    await session.commit()
    # await session.refresh(document)

    return document


# ----- DELETE ----- #


async def delete_document(
    user: User,
    session: AsyncSession,
    document_id: int,
) -> None:
    subquery_interaction = select(Interaction.id).where(Interaction.user_id == user.id)

    query = delete(Document).where(
        col(Document.id) == document_id,
        col(Document.interaction_id).in_(subquery_interaction),
    )
    result = await session.execute(query)

    if result.rowcount == 0:  # type: ignore
        raise ExceptionNotFound_404(
            "Document",
            {
                "id": document_id,
                "interaction.user_id": user.id,
            },
        )

    await session.commit()
