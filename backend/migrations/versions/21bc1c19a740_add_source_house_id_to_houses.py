"""add source_house_id to houses

Revision ID: 21bc1c19a740
Revises: 3d7d8b060780
Create Date: 2025-12-23 18:00:18.219898

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '21bc1c19a740'
down_revision: Union[str, Sequence[str], None] = '3d7d8b060780'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "houses",
        sa.Column("source_house_id", sa.String(length=64), nullable=True)
    )
    op.create_index(
        "ix_houses_source_house_id",
        "houses",
        ["source_house_id"],
        unique=True
    )


def downgrade():
    op.drop_index("ix_houses_source_house_id", table_name="houses")
    op.drop_column("houses", "source_house_id")
