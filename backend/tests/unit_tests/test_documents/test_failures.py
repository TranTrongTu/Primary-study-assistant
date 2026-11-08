from pathlib import Path

import pytest
from httpx import AsyncClient

from backend.src.exceptions.core import ExceptionResponse, ExceptionType
from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.models_schema.user.user import User
from backend.tests.utils.validators import (
    validate_model,
    validate_response_contents,
    validate_status_code,
)


@pytest.mark.parametrize(
    "filename, query_parameters",
    [
        ("test_file_pdf.pdf", ""),
        ("test_file_pdf.pdf", "?subject_type=MATHS&subject_type_overwrite=true"),
        ("test_file_wrong.xlsx", "?subject_type_overwrite=false"),
    ],
)
async def test_create_document(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
    filename: str,
    query_parameters: str,
) -> None:
    """
    Fails to upload a document by not specifying overwrite mode.
    Fails to upload a document by setting overwrite to true while subject type is not null.
    Fails to upload a document with invalid format.
    """

    filepath = Path(__file__).resolve().parent.parent.parent / "test_data" / filename

    with open(filepath, "rb") as f:
        response = await client.post(
            f"/api/document/{create_interaction_test.id}/upload{query_parameters}",
            files={"file": ("test_file.pdf", f, "application/pdf")},
        )

        validate_status_code(response, 400)
        validate_model(response, ExceptionResponse)
        validate_response_contents(
            response, {"exception_type": ExceptionType.REQUEST_VALIDATION}
        )
