"""add the unaccent extension

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-11

Keyword search compares the question and the chunks with diacritics removed, so
a question typed without Vietnamese tone marks ("phan so la gi") still matches
"phân số". unaccent() comes from this extension.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")


def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS unaccent")
