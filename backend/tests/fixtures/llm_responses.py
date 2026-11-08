from datetime import datetime, timezone
from types import CoroutineType
from typing import Any, Callable

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.models_schema.llm_response.llm_response import LLMResponse


@pytest.fixture(name="create_llm_response_custom")
async def create_llm_response_custom_fixture(
    session: AsyncSession,
) -> Callable[[Interaction, str, str], CoroutineType[Any, Any, LLMResponse]]:
    """
    Returns a function that creates an LLM responses attached to an interaction.
    """

    async def create_llm_response_custom(
        interaction: Interaction, prompt: str, answer: str
    ) -> LLMResponse:
        llm_response = LLMResponse(
            prompt=prompt,
            answer=answer,
            created_at=datetime.now(timezone.utc),
            interaction=interaction,
        )

        session.add(llm_response)
        await session.commit()

        return llm_response

    return create_llm_response_custom
