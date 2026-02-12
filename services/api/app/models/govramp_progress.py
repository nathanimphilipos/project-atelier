from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime, Boolean, func
from app.database import Base


class GovRAMPSnapshot(Base):
    __tablename__ = "govramp_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    period = Column(String, nullable=False)  # e.g. "202601"
    snapshot_score = Column(Float, nullable=True)
    core_implemented = Column(Integer, default=0)
    core_required = Column(Integer, default=60)
    ready_implemented = Column(Integer, default=0)
    ready_required = Column(Integer, default=80)
    authorized_implemented = Column(Integer, default=0)
    authorized_required = Column(Integer, default=319)
    created_at = Column(DateTime, server_default=func.now())


class GovRAMPProgress(Base):
    __tablename__ = "govramp_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tier = Column(String, nullable=False)  # "ps", "ready", "core", "authorized"
    total_controls = Column(Integer, nullable=False)
    completed_controls = Column(Integer, default=0)
    completion_pct = Column(Float, default=0.0)
    missing_control_ids = Column(JSON, nullable=True)  # ["IA-05", "AC-02", ...]
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class GovRAMPFeedback(Base):
    __tablename__ = "govramp_pmo_feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    control_id = Column(String, nullable=False, index=True)
    control_name = Column(String, nullable=True)
    family = Column(String, nullable=True)
    control_completed = Column(Boolean, default=False)
    score = Column(Float, nullable=True)
    month_last_passed = Column(String, nullable=True)
    latest_period = Column(String, nullable=True)
    latest_status = Column(String, nullable=True)
    latest_feedback = Column(Text, nullable=True)
    issues = Column(JSON, nullable=True)
    feedback_history = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
