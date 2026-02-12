from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class AuditorFeedback(Base):
    __tablename__ = "auditor_feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    control_id = Column(String, ForeignKey("controls.control_id"), nullable=False, index=True)
    filename = Column(String, nullable=True)
    extracted_text = Column(Text, nullable=False)
    findings_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    control = relationship("Control", back_populates="feedback")
