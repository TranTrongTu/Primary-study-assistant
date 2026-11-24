import asyncio
import base64
from abc import ABC, abstractmethod
from types import FunctionType
from typing import Any, Awaitable, Callable

import httpx
import ollama
from fastapi import UploadFile
from google import genai
from google.genai import Client
from pydantic import BaseModel

from backend.src.core.config import settings
from backend.src.core.llm_retry import call_with_retries
from backend.src.core.openai_compatible import Endpoint, OpenAICompatibleClient
from backend.src.exceptions.core import (
    ExceptionExternalService_503,
    ExceptionInternalError_500,
    ExceptionLLMError_502,
    ExceptionRequest_400,
)

# ----- MODEL CONFIGURATIONS ----- #

# === GOOGLE ===#


class GeminiKeysManager:
    def __init__(self, keys: list[str]):
        if len(keys) == 0:
            raise ExceptionInternalError_500("Missing Gemini API key.")

        self.keys = keys
        self.current_key_index = 0
        self.client: Client = genai.Client(api_key=self.keys[self.current_key_index])

    def rotate(self) -> None:
        self.current_key_index += 1
        if self.current_key_index == len(self.keys):
            self.current_key_index = 0
        self.client: Client = genai.Client(api_key=self.keys[self.current_key_index])

    def rotate_from(self, failed_key_index: int) -> None:
        """
        Moves on from a key that failed. Does nothing when a concurrent request already
        did: rotating twice would skip a key (or, with two keys, return to the bad one).
        """
        if failed_key_index == self.current_key_index:
            self.rotate()


keys_manager = GeminiKeysManager(settings.gemini_keys_list)

# GOOGLE_CLIENT = genai.Client(api_key=settings.API_KEY_GEMINI)

# === OLLAMA === #

OLLAMA_CLIENT = ollama.AsyncClient(host=settings.OLLAMA_HOST)

# === CLOUDFLARE === #
CLOUDFLARE_URL_EMBED = f"https://api.cloudflare.com/client/v4/accounts/{settings.CLOUDFLARE_ACCOUNT_ID}/ai/run/{settings.EMBED_MODEL_CLOUDFLARE}"
CLOUDFLARE_URL_IMAGE_CAPTION = f"https://api.cloudflare.com/client/v4/accounts/{settings.CLOUDFLARE_ACCOUNT_ID}/ai/run/{settings.VISION_MODEL_CLOUDFLARE}"
CLOUDFLARE_HEADERS = {
    "Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}",
    "Content-Type": "application/json",
}


# ----- MODEL CALLS ----- #


class API(ABC):
    @classmethod
    async def wrapper(cls, func: FunctionType) -> Any:
        """
        Wraps around the main function, providing utility and error handling.
        ONLY catches errors caused by external or used originated factors.
        """
        pass

    @classmethod
    @abstractmethod
    async def embed(cls, content: str) -> list[float]:
        """
        Embeds text into a vector.
        """
        pass

    @classmethod
    @abstractmethod
    async def mass_embed(cls, contents: list[str]) -> list[list[float]]:
        """
        Embeds a list of texts into a list of vectors.
        """

    @classmethod
    @abstractmethod
    async def caption_image(cls, file: UploadFile) -> str:
        """
        Generates a detailed description of the image.
        """
        pass

    @classmethod
    @abstractmethod
    async def generate_content(
        cls,
        prompt: str,
        response_schema: type[BaseModel] | None = None,
        operation: str = "generate_content",
    ) -> str:
        """
        Generates an LLM response from a prompt.
        """
        pass


