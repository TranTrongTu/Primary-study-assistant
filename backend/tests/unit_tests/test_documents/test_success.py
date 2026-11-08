from pathlib import Path
from types import CoroutineType
from typing import Any, Callable
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.ai_api import GlobalAPI
from backend.src.core.config import settings
from backend.src.models_schema.document.document import (
    Document,
    DocumentOutput,
    DocumentUpdate,
)
from backend.src.models_schema.document.document_analysis import (
    DocumentAnalysisOutput,
    DocumentAnalysisSchema,
    MaterialRecommendationSchema,
    QuestionRecommendationSchema,
)
from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.models_schema.miscellaneous.enums import (
    DocumentType,
    StudyActivityFormat,
    SubjectType,
)
from backend.src.models_schema.user.user import User
from backend.tests.utils.validators import (
    validate_model,
    validate_object_contents,
    validate_response_contents,
    validate_status_code,
)


@pytest.mark.parametrize(
    "filename, subject_type, document_type, MIME_type",
    [
        ("test_file_pdf.pdf", SubjectType.MATHS, DocumentType.PDF, "application/pdf"),
        ("test_file_txt.txt", SubjectType.VIETNAMESE, DocumentType.TEXT, "text/plain"),
        ("test_file_image.webp", SubjectType.ENGLISH, DocumentType.IMAGE, "image/webp"),
    ],
)
@patch.object(GlobalAPI, "generate_document_analysis")
@patch.object(GlobalAPI, "mass_embed")
@patch.object(GlobalAPI, "caption_image")
async def test_create_document(
    mock_GlobalAPI_caption_image: AsyncMock,
    mock_GlobalAPI_mass_embed: AsyncMock,
    mock_GlobalAPI_generate_document_analysis: AsyncMock,
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
    filename: str,
    subject_type: SubjectType,
    document_type: DocumentType,
    MIME_type: str,
) -> None:
    """
    Uploads a document.
    """

    # Mock embedding
    mock_GlobalAPI_mass_embed.return_value = [
        [0.1] * settings.DEFAULT_EMBED_DIMENSIONALITY_CLOUDFLARE,
    ]

    # Mock document analysis
    mock_summary = "Mock document analysis."
    mock_material = MaterialRecommendationSchema(
        prompt="Mock material generation prompt.",
        activity_format=StudyActivityFormat.MULTIPLE_CHOICE_QUESTIONS,
        subject_type=subject_type,
    )
    mock_question = QuestionRecommendationSchema(prompt="Mock question prompt.")
    mock_analysis = DocumentAnalysisSchema(
        summary=mock_summary,
        subject_type=subject_type,
        subject_type_overwrite=True,
        material_recommendations=[mock_material],
        question_recommendations=[mock_question],
    )
    mock_GlobalAPI_generate_document_analysis.return_value = (
        mock_analysis.model_dump_json()
    )

    # Mock image captaining
    mock_GlobalAPI_caption_image.return_value = "Mock image captioning"

    filepath = Path(__file__).resolve().parent.parent.parent / "test_data" / filename

    with open(filepath, "rb") as f:
        response = await client.post(
            f"/api/document/{create_interaction_test.id}/upload?subject_type_overwrite=true",
            files={"file": (filename, f, MIME_type)},
        )

    validate_status_code(response, 200)
    validate_model(response, tuple[DocumentOutput, DocumentAnalysisOutput])
    validate_response_contents(
        response,
        [
            {
                "name": filename,
                "subject_type": subject_type,
                "type": document_type.value,
            },
            mock_analysis.model_dump(
                exclude={"subject_type", "subject_type_overwrite"}
            ),
        ],
    )


async def test_read_all_documents(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
    create_document_custom: Callable[
        [Interaction, str], CoroutineType[Any, Any, Document]
    ],
):
    """
    Reads all documents.
    """
    await create_document_custom(create_interaction_test, "test1")
    await create_document_custom(create_interaction_test, "test2")

    response = await client.get(
        f"/api/document/{create_interaction_test.id}/",
    )

    validate_status_code(response, 200)
    validate_model(response, list[DocumentOutput])
    validate_response_contents(
        response,
        [
            {"name": "test1-document"},
            {"name": "test2-document"},
        ],
    )


async def test_read_document_complete(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
    create_document_test: Document,
):
    """
    Reads all documents.
    """
    response = await client.get(
        f"/api/document/{create_interaction_test.id}/{create_document_test.id}",
    )

    validate_status_code(response, 200)
    validate_model(response, tuple[DocumentOutput, DocumentAnalysisOutput | None])
    validate_response_contents(
        response,
        [
            {"name": "test-document"},
            {"summary": "test-summary"},
        ],
    )


async def test_update_document(
    session: AsyncSession,
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
    create_document_test: Document,
):
    """
    Updates a document.
    """
    document_update = DocumentUpdate(
        name="updated",
        subject_type=SubjectType.VIETNAMESE,
    )

    response = await client.patch(
        f"/api/document/{create_document_test.id}",
        json=document_update.model_dump(exclude_unset=True),
    )

    validate_status_code(response, 200)
    validate_model(response, DocumentOutput)
    validate_response_contents(response, document_update.model_dump(exclude_unset=True))

    await session.refresh(create_document_test)

    validate_object_contents(
        create_document_test, document_update.model_dump(exclude_unset=True)
    )


async def test_delete_document(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
    create_document_test: Document,
):
    """
    Deletes a document.
    """

    response1 = await client.delete(f"/api/document/{create_document_test.id}")
    validate_status_code(response1, 204)

    response2 = await client.delete(f"/api/document/{create_document_test.id}")
    validate_status_code(response2, 404)
