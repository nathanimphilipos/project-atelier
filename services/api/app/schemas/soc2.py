from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CrosswalkOut(BaseModel):
    id: int
    nist_control_id: str
    soc2_target: str
    evidence_objective: Optional[str] = None

    class Config:
        from_attributes = True


class SOC2TargetSummary(BaseModel):
    soc2_target: str
    evidence_objective: Optional[str] = None
    nist_control_ids: list[str] = []
    linked_evidence_count: int = 0
    satisfied: bool = False


class SOC2LinkRequest(BaseModel):
    soc2_target: str
    evidence_id: int
    control_id: Optional[str] = None


class SOC2EvidenceLinkOut(BaseModel):
    id: int
    soc2_target: str
    evidence_id: int
    control_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