class GoogleAPI(API):
    @classmethod
    async def wrapper(  # type: ignore[override]
        cls,
        func: Callable[[str], Awaitable[Any]],
        models: list[str],
        operation: str,
    ) -> Any:
        return await call_with_retries(
            func, models, "google", operation, keys=keys_manager
        )

    @classmethod
    async def embed(cls, content: str) -> list[float]:
        async def call_api(model: str) -> Any:
            return await keys_manager.client.aio.models.embed_content(
                model=model,
                contents=content,
                # Content is truncated from 3072-D to 768-D
                config=genai.types.EmbedContentConfig(
                    output_dimensionality=settings.DEFAULT_EMBED_DIMENSIONALITY_GOOGLE_OLLAMA,
                ),
            )

        response = await cls.wrapper(call_api, [settings.EMBED_MODEL_GOOGLE], "embed")

        # Validation
        assert response.embeddings is not None
        assert isinstance(response.embeddings[0].values, list)

        return response.embeddings[0].values

    @classmethod
    async def mass_embed(cls, contents: list[str]) -> list[list[float]]:
        async def call_api(model: str) -> Any:
            return await keys_manager.client.aio.models.embed_content(
                model=model,
                contents=contents,
                # Content is truncated from 3072-D to 768-D
                config=genai.types.EmbedContentConfig(
                    output_dimensionality=settings.DEFAULT_EMBED_DIMENSIONALITY_GOOGLE_OLLAMA,
                ),
            )

        response = await cls.wrapper(
            call_api, [settings.EMBED_MODEL_GOOGLE], "mass_embed"
        )

        # Validation
        assert response.embeddings is not None

        embeddings = [e.values for e in response.embeddings if e.values]
        if len(embeddings) != len(contents):
            raise ExceptionLLMError_502("Embedding failed.")

        return embeddings

    @classmethod
    async def caption_image(cls, file: UploadFile) -> str:
        # Extracting information from the image
        image_bytes = await file.read()
        content_type = file.content_type

        async def call_api(model: str) -> Any:
            prompt_text = "Extract all readable text from this image exactly as written.\nThen, describe the layout, charts, figures, subjects, and any data points in exhaustive detail."

            image_part = genai.types.Part.from_bytes(
                data=image_bytes,
                mime_type=content_type,  # type: ignore
            )

            return await keys_manager.client.aio.models.generate_content(
                model=model,
                contents=[prompt_text, image_part],
            )

        response = await cls.wrapper(
            call_api, [settings.VISION_MODEL_GOOGLE], "caption_image"
        )

        # Validation
        if response.text is None:
            raise ExceptionRequest_400("Image could not be saved properly.")

        return response.text

    @classmethod
    async def generate_content(
        cls,
        prompt: str,
        response_schema: type[BaseModel] | None = None,
        operation: str = "generate_content",
    ) -> str:
        async def call_api(model: str) -> Any:
            config = genai.types.GenerateContentConfig()

            if response_schema:
                config.response_mime_type = "application/json"
                config.response_schema = response_schema

            return await keys_manager.client.aio.models.generate_content(
                model=model,
                contents=prompt,
                config=config,
            )

        models = [settings.ANSWER_MODEL_GOOGLE]
        if settings.ANSWER_MODEL_GOOGLE_FALLBACK:
            models.append(settings.ANSWER_MODEL_GOOGLE_FALLBACK)

        response = await cls.wrapper(call_api, models, operation)

        # Validation
        if response.text is None:
            raise ExceptionRequest_400(
                "A response could not be generated. Please recheck your question."
            )

        return response.text


class OllamaAPI(API):
    @classmethod
    async def wrapper(cls, func: FunctionType) -> Any:
        attempt_traffic = 0

        while True:
            try:
                return await func()

            except ollama.ResponseError as e:
                # Potentially dangerous error
                if e.status_code in (429, 502, 503, 504):
                    wait_time = (attempt_traffic + 1) * 2
                    await asyncio.sleep(wait_time)
                    attempt_traffic += 1

                    if attempt_traffic >= settings.DEFAULT_N_API_CALL_RETRIES:
                        break
                    continue
                else:
                    raise ExceptionInternalError_500(f"Ollama Config error: {str(e)}")

            except httpx.RequestError:
                # Network, connection issues
                wait_time = (attempt_traffic + 1) * 2
                await asyncio.sleep(wait_time)
                attempt_traffic += 1

                if attempt_traffic >= settings.DEFAULT_N_API_CALL_RETRIES:
                    break

                continue

        raise ExceptionExternalService_503(
            "Ollama failed after multiple retries. Please come back again later."
        )

    @classmethod
    async def embed(cls, content: str) -> list[float]:
        async def call_api() -> list[float]:

            # API call
            response = await OLLAMA_CLIENT.embeddings(
                model=settings.EMBED_MODEL_OLLAMA,
                prompt=content,
            )

            embeddings = response.get("embedding")

            # Validation
            assert embeddings is not None
            assert isinstance(embeddings, list)

            if len(embeddings) > settings.DEFAULT_EMBED_DIMENSIONALITY_GOOGLE_OLLAMA:
                embeddings = embeddings[
                    : settings.DEFAULT_EMBED_DIMENSIONALITY_GOOGLE_OLLAMA
                ]

            return embeddings

        return await cls.wrapper(call_api)

    @classmethod
    async def mass_embed(cls, contents: list[str]) -> list[list[float]]:
        async def call_api() -> list[list[float]]:

            # API call
            response = await OLLAMA_CLIENT.embed(
                model=settings.EMBED_MODEL_OLLAMA,
                input=contents,
            )

            embeddings = response.get("embeddings")

            # Validation
            assert embeddings is not None
            assert isinstance(embeddings, list)
            assert isinstance(embeddings[0], list)

            if len(embeddings[0]) > settings.DEFAULT_EMBED_DIMENSIONALITY_GOOGLE_OLLAMA:
                embeddings = [
                    vector[: settings.DEFAULT_EMBED_DIMENSIONALITY_GOOGLE_OLLAMA]
                    for vector in embeddings
                ]

            return embeddings

        return await cls.wrapper(call_api)

    @classmethod
    async def caption_image(cls, file: UploadFile) -> str:
        # Extracting information from the image
        image_bytes = await file.read()

        async def call_api() -> str:
            prompt_text = "Extract all readable text from this image exactly as written.\nThen, describe the layout, charts, figures, subjects, and any data points in exhaustive detail."

            # Reads the image using the model
            response = await OLLAMA_CLIENT.generate(
                model=settings.VISION_MODEL_OLLAMA,
                prompt=prompt_text,
                images=[image_bytes],
                options={"num_ctx": 8192},
            )

            result_text = response.get("response")

            # Validation
            if not result_text:
                raise ExceptionRequest_400("Image could not be saved properly.")

            return result_text

        return await cls.wrapper(call_api)

    @classmethod
    async def generate_content(
        cls,
        prompt: str,
        response_schema: type[BaseModel] | None = None,
        operation: str = "generate_content",
    ) -> str:
        async def call_api() -> str:
            if response_schema:
                response = await OLLAMA_CLIENT.generate(
                    model=settings.ANSWER_MODEL_OLLAMA,
                    prompt=prompt,
                    options={"num_ctx": 8192},
                    format=response_schema.model_json_schema(),
                )
            else:
                response = await OLLAMA_CLIENT.generate(
                    model=settings.ANSWER_MODEL_OLLAMA,
                    prompt=prompt,
                    options={"num_ctx": 8192},
                )

            result_text = response.get("response")

            # Validation
            if not result_text:
                raise ExceptionRequest_400(
                    "A response could not be generated. Please recheck your question."
                )

            return result_text

        return await cls.wrapper(call_api)


