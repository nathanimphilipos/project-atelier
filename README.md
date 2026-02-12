# Project Atelier (GRC Studio)

> **Atelier** *(French: a creative studio or workshop)* — Project Atelier is the GovRAMP + NIST 800-53 version of a creative studio, purpose-built to streamline GRC engineering workflows. From evidence collection and narrative generation to PMO feedback tracking and compliance dashboards, Atelier turns the audit grind into a structured, efficient process.

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- An OpenAI API key (with access to gpt-4o)

### 1. Environment Setup

```bash
# From project root
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY
```

### 2. Backend Setup

```bash
cd services/api

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run Alembic migrations
alembic upgrade head

# Seed NIST 800-53 controls + boards
python scripts/seed_db.py

# Index controls into ChromaDB for RAG
python scripts/index_chroma.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
# In a new terminal
cd apps/web

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### 4. Open the App

Navigate to **http://localhost:3000**

The frontend proxies `/api/*` requests to the FastAPI backend at `http://127.0.0.1:8000`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GENAI_PROVIDER` | `openai` | GenAI provider (only `openai` currently) |
| `OPENAI_API_KEY` | — | Your OpenAI API key |
| `OPENAI_VISION_MODEL` | `gpt-4o` | Vision-capable model |
| `OPENAI_TEXT_MODEL` | `gpt-4o` | Text generation model |

## Project Structure

```
project-atelier/
├── apps/web/              Next.js 14 + TypeScript frontend
├── services/api/          FastAPI Python backend
│   ├── app/               Application code
│   │   ├── genai/         Pluggable GenAI provider interface
│   │   ├── models/        SQLAlchemy ORM models (10 tables)
│   │   ├── rag/           ChromaDB vector store
│   │   ├── routers/       API route handlers
│   │   ├── schemas/       Pydantic request/response models
│   │   └── services/      Business logic + scoring
│   ├── alembic/           Database migrations
│   ├── resources/         nist_80053.csv seed data
│   └── scripts/           Seed + indexing scripts
├── data/atelier/          Local data (gitignored)
│   ├── uploads/           Evidence file storage
│   ├── chroma/            ChromaDB persistent store
│   └── atelier.db         SQLite database
└── docs/                  Architecture + prompt docs
```

## Features

- **Controls List**: Searchable table of all NIST 800-53 Rev 5 controls with status chips and confidence scores
- **Control Workspace**: Upload evidence, paste feedback, generate audit-ready narratives
- **Evidence Vault**: Central evidence repository with control and SOC 2 linkage
- **Narrative Studio**: Quick access to controls with active narratives
- **Boards**: 5 Kanban boards (GovRAMP Progress, GovRAMP Ready, GovRAMP Core, GovRAMP Authorized Moderate, SOC 2)
- **SOC 2 Reuse**: Crosswalk mapping + evidence reuse from NIST controls
- **Imports**: Crosswalk CSV import + GovRAMP Excel placeholder

## API Endpoints

See `services/api/app/routers/` for full endpoint definitions. Key endpoints:

- `GET /api/controls` — List/search controls
- `GET /api/controls/{id}` — Control detail
- `POST /api/evidence/upload` — Upload evidence (multipart)
- `POST /api/controls/{id}/feedback` — Submit auditor feedback
- `POST /api/narratives/generate` — Generate narrative + assessment
- `GET /api/boards` — List boards
- `POST /api/controls/{id}/create-cards-from-gaps` — Create board cards from remediation items
- `POST /api/crosswalk/import` — Import SOC 2 crosswalk CSV
- `GET /api/soc2/targets` — SOC 2 target summary
