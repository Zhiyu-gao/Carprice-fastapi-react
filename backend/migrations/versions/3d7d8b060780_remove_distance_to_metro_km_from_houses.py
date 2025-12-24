"""remove distance_to_metro_km from houses

Revision ID: 3d7d8b060780
Revises: 686c19501690
Create Date: 2025-12-23 17:48:23.531039

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3d7d8b060780'
down_revision: Union[str, Sequence[str], None] = '686c19501690'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.drop_column("houses", "distance_to_metro_km")

def downgrade():
    op.add_column(
        "houses",
        sa.Column("distance_to_metro_km", sa.Float(), nullable=True)
    )

