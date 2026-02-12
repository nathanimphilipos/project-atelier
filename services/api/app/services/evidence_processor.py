import hashlib
import logging
from pathlib import Path

from app.genai.factory import get_genai_provider
from app.services.prompts import VISION_SUMMARY_PROMPT

logger = logging.getLogger(__name__)


def compute_sha256(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    from PyPDF2 import PdfReader
    import io
    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text_parts.append(t)
    return "\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    from docx import Document
    import io
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


async def process_evidence_file(
    file_bytes: bytes, filename: str, filetype: str
) -> dict:
    result = {"extracted_text": None, "vision_summary_json": None}

    if filetype in ("image/png", "image/jpeg", "image/jpg"):
        provider = get_genai_provider()
        try:
            summary = await provider.analyze_image(
                file_bytes, VISION_SUMMARY_PROMPT, filename
            )
            result["vision_summary_json"] = summary
            result["extracted_text"] = summary.get("key_text", "")
        except Exception as e:
            logger.error("Vision analysis failed for %s: %s", filename, e)
            result["extracted_text"] = f"[Vision analysis failed: {e}]"

    elif filetype == "application/pdf":
        try:
            result["extracted_text"] = extract_text_from_pdf(file_bytes)
        except Exception as e:
            logger.error("PDF extraction failed for %s: %s", filename, e)
            result["extracted_text"] = f"[PDF extraction failed: {e}]"

    elif filetype in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ):
        try:
            result["extracted_text"] = extract_text_from_docx(file_bytes)
        except Exception as e:
            logger.error("DOCX extraction failed for %s: %s", filename, e)
            result["extracted_text"] = f"[DOCX extraction failed: {e}]"

    return result
