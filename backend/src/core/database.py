import asyncio
import logging
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from backend.src.core.config import settings

logger = logging.getLogger(__name__)

# The app always uses POSTGRES_URL. POSTGRES_URL_TEST is reserved for pytest,
# which drops every table after each test, so the two must never be the same DB.
engine = create_async_engine(
    str(settings.POSTGRES_URL),
    # SQL logging only in dev: in production it floods logs and writes user data to them
    echo=settings.DEV_MODE,
    # Small on purpose: managed Postgres (Neon free) allows few connections, and a request
    # waiting on an LLM holds its connection. Tune with DB_POOL_SIZE / DB_MAX_OVERFLOW.
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=30.0,
    pool_pre_ping=True,
    pool_recycle=300,
)


# The migration scripts ship inside the backend package, so the runtime image (which
# only copies ./backend) has them. Built in code instead of reading alembic.ini.
MIGRATIONS_DIR = Path(__file__).resolve().parents[2] / "migrations"
BASELINE_REVISION = "0001"


def _alembic_config() -> Config:
    config = Config()
    config.set_main_option("script_location", str(MIGRATIONS_DIR))
    return config


def _is_unversioned_legacy_database(sync_conn) -> bool:
    """True for a database created by the old create_all() startup: tables, no history."""
    tables = inspect(sync_conn).get_table_names()
    return "alembic_version" not in tables and "user" in tables


async def migrate_database() -> None:
    """Bring the schema to the latest revision. Safe to run on every startup."""
    async with engine.connect() as conn:
        legacy = await conn.run_sync(_is_unversioned_legacy_database)

    config = _alembic_config()
    # Alembic's env.py runs its own event loop, so it must not run on ours
    if legacy:
        # Schema already matches the baseline: record that instead of re-creating tables
        logger.info(
            "Existing schema without migration history: stamping %s", BASELINE_REVISION
        )
        await asyncio.to_thread(command.stamp, config, BASELINE_REVISION)
    await asyncio.to_thread(command.upgrade, config, "head")


async def dispose():
    await engine.dispose()


async def reset_database():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)


SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_async_session():
    async with SessionLocal() as session:
        yield session
