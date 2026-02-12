from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Narrative, Assessment
from app.schemas.narratives import NarrativeGenerateRequest, NarrativeOut, AssessmentOut
from app.services.narrative_generator import generate_narrative

router = APIRouter(prefix="/api", tags=["narratives"])


@router.post("/narratives/generate")
async def generate(body: NarrativeGenerateRequest, db: Session = Depends(get_db)):
    try:
        result = await generate_narrative(
            db=db,
            control_id=body.control_id,
            evidence_ids=body.evidence_ids,
            narrative_text=body.narrative_text,
            feedback_id=body.feedback_id,
        )
        return {
            "narrative": NarrativeOut.model_validate(result["narrative"]),
            "assessment": AssessmentOut.model_validate(result["assessment"]),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Narrative generation failed: {e}")


@router.get("/narratives", response_model=list[NarrativeOut])
def list_narratives(control_id: str = Query(...), db: Session = Depends(get_db)):
    return (
        db.query(Narrative)
        .filter(Narrative.control_id == control_id)
        .order_by(Narrative.created_at.desc())
        .all()
    )


@router.get("/assessments", response_model=list[AssessmentOut])
def list_assessments(control_id: str = Query(...), db: Session = Depends(get_db)):
    return (
        db.query(Assessment)
        .filter(Assessment.control_id == control_id)
        .order_by(Assessment.created_at.desc())
        .all()
    )
