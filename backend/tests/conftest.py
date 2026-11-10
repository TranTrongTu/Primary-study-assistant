from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, text

from backend.src.core.ai_api import GlobalAPI
from backend.src.core.config import settings
from backend.src.core.database import get_async_session
from backend.src.main import FastAPI, app

# ----- TEST CONFIGURATIONS ----- #

# Safety net: the fixtures below drop every table, so refuse to run against the app DB.
if settings.POSTGRES_URL_TEST is None:
    raise pytest.UsageError(
        "POSTGRES_URL_TEST is not set. Point it at a separate, disposable database."
    )

if str(settings.POSTGRES_URL_TEST) == str(settings.POSTGRES_URL):
    raise pytest.UsageError(
        "POSTGRES_URL_TEST points to the same database as POSTGRES_URL. "
        "Tests drop all tables; use a separate test database."
    )

engine = create_async_engine(
    str(settings.POSTGRES_URL_TEST),
    poolclass=NullPool,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)



# ----- NO REAL AI CALLS IN TESTS ----- #

_DIM = settings.DEFAULT_EMBED_DIMENSIONALITY_CLOUDFLARE


def _unmocked(name: str) -> AsyncMock:
    async def _raise(*args, **kwargs):
        raise RuntimeError(
            f"GlobalAPI.{name} was called in a test without a mock. "
            "Tests must never reach a real AI provider."
        )

    return AsyncMock(side_effect=_raise)


@pytest.fixture(autouse=True)
def block_external_ai_calls():
    """Every test runs without network access to Gemini/Cloudflare/Ollama.

    Cheap, deterministic stand-ins are returned for embeddings, captions and prompt
    rewriting. Generation that needs structured output raises unless the test
    patches it explicitly (patch.object on GlobalAPI still overrides these).
    """

    async def fake_mass_embed(contents):
        return [[0.1] * _DIM for _ in contents]

    with (
        patch.object(GlobalAPI, "embed", AsyncMock(return_value=[0.1] * _DIM)),
        patch.object(GlobalAPI, "mass_embed", AsyncMock(side_effect=fake_mass_embed)),
        patch.object(GlobalAPI, "caption_image", AsyncMock(return_value="Mock caption")),
        patch.object(GlobalAPI, "rewrite_prompt", AsyncMock(side_effect=lambda p: p)),
        patch.object(GlobalAPI, "generate_chat", _unmocked("generate_chat")),
        patch.object(GlobalAPI, "generate_material", _unmocked("generate_material")),
        patch.object(GlobalAPI, "grade_answers", _unmocked("grade_answers")),
        patch.object(
            GlobalAPI,
            "generate_document_analysis",
            _unmocked("generate_document_analysis"),
        ),
        patch.object(
            GlobalAPI,
            "generate_study_assessment",
            _unmocked("generate_study_assessment"),
        ),
    ):
        yield

@pytest.fixture(name="session")
async def session_fixture():
    # Setup
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
        await conn.run_sync(SQLModel.metadata.create_all)

    # Yield session
    async with SessionLocal() as session:
        yield session

    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture(name="app")
async def app_fixture(session: AsyncSession):
    async def override_get_async_session():
        async with SessionLocal() as session:
            yield session

    app.dependency_overrides[get_async_session] = override_get_async_session

    yield app

    app.dependency_overrides.clear()


@pytest.fixture(name="client")
async def client_fixture(app: FastAPI):
    transport = ASGITransport(app)

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# Imports other fixtures

pytest_plugins = [
    "backend.tests.fixtures.auth",
    "backend.tests.fixtures.interactions",
    "backend.tests.fixtures.documents",
    "backend.tests.fixtures.llm_responses",
]
