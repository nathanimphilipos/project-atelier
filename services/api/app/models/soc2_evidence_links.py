from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class SOC2EvidenceLink(Base):
    __tablename__ = "soc2_evidence_links"

    id = Column(Integer, primary_key=True, autoincrement=True)
    soc2_target = Column(String, nullable=False, index=True)
    evidence_id = Column(Integer, ForeignKey("evidence.id"), nullable=False)
    control_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    evidence = relationship("Evidence", back_populates="soc2_links")
