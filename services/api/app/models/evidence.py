from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    filetype = Column(String, nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now())
    extracted_text = Column(Text, nullable=True)
    vision_summary_json = Column(JSON, nullable=True)
    source_system = Column(String, nullable=True)
    owner = Column(String, nullable=True)
    tags = Column(JSON, nullable=True)
    sha256_hash = Column(String, nullable=False, unique=True)

    control_links = relationship("ControlEvidence", back_populates="evidence")
    soc2_links = relationship("SOC2EvidenceLink", back_populates="evidence")
