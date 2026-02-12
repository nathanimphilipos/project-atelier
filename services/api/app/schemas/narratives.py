from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NarrativeGenerateRequest(BaseModel):
    control_id: str
    evidence_ids: list[int] = []
    narrative_text: Optional[str] = None
    feedback_id: Optional[int] = None


class NarrativeOut(BaseModel):
    id: int
    control_id: str
    version: int
    narrative_text: str
    scoring_inputs_json: Optional[dict] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_used: Optional[str] = None
    prompt_version: Optional[str] = None
    inputs_json: Optional[dict] = None

    class Config:
        from_attributes = True


class AssessmentOut(BaseModel):
    id: int
    control_id: str
    meets_status: str
    confidence_score: int
    score_rationale_json: Optional[dict] = None
    created_at: Optional[datetime] = None
    model_used: Optional[str] = None
    prompt_version: Optional[str] = None

    class Config:
        from_attributes = True
