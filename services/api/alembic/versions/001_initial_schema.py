"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "controls",
        sa.Column("control_id", sa.String(), primary_key=True),
        sa.Column("family", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("control_text", sa.Text(), nullable=False),
        sa.Column("discussion", sa.Text(), nullable=True),
        sa.Column("enhancements", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), server_default="not_started"),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_controls_control_id", "controls", ["control_id"])
    op.create_index("ix_controls_family", "controls", ["family"])

    op.create_table(
        "evidence",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("filepath", sa.String(), nullable=False),
        sa.Column("filetype", sa.String(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("vision_summary_json", sa.JSON(), nullable=True),
        sa.Column("source_system", sa.String(), nullable=True),
        sa.Column("owner", sa.String(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("sha256_hash", sa.String(), nullable=False, unique=True),
    )

    op.create_table(
        "control_evidence",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("control_id", sa.String(), sa.ForeignKey("controls.control_id"), nullable=False),
        sa.Column("evidence_id", sa.Integer(), sa.ForeignKey("evidence.id"), nullable=False),
        sa.Column("relevance_note", sa.Text(), nullable=True),
    )
    op.create_index("ix_control_evidence_control_id", "control_evidence", ["control_id"])
    op.create_index("ix_control_evidence_evidence_id", "control_evidence", ["evidence_id"])

    op.create_table(
        "narratives",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("control_id", sa.String(), sa.ForeignKey("controls.control_id"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("narrative_text", sa.Text(), nullable=False),
        sa.Column("scoring_inputs_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("model_used", sa.String(), nullable=True),
        sa.Column("prompt_version", sa.String(), nullable=True),
        sa.Column("inputs_json", sa.JSON(), nullable=True),
    )
    op.create_index("ix_narratives_control_id", "narratives", ["control_id"])

    op.create_table(
        "auditor_feedback",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("control_id", sa.String(), sa.ForeignKey("controls.control_id"), nullable=False),
        sa.Column("filename", sa.String(), nullable=True),
        sa.Column("extracted_text", sa.Text(), nullable=False),
        sa.Column("findings_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_auditor_feedback_control_id", "auditor_feedback", ["control_id"])

    op.create_table(
        "assessments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("control_id", sa.String(), sa.ForeignKey("controls.control_id"), nullable=False),
        sa.Column("meets_status", sa.String(), nullable=False),
        sa.Column("confidence_score", sa.Integer(), nullable=False),
        sa.Column("score_rationale_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("model_used", sa.String(), nullable=True),
        sa.Column("prompt_version", sa.String(), nullable=True),
    )
    op.create_index("ix_assessments_control_id", "assessments", ["control_id"])

    op.create_table(
        "boards",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "cards",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("board_id", sa.Integer(), sa.ForeignKey("boards.id"), nullable=False),
        sa.Column("column", sa.String(), nullable=False, server_default="todo"),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("owner", sa.String(), nullable=True),
        sa.Column("due_date", sa.String(), nullable=True),
        sa.Column("linked_control_ids", sa.JSON(), nullable=True),
        sa.Column("linked_evidence_ids", sa.JSON(), nullable=True),
        sa.Column("linked_narrative_id", sa.Integer(), nullable=True),
        sa.Column("source_row_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_cards_board_id", "cards", ["board_id"])

    op.create_table(
        "crosswalk",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nist_control_id", sa.String(), nullable=False),
        sa.Column("soc2_target", sa.String(), nullable=False),
        sa.Column("evidence_objective", sa.Text(), nullable=True),
    )
    op.create_index("ix_crosswalk_nist_control_id", "crosswalk", ["nist_control_id"])
    op.create_index("ix_crosswalk_soc2_target", "crosswalk", ["soc2_target"])

    op.create_table(
        "soc2_evidence_links",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("soc2_target", sa.String(), nullable=False),
        sa.Column("evidence_id", sa.Integer(), sa.ForeignKey("evidence.id"), nullable=False),
        sa.Column("control_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_soc2_evidence_links_soc2_target", "soc2_evidence_links", ["soc2_target"])


def downgrade() -> None:
    op.drop_table("soc2_evidence_links")
    op.drop_table("crosswalk")
    op.drop_table("cards")
    op.drop_table("boards")
    op.drop_table("assessments")
    op.drop_table("auditor_feedback")
    op.drop_table("narratives")
    op.drop_table("control_evidence")
    op.drop_table("evidence")
    op.drop_table("controls")
