"""Alembic environment: async engine, URL and metadata taken from the application itself."""

import asyncio
import importlib
import pkgutil
from logging.config import fileConfig

from alembic import context
from pgvector.sqlalchemy import Vector
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

from backend.src import models_schema
from backend.src.core.config import settings

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

# Import every model module so SQLModel.metadata knows all tables (same set the app creates)
for module in pkgutil.walk_packages(
    models_schema.__path__, models_schema.__name__ + "."
):
    importlib.import_module(module.name)

target_metadata = SQLModel.metadata


def render_item(type_, obj, autogen_context):
    """Render pgvector columns with their own import instead of a dotted path."""
    if type_ == "type" and isinstance(obj, Vector):
        autogen_context.imports.add("import pgvector.sqlalchemy")
        return (
            f"pgvector.sqlalchemy.Vector({obj.dim})"
            if obj.dim
            else "pgvector.sqlalchemy.Vector()"
        )
    return False


def run_migrations_offline() -> None:
    context.configure(
        url=str(settings.POSTGRES_URL),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_item=render_item,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        render_item=render_item,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = create_async_engine(str(settings.POSTGRES_URL), poolclass=pool.NullPool)
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
