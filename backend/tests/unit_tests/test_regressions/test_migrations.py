"""
The Alembic migrations must describe exactly the schema the models define.

Without this check a model change that forgets its migration would pass every other
test (they build tables from the models) and only fail on the real database.
"""

import asyncio
import uuid

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

from backend.src.core import database
from backend.src.core.config import settings


@pytest.fixture
async def scratch_database_url(monkeypatch):
    """An empty database next to the test database, removed afterwards."""
    base_url = make_url(str(settings.POSTGRES_URL_TEST))
    name = f"migration_check_{uuid.uuid4().hex[:8]}"

    admin = create_async_engine(base_url, isolation_level="AUTOCOMMIT")
    async with admin.connect() as conn:
        await conn.execute(text(f'CREATE DATABASE "{name}"'))

    url = base_url.set(database=name)
    # env.py reads the URL from settings, exactly like the app does
    monkeypatch.setattr(
        settings, "POSTGRES_URL", url.render_as_string(hide_password=False)
    )
    try:
        yield url
    finally:
        async with admin.connect() as conn:
            await conn.execute(text(f'DROP DATABASE IF EXISTS "{name}" WITH (FORCE)'))
        await admin.dispose()


async def test_migrations_build_the_schema_the_models_describe(scratch_database_url):
    config = database._alembic_config()
    await asyncio.to_thread(command.upgrade, config, "head")

    engine = create_async_engine(scratch_database_url)
    try:
        async with engine.connect() as conn:

            def differences(sync_conn):
                context = MigrationContext.configure(
                    sync_conn, opts={"compare_type": True}
                )
                return compare_metadata(context, SQLModel.metadata)

            assert await conn.run_sync(differences) == []
    finally:
        await engine.dispose()


async def test_downgrade_removes_everything_it_created(scratch_database_url):
    config = database._alembic_config()
    await asyncio.to_thread(command.upgrade, config, "head")
    await asyncio.to_thread(command.downgrade, config, "base")

    engine = create_async_engine(scratch_database_url)
    try:
        async with engine.connect() as conn:
            tables = await conn.run_sync(lambda c: set(inspect(c).get_table_names()))
            leftover_types = (
                (
                    await conn.execute(
                        text("SELECT typname FROM pg_type WHERE typtype = 'e'")
                    )
                )
                .scalars()
                .all()
            )
    finally:
        await engine.dispose()

    assert tables == {"alembic_version"}
    assert leftover_types == []


async def test_database_created_before_migrations_is_stamped_not_recreated(
    scratch_database_url, monkeypatch
):
    """The production database was built by create_all(): it must keep its data."""
    engine = create_async_engine(scratch_database_url)
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        await conn.run_sync(SQLModel.metadata.create_all)
        await conn.execute(
            text(
                'INSERT INTO "user" (username, email, description, hashed_password, '
                "login_streak, longest_login_streak, created_at) "
                "VALUES ('kept', 'kept@example.com', '', 'x', 0, 0, now())"
            )
        )

    # Point the app's engine at the scratch database for this check
    monkeypatch.setattr(database, "engine", engine)
    await database.migrate_database()

    try:
        async with engine.connect() as conn:
            version = (
                await conn.execute(text("SELECT version_num FROM alembic_version"))
            ).scalar_one()
            kept = (
                await conn.execute(text('SELECT count(*) FROM "user"'))
            ).scalar_one()
    finally:
        await engine.dispose()

    assert version == "0001"
    assert kept == 1
