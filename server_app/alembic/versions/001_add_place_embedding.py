"""Add embedding column to places

Revision ID: 001_embedding
Revises: 
Create Date: 2025-03-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, DOUBLE_PRECISION

revision: str = "001_embedding"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "places",
        sa.Column("embedding", ARRAY(DOUBLE_PRECISION), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("places", "embedding")
