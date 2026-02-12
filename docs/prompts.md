# Project Atelier — GenAI Prompt Templates

All prompts are defined in `services/api/app/services/prompts.py`. This document provides the full reference.

---

## 1. Evidence Vision Summary Prompt

Used when processing uploaded image evidence (PNG/JPG) via the vision model.

```
Analyze this evidence screenshot for GRC/compliance purposes.
Return a JSON object with exactly these fields:
{
  "key_text": "verbatim important text visible in the image",
  "key_findings": ["bullet1", "bullet2"],
  "configuration_values": {"setting_name": "value"},
  "claims_supported": ["This evidence supports claim X"],
  "uncertainty": ["Areas where the evidence is unclear or incomplete"],
  "suggested_controls": ["AC-01", "IA-05"]
}
Be thorough but concise. Focus on what this evidence proves or disproves for compliance.
```

**System prompt**: "You are a GRC evidence analyst. Analyze the provided screenshot and return a structured JSON summary."

---

## 2. Feedback Parsing Prompt

Used when auditor/PMO feedback is uploaded or pasted.

```
Parse the following auditor/PMO feedback into structured findings.
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
{feedback_text}
```

**System prompt**: "You are a GRC feedback parser. Extract structured findings from auditor feedback."

---

## 3. Narrative Generation Prompt

Used when generating an updated control narrative.

**System prompt**:
```
You are an expert GRC narrative writer producing audit-ready control narratives for NIST 800-53 Rev 5.
Your narratives must be specific, evidence-based, and auditor-friendly. Never use filler or vague language.
Always cite evidence filenames when referencing proof. Be honest about gaps.
```

**User prompt**:
```
Generate an updated control narrative for NIST 800-53 control {control_id}: {control_title}.

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
Specific, paste-ready narrative describing how the organization implements this control.
Reference evidence filenames. No fluff.

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
{
  "required_evidence_items": [
    {"name": "description", "present": true/false, "strength": "weak|medium|strong", "notes": "..."}
  ],
  "feedback_open_items": [
    {"item": "description", "resolved": true/false}
  ],
  "risks": [
    {"risk": "description", "severity": "low|med|high"}
  ],
  "confidence_cap_reason": null or "reason string"
}
```

---

## 4. Scoring Inputs JSON Schema

The scoring_inputs_json produced by the narrative generation prompt is consumed by the deterministic scoring function.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["required_evidence_items", "feedback_open_items", "risks", "confidence_cap_reason"],
  "properties": {
    "required_evidence_items": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "present", "strength"],
        "properties": {
          "name": { "type": "string" },
          "present": { "type": "boolean" },
          "strength": { "type": "string", "enum": ["weak", "medium", "strong"] },
          "notes": { "type": "string" }
        }
      }
    },
    "feedback_open_items": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["item", "resolved"],
        "properties": {
          "item": { "type": "string" },
          "resolved": { "type": "boolean" }
        }
      }
    },
    "risks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["risk", "severity"],
        "properties": {
          "risk": { "type": "string" },
          "severity": { "type": "string", "enum": ["low", "med", "high"] }
        }
      }
    },
    "confidence_cap_reason": {
      "type": ["string", "null"]
    }
  }
}
```

---

## 5. Confidence Scoring Algorithm

The deterministic scoring function in `services/api/app/services/scoring.py`:

1. Start at 100
2. **Evidence coverage**: Penalize up to -40 for missing required evidence items
3. **Evidence strength**: -5 per "weak" evidence item
4. **Unresolved feedback**: -8 per unresolved item (max -30)
5. **High risks**: -10 per high-severity risk
6. **Medium risks**: -5 per medium-severity risk
7. **Confidence cap**: If `confidence_cap_reason` is set, cap score at 60
8. Clamp to [0, 100]

**Meets status thresholds**:
- >= 80: **Meets**
- >= 50: **Partially Meets**
- < 50: **Does Not Meet**

**Output**:
```json
{
  "meets_status": "meets|partially_meets|not_met",
  "confidence_score": 0-100,
  "score_rationale_json": {
    "why_this_score": ["reason1", "reason2"],
    "top_3_actions_to_raise_score": ["action1", "action2", "action3"]
  }
}
```
