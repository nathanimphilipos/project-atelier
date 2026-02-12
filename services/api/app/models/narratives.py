from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Narrative(Base):
    __tablename__ = "narratives"

    id = Column(Integer, primary_key=True, autoincrement=True)
    control_id = Column(String, ForeignKey("controls.control_id"), nullable=False, index=True)
    version = Column(Integer, nullable=False, default=1)
    narrative_text = Column(Text, nullable=False)
    scoring_inputs_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    model_used = Column(String, nullable=True)
    prompt_version = Column(String, nullable=True)
    inputs_json = Column(JSON, nullable=True)

    control = relationship("Control", back_populates="narratives")
