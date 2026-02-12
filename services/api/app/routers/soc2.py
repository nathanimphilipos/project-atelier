import csv
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Crosswalk, SOC2EvidenceLink, Evidence
from app.schemas.soc2 import CrosswalkOut, SOC2TargetSummary, SOC2LinkRequest, SOC2EvidenceLinkOut

router = APIRouter(prefix="/api", tags=["soc2"])


@router.post("/crosswalk/import")
async def import_crosswalk(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    for row in reader:
        nist_id = row.get("nist_control_id", "").strip()
        soc2_target = row.get("soc2_target", "").strip()
        objective = row.get("evidence_objective", "").strip()

        if not nist_id or not soc2_target:
            continue

        existing = (
            db.query(Crosswalk)
            .filter(Crosswalk.nist_control_id == nist_id, Crosswalk.soc2_target == soc2_target)
            .first()
        )
        if not existing:
            cw = Crosswalk(
                nist_control_id=nist_id,
                soc2_target=soc2_target,
                evidence_objective=objective,
            )
            db.add(cw)
            imported += 1

    db.commit()
    return {"imported": imported}


@router.get("/soc2/targets", response_model=list[SOC2TargetSummary])
def list_soc2_targets(db: Session = Depends(get_db)):
    crosswalks = db.query(Crosswalk).all()

    target_map: dict[str, SOC2TargetSummary] = {}
    for cw in crosswalks:
        if cw.soc2_target not in target_map:
            target_map[cw.soc2_target] = SOC2TargetSummary(
                soc2_target=cw.soc2_target,
                evidence_objective=cw.evidence_objective,
                nist_control_ids=[],
                linked_evidence_count=0,
                satisfied=False,
            )
        target_map[cw.soc2_target].nist_control_ids.append(cw.nist_control_id)

    for target_id, summary in target_map.items():
        link_count = (
            db.query(SOC2EvidenceLink)
            .filter(SOC2EvidenceLink.soc2_target == target_id)
            .count()
        )
        summary.linked_evidence_count = link_count
        summary.satisfied = link_count > 0

    return list(target_map.values())


@router.post("/soc2/link-evidence", response_model=SOC2EvidenceLinkOut)
def link_soc2_evidence(body: SOC2LinkRequest, db: Session = Depends(get_db)):
    evidence = db.query(Evidence).filter(Evidence.id == body.evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    existing = (
        db.query(SOC2EvidenceLink)
        .filter(
            SOC2EvidenceLink.soc2_target == body.soc2_target,
            SOC2EvidenceLink.evidence_id == body.evidence_id,
        )
        .first()
    )
    if existing:
        return existing

    link = SOC2EvidenceLink(
        soc2_target=body.soc2_target,
        evidence_id=body.evidence_id,
        control_id=body.control_id,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link
