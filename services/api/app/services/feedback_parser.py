import logging
from typing import Optional

from app.genai.factory import get_genai_provider
from app.services.prompts import FEEDBACK_PARSING_PROMPT

logger = logging.getLogger(__name__)


async def parse_feedback(feedback_text: str) -> dict:
    provider = get_genai_provider()
    prompt = FEEDBACK_PARSING_PROMPT.format(feedback_text=feedback_text)

    try:
        result = await provider.parse_structured(
            prompt,
            system_prompt="You are a GRC feedback parser. Extract structured findings from auditor feedback.",
        )
        required_keys = [
            "findings",
            "missing_proof_requests",
            "required_wording",
            "rejected_claims",
            "remediation_requests",
        ]
        for key in required_keys:
            if key not in result:
                result[key] = []
        return result
    except Exception as e:
        logger.error("Feedback parsing failed: %s", e)
        return {
            "findings": [feedback_text[:500]],
            "missing_proof_requests": [],
            "required_wording": [],
            "rejected_claims": [],
            "remediation_requests": [],
            "parse_error": str(e),
        }
