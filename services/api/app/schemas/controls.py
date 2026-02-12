from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ControlOut(BaseModel):
    control_id: str
    family: str
    title: str
    control_text: str
    discussion: Optional[str] = None
    enhancements: Optional[str] = None
    status: str = "not_started"
    updated_at: Optional[datetime] = None
    evidence_count: int = 0
    latest_confidence_score: Optional[int] = None

    class Config:
        from_attributes = True


class ControlDetail(BaseModel):
    control_id: str
    family: str
    title: str
    control_text: str
    discussion: Optional[str] = None
    enhancements: Optional[str] = None
    status: str = "not_started"
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LinkEvidenceRequest(BaseModel):
    evidence_ids: list[int]
    relevance_note: Optional[str] = None
