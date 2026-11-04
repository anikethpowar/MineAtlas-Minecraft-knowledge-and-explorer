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

## Current Status: Phase 1 (Foundation)

> [!IMPORTANT]
> In **Phase 1: Foundation**, only the **React Frontend ↔ FastAPI Backend** connection exists.
> SQLite persistence, Astroworld API ingestion, and graph visualizers are **not yet active**.

```mermaid
flowchart LR
    subgraph Phase 1 Implemented
    F["React Frontend (:5173)"] -->|GET /api/health| B["FastAPI Backend (:8000)"]
    end
    subgraph Future Phases
    B -.->|Planned| DB["SQLite Database"]
    B -.->|Planned (50 req/min)| AW["Astroworld API"]
    end
```

---

## Component Explanations for Beginners

### 1. React Frontend (`frontend/`)
- **What it does:** Runs inside the user's web browser. It renders the user interface (buttons, cards, badges) and fetches data from our backend.
- **Why Vite & TypeScript?**
  - **Vite** is a lightning-fast build tool that starts up instantly and reloads changes automatically during development.
  - **TypeScript** adds static types (like `HealthResponse`), preventing runtime bugs and spelling errors in object keys.
- **Why Tailwind CSS?**
  - Allows styling elements directly using standard utility classes (e.g. `bg-emerald-600`, `text-white`, `rounded-md`), keeping styling uniform and maintainable without large custom CSS files.

### 2. API Communication Layer (`frontend/src/api/mineatlasApi.ts`)
- **What it does:** Acts as the single doorway through which the frontend makes network requests.
- **Why isolate it?** Instead of putting `fetch()` calls scattered everywhere inside React components, keeping requests in one central file makes the code cleaner, easier to test, and ensures compliance with the rule that frontend code never contacts external third parties directly.

### 3. FastAPI Backend (`backend/app/`)
- **What it does:** A lightweight, high-performance Python web framework that handles HTTP endpoints, data validation, and business logic.
- **Why FastAPI?**
  - Built-in type hint support (Pydantic), automatic OpenAPI documentation at `/docs`, and high performance.
  - Very clean syntax for beginners compared to larger frameworks.
- **CORS (Cross-Origin Resource Sharing):**
  - By default, browsers block web pages from making requests to a different port (e.g., `localhost:5173` calling `localhost:8000`).
  - FastAPI includes CORS middleware that explicitly permits requests originating from our local Vite development server.

### 4. SQLite Database (Planned for Phase 2)
- **What it does:** Stores mobs, biomes, items, and graph relationships in a single file on disk (`mineatlas.db`).
- **Why SQLite over PostgreSQL or Docker?**
  - Zero background daemon, zero configuration, zero memory overhead. It runs comfortably on Linux Mint with zero setup required.

### 5. Astroworld API Integration (Planned for Phase 2)
- **What it does:** Upstream source for standard Minecraft Java Edition entity drops, trade tables, and biome features.
- **Rate Limit Protection:**
  - The backend will enforce an internal token bucket / scheduler capped at **50 requests per minute**.
  - Requests are cached in SQLite so that repeated frontend views never hit the upstream API unnecessarily.

