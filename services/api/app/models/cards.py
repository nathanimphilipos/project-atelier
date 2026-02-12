from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    board_id = Column(Integer, ForeignKey("boards.id"), nullable=False, index=True)
    column = Column(String, nullable=False, default="todo")
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    linked_control_ids = Column(JSON, nullable=True)
    linked_evidence_ids = Column(JSON, nullable=True)
    linked_narrative_id = Column(Integer, nullable=True)
    source_row_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    board = relationship("Board", back_populates="cards")