class CloudFlareAPI(API):
    @classmethod
    async def wrapper(cls, func: FunctionType) -> Any:
        attempt_traffic = 0

        while True:
            try:
                return await func()

            except httpx.HTTPStatusError as e:
                # Potentially dangerous error
                if e.response.status_code in (429, 500, 502, 503, 504):
                    wait_time = (attempt_traffic + 1) * 2
                    await asyncio.sleep(wait_time)
                    attempt_traffic += 1

                    if attempt_traffic >= settings.DEFAULT_N_API_CALL_RETRIES:
                        break

                    continue
                else:
                    raise ExceptionInternalError_500(
                        f"Cloudflare API error: {e.response.status_code} - {e.response.text}"
                    )

            except httpx.RequestError:
                # Network, connection issues
                wait_time = (attempt_traffic + 1) * 2
                await asyncio.sleep(wait_time)
                attempt_traffic += 1

                if attempt_traffic >= settings.DEFAULT_N_API_CALL_RETRIES:
                    break

                continue

        raise ExceptionExternalService_503(
            "Cloudflare failed after multiple retries. Please come back again later."
        )

    @classmethod
    async def embed(cls, content: str) -> list[float]:
        async def call_api() -> list[float]:
            json_data = {"text": [content]}

            # API call
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    CLOUDFLARE_URL_EMBED, headers=CLOUDFLARE_HEADERS, json=json_data
                )

                response.raise_for_status()

                response_data = response.json()

            # Validation
            assert response_data.get("result") is not None

            result_data = response_data.get("result", {}).get("data")

            assert result_data is not None
            assert isinstance(result_data, list)
            assert isinstance(result_data[0], list)

            return result_data[0]

        return await cls.wrapper(call_api)

    @classmethod
    async def mass_embed(cls, contents: list[str]) -> list[list[float]]:
        async def call_api() -> list[list[float]]:
            json_data = {"text": contents}

            # API call
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    CLOUDFLARE_URL_EMBED, headers=CLOUDFLARE_HEADERS, json=json_data
                )

                response.raise_for_status()
                response_data = response.json()

            # Validates the result
            assert response_data.get("result") is not None
            result_data = response_data.get("result", {}).get("data")

            assert result_data is not None
            assert isinstance(result_data, list)

            return result_data

        return await cls.wrapper(call_api)

    @classmethod
    async def caption_image(cls, file: UploadFile) -> str:
        # Extracting information from the image
        image_bytes = await file.read()

        async def call_api() -> str:
            base64_image = base64.b64encode(image_bytes).decode("utf-8")

            system_prompt = (
                "You are an expert AI vision assistant specialized in OCR, document transcription, "
                "and detailed visual analysis. Extract text exactly as written and describe layouts, "
                "data points, charts, and visual elements with exhaustive precision."
            )
            prompt_text = "Extract all readable text from this image exactly as written.\nThen, describe the layout, charts, figures, subjects, and any data points in exhaustive detail."

            json_data = {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt_text},
                ],
                "image": base64_image,
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    CLOUDFLARE_URL_IMAGE_CAPTION,
                    headers=CLOUDFLARE_HEADERS,
                    json=json_data,
                )

                response.raise_for_status()

                response_data = response.json()

            if not response_data.get("success"):
                raise ExceptionRequest_400("Image could not be saved properly.")

            result_data = response_data.get("result", {}).get("response")

            assert result_data is not None
            assert isinstance(result_data, str)

            return result_data

        return await cls.wrapper(call_api)

    @classmethod
    async def generate_content(
        cls,
        prompt: str,
        response_schema: type[BaseModel] | None = None,
        operation: str = "generate_content",
    ) -> str:
        raise ExceptionInternalError_500("You weren't supposed to call this")


