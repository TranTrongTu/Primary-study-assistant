"""fix embedding dimension to 1024

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-11

The embedding column had no fixed size, so vectors from different providers
(768-d Google/Ollama, 1024-d Cloudflare) could be mixed in one column.
Existing rows must already be 1024-d (the cast fails loudly otherwise).
"""

from typing import Sequence, Union

import pgvector.sqlalchemy
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "document_chunk",
        "content_embedded",
        existing_type=pgvector.sqlalchemy.Vector(),
        type_=pgvector.sqlalchemy.Vector(1024),
        existing_nullable=True,
        postgresql_using="content_embedded::vector(1024)",
    )


def downgrade() -> None:
    op.alter_column(
        "document_chunk",
        "content_embedded",
        existing_type=pgvector.sqlalchemy.Vector(1024),
        type_=pgvector.sqlalchemy.Vector(),
        existing_nullable=True,
        postgresql_using="content_embedded::vector",
    )
