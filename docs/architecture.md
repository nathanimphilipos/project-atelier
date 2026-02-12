# Project Atelier — Architecture

## Overview
Project Atelier is a localhost internal web application for generating audit-ready narratives
for NIST 800-53 Rev 5 controls using cloud GenAI (vision + text). It is control-first:
every workflow starts from a specific NIST control and builds evidence, narratives, and
assessments around it.

## Repo Layout
```
project-atelier/
├── apps/
│   └── web/                    # Next.js 14 + TypeScript frontend
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   ├── components/     # Reusable UI components
│       │   ├── lib/            # API client, utils, types
│       │   └── hooks/          # React Query hooks
│       ├── public/
│       ├── tailwind.config.ts
│       ├── next.config.js
│       └── package.json
├── services/
│   └── api/                    # FastAPI Python backend
│       ├── app/
│       │   ├── main.py         # FastAPI app entry
│       │   ├── config.py       # Settings via pydantic-settings
│       │   ├── database.py     # SQLAlchemy engine + session
│       │   ├── models/         # SQLAlchemy ORM models
│       │   ├── schemas/        # Pydantic request/response schemas
│       │   ├── routers/        # API route modules
│       │   ├── services/       # Business logic
│       │   ├── genai/          # Pluggable GenAI provider interface
│       │   └── rag/            # Chroma vector store + retrieval
│       ├── alembic/            # Alembic migrations
│       ├── scripts/            # Seed + indexing scripts
│       ├── resources/          # nist_80053.csv
│       ├── alembic.ini
│       └── requirements.txt
├── data/
│   └── atelier/
│       ├── uploads/            # Evidence file storage
│       ├── chroma/             # Chroma persistent vector DB
│       └── atelier.db          # SQLite database
└── docs/
    ├── architecture.md         # This file
    └── prompts.md              # GenAI prompt templates
```

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query
- **Backend**: FastAPI + SQLAlchemy + Alembic + SQLite
- **Vector/RAG**: ChromaDB (persistent, local)
- **GenAI**: Pluggable provider (OpenAI default) — vision + text models
- **Storage**: Local filesystem (./data/atelier/uploads)

## Data Flow
1. User selects a NIST control from the Controls list
2. On the Control Workspace, user uploads evidence (images, PDFs, DOCX)
3. Evidence is processed: images → vision model → structured JSON; docs → text extraction
4. User optionally adds auditor feedback (upload or paste)
5. Feedback is parsed into structured findings_json
6. User clicks "Generate Updated Narrative"
7. System retrieves NIST control chunks from Chroma (RAG)
8. System composes prompt with: control chunks + evidence summaries + feedback + current narrative
9. GenAI produces structured narrative output
10. Deterministic scoring function computes confidence score from scoring_inputs
11. Everything persisted to SQLite; evidence files on disk

## Database
SQLite via SQLAlchemy ORM. 10 tables: controls, evidence, control_evidence,
narratives, auditor_feedback, assessments, boards, cards, crosswalk, soc2_evidence_links.
See models/ for full schema.

## GenAI Provider Interface
Abstract base class `GenAIProvider` with methods:
- `analyze_image(image_bytes, prompt) -> dict`
- `generate_text(prompt, system_prompt) -> str`
- `parse_structured(prompt, schema) -> dict`

OpenAI implementation uses gpt-4o for vision, gpt-4o for text.
Configured via environment variables. Anthropic can be added by implementing the interface.