def openai_compatible_client() -> OpenAICompatibleClient:
    # Built per call, so a settings change (tests, evaluation) takes effect
    return OpenAICompatibleClient(
        Endpoint(
            base_url=settings.OPENAI_COMPATIBLE_BASE_URL,
            api_key=settings.OPENAI_COMPATIBLE_API_KEY,
            model=settings.OPENAI_COMPATIBLE_MODEL,
            structured_output=settings.OPENAI_COMPATIBLE_STRUCTURED_OUTPUT,
            timeout=settings.OPENAI_COMPATIBLE_TIMEOUT_SECONDS,
        )
    )


class OpenAICompatibleAPI(API):
    @classmethod
    async def embed(cls, content: str) -> list[float]:
        return (await cls.mass_embed([content]))[0]

    @classmethod
    async def mass_embed(cls, contents: list[str]) -> list[list[float]]:
        return await openai_compatible_client().embed(
            contents,
            settings.OPENAI_COMPATIBLE_EMBED_MODEL,
            settings.DEFAULT_EMBED_DIMENSIONALITY_CLOUDFLARE,
        )

    @classmethod
    async def caption_image(cls, file: UploadFile) -> str:
        return await openai_compatible_client().describe_image(
            "Extract all readable text from this image exactly as written.\nThen, describe the layout, charts, figures, subjects, and any data points in exhaustive detail.",
            await file.read(),
            file.content_type,
            settings.OPENAI_COMPATIBLE_VISION_MODEL,
        )

    @classmethod
    async def generate_content(
        cls,
        prompt: str,
        response_schema: type[BaseModel] | None = None,
        operation: str = "generate_content",
    ) -> str:
        return await openai_compatible_client().chat(prompt, response_schema, operation)


class GlobalAPI:
    models: dict[str, type[API]] = {
        "GOOGLE": GoogleAPI,
        "OLLAMA": OllamaAPI,
        "CLOUDFLARE": CloudFlareAPI,
        "OPENAI_COMPATIBLE": OpenAICompatibleAPI,
    }

    @classmethod
    async def embed(cls, content: str) -> list[float]:
        return await cls.models[settings.MODEL_IN_USE_EMBED].embed(content)

    @classmethod
    async def mass_embed(cls, contents: list[str]) -> list[list[float]]:
        return await cls.models[settings.MODEL_IN_USE_EMBED].mass_embed(contents)

    @classmethod
    async def caption_image(cls, file: UploadFile) -> str:
        return await cls.models[settings.MODEL_IN_USE_CAPTION_IMAGE].caption_image(file)

    @classmethod
    async def generate_chat(cls, prompt: str) -> str:
        return await cls.models[settings.MODEL_IN_USE_GENERATE_CHAT].generate_content(
            prompt, operation="chat"
        )

    @classmethod
    async def rewrite_prompt(cls, prompt: str) -> str:
        return await cls.models[settings.MODEL_IN_USE_REWRITE_PROMPT].generate_content(
            prompt, operation="rewrite_prompt"
        )

    @classmethod
    async def generate_material(
        cls, prompt: str, response_schema: type[BaseModel]
    ) -> str:
        return await cls.models[
            settings.MODEL_IN_USE_GENERATE_MATERIAL
        ].generate_content(
            prompt,
            response_schema=response_schema,
            operation="generate_material",
        )

    @classmethod
    async def grade_answers(cls, prompt: str, response_schema: type[BaseModel]) -> str:
        return await cls.models[settings.MODEL_IN_USE_GRADE_ANSWERS].generate_content(
            prompt,
            response_schema=response_schema,
            operation="grade_answers",
        )

    @classmethod
    async def generate_document_analysis(
        cls, prompt: str, response_schema: type[BaseModel]
    ) -> str:
        return await cls.models[
            settings.MODEL_IN_USE_GENERATE_DOCUMENT_ANALYSIS
        ].generate_content(
            prompt,
            response_schema=response_schema,
            operation="document_analysis",
        )

    @classmethod
    async def generate_study_assessment(cls, prompt: str) -> str:
        return await cls.models[
            settings.MODEL_IN_USE_GENERATE_STUDY_ASSESSMENT
        ].generate_content(prompt, operation="study_assessment")
