from app.genai.base import GenAIProvider
from app.config import settings


_provider_instance: GenAIProvider | None = None


def get_genai_provider() -> GenAIProvider:
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance

    if settings.GENAI_PROVIDER == "openai":
        from app.genai.openai_provider import OpenAIProvider
        _provider_instance = OpenAIProvider()
    else:
        raise ValueError(f"Unknown GenAI provider: {settings.GENAI_PROVIDER}")

    return _provider_instance
