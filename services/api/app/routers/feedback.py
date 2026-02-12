from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Control, AuditorFeedback
from app.schemas.feedback import FeedbackOut
from app.services.feedback_parser import parse_feedback
from app.services.evidence_processor import extract_text_from_pdf, extract_text_from_docx

router = APIRouter(prefix="/api/controls", tags=["feedback"])


@router.post("/{control_id}/feedback", response_model=FeedbackOut)
async def create_feedback(
    control_id: str,
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    control = db.query(Control).filter(Control.control_id == control_id).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")

    feedback_text = ""
    filename = None

    if file:
        file_bytes = await file.read()
        filename = file.filename
        content_type = file.content_type or ""

        if "pdf" in content_type:
            feedback_text = extract_text_from_pdf(file_bytes)
        elif "word" in content_type or "docx" in content_type:
            feedback_text = extract_text_from_docx(file_bytes)
        else:
            feedback_text = file_bytes.decode("utf-8", errors="replace")
    elif text:
        feedback_text = text
    else:
        raise HTTPException(status_code=400, detail="Provide either text or file")

    findings_json = await parse_feedback(feedback_text)

    fb = AuditorFeedback(
        control_id=control_id,
        filename=filename,
        extracted_text=feedback_text,
        findings_json=findings_json,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb


@router.get("/{control_id}/feedback", response_model=list[FeedbackOut])
def list_feedback(control_id: str, db: Session = Depends(get_db)):
    return (
        db.query(AuditorFeedback)
        .filter(AuditorFeedback.control_id == control_id)
        .order_by(AuditorFeedback.created_at.desc())
        .all()
    )
