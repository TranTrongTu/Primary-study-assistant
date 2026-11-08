from backend.src.core.ai_api import GlobalAPI
from backend.src.models_schema.RAG.augmentation import PromptRewriteParams
from backend.src.RAG.augmentation.core.specific_augmentations import (
    prompt_rewrite_augmentation,
)


async def rewrite_prompt(raw_prompt: str, context_conversations: str) -> str:
    params = PromptRewriteParams(
        prompt=raw_prompt,
        context_conversations=context_conversations,
    )
    augmented_prompt = prompt_rewrite_augmentation(params)

    rewritten_prompt = await GlobalAPI.rewrite_prompt(augmented_prompt)

    return rewritten_prompt
