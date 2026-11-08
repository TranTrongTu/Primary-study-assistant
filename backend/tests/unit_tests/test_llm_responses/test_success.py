from types import CoroutineType
from typing import Any, Callable
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from backend.src.core.ai_api import GlobalAPI
from backend.src.core.config import settings
from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.models_schema.llm_response.llm_response import (
    LLMResponse,
    LLMResponseOutput,
)
from backend.src.models_schema.user.user import User
from backend.tests.utils.validators import (
    validate_model,
    validate_response_contents,
    validate_status_code,
)


@patch.object(GlobalAPI, "generate_chat")
@patch.object(GlobalAPI, "mass_embed")
async def test_create_llm_response(
    mock_GlobalAPI_mass_embed: AsyncMock,
    mock_GlobalAPI_generate_chat: AsyncMock,
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
):

    # Mock embedding
    mock_GlobalAPI_mass_embed.return_value = [
        [0.1] * settings.DEFAULT_EMBED_DIMENSIONALITY_CLOUDFLARE,
    ]

    # Mock chat generation
    mock_GlobalAPI_generate_chat.return_value = "Mock LLM response."

    response = await client.post(
        f"/api/llm-response/{create_interaction_test.id}/chat",
        json={"prompt": "LLM call prompt."},
    )
    validate_status_code(response, 200)
    validate_model(response, LLMResponseOutput)
    validate_response_contents(
        response,
        {
            "prompt": "LLM call prompt.",
            "answer": "Mock LLM response.",
        },
    )


async def test_read_llm_responses(
    client: AsyncClient,
    register_user_test: User,
    login_user_test: None,
    create_interaction_test: Interaction,
    create_llm_response_custom: Callable[
        [Interaction, str, str], CoroutineType[Any, Any, LLMResponse]
    ],
):
    llm_response1 = await create_llm_response_custom(
        create_interaction_test, "Prompt 1", "Answer 1"
    )
    llm_response2 = await create_llm_response_custom(
        create_interaction_test, "Prompt 2", "Answer 2"
    )

    response = await client.get(f"/api/llm-response/{create_interaction_test.id}/")

    validate_status_code(response, 200)
    validate_model(response, list[LLMResponseOutput])
    validate_response_contents(
        response,
        [
            llm_response1.model_dump(include={"prompt", "answer"}),
            llm_response2.model_dump(include={"prompt", "answer"}),
        ],
    )
