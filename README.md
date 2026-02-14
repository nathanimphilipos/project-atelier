# Project Atelier

> **Atelier** *(French: a creative studio or workshop)* — Project Atelier is an AI-powered GRC (Governance, Risk & Compliance) platform built for GovRAMP and NIST 800-53 compliance. It helps organizations prove they meet government security standards by automatically organizing evidence, generating audit-ready narratives, and tracking PMO feedback — turning the compliance grind into a streamlined, efficient process.

**Created by Nathan Philipos** · [github.com/nathanimphilipos/project-atelier](https://github.com/nathanimphilipos/project-atelier)

## What It Does (In Plain English)

When a company wants to work with the U.S. government, they need to prove their systems are secure. This involves hundreds of security controls, mountains of evidence, and auditors who scrutinize everything. Project Atelier automates the hardest parts:

1. **Upload your evidence** (screenshots, configs, policies) and link it to the right controls
2. **AI generates compliance narratives** — written explanations of how you meet each requirement
3. **Get a confidence score** — how likely the auditor is to accept your narrative
4. **Track GovRAMP progress** across all 4 tiers with visual dashboards
5. **Import PMO feedback CSVs** — the auditor nitpick files — and Atelier parses them automatically

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

Navigate to **http://localhost:3000** — you'll land on the login page. Sign in and you're in.

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
│   ├── src/app/           Pages (login, dashboard, controls, etc.)
│   ├── src/components/    UI components, sidebar, auth context
│   └── src/hooks/         React Query API hooks
├── services/api/          FastAPI Python backend
│   ├── app/               Application code
│   │   ├── genai/         Pluggable GenAI provider interface
│   │   ├── models/        SQLAlchemy ORM models
│   │   ├── rag/           ChromaDB vector store for RAG
│   │   ├── routers/       API route handlers
│   │   ├── schemas/       Pydantic request/response models
│   │   └── services/      Business logic, scoring, prompts
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

### Core
- **Login Page**: Username/password or SSO (Google, Microsoft) authentication
- **Dashboard**: Welcome banner, onboarding wizard (manual or CSV upload), evidence acceptance rate chart, GovRAMP tier progress donut charts
- **Market Snapshot**: U.S. market indices and economic indicators with GRC impact analysis

### Compliance
- **Controls List**: Searchable table of all NIST 800-53 Rev 5 controls with status chips, confidence scores, and filters
- **Control Workspace**: Upload evidence, paste auditor feedback, generate AI-powered narratives with confidence scoring
- **Evidence Vault**: Central evidence repository with control and SOC 2 linkage
- **Narrative Studio**: AWS-first evidence suggestions per control family, AI narrative generation, auditor acceptance confidence scores (Azure & GCP coming soon)

### Programs
- **GovRAMP Journey**: Track progress across 4 tiers (Progressing Snapshot, Core, Ready, Authorized), upload PMO feedback CSVs, view snapshot history and timeseries charts
- **SOC 2 Reuse**: Crosswalk mapping + evidence reuse from NIST controls
- **Boards**: 5 Kanban boards for task tracking
- **Imports**: Crosswalk CSV import and GovRAMP data ingestion

## API Endpoints

See `services/api/app/routers/` for full endpoint definitions. Key endpoints:

- `GET /api/controls` — List/search controls
- `GET /api/controls/{id}` — Control detail
- `POST /api/evidence/upload` — Upload evidence (multipart)
- `POST /api/controls/{id}/feedback` — Submit auditor feedback
- `POST /api/narratives/generate` — Generate narrative + confidence assessment
- `GET /api/boards` — List boards
- `POST /api/controls/{id}/create-cards-from-gaps` — Create board cards from remediation items
- `POST /api/crosswalk/import` — Import SOC 2 crosswalk CSV
- `GET /api/govramp/dashboard` — GovRAMP tier progress + snapshots
- `POST /api/govramp/pmo-feedback/upload` — Upload PMO feedback CSV
- `GET /api/govramp/stats` — Aggregated GovRAMP stats for dashboard

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, React Query
- **Backend**: FastAPI, SQLAlchemy, Alembic, ChromaDB
- **AI**: OpenAI GPT-4o (narrative generation, evidence analysis, scoring)
- **Database**: SQLite (dev), easily swappable to PostgreSQL

---

*v1.0 — with love, SaltyCloud GRC Team 💙*
