from sqlalchemy import Column, Integer, String, Text
from app.database import Base


class Crosswalk(Base):
    __tablename__ = "crosswalk"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nist_control_id = Column(String, nullable=False, index=True)
    soc2_target = Column(String, nullable=False, index=True)
    evidence_objective = Column(Text, nullable=True)
