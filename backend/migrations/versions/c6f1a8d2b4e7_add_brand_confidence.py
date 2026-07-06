"""add brand confidence fields

Revision ID: c6f1a8d2b4e7
Revises: ad9c8ed540c2
Create Date: 2026-07-06 23:21:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c6f1a8d2b4e7"
down_revision: Union[str, Sequence[str], None] = "ad9c8ed540c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("train_cars", sa.Column("brand_confidence", sa.Float(), nullable=True))
    op.add_column("train_cars", sa.Column("brand_source", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("train_cars", "brand_source")
    op.drop_column("train_cars", "brand_confidence")
