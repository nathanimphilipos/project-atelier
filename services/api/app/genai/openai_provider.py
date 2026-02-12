import json
import base64
import logging
from typing import Any

from openai import AsyncOpenAI

from app.genai.base import GenAIProvider
from app.config import settings

logger = logging.getLogger(__name__)


class OpenAIProvider(GenAIProvider):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.vision_model = settings.OPENAI_VISION_MODEL
        self.text_model = settings.OPENAI_TEXT_MODEL

    def get_vision_model(self) -> str:
        return self.vision_model

    def get_text_model(self) -> str:
        return self.text_model

    async def analyze_image(self, image_bytes: bytes, prompt: str, filename: str = "") -> dict:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        ext = filename.rsplit(".", 1)[-1].lower() if filename else "png"
        mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}.get(ext, "image/png")

        response = await self.client.chat.completions.create(
            model=self.vision_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a GRC evidence analyst. Analyze the provided screenshot and return a structured JSON summary.",
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime};base64,{b64}"},
                        },
                    ],
                },
            ],
            max_tokens=2000,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Vision model returned non-JSON: %s", raw[:200])
            return {"raw_text": raw}

    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.text_model,
            messages=messages,
            max_tokens=4000,
        )
        return response.choices[0].message.content

    async def parse_structured(self, prompt: str, system_prompt: str = "") -> dict:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.text_model,
            messages=messages,
            max_tokens=4000,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Structured parse returned non-JSON: %s", raw[:200])
            return {"raw_text": raw}
