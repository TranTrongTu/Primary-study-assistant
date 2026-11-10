"""
Regression tests for two correctness bugs:

- add_flashcards returned flashcards that had already been soft-deleted.
- Past conversations were put into the LLM prompt newest-first, so the model read
  the dialogue backwards. The order is fixed where the history is read
  (read_conversation_history), not in the formatter.
"""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.ai_api import GlobalAPI
from backend.src.models_schema.activity.review_item import FlashcardInput
from backend.src.models_schema.activity.study_activity import FlashcardsActivityInput
from backend.src.models_schema.interaction.interaction import InteractionInput
from backend.src.models_schema.llm_response.llm_response import (
    LLMResponse,
    LLMResponseInput,
)
from backend.src.models_schema.miscellaneous.enums import SubjectType
from backend.src.RAG.augmentation.formatters.conversations.core import (
    conversations_formatter,
)
from backend.src.services.interaction import create_interaction
from backend.src.services.llm_response import (
    create_llm_response,
    read_conversation_history,
    read_llm_responses,
)
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


def _conversation(index: int, interaction_id: int) -> LLMResponse:
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    return LLMResponse(
        prompt=f"question {index}",
        answer=f"answer {index}",
        interaction_id=interaction_id,
        created_at=base + timedelta(minutes=index),
    )


async def test_conversation_history_is_the_latest_n_oldest_first(
    session: AsyncSession,
    register_user_custom,
    create_interaction_custom,
):
    user = await register_user_custom("history-owner")
    interaction = await create_interaction_custom(user, "history")
    session.add_all([_conversation(i, interaction.id) for i in (1, 2, 3)])
    await session.commit()

    history = await read_conversation_history(session, interaction, limit=2)

    # The two most recent conversations, in the order they happened
    assert [c.prompt for c in history] == ["question 2", "question 3"]

    # The listing used by the API keeps its newest-first order
    listing = await read_llm_responses(session, interaction, limit=None)
    assert [c.prompt for c in listing] == ["question 3", "question 2", "question 1"]


def test_conversations_formatter_keeps_the_given_order():
    formatted = conversations_formatter([_conversation(1, 1), _conversation(2, 1)])

    assert formatted.index("Conversation #1") < formatted.index("question 1")
    assert formatted.index("question 1") < formatted.index("Conversation #2")
    assert formatted.index("Conversation #2") < formatted.index("question 2")


@patch.object(GlobalAPI, "generate_chat", new_callable=AsyncMock)
async def test_chat_prompt_lists_past_conversations_chronologically(
    mock_generate_chat: AsyncMock,
    session: AsyncSession,
    register_user_custom,
    create_interaction_custom,
):
    mock_generate_chat.return_value = "Mock answer"

    user = await register_user_custom("chat-owner")
    interaction = await create_interaction_custom(user, "chat")
    session.add_all([_conversation(i, interaction.id) for i in (1, 2)])
    await session.commit()

    await create_llm_response(
        user=user,
        session=session,
        current_datetime=datetime(2026, 1, 2, tzinfo=timezone.utc),
        llm_response_input=LLMResponseInput(prompt="follow-up question"),
        interaction=interaction,
    )

    # What the chat service actually sent to the model
    final_prompt = mock_generate_chat.call_args.args[0]
    assert final_prompt.index("question 1") < final_prompt.index("question 2")
