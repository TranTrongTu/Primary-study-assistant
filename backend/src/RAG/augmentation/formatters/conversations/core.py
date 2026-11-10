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

    Keeps the order it is given. Pass the conversations oldest-first (see
    `read_conversation_history`) so the model reads the dialogue as it happened.
    """
    formatted_conversations = "\n\n".join(
        singular_conversation_formatter(i, conv)
        for i, conv in enumerate(conversations, start=1)
    )

    return formatted_conversations
