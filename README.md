# Project Atelier

> **Atelier** *(French: a creative studio or workshop)* — a full-stack, AI-powered GRC (Governance, Risk & Compliance) engineering platform purpose-built for GovRAMP / StateRAMP / FedRAMP authorization workflows against the NIST 800-53 Rev 5 control framework.

**Created by Nathan Philipos** · [github.com/nathanimphilipos/project-atelier](https://github.com/nathanimphilipos/project-atelier)

---

## Table of Contents

- [Why This Exists](#why-this-exists)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [AI Pipeline](#ai-pipeline)
- [Frontend Architecture](#frontend-architecture)
- [API Reference](#api-reference)
- [Features Deep Dive](#features-deep-dive)
- [Configuration](#configuration)
- [Development](#development)

---

## Why This Exists

Cloud service providers (CSPs) pursuing GovRAMP, StateRAMP, or FedRAMP authorization must demonstrate compliance with **319 NIST 800-53 Rev 5 security controls**. This process involves:

- Collecting hundreds of evidence artifacts (IAM policies, CloudTrail configs, vulnerability scans, etc.)
- Writing audit-ready **System Security Plan (SSP) narratives** for every control — each one mapping evidence to specific sub-requirements
- Responding to **PMO (Program Management Office) feedback** where assessors nitpick every gap, missing proof, and vague claim
- Tracking progress across **4 authorization tiers**: Progressing Snapshot (40 controls), Core (60), Ready (80), and Authorized (319)
- Repeating this cycle every assessment period until authorization is granted

Project Atelier automates the most painful parts of this workflow:

1. **Evidence ingestion** — Upload screenshots, PDFs, DOCX files. The system extracts text, runs GPT-4o vision analysis on images, and produces structured JSON summaries of what each artifact proves.
2. **RAG-augmented narrative generation** — The AI doesn't just write generic prose. It retrieves the full NIST control text from a ChromaDB vector store, cross-references related controls across families, incorporates prior PMO feedback, and generates a narrative that reads like it was written by a compliance engineer who's been through 10 audits.
3. **Confidence scoring** — A deterministic scoring engine evaluates evidence coverage, feedback resolution, and risk severity to produce a percentage confidence that the auditor will accept the narrative. This isn't a vibes-based number — it's computed from structured inputs the AI extracts.
4. **PMO feedback parsing** — Upload the CSV export from your PMO assessor. Atelier parses pass/fail decisions, analyst notes, issues, and gaps per control, then feeds that context back into future narrative generations.

The goal: reduce the time from "we have evidence scattered across 47 Confluence pages and a shared drive" to "here's a complete, auditor-ready control package" from weeks to hours.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js 14)                     │
│  Login → Dashboard → Controls → Evidence → Narrative Studio     │
│  React Query for server state · Tailwind + shadcn/ui            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ /api/* proxy (next.config.js rewrites)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (:8000)                      │
│                                                                 │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Routers │  │ Services │  │   RAG    │  │  GenAI Layer   │  │
│  │         │  │          │  │          │  │                │  │
│  │controls │  │narrative │  │ChromaDB  │  │ GenAIProvider  │  │
│  │evidence │  │generator │  │cosine    │  │   (ABC)        │  │
│  │govramp  │  │scoring   │  │similarity│  │      │         │  │
│  │boards   │  │prompts   │  │HNSW     │  │ OpenAIProvider │  │
│  │soc2     │  │          │  │index    │  │  - vision      │  │
│  │narratives│ │          │  │          │  │  - text gen    │  │
│  └─────────┘  └──────────┘  └──────────┘  │  - structured  │  │
│                                            └────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SQLAlchemy ORM + Alembic Migrations         │   │
│  │  SQLite (dev) — swap to PostgreSQL via DATABASE_URL      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 14.2 | App Router, file-based routing, API proxy |
| **TypeScript** | 5.x | Type safety across all components and hooks |
| **Tailwind CSS** | 3.4 | Utility-first styling with custom design tokens |
| **shadcn/ui** | latest | Radix-based component primitives (Card, Button, Input, Badge, etc.) |
| **React Query** | 5.x | Server state management, cache invalidation, optimistic updates |
| **Lucide React** | latest | Icon system (200+ icons used across the UI) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.115.6 | Async REST API with automatic OpenAPI docs |
| **SQLAlchemy** | 2.0.36 | ORM with 13 models across 11 tables |
| **Alembic** | 1.14.1 | Schema migrations (2 migration files) |
| **Pydantic** | 2.10.4 | Request/response validation and serialization |
| **ChromaDB** | 0.5.23 | Vector store for RAG (cosine similarity, HNSW index) |
| **OpenAI SDK** | 1.59.3 | GPT-4o for text generation, vision analysis, structured output |
| **python-multipart** | 0.0.20 | Multipart file upload handling |
| **python-docx** | 1.1.2 | DOCX text extraction from evidence files |
| **PyPDF2** | 3.0.1 | PDF text extraction from evidence files |
| **Pillow** | 11.1.0 | Image processing for vision analysis pipeline |

### Infrastructure
| Component | Implementation |
|---|---|
| **Database** | SQLite (file-based, zero-config dev). Swap to PostgreSQL by changing `DATABASE_URL`. |
| **Vector Store** | ChromaDB PersistentClient at `data/atelier/chroma/` |
| **File Storage** | Local filesystem at `data/atelier/uploads/` |
| **Auth** | Client-side auth context with localStorage (production: swap to NextAuth.js + JWT) |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- An OpenAI API key with GPT-4o access

### 1. Clone & Configure

```bash
git clone https://github.com/nathanimphilipos/project-atelier.git
cd project-atelier
cp .env.example .env
# Edit .env → set OPENAI_API_KEY
```

### 2. Backend

```bash
cd services/api
python -m venv .venv
source .venv/bin/activate          # macOS/Linux

pip install -r requirements.txt

alembic upgrade head               # Run migrations (creates SQLite DB)
python scripts/seed_db.py          # Seed 319 NIST 800-53 controls + 5 Kanban boards
python scripts/index_chroma.py     # Index controls into ChromaDB for RAG

uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd apps/web
npm install
npm run dev                        # Starts on :3000
```

### 4. Open

Navigate to **http://localhost:3000**. You'll land on the login page. Sign in with any name — the app stores your session in localStorage and greets you on the dashboard.

The Next.js dev server proxies all `/api/*` requests to the FastAPI backend at `http://127.0.0.1:8000`.

---

## Project Structure

```
project-atelier/
│
├── apps/web/                          # ── FRONTEND ──────────────────────
│   ├── src/
│   │   ├── app/                       # Next.js App Router pages
│   │   │   ├── page.tsx               # / — Login page (root route)
│   │   │   ├── dashboard/page.tsx     # /dashboard — Main dashboard
│   │   │   ├── market/page.tsx        # /market — U.S. market snapshot
│   │   │   ├── controls/page.tsx      # /controls — NIST 800-53 control list
│   │   │   ├── controls/[controlId]/  # /controls/:id — Control workspace
│   │   │   ├── evidence/page.tsx      # /evidence — Evidence vault
│   │   │   ├── narrative-studio/      # /narrative-studio — Narrative overview
│   │   │   ├── govramp/page.tsx       # /govramp — GovRAMP journey tracker
│   │   │   ├── boards/page.tsx        # /boards — Kanban boards
│   │   │   ├── soc2/page.tsx          # /soc2 — SOC 2 crosswalk reuse
│   │   │   ├── imports/page.tsx       # /imports — CSV/data import
│   │   │   ├── layout.tsx             # Root layout (AppShell wrapper)
│   │   │   └── globals.css            # Tailwind base + HSL CSS variables
│   │   │
│   │   ├── components/
│   │   │   ├── app-shell.tsx          # Conditional sidebar (hidden on login)
│   │   │   ├── auth-context.tsx       # React context for user session
│   │   │   ├── providers.tsx          # QueryClient + AuthProvider wrapper
│   │   │   ├── sidebar.tsx            # Notion/Jira-style grouped nav
│   │   │   ├── layout/               # Reusable layout primitives
│   │   │   │   ├── page-header.tsx    # Consistent page title + icon + actions
│   │   │   │   ├── stat-card.tsx      # Metric display card
│   │   │   │   ├── empty-state.tsx    # Empty state with icon + CTA
│   │   │   │   └── skeleton.tsx       # Loading skeletons (card, table, generic)
│   │   │   └── ui/                    # shadcn/ui primitives (card, button, input, etc.)
│   │   │
│   │   ├── hooks/
│   │   │   └── use-api.ts            # 20+ React Query hooks wrapping every API call
│   │   │
│   │   └── lib/
│   │       ├── api.ts                 # Typed fetch wrapper (request/upload helpers)
│   │       ├── types.ts               # 25+ TypeScript interfaces for all data models
│   │       └── utils.ts               # cn() classname merge utility
│   │
│   ├── tailwind.config.ts             # Extended theme: colors, shadows, typography, animations
│   ├── postcss.config.js              # Tailwind + autoprefixer
│   └── next.config.mjs                # API proxy rewrites to :8000
│
├── services/api/                      # ── BACKEND ───────────────────────
│   ├── app/
│   │   ├── main.py                    # FastAPI app factory + CORS + router registration
│   │   ├── config.py                  # Pydantic Settings (env vars, paths)
│   │   ├── database.py                # SQLAlchemy engine + session factory
│   │   │
│   │   ├── models/                    # SQLAlchemy ORM models (13 models)
│   │   │   ├── controls.py            # Control (319 NIST 800-53 controls)
│   │   │   ├── evidence.py            # Evidence (uploaded files + extracted text)
│   │   │   ├── control_evidence.py    # M2M join: Control ↔ Evidence
│   │   │   ├── narratives.py          # Narrative (versioned AI-generated text)
│   │   │   ├── auditor_feedback.py    # AuditorFeedback (parsed findings JSON)
│   │   │   ├── assessments.py         # Assessment (confidence score + rationale)
│   │   │   ├── boards.py              # Board (Kanban board definitions)
│   │   │   ├── cards.py               # Card (Kanban cards with control/evidence links)
│   │   │   ├── crosswalk.py           # Crosswalk (NIST → SOC 2 mapping)
│   │   │   ├── soc2_evidence_links.py # SOC2EvidenceLink (evidence → SOC 2 target)
│   │   │   └── govramp_progress.py    # GovRAMPSnapshot, GovRAMPProgress, GovRAMPFeedback
│   │   │
│   │   ├── routers/                   # FastAPI route handlers
│   │   │   ├── controls.py            # CRUD + search + evidence linking
│   │   │   ├── evidence.py            # Upload (multipart) + vision analysis
│   │   │   ├── narratives.py          # Generate narrative + assessment
│   │   │   ├── boards.py              # Boards + cards + gap-to-card creation
│   │   │   ├── govramp.py             # Dashboard, progress, PMO feedback, CSV import
│   │   │   ├── soc2.py                # SOC 2 targets + evidence linking
│   │   │   └── crosswalk.py           # Crosswalk CSV import
│   │   │
│   │   ├── schemas/                   # Pydantic request/response models
│   │   │   ├── controls.py
│   │   │   ├── evidence.py
│   │   │   ├── narratives.py
│   │   │   ├── boards.py
│   │   │   ├── govramp.py
│   │   │   └── soc2.py
│   │   │
│   │   ├── services/                  # Business logic layer
│   │   │   ├── narrative_generator.py # Orchestrates the full generation pipeline
│   │   │   ├── scoring.py             # Deterministic confidence score computation
│   │   │   └── prompts.py             # All AI prompt templates + NIST catalog loader
│   │   │
│   │   ├── genai/                     # Pluggable GenAI provider interface
│   │   │   ├── base.py               # GenAIProvider ABC (5 abstract methods)
│   │   │   ├── factory.py            # Provider factory (reads GENAI_PROVIDER env)
│   │   │   └── openai_provider.py    # OpenAI implementation (vision, text, structured)
│   │   │
│   │   └── rag/                       # Retrieval-Augmented Generation
│   │       └── chroma_store.py        # ChromaDB client, collection mgmt, query functions
│   │
│   ├── alembic/                       # Database migrations
│   │   └── versions/
│   │       ├── 001_initial.py         # Core tables (controls, evidence, narratives, etc.)
│   │       └── 002_govramp_progress.py # GovRAMP tables (snapshots, progress, feedback)
│   │
│   ├── resources/
│   │   └── nist_80053.csv             # Full NIST 800-53 Rev 5 catalog (319 controls)
│   │
│   └── scripts/
│       ├── seed_db.py                 # Seeds controls from CSV + creates 5 boards
│       └── index_chroma.py            # Indexes control text into ChromaDB vectors
│
├── data/atelier/                      # ── LOCAL DATA (gitignored) ───────
│   ├── uploads/                       # Evidence file storage
│   ├── chroma/                        # ChromaDB persistent vector store
│   └── atelier.db                     # SQLite database file
│
├── .env.example                       # Environment variable template
└── README.md                          # You are here
```

---

## Data Model

### Entity Relationship

```
Control (319 rows, seeded from NIST CSV)
  │
  ├── ControlEvidence (M2M) ──→ Evidence (uploaded files)
  │                                  │
  │                                  └── SOC2EvidenceLink ──→ Crosswalk (NIST→SOC2)
  │
  ├── Narrative (versioned, AI-generated)
  │     └── scoring_inputs_json (structured AI output for scoring)
  │
  ├── AuditorFeedback (parsed findings)
  │     └── findings_json { findings, missing_proof_requests, rejected_claims, ... }
  │
  └── Assessment (computed from scoring_inputs)
        ├── confidence_score (0-100)
        ├── meets_status (meets | partially_meets | not_met)
        └── score_rationale_json { why_this_score, top_3_actions }

GovRAMPProgress (4 tiers: ps, core, ready, authorized)
GovRAMPSnapshot (historical period data for timeseries)
GovRAMPFeedback (per-control PMO assessor feedback, parsed from CSV)

Board → Card (Kanban, with linked_control_ids and linked_evidence_ids)
```

### Key Design Decisions

- **Narratives are versioned** — every generation creates a new row with an incrementing `version` field. You never lose a previous narrative.
- **Assessments are decoupled from narratives** — the scoring engine runs independently on structured inputs extracted from the AI output. This means you can re-score without re-generating.
- **Evidence supports vision analysis** — image uploads are sent through GPT-4o vision, which returns structured JSON (`key_findings`, `configuration_values`, `claims_supported`, `uncertainty`). This JSON is stored in `vision_summary_json` and fed into narrative generation.
- **GovRAMP feedback is control-normalized** — CSV control IDs like `AC-2`, `AC-2 (1)`, `AC-02` are all normalized to the canonical format `AC-02` using regex normalization in the import pipeline.

---

## AI Pipeline

### Narrative Generation Flow

```
User clicks "Generate Narrative"
         │
         ▼
┌─ narrative_generator.py ─────────────────────────────────────┐
│                                                               │
│  1. Load Control from DB (control_text, discussion, title)    │
│  2. Query ChromaDB for top-5 related chunks (RAG)             │
│  3. Build evidence summaries:                                 │
│     - Vision JSON for images                                  │
│     - Extracted text for PDFs/DOCX (truncated to 2000 chars)  │
│  4. Build auditor feedback text (if feedback_id provided)     │
│  5. Query GovRAMPFeedback for PMO context on this control     │
│  6. Format prompt with all context                            │
│  7. Send to OpenAI GPT-4o with PMO assessor system prompt     │
│  8. Parse response:                                           │
│     - Extract ===COPY-PASTE NARRATIVE=== section               │
│     - Extract ```json scoring_inputs block                    │
│  9. Run deterministic scoring on scoring_inputs                │
│ 10. Create Narrative + Assessment rows, update Control status  │
└───────────────────────────────────────────────────────────────┘
```

### System Prompt Design (v2.0-pmo)

The AI is prompted as a **skeptical PMO assessor**, not a helpful writer. Key behaviors:

- Every sub-requirement of the control text must be individually verified against evidence
- Vague evidence ("we have a policy") is insufficient without specific content
- 8/10 sub-requirements met = "Partially Meets", not "Meets"
- Unresolved PMO feedback items automatically cap the score at 50
- The full NIST 800-53 catalog (~319 controls) is injected into the system prompt so the AI can cross-reference related controls across families

### Scoring Engine (`scoring.py`)

The confidence score is **deterministic**, not AI-generated. It's computed from structured inputs the AI extracts:

```
Base score: 100

Evidence penalties:
  - Missing evidence items: -(missing/total × 40)
  - Weak evidence strength: -5 per item
  - No evidence defined: -30

Feedback penalties:
  - Unresolved auditor items: -8 per item (max -30)

Risk penalties:
  - High severity: -10 per risk
  - Medium severity: -5 per risk

Confidence cap:
  - If cap_reason exists: score capped at 60

Final: clamp(0, 100)
  ≥80 → "meets"
  ≥50 → "partially_meets"
  <50 → "not_met"
```

### GenAI Provider Interface

The AI layer is abstracted behind a `GenAIProvider` ABC with 5 methods:

```python
class GenAIProvider(ABC):
    async def analyze_image(image_bytes, prompt, filename) -> dict    # Vision
    async def generate_text(prompt, system_prompt) -> str             # Narrative gen
    async def parse_structured(prompt, system_prompt) -> dict         # JSON output
    def get_vision_model() -> str
    def get_text_model() -> str
```

Currently only `OpenAIProvider` is implemented. To add Anthropic, Gemini, or a local model, implement this interface and register it in `genai/factory.py`.

### RAG Implementation

ChromaDB stores NIST control text as vector embeddings:

- **Collection**: `nist_controls` with cosine similarity and HNSW index
- **Query**: `query_control_chunks(control_id, n_results=5)` retrieves the most relevant chunks for a given control
- **Cross-reference**: `query_related_controls(query_text, n_results=3)` finds semantically similar controls across families
- **Indexing**: `scripts/index_chroma.py` reads `nist_80053.csv` and upserts all 319 controls

---

## Frontend Architecture

### Routing

| Route | Component | Auth | Sidebar |
|---|---|---|---|
| `/` | Login page | No | Hidden |
| `/dashboard` | Dashboard (onboarding, charts, donuts) | Yes | Visible |
| `/market` | U.S. market snapshot | Yes | Visible |
| `/controls` | NIST 800-53 control list | Yes | Visible |
| `/controls/[controlId]` | Control workspace (evidence, feedback, narrative) | Yes | Visible |
| `/evidence` | Evidence vault | Yes | Visible |
| `/narrative-studio` | Narrative overview with AWS evidence suggestions | Yes | Visible |
| `/govramp` | GovRAMP journey tracker | Yes | Visible |
| `/boards` | Kanban boards | Yes | Visible |
| `/soc2` | SOC 2 crosswalk reuse | Yes | Visible |
| `/imports` | Data import tools | Yes | Visible |

### State Management

- **Server state**: React Query (`@tanstack/react-query`) with 20+ custom hooks in `hooks/use-api.ts`. Each hook wraps a typed API call with automatic cache invalidation on mutations.
- **Auth state**: React Context (`auth-context.tsx`) backed by `localStorage`. Stores `{ firstName, lastName, username }`.
- **UI state**: Component-local `useState` — no global UI state store needed.

### Design System

Custom Tailwind theme extending shadcn/ui defaults:

- **Colors**: Navy (`#003070`), CTA green (`#1a7a00`), soft mint background (`#f4f7f7`), HSL CSS variables for shadcn compatibility
- **Typography**: Custom `page-title` (1.625rem/700), `section-title` (1rem/600), `stat` (1.875rem/700) font sizes with negative letter-spacing
- **Shadows**: `card` (subtle), `card-hover` (medium), `elevated` (prominent) — three-tier elevation system
- **Border radius**: Standardized at `xl` (1rem), `lg` (0.875rem), `md` (0.625rem)
- **Animations**: Custom `skeleton-pulse` keyframe for loading states

### Sidebar

Notion/Jira-inspired grouped navigation with 4 sections (Overview, Compliance, Programs, Workspace). Active state uses an emerald accent bar on the left edge. The `AppShell` component conditionally hides the sidebar on auth routes (`/` and `/login`).

---

## API Reference

All endpoints are prefixed with `/api`. The FastAPI backend auto-generates OpenAPI docs at `http://localhost:8000/docs`.

### Controls

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/controls?search=` | List/search all 319 controls. Returns status, evidence count, latest confidence score. |
| `GET` | `/controls/{control_id}` | Full control detail including text, discussion, enhancements. |
| `POST` | `/controls/{control_id}/link-evidence` | Link evidence IDs to a control. Body: `{ evidence_ids: [1, 2, 3] }` |
| `POST` | `/controls/{control_id}/feedback` | Upload auditor feedback (multipart: text and/or file). Parses findings via GPT-4o. |
| `GET` | `/controls/{control_id}/feedback` | List all feedback for a control. |
| `POST` | `/controls/{control_id}/create-cards-from-gaps` | Auto-create Kanban cards from assessment gaps. |

### Evidence

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/evidence?control_id=&search=` | List evidence, optionally filtered by control or search term. |
| `POST` | `/evidence/upload` | Upload evidence file (multipart). Extracts text from PDF/DOCX, runs vision on images. |

### Narratives & Assessments

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/narratives/generate` | Generate narrative + assessment. Body: `{ control_id, evidence_ids, narrative_text?, feedback_id? }` |
| `GET` | `/narratives?control_id=` | List all narrative versions for a control. |
| `GET` | `/assessments?control_id=` | List all assessments for a control. |

### GovRAMP

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/govramp/dashboard` | Full dashboard: tier progress + snapshot history. |
| `GET` | `/govramp/stats` | Aggregated stats for dashboard widgets (total controls, avg confidence, tier breakdowns). |
| `GET` | `/govramp/progress` | List all 4 tier progress records. |
| `PUT` | `/govramp/progress/{tier}` | Update tier progress. Body: `{ completion_pct, missing_control_ids? }` |
| `POST` | `/govramp/import-journey-csv` | Import journey CSV from local file path. |
| `GET` | `/govramp/pmo-feedback` | List all PMO feedback rows. |
| `POST` | `/govramp/pmo-feedback/upload` | Upload PMO feedback CSV (multipart). Parses, normalizes control IDs, replaces existing data. |

### Boards

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/boards` | List all boards with card counts. |
| `GET` | `/boards/{board_id}/cards` | List cards for a board. |
| `POST` | `/boards/{board_id}/cards` | Create a card. |
| `PUT` | `/cards/{card_id}` | Update a card (move columns, edit details). |

### SOC 2

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/soc2/targets` | List SOC 2 targets with evidence counts and satisfaction status. |
| `POST` | `/soc2/link-evidence` | Link evidence to a SOC 2 target. |
| `POST` | `/crosswalk/import` | Import NIST → SOC 2 crosswalk CSV. |

---

## Features Deep Dive

### Dashboard (`/dashboard`)

- **Welcome banner** with dynamic user name from auth context
- **Onboarding CTA** (shown when no data exists): two options — manual entry via GovRAMP Journey, or CSV upload of PMO feedback (recommended, fastest path)
- **Evidence Acceptance Rate chart**: SVG timeseries showing evidence submission progress across all 4 tiers over time, rendered from `GovRAMPSnapshot` data
- **GovRAMP Progress donuts**: 4 animated SVG donut charts (Progressing Snapshot, Core, Ready, Authorized) with completion percentages, control counts, and missing control badges

### Narrative Studio (`/narrative-studio`)

- **AWS-first evidence suggestions**: Per control family (AC, AU, IA, SC, SI, CM, CP, IR, RA), shows specific AWS artifacts to collect (IAM policies, CloudTrail configs, GuardDuty findings, etc.)
- **Cloud provider badges**: AWS active, Azure and GCP marked "Coming Soon"
- **Auditor acceptance confidence**: Each control card shows a confidence percentage with human-readable labels ("Very likely to pass", "May need more evidence", etc.)
- The studio does **not** assess controls — it generates narratives from evidence and provides a confidence score on auditor acceptance

### Control Workspace (`/controls/[controlId]`)

The core workflow page. A single control workspace includes:
- Full NIST control text, discussion, and enhancements
- Evidence attachment (link existing or upload new)
- Auditor feedback submission (text or file upload, auto-parsed by GPT-4o)
- Narrative generation with version history
- Assessment results with score rationale and top 3 actions to improve
- Gap-to-card creation (auto-generates Kanban tasks from identified gaps)

### GovRAMP Journey (`/govramp`)

- **4 tier progress cards** with editable completion percentages and missing control lists
- **PMO feedback upload**: Parses CSV exports from PMO assessors. Normalizes control IDs (`AC-2` → `AC-02`), extracts pass/fail status, analyst feedback, issues, and score per control.
- **Snapshot history table**: Period-over-period data showing core/ready/authorized implementation counts
- **Timeseries chart**: SVG line chart with 4 series showing evidence submission trends
- **PMO feedback breakdown**: Status distribution (Pass/Fail/Concerns) + detailed table with control, status, feedback, issues, and month last passed

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GENAI_PROVIDER` | `openai` | GenAI provider. Only `openai` implemented; extend `genai/base.py` for others. |
| `OPENAI_API_KEY` | — | **Required.** Your OpenAI API key with GPT-4o access. |
| `OPENAI_VISION_MODEL` | `gpt-4o` | Model for evidence image analysis. Must support vision. |
| `OPENAI_TEXT_MODEL` | `gpt-4o` | Model for narrative generation and feedback parsing. |
| `DATABASE_URL` | `sqlite:///data/atelier/atelier.db` | SQLAlchemy connection string. Swap to `postgresql://...` for production. |
| `UPLOAD_DIR` | `data/atelier/uploads` | Evidence file storage path. |
| `CHROMA_DIR` | `data/atelier/chroma` | ChromaDB persistent storage path. |

### Next.js Proxy

The frontend proxies `/api/*` to the backend via `next.config.mjs` rewrites. In production, replace this with a proper reverse proxy (nginx, Caddy, etc.) or deploy the API separately.

---

## Development

### Adding a New GenAI Provider

1. Create `services/api/app/genai/your_provider.py`
2. Implement the `GenAIProvider` ABC (5 methods: `analyze_image`, `generate_text`, `parse_structured`, `get_vision_model`, `get_text_model`)
3. Register in `genai/factory.py`
4. Set `GENAI_PROVIDER=your_provider` in `.env`

### Adding a New Database Migration

```bash
cd services/api
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Adding a New Frontend Page

1. Create `apps/web/src/app/your-page/page.tsx`
2. Add a nav entry in `components/sidebar.tsx` under the appropriate section
3. Add API hooks in `hooks/use-api.ts` if needed
4. Use layout primitives (`PageHeader`, `StatCard`, `EmptyState`, `Skeleton`) for consistency

### Running a Production Build

```bash
cd apps/web
npx next build        # Outputs to .next/
npx next start        # Serves on :3000
```

---

*v1.0 — with love, SaltyCloud GRC Team 💙*
