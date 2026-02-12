import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings, get_abs_path
from app.routers import controls, evidence, feedback, narratives, boards, soc2, govramp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Project Atelier API",
    description="Control-first NIST 800-53 narrative generation platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(controls.router)
app.include_router(evidence.router)
app.include_router(feedback.router)
app.include_router(narratives.router)
app.include_router(boards.router)
app.include_router(soc2.router)
app.include_router(govramp.router)


@app.on_event("startup")
def startup():
    upload_dir = Path(get_abs_path(settings.UPLOAD_DIR))
    upload_dir.mkdir(parents=True, exist_ok=True)
    chroma_dir = Path(get_abs_path(settings.CHROMA_DIR))
    chroma_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Project Atelier API started")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Project Atelier"}
