"""add govramp pmo feedback table

Revision ID: 003_govramp_pmo_feedback
Revises: 002_govramp_progress
Create Date: 2026-02-12 19:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "003_govramp_pmo_feedback"
down_revision = "002_govramp_progress"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "govramp_pmo_feedback",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("control_id", sa.String(), nullable=False),
        sa.Column("control_name", sa.String(), nullable=True),
        sa.Column("family", sa.String(), nullable=True),
        sa.Column("control_completed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("month_last_passed", sa.String(), nullable=True),
        sa.Column("latest_period", sa.String(), nullable=True),
        sa.Column("latest_status", sa.String(), nullable=True),
        sa.Column("latest_feedback", sa.Text(), nullable=True),
        sa.Column("issues", sa.JSON(), nullable=True),
        sa.Column("feedback_history", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_govramp_pmo_feedback_control_id", "govramp_pmo_feedback", ["control_id"])


def downgrade() -> None:
    op.drop_index("ix_govramp_pmo_feedback_control_id", table_name="govramp_pmo_feedback")
    op.drop_table("govramp_pmo_feedback")
