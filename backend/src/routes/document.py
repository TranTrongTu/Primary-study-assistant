from typing import Annotated

from fastapi import APIRouter, Query, UploadFile, status

from backend.src.core.dependencies import (
    DatetimeDep,
    InteractionDep,
    SessionDep,
    UserDep,
)
from backend.src.exceptions.core import Responses
from backend.src.models_schema.document.document import (
    DocumentInput,
    DocumentOutput,
    DocumentUpdate,
)
from backend.src.models_schema.document.document_analysis import DocumentAnalysisOutput
from backend.src.services import document as document_service

router = APIRouter()


# ----- CREATE ----- #


@router.post(
    "/{interaction_id}/upload",
    response_model=tuple[DocumentOutput, DocumentAnalysisOutput | None],
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
        502: Responses.RESPONSE_502_BAD_GATEWAY,
        503: Responses.RESPONSE_503_SERVICE_UNAVAILABLE,
    },
)
async def save_document(
    user: UserDep,
    session: SessionDep,
    current_datetime: DatetimeDep,
    file: UploadFile,
    document_input: Annotated[DocumentInput, Query()],
    interaction: InteractionDep,
):
    """
    Embeds and saves a user-uploaded document_service to the database. Documents belong to an interaction.
    """
    document_output, document_analysis = await document_service.save_document(
        user=user,
        session=session,
        current_datetime=current_datetime,
        file=file,
        interaction=interaction,
        document_input=document_input,
    )

    return document_output, document_analysis


# ----- READ ----- #


@router.get(
    "/{interaction_id}/",
    response_model=list[DocumentOutput],
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def read_all_documents(
    user: UserDep,
    session: SessionDep,
    interaction: InteractionDep,
):
    """
    Reads all documents in an interaction.
    """
    documents_output = await document_service.read_all_documents(
        session=session,
        interaction=interaction,
    )
    return documents_output


@router.get(
    "/{interaction_id}/{document_id}",
    response_model=tuple[DocumentOutput, DocumentAnalysisOutput | None],
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def read_document_complete(
    user: UserDep,
    session: SessionDep,
    interaction: InteractionDep,
    document_id: int,
):
    """
    Reads a document_service, together with the document_service analysis performed by the LLM.
    """
    result = await document_service.read_document_complete(
        session=session,
        interaction=interaction,
        document_id=document_id,
    )
    return result


# ----- UPDATE ----- #


@router.patch(
    "/{document_id}",
    response_model=DocumentOutput,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def update_document(
    user: UserDep,
    session: SessionDep,
    document_id: int,
    document_update: DocumentUpdate,
):
    """
    Updates a document_service's information. Document's contents cannot be updated.
    """
    document_output = await document_service.update_document(
        user=user,
        session=session,
        document_id=document_id,
        document_update=document_update,
    )
    return document_output


# ----- DELETE ----- #


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def delete_document(
    user: UserDep,
    session: SessionDep,
    document_id: int,
):
    """
    Deletes a document_service from an interaction.
    """
    await document_service.delete_document(
        user=user,
        session=session,
        document_id=document_id,
    )
