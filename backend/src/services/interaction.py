from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, delete, select, update

from backend.src.exceptions.core import ExceptionNotFound_404
from backend.src.models_schema.activity.exercise_item import ExerciseItem
from backend.src.models_schema.activity.review_item import ReviewItem
from backend.src.models_schema.activity.study_activity import StudyActivity
from backend.src.models_schema.document.document import Document
from backend.src.models_schema.interaction.interaction import (
    Interaction,
    InteractionInput,
    InteractionUpdate,
)
from backend.src.models_schema.llm_response.llm_response import LLMResponse
from backend.src.models_schema.note.note import Note
from backend.src.models_schema.user.user import User
from backend.src.services.study_activity import ExerciseItemContent, ReviewItemContent

# ----- CREATE ----- #


async def create_interaction(
    user: User,
    session: AsyncSession,
    current_datetime: datetime,
    interaction_input: InteractionInput,
) -> Interaction:
    interaction = Interaction(
        name=interaction_input.name,
        description=interaction_input.description,
        created_at=current_datetime,
        user=user,
    )

    session.add(interaction)
    await session.commit()
    # await session.refresh(interaction)

    return interaction


# ----- READ ----- #


async def read_all_interactions(user: User, session: AsyncSession) -> list[Interaction]:
    query = select(Interaction).where(
        Interaction.user_id == user.id, Interaction.is_deleted == False
    )
    interactions = (await session.execute(query)).scalars().all()

    return list(interactions)


# ----- UPDATE ----- #


async def update_interaction(
    user: User,
    session: AsyncSession,
    interaction: Interaction,
    interaction_update: InteractionUpdate,
) -> Interaction:
    # Update logic
    update_data = interaction_update.model_dump(exclude_unset=True)
    interaction.sqlmodel_update(update_data)

    await session.commit()
    # await session.refresh(interaction)

    return interaction


# ----- DELETE ----- #


async def soft_delete_study_activities(session: AsyncSession, interaction_id: int):
    query = (
        update(StudyActivity)
        .where(col(StudyActivity.interaction_id) == interaction_id)
        .values(is_deleted=True)
    )
    await session.execute(query)


async def soft_delete_items(session: AsyncSession, interaction_id: int):
    subquery_activity = select(StudyActivity.id).where(
        StudyActivity.interaction_id == interaction_id
    )

    query_exercise = (
        update(ExerciseItem)
        .where(col(ExerciseItem.study_activity_id).in_(subquery_activity))
        .values(is_deleted=True)
    )

    query_review = (
        update(ReviewItem)
        .where(col(ReviewItem.study_activity_id).in_(subquery_activity))
        .values(is_deleted=True)
    )

    await session.execute(query_exercise)
    await session.execute(query_review)


async def hard_delete_documents(session: AsyncSession, interaction_id: int):
    query = delete(Document).where(col(Document.interaction_id) == interaction_id)
    await session.execute(query)


async def hard_delete_llm_responses(session: AsyncSession, interaction_id: int):
    query = delete(LLMResponse).where(col(LLMResponse.interaction_id) == interaction_id)
    await session.execute(query)


async def hard_delete_notes(session: AsyncSession, interaction_id: int):
    query = delete(Note).where(col(Note.interaction_id) == interaction_id)
    await session.execute(query)


async def delete_interaction(
    user: User, session: AsyncSession, interaction_id: int
) -> None:

    # Fetches interaction
    query = select(Interaction).where(
        Interaction.user_id == user.id,
        Interaction.id == interaction_id,
        Interaction.is_deleted == False,
    )
    interaction = (await session.execute(query)).scalars().first()

    if interaction is None:
        raise ExceptionNotFound_404(
            "Interaction",
            {
                "user_id": user.id,
                "id": interaction_id,
                "is_deleted": False,
            },
        )

    # Soft deletes study activities
    await soft_delete_study_activities(session, interaction_id)

    # Soft deletes the associated items
    await soft_delete_items(session, interaction_id)

    # Hard deletes the other things
    await hard_delete_documents(session, interaction_id)
    await hard_delete_llm_responses(session, interaction_id)
    await hard_delete_notes(session, interaction_id)

    # Soft deletes the interaction
    interaction.is_deleted = True

    await session.commit()
