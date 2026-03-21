"""Add cluster_id column to places

Revision ID: 003_cluster_id
Revises: 002_special_offers
Create Date: 2025-03-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003_cluster_id"
down_revision: Union[str, Sequence[str], None] = "002_special_offers"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add cluster_id column
    op.add_column(
        "places",
        sa.Column("cluster_id", sa.String(64), nullable=True),
    )
    
    # Create foreign key constraint
    op.create_foreign_key(
        "places_cluster_id_fkey",
        "places",
        "clusters",
        ["cluster_id"],
        ["id"],
    )
    
    # Create index on cluster_id
    op.create_index("ix_places_cluster_id", "places", ["cluster_id"])


def downgrade() -> None:
    op.drop_index("ix_places_cluster_id", table_name="places")
    op.drop_constraint("places_cluster_id_fkey", "places", type_="foreignkey")
    op.drop_column("places", "cluster_id")
