import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings, get_abs_path
from app.models import Evidence, ControlEvidence, SOC2EvidenceLink
from app.schemas.evidence import EvidenceOut
from app.services.evidence_processor import compute_sha256, process_evidence_file

router = APIRouter(prefix="/api/evidence", tags=["evidence"])


@router.post("/upload", response_model=EvidenceOut)
async def upload_evidence(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()
    sha256 = compute_sha256(file_bytes)

    existing = db.query(Evidence).filter(Evidence.sha256_hash == sha256).first()
    if existing:
        return _to_evidence_out(existing, db)

    upload_dir = Path(get_abs_path(settings.UPLOAD_DIR))
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename).suffix
    stored_name = f"{uuid.uuid4().hex}{ext}"
    filepath = upload_dir / stored_name

    with open(filepath, "wb") as f:
        f.write(file_bytes)

    processed = await process_evidence_file(file_bytes, file.filename, file.content_type or "")

    evidence = Evidence(
        filename=file.filename,
        filepath=str(filepath),
        filetype=file.content_type or "application/octet-stream",
        extracted_text=processed.get("extracted_text"),
        vision_summary_json=processed.get("vision_summary_json"),
        sha256_hash=sha256,
        tags=[],
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    return _to_evidence_out(evidence, db)


@router.get("", response_model=list[EvidenceOut])
def list_evidence(
    control_id: str = Query("", description="Filter by control"),
    search: str = Query("", description="Search evidence"),
    db: Session = Depends(get_db),
):
    query = db.query(Evidence)

    if control_id:
        ev_ids = [
            ce.evidence_id
            for ce in db.query(ControlEvidence).filter(ControlEvidence.control_id == control_id).all()
        ]
        if ev_ids:
            query = query.filter(Evidence.id.in_(ev_ids))
        else:
            return []

    if search:
        like = f"%{search}%"
        query = query.filter(
            (Evidence.filename.ilike(like)) | (Evidence.extracted_text.ilike(like))
        )

    evidence_list = query.order_by(Evidence.uploaded_at.desc()).all()
    return [_to_evidence_out(e, db) for e in evidence_list]


def _to_evidence_out(ev: Evidence, db: Session) -> EvidenceOut:
    linked_controls = [
        ce.control_id for ce in db.query(ControlEvidence).filter(ControlEvidence.evidence_id == ev.id).all()
    ]
    linked_soc2 = [
        sl.soc2_target for sl in db.query(SOC2EvidenceLink).filter(SOC2EvidenceLink.evidence_id == ev.id).all()
    ]
    return EvidenceOut(
        id=ev.id,
        filename=ev.filename,
        filepath=ev.filepath,
        filetype=ev.filetype,
        uploaded_at=ev.uploaded_at,
        extracted_text=ev.extracted_text,
        vision_summary_json=ev.vision_summary_json,
        source_system=ev.source_system,
        owner=ev.owner,
        tags=ev.tags,
        sha256_hash=ev.sha256_hash,
        linked_controls=linked_controls,
        linked_soc2_targets=linked_soc2,
    )
