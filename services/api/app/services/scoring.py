import logging
from typing import Optional

logger = logging.getLogger(__name__)


def compute_confidence_score(scoring_inputs: dict) -> dict:
    if not scoring_inputs:
        return {
            "meets_status": "not_met",
            "confidence_score": 0,
            "score_rationale_json": {
                "why_this_score": ["No scoring inputs available"],
                "top_3_actions_to_raise_score": ["Provide evidence and generate a narrative"],
            },
        }

    evidence_items = scoring_inputs.get("required_evidence_items", [])
    feedback_items = scoring_inputs.get("feedback_open_items", [])
    risks = scoring_inputs.get("risks", [])
    cap_reason = scoring_inputs.get("confidence_cap_reason")

    score = 100
    rationale = []
    actions = []

    # --- Evidence scoring ---
    total_evidence = len(evidence_items)
    present_evidence = [e for e in evidence_items if e.get("present")]
    missing_evidence = [e for e in evidence_items if not e.get("present")]

    if total_evidence > 0:
        coverage = len(present_evidence) / total_evidence
        if coverage < 1.0:
            penalty = int((1.0 - coverage) * 40)
            score -= penalty
            rationale.append(
                f"{len(missing_evidence)}/{total_evidence} required evidence items missing (-{penalty})"
            )
            for me in missing_evidence[:3]:
                actions.append(f"Provide evidence: {me.get('name', 'unknown')}")

        # Strength penalties
        for ev in present_evidence:
            strength = ev.get("strength", "medium")
            if strength == "weak":
                score -= 5
                rationale.append(f"Evidence '{ev.get('name', '?')}' is weak (-5)")
                actions.append(f"Strengthen evidence for: {ev.get('name', '?')}")
    else:
        score -= 30
        rationale.append("No evidence items defined in scoring inputs (-30)")
        actions.append("Upload relevant evidence for this control")

    # --- Feedback scoring ---
    total_feedback = len(feedback_items)
    unresolved_feedback = [f for f in feedback_items if not f.get("resolved")]

    if unresolved_feedback:
        penalty = min(len(unresolved_feedback) * 8, 30)
        score -= penalty
        rationale.append(
            f"{len(unresolved_feedback)}/{total_feedback} auditor feedback items unresolved (-{penalty})"
        )
        for uf in unresolved_feedback[:2]:
            actions.append(f"Resolve feedback: {uf.get('item', 'unknown')}")

    # --- Risk scoring ---
    high_risks = [r for r in risks if r.get("severity") == "high"]
    med_risks = [r for r in risks if r.get("severity") == "med"]

    if high_risks:
        penalty = len(high_risks) * 10
        score -= penalty
        rationale.append(f"{len(high_risks)} high-severity risks (-{penalty})")
        for hr in high_risks[:2]:
            actions.append(f"Mitigate risk: {hr.get('risk', 'unknown')}")

    if med_risks:
        penalty = len(med_risks) * 5
        score -= penalty
        rationale.append(f"{len(med_risks)} medium-severity risks (-{penalty})")

    # --- Confidence cap ---
    if cap_reason:
        score = min(score, 60)
        rationale.append(f"Score capped at 60: {cap_reason}")
        actions.append(f"Address cap reason: {cap_reason}")

    # Clamp
    score = max(0, min(100, score))

    # Determine meets status
    if score >= 80:
        meets_status = "meets"
    elif score >= 50:
        meets_status = "partially_meets"
    else:
        meets_status = "not_met"

    # Ensure we have at least 3 actions
    while len(actions) < 3:
        actions.append("Review and strengthen existing evidence documentation")

    return {
        "meets_status": meets_status,
        "confidence_score": score,
        "score_rationale_json": {
            "why_this_score": rationale if rationale else ["All evidence present and strong"],
            "top_3_actions_to_raise_score": actions[:3],
        },
    }
