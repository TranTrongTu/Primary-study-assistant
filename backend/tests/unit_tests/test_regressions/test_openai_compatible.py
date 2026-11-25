"""
The client for OpenAI-compatible providers, against a fake server: what it sends, what
it makes of the answers, and that switching provider needs only configuration.
"""

import json
import logging
from io import BytesIO
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi import UploadFile
from pydantic import BaseModel, ValidationError

from backend.src.core import ai_api, llm_retry, openai_compatible
from backend.src.core.ai_api import GlobalAPI, OpenAICompatibleAPI
from backend.src.core.config import Settings, settings
from backend.src.core.openai_compatible import (
    Endpoint,
    OpenAICompatibleClient,
    strict_schema,
)
from backend.src.exceptions.core import (
    ExceptionAIQuota_503,
    ExceptionExternalService_503,
    ExceptionInternalError_500,
    ExceptionLLMError_502,
    ExceptionRequest_400,
)
from backend.src.models_schema.activity.llm_return_json_schema import (
    FlashcardsSchema,
    GapFillSchema,
    MCQGradedSchema,
    MCQSchema,
    OpenEndedCreationSchema,
    OpenEndedGradedSchema,
)
from backend.src.models_schema.document.document_analysis import DocumentAnalysisSchema
from backend.tests.unit_tests.test_regressions.test_settings import REQUIRED
from scripts.generation_eval import JudgeVerdict

# Taken before the autouse fixture of conftest.py replaces it
real_mass_embed = GlobalAPI.mass_embed


class Verdict(BaseModel):
    ok: bool


class FakeServer:
    def __init__(self, *answers):
        self.answers = list(answers)
        self.requests: list[httpx.Request] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        answer = self.answers.pop(0)
        if isinstance(answer, Exception):
            raise answer
        return answer

    def body(self, index=-1) -> dict:
        return json.loads(self.requests[index].content)


def reply(text, **usage):
    return httpx.Response(
        200,
        json={"choices": [{"message": {"content": text}}], "usage": usage},
    )


def client(server, **overrides):
    endpoint = {
        "base_url": "https://provider.test/v1/",
        "api_key": "secret-key",
        "model": "small",
        **overrides,
    }
    return OpenAICompatibleClient(
        Endpoint(**endpoint), transport=httpx.MockTransport(server)
    )


@pytest.fixture(autouse=True)
def sleeps(monkeypatch):
    monkeypatch.setattr(settings, "DEFAULT_N_API_CALL_RETRIES", 3)
    monkeypatch.setattr(settings, "LLM_MAX_RETRY_WAIT_SECONDS", 20)
    with patch.object(llm_retry.asyncio, "sleep", AsyncMock()) as sleep:
        yield lambda: [call.args[0] for call in sleep.await_args_list]


# ----- REQUESTS ----- #


async def test_a_chat_request_has_the_standard_shape():
    server = FakeServer(reply("Cu Đỏ."))

    assert await client(server).chat("Con gà tên gì?", temperature=0) == "Cu Đỏ."
    assert str(server.requests[0].url) == "https://provider.test/v1/chat/completions"
    assert server.requests[0].headers["Authorization"] == "Bearer secret-key"
    assert server.body() == {
        "model": "small",
        "temperature": 0,
        "messages": [{"role": "user", "content": "Con gà tên gì?"}],
    }


async def test_a_local_server_without_a_key_gets_no_authorization_header():
    server = FakeServer(reply("ok"))
    await client(server, api_key="").chat("hi")

    assert "Authorization" not in server.requests[0].headers


async def test_the_schema_can_be_sent_as_it_is():
    server = FakeServer(reply('{"ok": true}'))
    await client(server).chat("hi", Verdict)

    sent = server.body()["response_format"]
    assert sent["type"] == "json_schema"
    assert sent["json_schema"]["schema"] == Verdict.model_json_schema()
    assert server.body()["messages"][0]["content"] == "hi"


async def test_otherwise_the_schema_goes_into_the_prompt():
    server = FakeServer(reply('{"ok": true}'))
    await client(server, structured_output="json_object").chat("hi", Verdict)

    assert server.body()["response_format"] == {"type": "json_object"}
    assert '"ok"' in server.body()["messages"][0]["content"]


