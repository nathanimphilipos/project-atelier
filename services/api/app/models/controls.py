from sqlalchemy import Column, String, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class Control(Base):
    __tablename__ = "controls"

    control_id = Column(String, primary_key=True, index=True)
    family = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    control_text = Column(Text, nullable=False)
    discussion = Column(Text, nullable=True)
    enhancements = Column(Text, nullable=True)
    status = Column(String, default="not_started")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    evidence_links = relationship("ControlEvidence", back_populates="control")
    narratives = relationship("Narrative", back_populates="control", order_by="desc(Narrative.created_at)")
    feedback = relationship("AuditorFeedback", back_populates="control", order_by="desc(AuditorFeedback.created_at)")
    assessments = relationship("Assessment", back_populates="control", order_by="desc(Assessment.created_at)")
