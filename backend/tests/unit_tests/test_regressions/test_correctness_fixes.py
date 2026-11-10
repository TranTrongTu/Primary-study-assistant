"""
Regression tests for two correctness bugs:

- add_flashcards returned flashcards that had already been soft-deleted.
- Past conversations were put into the LLM prompt newest-first, so the model read
  the dialogue backwards.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models_schema.activity.review_item import FlashcardInput
from backend.src.models_schema.activity.study_activity import FlashcardsActivityInput
from backend.src.models_schema.interaction.interaction import InteractionInput
from backend.src.models_schema.llm_response.llm_response import LLMResponse
from backend.src.models_schema.miscellaneous.enums import SubjectType
from backend.src.RAG.augmentation.formatters.conversations.core import (
    conversations_formatter,
)
from backend.src.services.interaction import create_interaction
from backend.src.services.study_activity import (
    add_flashcards,
    create_flashcards_activity,
    delete_flashcard,
)

# ----- add_flashcards must not return soft-deleted flashcards ----- #


async def test_add_flashcards_excludes_soft_deleted_flashcards(
    session: AsyncSession,
    register_user_custom,
):
    user = await register_user_custom("flashcard-owner")
    now = datetime.now(timezone.utc)

    interaction = await create_interaction(
        user=user,
        session=session,
        current_datetime=now,
        interaction_input=InteractionInput(name="Cards", description="d"),
    )
    activity = await create_flashcards_activity(
        session=session,
        interaction=interaction,
        current_datetime=now,
        flashcards_activity_input=FlashcardsActivityInput(
            subject_type=SubjectType.ENGLISH, name="Deck", description="d"
        ),
    )

    first = await add_flashcards(
        user=user,
        session=session,
        flashcard_inputs=[
            FlashcardInput(front="keep-front", back="keep-back"),
            FlashcardInput(front="drop-front", back="drop-back"),
        ],
        flashcards_activity_id=activity.id,
    )
    assert len(first.review_items) == 2

    dropped = next(
        item
        for item in first.review_items
        if any(c.content == "drop-front" for c in item.contents)
    )
    await delete_flashcard(user=user, session=session, flashcard_id=dropped.id)

    # A later request gets a fresh session and loads the collection from the
    # database. Expire the cached collection to mimic that, otherwise the
    # identity map would hand back the stale in-memory list.
    session.expire(first, ["review_items"])

    second = await add_flashcards(
        user=user,
        session=session,
        flashcard_inputs=[FlashcardInput(front="new-front", back="new-back")],
        flashcards_activity_id=activity.id,
    )

    fronts = {
        c.content
        for item in second.review_items
        for c in item.contents
        if c.content.endswith("-front")
    }
    assert "drop-front" not in fronts
    assert fronts == {"keep-front", "new-front"}


# ----- conversation history must reach the LLM oldest-first ----- #


def test_conversations_formatter_is_chronological():
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    oldest = LLMResponse(
        prompt="first question",
        answer="first answer",
        interaction_id=1,
        created_at=base,
    )
    newest = LLMResponse(
        prompt="second question",
        answer="second answer",
        interaction_id=1,
        created_at=base + timedelta(minutes=5),
    )

    # read_llm_responses returns the newest conversation first
    formatted = conversations_formatter([newest, oldest])

    assert formatted.index("first question") < formatted.index("second question")
    # The numbering also follows the order the conversations happened in
    assert formatted.index("Conversation #1") < formatted.index("first question")
    assert formatted.index("first question") < formatted.index("Conversation #2")
    assert formatted.index("Conversation #2") < formatted.index("second question")
