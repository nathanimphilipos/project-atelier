from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    control_id = Column(String, ForeignKey("controls.control_id"), nullable=False, index=True)
    meets_status = Column(String, nullable=False)
    confidence_score = Column(Integer, nullable=False)
    score_rationale_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    model_used = Column(String, nullable=True)
    prompt_version = Column(String, nullable=True)

    control = relationship("Control", back_populates="assessments")
