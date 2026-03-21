"""Add special_offers table

Revision ID: 002_special_offers
Revises: 001_embedding
Create Date: 2025-03-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_special_offers"
down_revision: Union[str, Sequence[str], None] = "001_embedding"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "special_offers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("place_id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("discount_percent", sa.Numeric(5, 2), nullable=True),
        sa.Column("special_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["place_id"], ["places.place_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["business_id"], ["business_representatives.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_special_offers_id"), "special_offers", ["id"], unique=False)
    op.create_index(op.f("ix_special_offers_place_id"), "special_offers", ["place_id"], unique=False)
    op.create_index(op.f("ix_special_offers_business_id"), "special_offers", ["business_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_special_offers_business_id"), table_name="special_offers")
    op.drop_index(op.f("ix_special_offers_place_id"), table_name="special_offers")
    op.drop_index(op.f("ix_special_offers_id"), table_name="special_offers")
    op.drop_table("special_offers")
