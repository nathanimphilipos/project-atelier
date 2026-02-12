"""GovRAMP progress tracking tables

Revision ID: 002
Revises: 001
Create Date: 2025-02-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "govramp_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("period", sa.String(), nullable=False),
        sa.Column("snapshot_score", sa.Float(), nullable=True),
        sa.Column("core_implemented", sa.Integer(), server_default="0"),
        sa.Column("core_required", sa.Integer(), server_default="60"),
        sa.Column("ready_implemented", sa.Integer(), server_default="0"),
        sa.Column("ready_required", sa.Integer(), server_default="80"),
        sa.Column("authorized_implemented", sa.Integer(), server_default="0"),
        sa.Column("authorized_required", sa.Integer(), server_default="319"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "govramp_progress",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("tier", sa.String(), nullable=False),
        sa.Column("total_controls", sa.Integer(), nullable=False),
        sa.Column("completed_controls", sa.Integer(), server_default="0"),
        sa.Column("completion_pct", sa.Float(), server_default="0.0"),
        sa.Column("missing_control_ids", sa.JSON(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("govramp_progress")
    op.drop_table("govramp_snapshots")