async def test_an_image_is_sent_inline():
    server = FakeServer(reply("Một con mèo."))
    text = await client(server).describe_image("Describe", b"png", "image/png", "eyes")

    assert text == "Một con mèo."
    assert server.body()["model"] == "eyes"
    image = server.body()["messages"][0]["content"][1]["image_url"]["url"]
    assert image == "data:image/png;base64,cG5n"


# ----- STRICT SCHEMAS ----- #

# Everything the app and the evaluation ask for as JSON
SCHEMAS = [
    MCQSchema,
    OpenEndedCreationSchema,
    FlashcardsSchema,
    GapFillSchema,
    MCQGradedSchema,
    OpenEndedGradedSchema,
    DocumentAnalysisSchema,
    JudgeVerdict,
]


def strict_problems(node, path="$"):
    """The rules OpenAI and Anthropic document for strict schemas, checked on a schema."""
    problems = []
    unknown = set(node) - {
        "type", "description", "enum", "const", "$ref", "$defs", "anyOf", "items",
        "properties", "required", "additionalProperties",
    }  # fmt: skip
    if unknown:
        problems.append(f"{path}: {unknown}")
    if "$ref" in node and len(node) > 1:
        problems.append(f"{path}: keywords next to $ref")
    if node.get("type") == "object":
        if node.get("additionalProperties") is not False:
            problems.append(f"{path}: open object")
        if set(node.get("required", [])) != set(node.get("properties", {})):
            problems.append(f"{path}: optional property")
    if node.get("type") == "array" and "items" not in node:
        problems.append(f"{path}: array of anything")
    children = [*node.get("properties", {}).items(), *node.get("$defs", {}).items()]
    children += [
        (f"anyOf{i}", option) for i, option in enumerate(node.get("anyOf", []))
    ]
    if "items" in node:
        children.append(("items", node["items"]))
    for name, child in children:
        problems += strict_problems(child, f"{path}.{name}")
    return problems


def anthropic(request: httpx.Request) -> httpx.Response:
    """Refuses what Anthropic's compatible endpoint documents as a 400."""
    body = json.loads(request.content)
    wanted = body.get("response_format")
    if body.get("temperature", 1) < 1:
        return httpx.Response(400, json={"error": {"message": "temperature"}})
    if wanted is not None:
        schema = wanted.get("json_schema", {})
        if wanted["type"] != "json_schema" or schema.get("strict") is not True:
            return httpx.Response(400, json={"error": {"message": "response_format"}})
        if strict_problems(schema["schema"]):
            return httpx.Response(400, json={"error": {"message": "schema"}})
    return reply("{}")


@pytest.mark.parametrize("schema", SCHEMAS, ids=lambda schema: schema.__name__)
async def test_every_schema_of_the_app_passes_the_strict_rules(schema):
    assert strict_problems(strict_schema(schema.model_json_schema())) == []

    strict = client(anthropic, structured_output="json_schema_strict")
    assert await strict.chat("hi", schema) == "{}"


@pytest.mark.parametrize("mode", ["json_schema", "json_object"])
async def test_the_other_modes_are_refused_by_such_a_provider(mode):
    # Guards the fake provider itself: it must be able to say no
    with pytest.raises(ExceptionInternalError_500, match="400"):
        await client(anthropic, structured_output=mode).chat("hi", MCQSchema)


async def test_the_temperature_is_only_sent_when_asked_for():
    strict = client(anthropic, structured_output="json_schema_strict")

    assert await strict.chat("hi") == "{}"
    with pytest.raises(ExceptionInternalError_500, match="400"):
        await strict.chat("hi", temperature=0)


def test_property_names_are_not_mistaken_for_keywords():
    class Awkward(BaseModel):
        default: str
        minimum: int = 0
        title: str | None = None

    strict = strict_schema(Awkward.model_json_schema())

    assert strict["required"] == ["default", "minimum", "title"]
    assert strict["properties"]["minimum"] == {"type": "integer"}
    assert strict_problems(strict) == []


