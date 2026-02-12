from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class ControlEvidence(Base):
    __tablename__ = "control_evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    control_id = Column(String, ForeignKey("controls.control_id"), nullable=False, index=True)
    evidence_id = Column(Integer, ForeignKey("evidence.id"), nullable=False, index=True)
    relevance_note = Column(Text, nullable=True)

    control = relationship("Control", back_populates="evidence_links")
    evidence = relationship("Evidence", back_populates="control_links")
