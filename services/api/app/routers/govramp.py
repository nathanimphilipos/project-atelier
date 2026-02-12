import csv
import io
import re
import logging
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from app.database import get_db
from app.config import settings, get_abs_path
from app.models import GovRAMPSnapshot, GovRAMPProgress, GovRAMPFeedback, Control, Assessment
from app.schemas.govramp import (
    GovRAMPSnapshotOut,
    GovRAMPProgressOut,
    GovRAMPProgressUpdate,
    GovRAMPDashboard,
    GovRAMPFeedbackOut,
    GovRAMPFeedbackUploadResult,
    GovRAMPStats,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/govramp", tags=["govramp"])

TIER_DEFAULTS = {
    "ps": 40,
    "ready": 80,
    "core": 60,
    "authorized": 319,
}

PMO_FEEDBACK_PREFIX = "PMO Feedback"


def _clean_cell(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\uFFFD", "").strip())


def _combine_headers(top: list[str], second: list[str]) -> list[str]:
    headers = []
    length = max(len(top), len(second))
    for idx in range(length):
        top_val = top[idx] if idx < len(top) else ""
        second_val = second[idx] if idx < len(second) else ""
        name = _clean_cell(second_val) or _clean_cell(top_val)
        headers.append(name)
    return headers


def _parse_bool(value: str) -> bool:
    lowered = value.strip().lower()
    return lowered in {"yes", "y", "true", "1", "pass", "passed"}


def _parse_score(value: str) -> float | None:
    value = value.strip()
    if not value:
        return None
    value = value.replace("%", "").replace(",", "")
    try:
        return float(value)
    except ValueError:
        return None


def _derive_status(control_completed: bool, feedback: str | None) -> str | None:
    if feedback:
        lowered = feedback.lower()
        for marker in ["pass with concerns", "pass", "fail", "not assessed"]:
            if marker in lowered:
                return marker.title()
    if control_completed:
        return "Pass"
    return "Fail"


def _extract_issues(feedback: str | None) -> list[str]:
    if not feedback:
        return []
    lines = []
    for raw_line in feedback.splitlines():
        line = raw_line.strip().lstrip("•*-·•").strip()
        if line:
            lines.append(line)
    if len(lines) <= 1:
        return []
    return lines[1:]


def _normalize_feedback_history(row: list[str], feedback_columns: list[tuple[str, int]]) -> tuple[dict[str, str], str | None, str | None]:
    history: dict[str, str] = {}
    latest_period = None
    latest_feedback = None
    for period, idx in feedback_columns:
        value = row[idx].strip() if idx < len(row) else ""
        if value:
            cleaned = value.strip()
            history[period] = cleaned
            if latest_period is None:
                latest_period = period
                latest_feedback = cleaned
    return history, latest_period, latest_feedback


@router.get("/dashboard", response_model=GovRAMPDashboard)
def get_dashboard(db: Session = Depends(get_db)):
    tiers = db.query(GovRAMPProgress).order_by(GovRAMPProgress.id).all()
    snapshots = db.query(GovRAMPSnapshot).order_by(GovRAMPSnapshot.period).all()
    return GovRAMPDashboard(tiers=tiers, snapshots=snapshots)


@router.get("/progress", response_model=list[GovRAMPProgressOut])
def get_progress(db: Session = Depends(get_db)):
    return db.query(GovRAMPProgress).order_by(GovRAMPProgress.id).all()


@router.put("/progress/{tier}", response_model=GovRAMPProgressOut)
def update_progress(tier: str, body: GovRAMPProgressUpdate, db: Session = Depends(get_db)):
    if tier not in TIER_DEFAULTS:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {tier}. Must be one of {list(TIER_DEFAULTS.keys())}")

    progress = db.query(GovRAMPProgress).filter(GovRAMPProgress.tier == tier).first()
    if not progress:
        raise HTTPException(status_code=404, detail=f"Tier {tier} not found. Run seed first.")

    progress.completion_pct = body.completion_pct
    completed = int(round(body.completion_pct / 100.0 * progress.total_controls))
    progress.completed_controls = completed

    if body.missing_control_ids is not None:
        progress.missing_control_ids = body.missing_control_ids

    db.commit()
    db.refresh(progress)
    return progress


@router.get("/snapshots", response_model=list[GovRAMPSnapshotOut])
def get_snapshots(db: Session = Depends(get_db)):
    return db.query(GovRAMPSnapshot).order_by(GovRAMPSnapshot.period).all()


@router.post("/import-journey-csv")
def import_journey_csv(db: Session = Depends(get_db)):
    """Import the GovRAMP Snapshot Matrix CSV from the data directory."""
    csv_path = Path(get_abs_path("data/atelier/govramp-journey/GovRAMP-Snapshot-Matrix_Rev5_V1.csv"))
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"GovRAMP journey CSV not found at {csv_path}")

    with open(csv_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Clear existing snapshots
    db.query(GovRAMPSnapshot).delete()

    # Parse the CSV structure:
    # Row 2 (idx 1): period headers
    # Row 3 (idx 2): snapshot scores
    # Row 6 (idx 5): core implemented
    # Row 7 (idx 6): core required
    # Row 9 (idx 8): ready implemented
    # Row 10 (idx 9): ready required
    # Row 12 (idx 11): authorized implemented
    # Row 13 (idx 12): authorized required
    parsed_rows = []
    for line in lines:
        parsed_rows.append([c.strip() for c in line.split(",")])

    if len(parsed_rows) < 14:
        raise HTTPException(status_code=400, detail="CSV too short to parse")

    periods = parsed_rows[1][2:]  # skip first two columns
    scores = parsed_rows[2][2:]
    core_impl = parsed_rows[5][2:]
    core_req = parsed_rows[6][2:]
    ready_impl = parsed_rows[8][2:]
    ready_req = parsed_rows[9][2:]
    auth_impl = parsed_rows[11][2:]
    auth_req = parsed_rows[12][2:]

    imported = 0
    for i, period in enumerate(periods):
        if not period or not period.strip():
            continue

        def parse_pct(val):
            if not val:
                return None
            val = val.replace("%", "").strip()
            try:
                return float(val)
            except ValueError:
                return None

        def parse_int(val):
            if not val:
                return 0
            try:
                return int(val)
            except ValueError:
                return 0

        snap = GovRAMPSnapshot(
            period=period.strip(),
            snapshot_score=parse_pct(scores[i] if i < len(scores) else ""),
            core_implemented=parse_int(core_impl[i] if i < len(core_impl) else ""),
            core_required=parse_int(core_req[i] if i < len(core_req) else "60"),
            ready_implemented=parse_int(ready_impl[i] if i < len(ready_impl) else ""),
            ready_required=parse_int(ready_req[i] if i < len(ready_req) else "80"),
            authorized_implemented=parse_int(auth_impl[i] if i < len(auth_impl) else ""),
            authorized_required=parse_int(auth_req[i] if i < len(auth_req) else "319"),
        )
        db.add(snap)
        imported += 1

    # Update progress tiers from the latest snapshot
    latest_period = None
    latest_idx = -1
    for i, period in enumerate(periods):
        if period and period.strip():
            latest_period = period.strip()
            latest_idx = i

    if latest_idx >= 0:
        for tier_name, req_row, impl_row in [
            ("core", core_req, core_impl),
            ("ready", ready_req, ready_impl),
            ("authorized", auth_req, auth_impl),
        ]:
            req_val = parse_int(req_row[latest_idx] if latest_idx < len(req_row) else "0")
            impl_val = parse_int(impl_row[latest_idx] if latest_idx < len(impl_row) else "0")
            pct = (impl_val / req_val * 100) if req_val > 0 else 0.0

            progress = db.query(GovRAMPProgress).filter(GovRAMPProgress.tier == tier_name).first()
            if progress:
                progress.total_controls = req_val
                progress.completed_controls = impl_val
                progress.completion_pct = round(pct, 2)

    db.commit()
    return {"imported_snapshots": imported, "latest_period": latest_period}


@router.post("/pmo-feedback/upload", response_model=GovRAMPFeedbackUploadResult)
async def upload_pmo_feedback(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        decoded = raw_bytes.decode("utf-8-sig", errors="replace")
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to decode PMO feedback upload")
        raise HTTPException(status_code=400, detail="Unable to decode uploaded file") from exc

    rows = list(csv.reader(io.StringIO(decoded)))
    if len(rows) < 3:
        raise HTTPException(status_code=400, detail="CSV file too short to parse")

    headers = _combine_headers(rows[0], rows[1])
    if not headers:
        raise HTTPException(status_code=400, detail="Unable to parse CSV headers")

    header_lookup = {header.lower(): idx for idx, header in enumerate(headers) if header}
    required = {
        "id": header_lookup.get("id"),
        "control name": header_lookup.get("control name"),
        "family": header_lookup.get("family"),
        "control completed": header_lookup.get("control completed"),
        "score": header_lookup.get("score"),
        "month last passed": header_lookup.get("month last passed"),
    }

    missing = [name for name, idx in required.items() if idx is None]
    if missing:
        raise HTTPException(status_code=400, detail=f"CSV missing required columns: {', '.join(missing)}")

    feedback_columns: list[tuple[str, int]] = []
    for idx, header in enumerate(headers):
        if header.startswith(PMO_FEEDBACK_PREFIX):
            period = header[len(PMO_FEEDBACK_PREFIX):].strip()
            feedback_columns.append((period or header, idx))

    if not feedback_columns:
        raise HTTPException(status_code=400, detail="No PMO feedback columns found in CSV")

    parsed_feedback: list[GovRAMPFeedback] = []
    latest_period_overall: str | None = None

    for row in rows[2:]:
        if not any(cell.strip() for cell in row):
            continue

        extended = row + [""] * (len(headers) - len(row))

        control_id = _clean_cell(extended[required["id"]])
        if not control_id:
            continue

        control_name = _clean_cell(extended[required["control name"]]) or None
        family = _clean_cell(extended[required["family"]]) or None
        control_completed = _parse_bool(extended[required["control completed"]])
        score = _parse_score(extended[required["score"]])
        month_last_passed = _clean_cell(extended[required["month last passed"]]) or None

        history, latest_period, latest_feedback = _normalize_feedback_history(extended, feedback_columns)
        issues = _extract_issues(latest_feedback)
        latest_status = _derive_status(control_completed, latest_feedback)

        parsed_feedback.append(
            GovRAMPFeedback(
                control_id=control_id,
                control_name=control_name,
                family=family,
                control_completed=control_completed,
                score=score,
                month_last_passed=month_last_passed,
                latest_period=latest_period,
                latest_status=latest_status,
                latest_feedback=latest_feedback,
                issues=issues or None,
                feedback_history=history or None,
            )
        )

        if latest_period:
            if latest_period_overall is None or latest_period > latest_period_overall:
                latest_period_overall = latest_period

    if not parsed_feedback:
        raise HTTPException(status_code=400, detail="No feedback rows found in CSV")

    db.query(GovRAMPFeedback).delete()
    db.add_all(parsed_feedback)
    db.commit()

    return {
        "imported": len(parsed_feedback),
        "latest_period": latest_period_overall,
    }


@router.get("/pmo-feedback", response_model=list[GovRAMPFeedbackOut])
def list_pmo_feedback(db: Session = Depends(get_db)):
    return (
        db.query(GovRAMPFeedback)
        .order_by(GovRAMPFeedback.control_id)
        .all()
    )


@router.get("/stats", response_model=GovRAMPStats)
def get_stats(db: Session = Depends(get_db)):
    """Dashboard stats: total controls, evidence count, narrative count, etc."""
    total_controls = db.query(Control).count()
    controls_with_assessment = (
        db.query(Assessment.control_id)
        .distinct()
        .count()
    )
    avg_confidence = db.query(sqlfunc.avg(Assessment.confidence_score)).scalar()

    tiers = db.query(GovRAMPProgress).all()
    tier_summary = {}
    for t in tiers:
        tier_summary[t.tier] = {
            "total": t.total_controls,
            "completed": t.completed_controls,
            "pct": t.completion_pct,
            "missing": t.missing_control_ids or [],
        }

    latest_snapshot = (
        db.query(GovRAMPSnapshot)
        .order_by(GovRAMPSnapshot.period.desc())
        .first()
    )

    feedback_entries = db.query(GovRAMPFeedback).all()
    feedback_summary = None
    if feedback_entries:
        status_counts: dict[str, int] = {}
        for entry in feedback_entries:
            label = entry.latest_status or ("Pass" if entry.control_completed else "Fail")
            status_counts[label] = status_counts.get(label, 0) + 1

        feedback_summary = {
            "total": len(feedback_entries),
            "status_counts": status_counts,
        }

    return {
        "total_controls": total_controls,
        "controls_assessed": controls_with_assessment,
        "avg_confidence": round(avg_confidence, 1) if avg_confidence else None,
        "tiers": tier_summary,
        "latest_snapshot_score": latest_snapshot.snapshot_score if latest_snapshot else None,
        "latest_snapshot_period": latest_snapshot.period if latest_snapshot else None,
        "feedback_summary": feedback_summary,
    }
