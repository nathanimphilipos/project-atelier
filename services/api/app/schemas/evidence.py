from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class EvidenceOut(BaseModel):
    id: int
    filename: str
    filepath: str
    filetype: str
    uploaded_at: Optional[datetime] = None
    extracted_text: Optional[str] = None
    vision_summary_json: Optional[dict] = None
    source_system: Optional[str] = None
    owner: Optional[str] = None
    tags: Optional[Any] = None
    sha256_hash: str
    linked_controls: list[str] = []
    linked_soc2_targets: list[str] = []

    class Config:
        from_attributes = True
