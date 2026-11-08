from typing import Annotated

from fastapi import APIRouter, Query

from backend.src.core.dependencies import (
    DatetimeDep,
    InteractionDep,
    SessionDep,
    UserDep,
)
from backend.src.exceptions.core import Responses
from backend.src.models_schema.llm_response.llm_response import (
    LLMResponseInput,
    LLMResponseOutput,
)
from backend.src.services import llm_response as llm_response_service

router = APIRouter()


# ----- CREATE ----- #


@router.post(
    "/{interaction_id}/chat",
    response_model=LLMResponseOutput,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        503: Responses.RESPONSE_503_SERVICE_UNAVAILABLE,
    },
)
async def create_llm_response(
    user: UserDep,
    session: SessionDep,
    current_datetime: DatetimeDep,
    interaction: InteractionDep,
    llm_response_input: LLMResponseInput,
):
    """
    Receives a user prompt and returns the model's answer. Conversations (prompts and answers) belong to an interaction.
    """
    llm_response_output = await llm_response_service.create_llm_response(
        user=user,
        session=session,
        current_datetime=current_datetime,
        llm_response_input=llm_response_input,
        interaction=interaction,
    )

    return llm_response_output


# ----- READ ----- #


@router.get(
    "/{interaction_id}/",
    response_model=list[LLMResponseOutput],
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
    },
)
async def read_llm_responses(
    user: UserDep,
    session: SessionDep,
    interaction: InteractionDep,
    limit: Annotated[int | None, Query(gt=0)] = None,
):
    """
    Reads past conversations in an interaction.
    """
    llm_responses_output = await llm_response_service.read_llm_responses(
        session=session,
        interaction=interaction,
        limit=limit,
    )
    return llm_responses_output
