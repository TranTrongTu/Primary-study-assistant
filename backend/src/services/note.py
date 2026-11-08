from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, delete, select

from backend.src.exceptions.core import ExceptionNotFound_404
from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.models_schema.note.note import Note, NoteInput, NoteUpdate
from backend.src.models_schema.user.user import User

# ----- CREATE ----- #


async def create_note(
    session: AsyncSession,
    current_datetime: datetime,
    interaction: Interaction,
    note_input: NoteInput,
) -> Note:
    note = Note(
        name=note_input.name,
        description=note_input.description,
        content=note_input.content,
        interaction=interaction,
        created_at=current_datetime,
    )

    session.add(note)
    await session.commit()
    # await session.refresh(note)

    return note


# ----- READ ----- #


async def read_all_notes(session: AsyncSession, interaction: Interaction) -> list[Note]:
    query = select(Note).where(Note.interaction_id == interaction.id)
    notes = (await session.execute(query)).scalars().all()

    return list(notes)


# ----- UPDATE ----- #


async def update_note(
    user: User,
    session: AsyncSession,
    note_id: int,
    note_update: NoteUpdate,
) -> Note:

    query = (
        select(Note)
        .join(Interaction)
        .where(
            Note.id == note_id,
            Interaction.user_id == user.id,
        )
    )
    note = (await session.execute(query)).scalars().first()

    if note is None:
        raise ExceptionNotFound_404(
            "Note",
            {
                "id": note_id,
                "note.user_id": user.id,
            },
        )

    # Update logic
    update_data = note_update.model_dump(exclude_unset=True)
    note.sqlmodel_update(update_data)

    await session.commit()
    # await session.refresh(note)

    return note


# ----- DELETE ----- #


async def delete_note(
    user: User,
    session: AsyncSession,
    note_id: int,
) -> None:
    subquery_interaction = select(Interaction.id).where(Interaction.user_id == user.id)

    query = delete(Note).where(
        col(Note.id) == note_id, col(Note.interaction_id).in_(subquery_interaction)
    )
    result = await session.execute(query)

    if result.rowcount == 0:  # type: ignore
        raise ExceptionNotFound_404(
            "Note",
            {
                "id": note_id,
                "interaction.user_id": user.id,
            },
        )

    await session.commit()
