import csv
import os
from pathlib import Path

def _load_control_catalog() -> str:
    """Load the full NIST 800-53 control catalog from CSV into a text block."""
    csv_path = Path(__file__).resolve().parents[2] / "resources" / "nist_80053.csv"
    if not csv_path.exists():
        return "[Control catalog not found]"
    lines = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cid = row.get("control_id", "")
            title = row.get("title", "")
            text = row.get("control_text", "")
            enhancements = row.get("enhancements", "")
            entry = f"- {cid} ({title}): {text}"
            if enhancements and enhancements != "None":
                entry += f" | Enhancements: {enhancements}"
            lines.append(entry)
    return "\n".join(lines)

NIST_CONTROL_CATALOG = _load_control_catalog()

VISION_SUMMARY_PROMPT = """Analyze this evidence screenshot for GRC/compliance purposes.
Return a JSON object with exactly these fields:
{
  "key_text": "verbatim important text visible in the image",
  "key_findings": ["bullet1", "bullet2"],
  "configuration_values": {"setting_name": "value"},
  "claims_supported": ["This evidence supports claim X"],
  "uncertainty": ["Areas where the evidence is unclear or incomplete"],
  "suggested_controls": ["AC-01", "IA-05"]
}
Be thorough but concise. Focus on what this evidence proves or disproves for compliance."""

FEEDBACK_PARSING_PROMPT = """Parse the following auditor/PMO feedback into structured findings.
Return a JSON object with exactly these fields:
{
  "findings": ["finding1", "finding2"],
  "missing_proof_requests": ["proof request 1"],
  "required_wording": ["specific wording requirement 1"],
  "rejected_claims": ["rejected claim 1"],
  "remediation_requests": ["remediation request 1"]
}
If a category has no items, use an empty list.

FEEDBACK TEXT:
{feedback_text}"""

NARRATIVE_GENERATION_SYSTEM = f"""You are a rigorous GovRAMP/StateRAMP PMO assessor evaluating NIST 800-53 Rev 5 control implementations.

Your role is to act as if you are the PMO office reviewing a cloud service provider's control package for authorization.
You are NOT a helpful writer — you are a skeptical auditor. Your job is to find gaps, not to give the benefit of the doubt.

Core principles:
- Every sub-requirement of the control text MUST be individually verified against evidence. If a sub-step lacks proof, it FAILS.
- Vague or generic evidence (e.g. "we have a policy") is INSUFFICIENT unless the specific policy content is provided and addresses the exact requirement.
- A control with 8 out of 10 sub-requirements met is NOT passing — it is "Partially Meets" at best.
- "Pass with Concerns" means the control mostly works but has specific documented gaps that need remediation within 90 days.
- Do NOT inflate scores. A control without strong, specific evidence for every sub-requirement should score below 80.
- If PMO feedback from a prior review is provided, verify whether each previously identified issue has been resolved with NEW evidence. Unresolved PMO findings automatically cap the score.
- Always cite evidence filenames when referencing proof. Never assume evidence exists if it is not provided.
- Be direct and blunt about deficiencies. The CSP needs honest feedback, not encouragement.

## FULL NIST 800-53 REV 5 CONTROL CATALOG (your reference for what is being tested)
You have been trained on the following complete control listing. Use this to understand each control's full requirements, its enhancements, and how controls relate to each other across families. When assessing a control, cross-reference related controls (e.g. AC-02 relates to IA-04 for identifier management, PS-04 for termination).

{NIST_CONTROL_CATALOG}
"""

NARRATIVE_GENERATION_PROMPT = """Assess NIST 800-53 control {control_id}: {control_title} as a PMO reviewer.

## AUTHORITATIVE CONTROL TEXT (every sub-requirement must be verified)
{control_text}

## CONTROL DISCUSSION & GUIDANCE
{discussion}

## EVIDENCE SUMMARIES
{evidence_summaries}

## CURRENT NARRATIVE (if any)
{current_narrative}

## AUDITOR / PMO FEEDBACK FROM PRIOR REVIEWS (if any)
{auditor_feedback}

## PMO FEEDBACK ON THIS CONTROL (if any)
{pmo_feedback}

---

INSTRUCTIONS:
1. Break the control text into every individual sub-requirement / sub-step.
2. For EACH sub-requirement, determine if specific evidence has been provided that directly proves implementation.
3. A sub-requirement without direct evidence is NOT MET — do not assume or infer.
4. If prior PMO feedback identified issues, check whether NEW evidence resolves each issue. Unresolved issues = automatic score cap at 50.
5. Be conservative: only mark "Meets" if ALL sub-requirements have strong, specific evidence.

Produce your response in EXACTLY this format. Use these exact section delimiters:

===COPY-PASTE NARRATIVE START===
Write a clean, professional, audit-ready control narrative in plain prose paragraphs (NO markdown, NO headers, NO bullets inside this section). This is what the CSP will paste directly into their SSP or StateRAMP Security Snapshot document. Write it in the style of a StateRAMP/FedRAMP control narrative — specific, evidence-based, referencing actual policy names and system components. Multiple paragraphs are fine. Acknowledge any gaps honestly at the end. Example style:

"[Organization] enforces [control requirement] through [specific mechanism]. [Specific policy/tool] is configured to [specific action]. This is evidenced by [evidence filename], which demonstrates [what it proves]."
===COPY-PASTE NARRATIVE END===

### Sub-Requirement Verification
For each sub-requirement of the control, list:
- **[Sub-requirement description]**: PASS / FAIL / PARTIAL
  - Evidence: [filename or "None provided"]
  - Gap: [what is missing, if any]

### Evidence Mapping
- [filename] → what it proves
- [missing evidence] → what sub-requirement it would satisfy

### PMO Assessment
**Status**: Meets / Partially Meets / Does Not Meet / Pass With Concerns
**Sub-requirements met**: X of Y
**Justification**: Why this determination was made. Be specific.

### Where We Fall Short
Explicit gaps. List every unmet sub-requirement. If fully met, state "No identified gaps."

### Remediation / Next Steps
- Actionable bullet with specific deliverable and timeline suggestion
- Prioritize by severity

### Scoring Inputs
Return as a JSON code block:
```json
{{
  "required_evidence_items": [
    {{"name": "description", "present": true/false, "strength": "weak|medium|strong", "notes": "..."}}
  ],
  "feedback_open_items": [
    {{"item": "description", "resolved": true/false}}
  ],
  "risks": [
    {{"risk": "description", "severity": "low|med|high"}}
  ],
  "confidence_cap_reason": null or "reason string"
}}
```

REMINDER: Do NOT give 100% unless every single sub-requirement has strong, specific, verified evidence. Most controls should score 40-70 unless the evidence package is truly comprehensive."""

PROMPT_VERSION = "v2.0-pmo"
