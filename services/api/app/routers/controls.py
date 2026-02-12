from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from app.database import get_db
from app.models import Control, ControlEvidence, Assessment
from app.schemas.controls import ControlOut, ControlDetail, LinkEvidenceRequest

router = APIRouter(prefix="/api/controls", tags=["controls"])


@router.get("", response_model=list[ControlOut])
def list_controls(search: str = Query("", description="Search controls"), db: Session = Depends(get_db)):
    query = db.query(Control)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Control.control_id.ilike(like))
            | (Control.title.ilike(like))
            | (Control.family.ilike(like))
        )
    controls = query.order_by(Control.family, Control.control_id).all()

    results = []
    for c in controls:
        ev_count = db.query(ControlEvidence).filter(ControlEvidence.control_id == c.control_id).count()
        latest_assessment = (
            db.query(Assessment)
            .filter(Assessment.control_id == c.control_id)
            .order_by(Assessment.created_at.desc())
            .first()
        )
        results.append(
            ControlOut(
                control_id=c.control_id,
                family=c.family,
                title=c.title,
                control_text=c.control_text,
                discussion=c.discussion,
                enhancements=c.enhancements,
                status=c.status or "not_started",
                updated_at=c.updated_at,
                evidence_count=ev_count,
                latest_confidence_score=latest_assessment.confidence_score if latest_assessment else None,
            )
        )
    return results


@router.get("/{control_id}", response_model=ControlDetail)
def get_control(control_id: str, db: Session = Depends(get_db)):
    control = db.query(Control).filter(Control.control_id == control_id).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
    return control


@router.post("/{control_id}/link-evidence")
def link_evidence(control_id: str, body: LinkEvidenceRequest, db: Session = Depends(get_db)):
    control = db.query(Control).filter(Control.control_id == control_id).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")

    linked = []
    for eid in body.evidence_ids:
        existing = (
            db.query(ControlEvidence)
            .filter(ControlEvidence.control_id == control_id, ControlEvidence.evidence_id == eid)
            .first()
        )
        if not existing:
            ce = ControlEvidence(
                control_id=control_id,
                evidence_id=eid,
                relevance_note=body.relevance_note,
            )
            db.add(ce)
            linked.append(eid)
    db.commit()
    return {"linked": linked, "control_id": control_id}
