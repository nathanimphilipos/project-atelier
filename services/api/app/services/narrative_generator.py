import json
import re
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models import Control, Evidence, Narrative, AuditorFeedback, Assessment
from app.genai.factory import get_genai_provider
from app.rag.chroma_store import query_control_chunks
from app.services.prompts import (
    NARRATIVE_GENERATION_SYSTEM,
    NARRATIVE_GENERATION_PROMPT,
    PROMPT_VERSION,
)
from app.services.scoring import compute_confidence_score

logger = logging.getLogger(__name__)


async def generate_narrative(
    db: Session,
    control_id: str,
    evidence_ids: list[int],
    narrative_text: Optional[str] = None,
    feedback_id: Optional[int] = None,
) -> dict:
    control = db.query(Control).filter(Control.control_id == control_id).first()
    if not control:
        raise ValueError(f"Control {control_id} not found")

    evidence_list = []
    if evidence_ids:
        evidence_list = db.query(Evidence).filter(Evidence.id.in_(evidence_ids)).all()

    feedback = None
    if feedback_id:
        feedback = db.query(AuditorFeedback).filter(AuditorFeedback.id == feedback_id).first()

    rag_chunks = query_control_chunks(control_id, n_results=5)
    rag_text = "\n\n".join(c["text"] for c in rag_chunks) if rag_chunks else control.control_text

    evidence_summaries = _build_evidence_summaries(evidence_list)
    auditor_feedback_text = _build_feedback_text(feedback)

    prompt = NARRATIVE_GENERATION_PROMPT.format(
        control_id=control.control_id,
        control_title=control.title,
        control_text=rag_text,
        discussion=control.discussion or "No discussion available.",
        evidence_summaries=evidence_summaries or "No evidence provided.",
        current_narrative=narrative_text or "No current narrative provided.",
        auditor_feedback=auditor_feedback_text or "No auditor feedback provided.",
    )

    provider = get_genai_provider()
    raw_output = await provider.generate_text(prompt, NARRATIVE_GENERATION_SYSTEM)

    scoring_inputs = _extract_scoring_inputs(raw_output)

    existing_count = db.query(Narrative).filter(Narrative.control_id == control_id).count()
    version = existing_count + 1

    narrative = Narrative(
        control_id=control_id,
        version=version,
        narrative_text=raw_output,
        scoring_inputs_json=scoring_inputs,
        model_used=provider.get_text_model(),
        prompt_version=PROMPT_VERSION,
        inputs_json={
            "evidence_ids": evidence_ids,
            "feedback_id": feedback_id,
            "had_current_narrative": narrative_text is not None,
        },
    )
    db.add(narrative)

    score_result = compute_confidence_score(scoring_inputs)

    assessment = Assessment(
        control_id=control_id,
        meets_status=score_result["meets_status"],
        confidence_score=score_result["confidence_score"],
        score_rationale_json=score_result["score_rationale_json"],
        model_used=provider.get_text_model(),
        prompt_version=PROMPT_VERSION,
    )
    db.add(assessment)

    control.status = _status_from_meets(score_result["meets_status"])
    db.commit()
    db.refresh(narrative)
    db.refresh(assessment)

    return {
        "narrative": narrative,
        "assessment": assessment,
    }


def _build_evidence_summaries(evidence_list: list[Evidence]) -> str:
    parts = []
    for ev in evidence_list:
        header = f"**{ev.filename}** ({ev.filetype})"
        if ev.vision_summary_json:
            summary = json.dumps(ev.vision_summary_json, indent=2)
            parts.append(f"{header}\nVision Summary:\n{summary}")
        elif ev.extracted_text:
            text = ev.extracted_text[:2000]
            parts.append(f"{header}\nExtracted Text:\n{text}")
        else:
            parts.append(f"{header}\n[No extracted content]")
    return "\n\n---\n\n".join(parts)


def _build_feedback_text(feedback: Optional[AuditorFeedback]) -> str:
    if not feedback:
        return ""
    parts = [f"Raw feedback text:\n{feedback.extracted_text[:3000]}"]
    if feedback.findings_json:
        parts.append(f"Structured findings:\n{json.dumps(feedback.findings_json, indent=2)}")
    return "\n\n".join(parts)


def _extract_scoring_inputs(narrative_text: str) -> dict:
    pattern = r"```json\s*(\{.*?\})\s*```"
    match = re.search(pattern, narrative_text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    return {
        "required_evidence_items": [],
        "feedback_open_items": [],
        "risks": [],
        "confidence_cap_reason": None,
    }


def _status_from_meets(meets_status: str) -> str:
    mapping = {
        "meets": "ready",
        "partially_meets": "under_review",
        "not_met": "needs_evidence",
    }
    return mapping.get(meets_status, "draft")
