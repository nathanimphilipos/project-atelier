from pydantic import BaseModel
from typing import Optional, Any


class GovRAMPSnapshotOut(BaseModel):
    id: int
    period: str
    snapshot_score: Optional[float] = None
    core_implemented: int
    core_required: int
    ready_implemented: int
    ready_required: int
    authorized_implemented: int
    authorized_required: int

    class Config:
        from_attributes = True


class GovRAMPProgressOut(BaseModel):
    id: int
    tier: str
    total_controls: int
    completed_controls: int
    completion_pct: float
    missing_control_ids: Optional[list[str]] = None

    class Config:
        from_attributes = True


class GovRAMPProgressUpdate(BaseModel):
    completion_pct: float
    missing_control_ids: Optional[list[str]] = None


class GovRAMPDashboard(BaseModel):
    tiers: list[GovRAMPProgressOut]
    snapshots: list[GovRAMPSnapshotOut]


class GovRAMPFeedbackOut(BaseModel):
    id: int
    control_id: str
    control_name: Optional[str] = None
    family: Optional[str] = None
    control_completed: bool
    score: Optional[float] = None
    month_last_passed: Optional[str] = None
    latest_period: Optional[str] = None
    latest_status: Optional[str] = None
    latest_feedback: Optional[str] = None
    issues: Optional[list[str]] = None
    feedback_history: Optional[dict[str, str]] = None

    class Config:
        from_attributes = True


class GovRAMPFeedbackSummary(BaseModel):
    total: int
    status_counts: dict[str, int]


class GovRAMPStats(BaseModel):
    total_controls: int
    controls_assessed: int
    avg_confidence: Optional[float]
    tiers: dict[str, dict[str, Any]]
    latest_snapshot_score: Optional[float]
    latest_snapshot_period: Optional[str]
    feedback_summary: Optional[GovRAMPFeedbackSummary] = None


class GovRAMPFeedbackUploadResult(BaseModel):
    imported: int
    latest_period: Optional[str] = None
