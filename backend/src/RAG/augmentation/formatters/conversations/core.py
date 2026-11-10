from typing import Iterable

from backend.src.models_schema.llm_response.llm_response import LLMResponse


def singular_conversation_formatter(index: int, conversation: LLMResponse) -> str:
    return f"""Conversation #{index} (created at {conversation.created_at}, in interaction #{conversation.interaction_id}):
User query: {conversation.prompt}
Model answer: {conversation.answer}
"""


def conversations_formatter(conversations: Iterable[LLMResponse]) -> str:
    """
    Formats past conversations for the LLM prompt.

    Expects the newest-first order returned by `read_llm_responses` and emits them
    oldest-first, so the model reads the dialogue in the order it happened.
    """
    chronological = reversed(list(conversations))
    formatted_conversations = "\n\n".join(
        singular_conversation_formatter(i, conv)
        for i, conv in enumerate(chronological, start=1)
    )

    return formatted_conversations
