import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, text

from backend.src.core.config import settings
from backend.src.core.database import get_async_session
from backend.src.main import FastAPI, app

# ----- TEST CONFIGURATIONS ----- #

engine = create_async_engine(
    str(settings.POSTGRES_URL_TEST),
    poolclass=NullPool,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


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
