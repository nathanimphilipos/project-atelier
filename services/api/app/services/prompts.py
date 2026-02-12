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

NARRATIVE_GENERATION_SYSTEM = """You are an expert GRC narrative writer producing audit-ready control narratives for NIST 800-53 Rev 5.
Your narratives must be specific, evidence-based, and auditor-friendly. Never use filler or vague language.
Always cite evidence filenames when referencing proof. Be honest about gaps."""

NARRATIVE_GENERATION_PROMPT = """Generate an updated control narrative for NIST 800-53 control {control_id}: {control_title}.

## AUTHORITATIVE CONTROL TEXT
{control_text}

## CONTROL DISCUSSION & GUIDANCE
{discussion}

## EVIDENCE SUMMARIES
{evidence_summaries}

## CURRENT NARRATIVE (if any)
{current_narrative}

## AUDITOR FEEDBACK (if any)
{auditor_feedback}

---

Produce your response in EXACTLY this format (use these exact headers):

### Control Intent
1-2 sentences describing what this control requires.

### Implementation Narrative
Specific, paste-ready narrative describing how the organization implements this control. Reference evidence filenames. No fluff.

### Evidence Mapping
- [filename] → what it proves

### Assessment
**Status**: Meets / Partially Meets / Does Not Meet
**Justification**: Why this determination was made.

### Where We Fall Short
Explicit gaps, if any. If fully met, state "No identified gaps."

### Remediation / Next Steps
- Actionable bullet 1
- Actionable bullet 2

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
```"""

PROMPT_VERSION = "v1.0"
