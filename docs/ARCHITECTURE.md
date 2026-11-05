# MineAtlas Architecture

This document provides a beginner-friendly overview of how the different components of **MineAtlas** interact.

---

## High-Level System Architecture

In its complete design, data flows through four distinct layers:

```mermaid
flowchart LR
    A["React Frontend (Vite + TS)"] -->|HTTP / JSON| B["FastAPI Backend (Python)"]
    B -->|SQL Queries| C["SQLite Database (Local File)"]
    B -->|Rate-Limited Ingestion (50 req/min)| D["Astroworld API (api.astroworldmc.com)"]
```

### Full Target Architecture Diagram:

```text
+------------------------------------------------------------------+
|                   MineAtlas Browser Frontend                     |
|  - React 18 + TypeScript + Vite                                  |
|  - Tailwind CSS dark UI inspired by exploration tools            |
|  - Talks ONLY to FastAPI (never to external APIs)                |
+------------------------------------------------------------------+
                                |
                                | HTTP REST (/api/...)
                                v
+------------------------------------------------------------------+
|                    FastAPI Backend (Python)                      |
|  - Manages API routing and CORS policies                         |
|  - Rate limits external calls (50 req/min max)                   |
|  - Queries SQLite and serves data to the frontend                |
+------------------------------------------------------------------+
               |                                    |
     SQL Reads & Writes              Scheduled Ingestion (Future)
               v                                    v
+-----------------------------+     +------------------------------+
|   SQLite Local Database     |     |       Astroworld API         |
|  - Single local file (*.db) |     |  - Upstream data source      |
|  - Fast, zero-config on     |     |  - NEVER contacted directly  |
|    Linux Mint               |     |    by browser/frontend       |
+-----------------------------+     +------------------------------+
```

---

## System Architecture Status: Complete Release

MineAtlas implements a full three-tier architecture that completely isolates browser users from upstream external APIs:

```mermaid
flowchart TD
    subgraph Tier 1: Presentation
        UI["React 18 + TypeScript + Vite (:5173)\nTailwind CSS • Cytoscape.js • SVG Schematics"]
    end

    subgraph Tier 2: Application & Cache
        API["FastAPI Backend (:8000)\nTyped REST Endpoints • Pydantic Schemas • CORS"]
        DB[("SQLite Local Cache & DB\nSQLAlchemy ORM • Alembic Migrations")]
        API <-->|SQL Queries| DB
    end

    subgraph Tier 3: Upstream Ingestion
        SYNC["Background CLI Ingestion & Seeder\nToken-Bucket Limiter (≤ 50 req/min)"]
        AW["Astroworld Public API\n(api.astroworldmc.com)"]
        SYNC <-->|Rate-Limited HTTPS| AW
        SYNC -->|Idempotent Upsert| DB
    end

    UI <-->|HTTP / JSON REST (/api/*)| API

    classDef presentation fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef application fill:#022c22,stroke:#10b981,stroke-width:2px,color:#f8fafc;
    classDef upstream fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;

    class UI presentation;
    class API,DB application;
    class SYNC,AW upstream;
```

---

## Component Details & Responsibilities

### 1. React Frontend (`frontend/`)
- **What it does:** Runs entirely inside the user's web browser. It renders the user interface (interactive Cytoscape.js graph, mob and biome registries, farm blueprints with interactive material checklists, and world calculators).
- **Isolation Guarantee:** The frontend exclusively communicates with the local FastAPI backend (`http://localhost:8000/api/*`). It **never** contacts Astroworld or external third parties directly.
- **Why Vite & TypeScript?**
  - **Vite** delivers sub-second Hot Module Replacement (HMR) and optimized Rollup production bundles.
  - **TypeScript** enforces strict typing across all API payloads, graph nodes, and component props.
- **Why Tailwind CSS?**
  - Utility-first dark Minecraft exploration theme without bloated external CSS libraries.

### 2. API Communication Layer (`frontend/src/api/mineatlasApi.ts`)
- **What it does:** Centralized HTTP client managing all REST calls, parameter serialization, error extraction, and endpoint routes.
- **Why isolate it?** Decouples UI components from networking logic, ensures strict single-point error handling, and makes mocking straightforward in automated Vitest tests.

### 3. FastAPI Backend (`backend/app/`)
- **What it does:** High-performance, typed Python 3.12 web service handling endpoint routing, query pagination, localized graph traversals, and mathematical calculations.
- **FastAPI Advantages:**
  - Automatic OpenAPI / Swagger interactive documentation at `/docs`.
  - Pydantic models for strict request/response validation.
  - Dependency injection for database sessions (`get_db`).
- **CORS Configuration:**
  - Configured to permit only local development origins (`http://localhost:5173` and `http://127.0.0.1:5173`).

### 4. SQLite Local Cache & Database (`backend/data/mineatlas.db`)
- **What it does:** Stores all entities (76 mobs, 64 biomes, 100 key items, 24 structures, enchantments, trades), 650 derived graph edges, 3 curated farm guides, 3 dimensions, and 5 world presets.
- **Why SQLite over PostgreSQL or Docker?**
  - Single zero-configuration file on disk.
  - Zero background daemon, zero port binding, zero memory leaks.
  - Runs natively and comfortably on Linux Mint.

### 5. Controlled Upstream Ingestion & Rate Limiting (`backend/app/clients/` & `scripts/`)
- **What it does:** CLI scripts (`sync_astroworld.py`, `seed_curated_farms.py`, `seed_world_reference.py`) that populate SQLite.
- **Rate-Limit Safety:**
  - Enforces an in-process token bucket rate limiter strictly capped at **50 requests per minute** (1 request every 1.2 seconds with exponential backoff).
  - All normal browsing queries read exclusively from local SQLite, generating **0** external network requests.

