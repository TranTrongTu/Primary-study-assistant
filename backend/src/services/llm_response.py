from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from backend.src.core.ai_api import GlobalAPI
from backend.src.core.config import settings
from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.models_schema.llm_response.llm_response import (
    LLMResponse,
    LLMResponseInput,
)
from backend.src.models_schema.RAG.augmentation import AnswerGenerationParams
from backend.src.models_schema.user.user import User
from backend.src.RAG.augmentation.core.specific_augmentations import (
    answer_generation_augmentation,
)
from backend.src.RAG.augmentation.formatters.chunks.core import (
    chunks_formatter,
)
from backend.src.RAG.augmentation.formatters.conversations.core import (
    conversations_formatter,
)
from backend.src.RAG.retrieval.core import retrieval
from backend.src.RAG.retrieval.prompt_rewrite import rewrite_prompt

# ----- CREATE ----- #


async def create_llm_response(
    user: User,
    session: AsyncSession,
    current_datetime: datetime,
    llm_response_input: LLMResponseInput,
    interaction: Interaction,
) -> LLMResponse:
    # Gets past conversations
    past_conversations = await read_llm_responses(
        session, interaction, settings.DEFAULT_N_PAST_CONVERSATIONS
    )

    await session.commit()  # Temporary close

    # Formats conversations
    formatted_past_conversations = conversations_formatter(past_conversations)

    # Rewrites prompt
    rewritten_prompt = await rewrite_prompt(
        llm_response_input.prompt, formatted_past_conversations
    )
    embedded_prompt = await GlobalAPI.embed(rewritten_prompt)

    # Chunks retrieval
    document_chunks = await retrieval(
        session=session,
        interaction=interaction,
        raw_prompt=rewritten_prompt,
        embedded_prompt=embedded_prompt,
        document_id=llm_response_input.document_id,
    )

    # Formats chunks
    formatted_chunks = chunks_formatter(document_chunks)

    await session.commit()  # Temporary close

    # Augmentation
    augmentation_params = AnswerGenerationParams(
        prompt=llm_response_input.prompt,
        context_conversations=formatted_past_conversations,
        context_chunks=formatted_chunks,
        personal_information=user.description,
    )
    final_prompt = answer_generation_augmentation(augmentation_params)

    # Generation
    answer = await GlobalAPI.generate_chat(final_prompt)

    # Saving response
    llm_response = LLMResponse(
        prompt=llm_response_input.prompt,
        answer=answer,
        interaction=interaction,
        created_at=current_datetime,
    )

    session.add(llm_response)
    await session.commit()
    # await session.refresh(llm_response)

    return llm_response


# ----- READ ----- #


async def read_llm_responses(
    session: AsyncSession, interaction: Interaction, limit: int | None
) -> list[LLMResponse]:
    query = (
        select(LLMResponse)
        .where(LLMResponse.interaction_id == interaction.id)
        .order_by(col(LLMResponse.created_at).desc())
    )
    if limit is not None:
        query = query.limit(limit)

    llm_responses = (await session.execute(query)).scalars().all()

    return list(llm_responses)


# ----- UPDATE ----- #
# ----- DELETE ----- #
