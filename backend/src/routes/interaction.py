from fastapi import APIRouter, status

from backend.src.core.dependencies import (
    DatetimeDep,
    InteractionDep,
    SessionDep,
    UserDep,
)
from backend.src.exceptions.core import Responses
from backend.src.models_schema.interaction.interaction import (
    InteractionInput,
    InteractionOutput,
    InteractionUpdate,
)
from backend.src.services import interaction as interaction_service

router = APIRouter()

# ----- CREATE ----- #


@router.post(
    "/create",
    response_model=InteractionOutput,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
    },
)
async def create_interaction(
    user: UserDep,
    session: SessionDep,
    current_datetime: DatetimeDep,
    interaction_input: InteractionInput,
):
    """
    Creates an interaction.
    """
    interaction_output = await interaction_service.create_interaction(
        user=user,
        session=session,
        current_datetime=current_datetime,
        interaction_input=interaction_input,
    )
    return interaction_output


# ----- READ ----- #


@router.get(
    "/",
    response_model=list[InteractionOutput],
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
    },
)
async def read_all_interactions(user: UserDep, session: SessionDep):
    """
    Gets all interactions of the current user.
    """
    interaction_output = await interaction_service.read_all_interactions(
        user=user,
        session=session,
    )
    return interaction_output


# ----- UPDATE ----- #


@router.patch(
    "/{interaction_id}",
    response_model=InteractionOutput,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def update_interaction(
    user: UserDep,
    session: SessionDep,
    interaction: InteractionDep,
    interaction_update: InteractionUpdate,
):
    """
    Updates an interaction's information.
    """
    interaction_output = await interaction_service.update_interaction(
        user=user,
        session=session,
        interaction=interaction,
        interaction_update=interaction_update,
    )
    return interaction_output


# ----- DELETE ----- #


@router.delete(
    "/{interaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def delete_interaction(user: UserDep, session: SessionDep, interaction_id: int):
    """
    Deletes an interaction, along with all of its associated information like uploaded documents, notes, history,...
    """
    await interaction_service.delete_interaction(user, session, interaction_id)
