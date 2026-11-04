# MineAtlas

**Minecraft Java Edition Atlas & Knowledge Graph Explorer**

MineAtlas is an interactive explorer for Minecraft Java Edition that connects biomes, mobs, items, key blocks, structures, enchantments, villager trades, and curated farm guides into a unified, graph-driven knowledge base.

---

## Current Status: Phase 4 (Data Ingestion & Knowledge Graph Caching)

MineAtlas has implemented a robust, rate-limited data ingestion pipeline with local SQLite caching and knowledge graph edge derivation:
- **Phase 1 (Foundation):** Runnable FastAPI backend, React + Vite frontend, and basic CI.
- **Phase 2 (API Audit):** Safe, rate-limited audit tool (`python -m app.scripts.audit_astroworld`) verified all 9 Astroworld collection endpoints.
- **Phase 3 (Database Schema):** SQLite database configured with SQLAlchemy ORM models and Alembic migrations across 16 canonical tables (including `mobs`, `biomes`, `items`, `structures`, `trades`, `farms`, and generic `relation_edges`).
- **Phase 4 (Ingestion & Graph Caching):** Strict 50 req/min token-bucket rate limiter, idempotent upserts into SQLite (`backend/data/mineatlas.db`), probability normalization, `SyncRun` tracking, and automatic derivation of initial semantic graph edges (`SPAWNS_IN`, `DROPS`, `BREEDS_WITH`, `TAMED_WITH`, `FOUND_IN`, `LOCATED_IN`, `CONTAINS_LOOT`, `TRADED_BY`, `UNLOCKS`, `ADDED_IN`).

> [!NOTE]
> **Planned for Later Phases:**
> - **Public Backend Query APIs:** List/detail endpoints with filtering and pagination (Phase 5).
> - **Global Search:** Fast multi-entity search across biomes, mobs, items, and structures (Phase 5).
> - **Interactive Knowledge Graph Visualizer:** React + Cytoscape graph canvas (Phase 6).
> - **Curated Farm Guides:** Handcrafted Java Edition farm blueprints with production metrics (Phase 7).

---

## Technology Stack

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | Python 3.12 + FastAPI | Fast, typed REST API |
| **Database** | SQLite | Zero-config, single-file local relational database (`backend/data/mineatlas.db`) |
| **ORM** | SQLAlchemy 2.0 | Type-safe declarative Python models |
| **Database Migrations** | Alembic | Version-controlled database schema migrations |
| **HTTP Client** | httpx | Upstream API communication with in-process token bucket rate limiter |
| **Backend Testing** | Pytest | Automated endpoint, rate limiter, normalizer, and ingestion test suite |
| **Frontend Framework** | React 18 + TypeScript | UI component library with static types |
| **Frontend Build Tool** | Vite | Ultra-fast local development & bundling |
| **Frontend Styling** | Tailwind CSS | Utility-first dark Minecraft exploration theme |
| **Routing** | React Router DOM | Client-side routing |

---

## Quick Start on Linux Mint

Follow these exact steps from the project root directory (`~/Desktop/mineatlas`):

### 1. Backend Setup & Run

Open a terminal and activate the existing Python 3.12 virtual environment:

```bash
# 1. Navigate to the project folder
cd ~/Desktop/mineatlas

# 2. Activate the existing virtual environment
source venv/bin/activate

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Run database migrations to apply the canonical schema
cd backend
alembic upgrade head
cd ..

# 5. Run the complete backend test suite (39 tests)
PYTHONPATH=backend pytest backend/tests

# 6. Start the FastAPI development server
uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

The backend is live at:
- Health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- Development Sync Status: [http://127.0.0.1:8000/api/development/sync-status](http://127.0.0.1:8000/api/development/sync-status)
- Interactive API Docs (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 2. Running Data Ingestion & Sync

To synchronize upstream Astroworld data into the local SQLite cache and derive graph edges:

```bash
cd ~/Desktop/mineatlas
source venv/bin/activate
cd backend
python -m app.scripts.sync_astroworld
```

* Contacts all 9 approved Astroworld collection endpoints sequentially.
* Gated by the internal **50 requests per minute** token bucket rate limiter.
* Idempotently upserts records without duplicates and derives knowledge graph edges.

---

### 3. Frontend Setup & Run

Open a second terminal window for the frontend:

```bash
# 1. Navigate to the frontend directory
cd ~/Desktop/mineatlas/frontend

# 2. Install frontend dependencies
npm install

# 3. Build for production (verifies TypeScript types & bundle)
npm run build

# 4. Start the Vite development server
npm run dev
```

The frontend will run at:
- Local App: [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```text
mineatlas/
├── README.md               # Project overview & run commands
├── LICENSE                 # MIT License
├── .gitignore              # Ignores venv, node_modules, .env, *.db, raw snapshots
├── .env.example            # Root environment variable template
├── docs/
│   ├── SCOPE.md            # Scope boundaries (Java Edition only, rate limits)
│   ├── ARCHITECTURE.md     # Architecture overview & data flow diagrams
│   ├── API_DATA_AUDIT.md   # Empirical findings from Phase 2 Astroworld audit
│   ├── DATA_MODEL.md       # Canonical SQLite database schema and graph design
│   └── INGESTION_AND_SYNC.md # Phase 4 ingestion, rate limiting & sync documentation
│
├── backend/
│   ├── requirements.txt    # FastAPI, Uvicorn, Pytest, httpx, SQLAlchemy, Alembic
│   ├── .env.example        # Backend environment variables template
│   ├── alembic.ini         # Alembic migration configuration
│   ├── pytest.ini          # Pytest configuration
│   ├── alembic/            # Database schema migrations
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI application entrypoint & CORS setup
│   │   ├── config.py       # Configuration & rate limiting parameters
│   │   ├── clients/        # Rate-limited AstroworldClient
│   │   ├── services/       # Ingestion, rate limiter, normalizers & graph derivation
│   │   │   ├── rate_limiter.py
│   │   │   ├── normalizers.py
│   │   │   ├── relationship_derivation.py
│   │   │   ├── ingestion_service.py
│   │   │   └── api_audit_service.py
│   │   ├── scripts/        # CLI scripts (sync_astroworld.py, audit_astroworld.py)
│   │   ├── db/             # Database connection, base classes, and ORM models
│   │   └── routers/        # Health and development routers
│   ├── data/
│   │   ├── mineatlas.db    # Local SQLite database (ignored by Git)
│   │   └── raw_snapshots/  # Local JSON snapshots (ignored by Git)
│   └── tests/              # 39 Pytest automated unit & integration tests
│
├── frontend/               # React + TypeScript + Vite + Tailwind CSS frontend
└── .github/
    └── workflows/
        └── ci.yml          # GitHub Actions CI workflow (tests + build)
```

---

## Architectural Rules & Guardrails

1. **Minecraft Java Edition Exclusively:** No Bedrock edition data or conflicting game mechanics.
2. **Zero Browser-to-Astroworld Calls:** The frontend only speaks to our FastAPI backend.
3. **Internal 50 RPM Rate Limiter:** Local in-process token-bucket limiter enforces 50 req/min strictly.
4. **No Heavy Database Infrastructure:** Runs natively on Linux Mint without Docker, Redis, PostgreSQL, or Neo4j. Powered by local SQLite (`backend/data/mineatlas.db`).
5. **Items & Key Blocks:** Focuses on functional blocks and items rather than every single block variation.
6. **Clear Provenance:** Every database record tracks `source_type` (`astroworld_api`, `curated`, or `calculated`), `source_url`, `game_version`, and `last_verified_at`.

---

## License

This project is licensed under the [MIT License](LICENSE).
