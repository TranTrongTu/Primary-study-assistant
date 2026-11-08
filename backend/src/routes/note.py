from fastapi import APIRouter, status

from backend.src.core.dependencies import (
    DatetimeDep,
    InteractionDep,
    SessionDep,
    UserDep,
)
from backend.src.exceptions.core import Responses
from backend.src.models_schema.note.note import NoteInput, NoteOutput, NoteUpdate
from backend.src.services import note as note_service

router = APIRouter()


# ----- CREATE ----- #


@router.post(
    "/{interaction_id}/upload",
    response_model=NoteOutput,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def create_note(
    user: UserDep,
    session: SessionDep,
    current_datetime: DatetimeDep,
    interaction: InteractionDep,
    note_input: NoteInput,
):
    """
    Creates a note. Notes belong to an interaction.
    """
    note_output = await note_service.create_note(
        session=session,
        current_datetime=current_datetime,
        interaction=interaction,
        note_input=note_input,
    )
    return note_output


# ----- READ ----- #


@router.get(
    "/{interaction_id}/",
    response_model=list[NoteOutput],
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def read_all_notes(
    user: UserDep,
    session: SessionDep,
    interaction: InteractionDep,
):
    """
    Reads all notes related to an interaction.
    """
    notes_output = await note_service.read_all_notes(session, interaction)
    return notes_output


# ----- UPDATE ----- #


@router.patch(
    "/{note_id}",
    response_model=NoteOutput,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def update_note(
    user: UserDep,
    session: SessionDep,
    note_id: int,
    note_update: NoteUpdate,
):
    """
    Updates a note.
    """
    note_output = await note_service.update_note(user, session, note_id, note_update)
    return note_output


# ----- DELETE ----- #


@router.delete(
    "/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def delete_note(
    user: UserDep,
    session: SessionDep,
    note_id: int,
):
    """
    Deletes a note.
    """
    await note_service.delete_note(user, session, note_id)
