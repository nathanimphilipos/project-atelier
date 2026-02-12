from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///data/atelier/atelier.db"
    UPLOAD_DIR: str = "data/atelier/uploads"
    CHROMA_DIR: str = "data/atelier/chroma"

    GENAI_PROVIDER: str = "openai"
    OPENAI_API_KEY: str = ""
    OPENAI_VISION_MODEL: str = "gpt-4o"
    OPENAI_TEXT_MODEL: str = "gpt-4o"

    PROJECT_ROOT: str = str(Path(__file__).resolve().parents[3])

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

def get_abs_path(relative: str) -> str:
    return str(Path(settings.PROJECT_ROOT) / relative)
