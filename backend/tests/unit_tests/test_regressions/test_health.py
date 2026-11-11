"""
The /health endpoint backs the container HEALTHCHECK, so it has to reflect the
database: 200 when a query works, 503 when it does not.
"""

from fastapi import FastAPI
from httpx import AsyncClient

from backend.src.core.database import get_async_session


async def test_health_ok_when_database_answers(client: AsyncClient):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_health_503_when_database_is_unreachable(
    app: FastAPI, client: AsyncClient
):
    class BrokenSession:
        async def execute(self, *args, **kwargs):
            raise ConnectionError("database is down")

    async def broken_session():
        yield BrokenSession()

    app.dependency_overrides[get_async_session] = broken_session

    response = await client.get("/health")

    assert response.status_code == 503
    assert response.json() == {"status": "unavailable"}


async def test_health_is_not_in_the_openapi_schema(client: AsyncClient):
    schema = (await client.get("/openapi.json")).json()

    assert "/health" not in schema["paths"]