def test_free_keys_cannot_be_strict():
    class Free(BaseModel):
        scores: dict[str, int]

    with pytest.raises(ValueError, match="free keys"):
        strict_schema(Free.model_json_schema())


# ----- EMBEDDINGS ----- #


async def test_embeddings_come_back_in_the_order_of_the_texts():
    data = [{"index": 1, "embedding": [2.0]}, {"index": 0, "embedding": [1.0]}]
    server = FakeServer(httpx.Response(200, json={"data": data}))

    assert await client(server).embed(["a", "b"], "emb", 1) == [[1.0], [2.0]]
    assert server.body() == {"model": "emb", "input": ["a", "b"]}


@pytest.mark.parametrize(
    "data, problem",
    [
        ([{"index": 0, "embedding": [1.0, 2.0]}], "dimensions"),
        ([], "failed"),
        (None, "failed"),
    ],
)
async def test_unusable_embeddings_are_refused(data, problem):
    server = FakeServer(httpx.Response(200, json={"data": data}))

    with pytest.raises(ExceptionLLMError_502, match=problem):
        await client(server).embed(["a"], "emb", 1)


# ----- FAILURES ----- #


async def test_a_rate_limit_waits_for_the_retry_after_header(sleeps):
    limited = httpx.Response(429, headers={"Retry-After": "6"}, json={})

    assert await client(FakeServer(limited, reply("ok"))).chat("hi") == "ok"
    assert sleeps() == [6]


@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(429, json={"error": {"code": "insufficient_quota"}}),
        httpx.Response(402, json={"error": {"message": "Insufficient credits"}}),
        # Gemini's compatible endpoint keeps Google's own error details, in a list
        httpx.Response(
            429,
            json=[
                {
                    "error": {
                        "details": [
                            {"violations": [{"quotaId": "GenerateRequestsPerDay"}]}
                        ]
                    }
                }
            ],
        ),
    ],
)
async def test_a_spent_quota_fails_at_once(sleeps, response):
    server = FakeServer(response)

    with pytest.raises(ExceptionAIQuota_503):
        await client(server).chat("hi")
    assert len(server.requests) == 1
    assert sleeps() == []


@pytest.mark.parametrize("body", [b"not json", b"[]", b'{"error": "text"}', b"null"])
async def test_a_429_with_an_odd_body_is_a_plain_rate_limit(body):
    odd = httpx.Response(429, content=body)

    assert await client(FakeServer(odd, reply("ok"))).chat("hi") == "ok"


@pytest.mark.parametrize("failure", [httpx.Response(503), httpx.ConnectError("down")])
async def test_overload_and_network_errors_are_retried(failure):
    assert await client(FakeServer(failure, reply("ok"))).chat("hi") == "ok"


async def test_a_timeout_is_not_repeated(sleeps):
    # Repeating it would make a student wait several times the whole timeout
    server = FakeServer(httpx.ReadTimeout("slow"))

    with pytest.raises(ExceptionExternalService_503, match="too long"):
        await client(server).chat("hi")
    assert len(server.requests) == 1
    assert sleeps() == []


async def test_retries_run_out():
    server = FakeServer(*[httpx.Response(529) for _ in range(3)])

    with pytest.raises(ExceptionExternalService_503, match="overloaded"):
        await client(server).chat("hi")


async def test_a_wrong_key_is_not_retried_and_the_providers_text_stays_private():
    server = FakeServer(httpx.Response(401, text="bad key secret-key"))

    with pytest.raises(ExceptionInternalError_500) as caught:
        await client(server).chat("hi")
    assert len(server.requests) == 1
    assert "secret-key" not in caught.value.message


@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(200, json={"error": {"message": "upstream failed"}}),
        httpx.Response(200, json={"choices": []}),
        httpx.Response(200, json=[]),
        httpx.Response(200, content=b"<html>"),
    ],
)
async def test_a_200_that_is_not_an_answer_is_an_error(response):
    with pytest.raises(ExceptionLLMError_502):
        await client(FakeServer(response)).chat("hi")


