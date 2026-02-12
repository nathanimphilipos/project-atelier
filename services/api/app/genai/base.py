from abc import ABC, abstractmethod
from typing import Any


class GenAIProvider(ABC):
    @abstractmethod
    async def analyze_image(self, image_bytes: bytes, prompt: str, filename: str = "") -> dict:
        """Send an image to a vision model and get structured JSON summary."""
        ...

    @abstractmethod
    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        """Generate text from a prompt."""
        ...

    @abstractmethod
    async def parse_structured(self, prompt: str, system_prompt: str = "") -> dict:
        """Generate structured JSON output from a prompt."""
        ...

    @abstractmethod
    def get_vision_model(self) -> str:
        ...

    @abstractmethod
    def get_text_model(self) -> str:
        ...
