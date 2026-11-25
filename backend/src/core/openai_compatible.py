"""
A client for any provider that speaks the OpenAI HTTP API.

Many do, so switching provider is a matter of configuration: a base URL, a key, a model
name and how the provider takes a JSON schema. "Compatible" is not identical: see
StructuredOutput below. Tried for real against Gemini only.
"""

import base64
import json
from dataclasses import dataclass, field
from typing import Any, Literal
from urllib.parse import urlsplit

import httpx
from pydantic import BaseModel

from backend.src.core.llm_retry import call_with_retries
from backend.src.exceptions.core import ExceptionLLMError_502, ExceptionRequest_400

# How a provider is told which JSON to return. Whatever it is, the caller validates the
# result.
#   json_schema_strict  schema rewritten to the strict subset, strict: true (OpenAI; the only
#                       mode Anthropic's compatible endpoint accepts)
#   json_schema         schema as it is, without strict (tried with Gemini)
#   json_object         the provider only promises JSON; the schema goes into the prompt
StructuredOutput = Literal["json_schema_strict", "json_schema", "json_object"]


@dataclass(frozen=True)
class Endpoint:
    # Up to and including the version, e.g. https://api.openai.com/v1
    base_url: str
    # Empty for a local server without authentication. Not in repr, so not in any log.
    api_key: str = field(repr=False)
    model: str
    structured_output: StructuredOutput = "json_schema"
    timeout: float = 60

    @property
    def host(self) -> str:
        return urlsplit(self.base_url).netloc

    @property
    def label(self) -> str:
        """Identifies the model in results: the same name may be served by two hosts."""
        return f"{self.model}@{self.host}"


# Keywords every strict implementation understands. Others (minimum, minItems, default...)
# are accepted by some providers and refused by others, so they are left out: the caller's
# own validation still applies them.
_STRICT_KEYWORDS = {"type", "description", "enum", "const", "$ref"}


def strict_schema(schema: dict[str, Any]) -> dict[str, Any]:
    """
    A pydantic JSON schema rewritten for `strict: true`: every object is closed and
    requires all its properties.
    """
    if "$ref" in schema:
        return {"$ref": schema["$ref"]}  # nothing may stand next to a reference

    result = {key: value for key, value in schema.items() if key in _STRICT_KEYWORDS}

    for key in ("anyOf", "oneOf"):
        if key in schema:
            result["anyOf"] = [strict_schema(option) for option in schema[key]]
    if "items" in schema:
        result["items"] = strict_schema(schema["items"])
    if "$defs" in schema:
        result["$defs"] = {
            name: strict_schema(definition)
            for name, definition in schema["$defs"].items()
        }

    if schema.get("type") == "object":
        if isinstance(schema.get("additionalProperties"), dict):
            raise ValueError("A dict with free keys cannot be a strict schema")
        properties = schema.get("properties", {})
        result["properties"] = {
            name: strict_schema(value) for name, value in properties.items()
        }
        result["required"] = list(properties)
        result["additionalProperties"] = False

    return result


class OpenAICompatibleClient:
    def __init__(
        self, endpoint: Endpoint, transport: httpx.AsyncBaseTransport | None = None
    ):
        self.endpoint = endpoint
        self._transport = transport  # tests pass a fake server here

    async def chat(
        self,
        prompt: str,
        response_schema: type[BaseModel] | None = None,
        operation: str = "generate_content",
        temperature: float | None = None,
    ) -> str:
        text = prompt
        body: dict[str, Any] = {}

        if response_schema is not None:
            schema = response_schema.model_json_schema()
            if self.endpoint.structured_output == "json_schema_strict":
                body["response_format"] = {
                    "type": "json_schema",
                    "json_schema": {
                        "name": response_schema.__name__,
                        "strict": True,
                        "schema": strict_schema(schema),
                    },
                }
            elif self.endpoint.structured_output == "json_schema":
                body["response_format"] = {
                    "type": "json_schema",
                    "json_schema": {"name": response_schema.__name__, "schema": schema},
                }
            else:
                body["response_format"] = {"type": "json_object"}
                text += (
                    "\n\nAnswer with one JSON object that follows this JSON schema:\n"
                    + json.dumps(schema, ensure_ascii=False)
                )

        if temperature is not None:
            body["temperature"] = temperature

        body["messages"] = [{"role": "user", "content": text}]
        return await self._complete(body, operation)

    async def describe_image(
        self, prompt: str, image: bytes, content_type: str | None, model: str
    ) -> str:
        data = base64.b64encode(image).decode()
        url = f"data:{content_type or 'image/png'};base64,{data}"
        body = {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": url}},
                    ],
                }
            ]
        }
        return await self._complete(body, "caption_image", model)

    async def embed(
        self, contents: list[str], model: str, dimensions: int
    ) -> list[list[float]]:
        response = await self._post(
            "/embeddings", {"input": contents}, "embed", model=model
        )
        try:
            items = sorted(response["data"], key=lambda item: item["index"])
            vectors = [item["embedding"] for item in items]
        except (KeyError, TypeError) as e:
            raise ExceptionLLMError_502("Embedding failed.") from e

        if len(vectors) != len(contents):
            raise ExceptionLLMError_502("Embedding failed.")
        # The database column has a fixed size, so another model needs a migration
        if any(len(vector) != dimensions for vector in vectors):
            raise ExceptionLLMError_502(
                f"The embedding model returned {len(vectors[0])} dimensions, "
                f"the database needs {dimensions}."
            )
        return vectors

    async def _complete(
        self, body: dict[str, Any], operation: str, model: str | None = None
    ) -> str:
        response = await self._post("/chat/completions", body, operation, model)
        # Some gateways answer 200 with an error body
        try:
            text = response["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as e:
            raise ExceptionLLMError_502(
                "The AI service returned an unexpected response."
            ) from e

        if not text:
            raise ExceptionRequest_400(
                "A response could not be generated. Please recheck your question."
            )
        return text

    async def _post(
        self, path: str, body: dict[str, Any], operation: str, model: str | None = None
    ) -> dict[str, Any]:
        headers = {}
        if self.endpoint.api_key:
            headers["Authorization"] = f"Bearer {self.endpoint.api_key}"

        async def call_api(model_name: str) -> dict[str, Any]:
            async with httpx.AsyncClient(
                timeout=self.endpoint.timeout, transport=self._transport
            ) as client:
                response = await client.post(
                    self.endpoint.base_url.rstrip("/") + path,
                    headers=headers,
                    json={"model": model_name, **body},
                )
            response.raise_for_status()
            try:
                return response.json()
            except ValueError as e:
                raise ExceptionLLMError_502(
                    "The AI service returned an unexpected response."
                ) from e

        return await call_with_retries(
            call_api, [model or self.endpoint.model], self.endpoint.host, operation
        )
