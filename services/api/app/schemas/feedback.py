from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FeedbackCreate(BaseModel):
    text: Optional[str] = None


class FeedbackOut(BaseModel):
    id: int
    control_id: str
    filename: Optional[str] = None
    extracted_text: str
    findings_json: Optional[dict] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
