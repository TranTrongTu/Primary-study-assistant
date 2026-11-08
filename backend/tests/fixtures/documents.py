from datetime import datetime, timezone
from types import CoroutineType
from typing import Any, Callable

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from backend.src.models_schema.document.document import Document
from backend.src.models_schema.document.document_analysis import (
    DocumentAnalysis,
    MaterialRecommendation,
    QuestionRecommendation,
)
from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.models_schema.miscellaneous.enums import (
    DocumentType,
    StudyActivityFormat,
    SubjectType,
)


@pytest.fixture(name="create_document_custom")
async def create_document_custom_fixture(
    session: AsyncSession,
) -> Callable[[Interaction, str], CoroutineType[Any, Any, Document]]:
    """
    Returns a function that creates a document attached to an interaction.
    """

    async def create_document_custom(
        interaction: Interaction, document_name: str
    ) -> Document:
        material_recommendation = MaterialRecommendation(
            prompt=f"{document_name}-material_recommendation",
            activity_format=StudyActivityFormat.MULTIPLE_CHOICE_QUESTIONS,
            subject_type=SubjectType.MATHS,
        )
        question_recommendation = QuestionRecommendation(
            prompt=f"{document_name}-question_recommendation",
        )
        document_analysis = DocumentAnalysis(
            summary=f"{document_name}-summary",
            question_recommendations=[question_recommendation],
            material_recommendations=[material_recommendation],
        )

        document = Document(
            name=f"{document_name}-document",
            subject_type=SubjectType.MATHS,
            type=DocumentType.PDF,
            text=f"{document_name}-text",
            interaction=interaction,
            document_analysis=document_analysis,
            created_at=datetime.now(timezone.utc),
        )

        session.add(document)
        await session.commit()

        return document

    return create_document_custom


@pytest.fixture(name="create_document_test")
async def create_document_test_fixture(
    session: AsyncSession,
    create_document_custom: Callable[
        [Interaction, str], CoroutineType[Any, Any, Document]
    ],
) -> Document:
    """
    Automatically creates a document with the name "test-document", attached to the interaction "test-interaction".
    """

    interaction = (
        (
            await session.execute(
                select(Interaction).where(Interaction.name == "test-interaction")
            )
        )
        .scalars()
        .first()
    )
    assert interaction is not None

    document = await create_document_custom(interaction, "test")
    return document