async def test_an_empty_answer_is_reported():
    with pytest.raises(ExceptionRequest_400):
        await client(FakeServer(reply(""))).chat("hi")


# ----- SECRETS AND COST ----- #


async def test_the_log_shows_the_cost_of_the_feature_but_no_content_or_key(caplog):
    caplog.set_level(logging.INFO, logger=llm_retry.__name__)
    server = FakeServer(reply("Cu Đỏ.", prompt_tokens=90, completion_tokens=4))
    await client(server).chat("Con gà tên gì?", operation="chat")

    line = caplog.records[-1].getMessage()
    assert "provider=provider.test operation=chat model=small" in line
    assert "input_tokens=90 output_tokens=4" in line
    assert "Cu Đỏ" not in line and "gà" not in line and "secret-key" not in line


def test_the_key_is_not_in_the_endpoints_text():
    endpoint = client(FakeServer()).endpoint

    assert "secret-key" not in repr(endpoint)
    assert endpoint.label == "small@provider.test"


# ----- SWITCHING PROVIDER BY CONFIGURATION ----- #


@pytest.fixture
def provider(monkeypatch):
    """Every task of the app on the fake provider, through settings only."""
    server = FakeServer()
    for name, value in {
        "OPENAI_COMPATIBLE_BASE_URL": "https://provider.test/v1",
        "OPENAI_COMPATIBLE_API_KEY": "secret-key",
        "OPENAI_COMPATIBLE_MODEL": "small",
        "OPENAI_COMPATIBLE_EMBED_MODEL": "emb",
        "OPENAI_COMPATIBLE_VISION_MODEL": "eyes",
        "MODEL_IN_USE_EMBED": "OPENAI_COMPATIBLE",
    }.items():
        monkeypatch.setattr(settings, name, value)
    original = openai_compatible.OpenAICompatibleClient
    monkeypatch.setattr(
        ai_api,
        "OpenAICompatibleClient",
        lambda endpoint: original(endpoint, httpx.MockTransport(server)),
    )
    return server


async def test_the_provider_answers_like_any_other(provider):
    provider.answers = [reply('{"ok": true}'), reply("Một con mèo.")]
    image = UploadFile(BytesIO(b"png"), filename="a.png")

    assert await OpenAICompatibleAPI.generate_content("hi", Verdict) == '{"ok": true}'
    assert await OpenAICompatibleAPI.caption_image(image) == "Một con mèo."
    assert provider.body(1)["model"] == "eyes"


async def test_mass_embed_follows_the_embedding_provider_not_the_chat_one(
    provider, monkeypatch
):
    # It used to check the chat provider, so an unrelated setting could break uploads
    monkeypatch.setattr(settings, "MODEL_IN_USE_GENERATE_CHAT", "SOMETHING_ELSE")
    vector = [0.5] * settings.DEFAULT_EMBED_DIMENSIONALITY_CLOUDFLARE
    provider.answers = [
        httpx.Response(200, json={"data": [{"index": 0, "embedding": vector}]})
    ]

    assert await real_mass_embed(["a"]) == [vector]


def test_selecting_the_provider_without_configuring_it_fails_at_startup():
    with pytest.raises(ValidationError) as caught:
        Settings(
            _env_file=None, **REQUIRED, MODEL_IN_USE_GENERATE_CHAT="OPENAI_COMPATIBLE"
        )  # type: ignore[arg-type]

    assert "OPENAI_COMPATIBLE_BASE_URL" in str(caught.value)
    assert "OPENAI_COMPATIBLE_MODEL" in str(caught.value)


def test_a_configured_provider_is_accepted():
    configured = Settings(
        _env_file=None,
        **REQUIRED,
        MODEL_IN_USE_GENERATE_CHAT="openai_compatible",
        OPENAI_COMPATIBLE_BASE_URL="https://provider.test/v1",
        OPENAI_COMPATIBLE_MODEL="small",
    )  # type: ignore[arg-type]

    assert configured.MODEL_IN_USE_GENERATE_CHAT == "OPENAI_COMPATIBLE"
    assert "small" in configured.answer_model("OPENAI_COMPATIBLE")
