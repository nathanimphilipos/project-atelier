from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class BoardOut(BaseModel):
    id: int
    name: str
    created_at: Optional[datetime] = None
    card_count: int = 0

    class Config:
        from_attributes = True


class CardCreate(BaseModel):
    title: str
    description: Optional[str] = None
    column: str = "todo"
    owner: Optional[str] = None
    due_date: Optional[str] = None
    linked_control_ids: Optional[list[str]] = None
    linked_evidence_ids: Optional[list[int]] = None
    linked_narrative_id: Optional[int] = None
    source_row_id: Optional[str] = None


class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    column: Optional[str] = None
    owner: Optional[str] = None
    due_date: Optional[str] = None
    linked_control_ids: Optional[list[str]] = None
    linked_evidence_ids: Optional[list[int]] = None
    linked_narrative_id: Optional[int] = None


class CardOut(BaseModel):
    id: int
    board_id: int
    column: str
    title: str
    description: Optional[str] = None
    owner: Optional[str] = None
    due_date: Optional[str] = None
    linked_control_ids: Optional[Any] = None
    linked_evidence_ids: Optional[Any] = None
    linked_narrative_id: Optional[int] = None
    source_row_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
