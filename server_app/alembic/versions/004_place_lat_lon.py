"""Add lat/lon columns to places

Revision ID: 004_place_lat_lon
Revises: 003_cluster_id
Create Date: 2026-03-26
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004_place_lat_lon"
down_revision: Union[str, Sequence[str], None] = "003_cluster_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "places",
        sa.Column("lat", sa.Float(), nullable=True),
    )
    op.add_column(
        "places",
        sa.Column("lon", sa.Float(), nullable=True),
    )

    op.create_index("ix_places_lat", "places", ["lat"])
    op.create_index("ix_places_lon", "places", ["lon"])


def downgrade() -> None:
    op.drop_index("ix_places_lon", table_name="places")
    op.drop_index("ix_places_lat", table_name="places")
    op.drop_column("places", "lon")
    op.drop_column("places", "lat")

