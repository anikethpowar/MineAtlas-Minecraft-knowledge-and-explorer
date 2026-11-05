# MineAtlas

**Minecraft Java Edition Atlas & Knowledge Graph Explorer**

MineAtlas is an interactive explorer for Minecraft Java Edition that connects biomes, mobs, items, key blocks, structures, enchantments, villager trades, and curated farm guides into a unified, graph-driven knowledge base.

---

## Current Status: Phase 8 (Curated Farm Blueprint Hub)

MineAtlas provides a fast, stable, and typed REST API over its local SQLite cache (`backend/data/mineatlas.db`) and an interactive React frontend:
- **Phase 1 (Foundation):** Runnable FastAPI backend, React + Vite frontend, and CI.
- **Phase 2 (API Audit):** Safe, rate-limited audit tool (`python -m app.scripts.audit_astroworld`) verified all 9 Astroworld collection endpoints.
- **Phase 3 (Database Schema):** SQLite database configured with SQLAlchemy ORM models and Alembic migrations across 16 canonical tables.
- **Phase 4 (Ingestion & Graph Caching):** Strict 50 req/min rate limiter, idempotent SQLite caching, probability normalization, `SyncRun` tracking, and automatic derivation of 650 semantic graph edges.
- **Phase 5 (FastAPI Query API):** Global multi-entity search, paginated and filterable explorer endpoints, supporting reference endpoints, localized graph-neighbour traversals (depth 1 & 2), and public cache status reporting. Reads strictly from SQLite.
- **Phase 6 (Core Frontend Explorer):** Full React + Tailwind browser explorer for Mobs, Biomes, Items & Key Blocks (curated 100 catalog), Structures, Global Search, and data transparency.
- **Phase 7 (Interactive Knowledge Graph Explorer):** Signature Cytoscape.js visual graph canvas (`/graph`) with shape-coded entity nodes, directed relationship arrows, deterministic "Why connected?" explanations, client-side predicate filtering, localized 1-2 hop depth radius, and an accessible Relationship List alternative view.
- **Phase 8 (Curated Farm Blueprint Hub):** Dedicated hub (`/farms`) and guide detail pages (`/farms/:farmSlug`) for verified Java Edition architectures (Iron Farm, Raid Farm, Villager Breeder). Includes version-specific compatibility notes (highlighting Java 1.21 Ominous Bottle changes), interactive local checklists, original spatial zone schematics, and integration with the Knowledge Graph.

> [!NOTE]
> **Planned for Later Phases:**
> - **World Atlas & Calculators:** Spawn mechanics, portal mathematics, and world reference tools (Phase 9).

---

## Technology Stack

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | Python 3.12 + FastAPI | Fast, typed REST API |
| **Database** | SQLite | Zero-config, single-file local relational database (`backend/data/mineatlas.db`) |
| **ORM** | SQLAlchemy 2.0 | Type-safe declarative Python models |
| **Database Migrations** | Alembic | Version-controlled database schema migrations |
| **HTTP Client** | httpx | Upstream API communication with in-process token bucket rate limiter |
| **Backend Testing** | Pytest | Automated endpoint, rate limiter, normalizer, and ingestion test suite (69 tests) |
| **Frontend Testing** | Vitest + Testing Library | Automated unit, component, and routing test suite (41 tests) |
| **Frontend Framework** | React 18 + TypeScript | UI component library with static types |
| **Graph Visualization** | Cytoscape.js | High-performance directed graph canvas with concentric layout |
| **Frontend Build Tool** | Vite | Ultra-fast local development & bundling |
| **Frontend Styling** | Tailwind CSS | Utility-first dark Minecraft exploration theme |
| **Routing** | React Router DOM | Client-side routing with URL query state persistence |

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

# 5. Run the complete backend test suite (60 tests)
PYTHONPATH=backend pytest backend/tests

# 6. Start the FastAPI development server
uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

The backend is live at:
- Interactive API Docs (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- Public Data Status: [http://127.0.0.1:8000/api/data-status](http://127.0.0.1:8000/api/data-status)
- Development Sync Status: [http://127.0.0.1:8000/api/development/sync-status](http://127.0.0.1:8000/api/development/sync-status)

---

### 2. Primary API Endpoints Overview

All endpoints read strictly from the local SQLite cache and never call upstream APIs:

| Endpoint | Method | Purpose | Key Parameters / Filters |
|---|:---:|---|---|
| `/api/search` | `GET` | Global multi-entity search | `q`, `types`, `limit` |
| `/api/mobs` | `GET` | Paginated Minecraft mobs | `page`, `page_size`, `search`, `type`, `category`, `tameable`, `breedable` |
| `/api/mobs/{mob_id}` | `GET` | Detailed mob record & stats | `mob_id` |
| `/api/biomes` | `GET` | Paginated Minecraft biomes | `page`, `page_size`, `search`, `dimension`, `category`, `rarity` |
| `/api/biomes/{biome_id}` | `GET` | Single biome detail | `biome_id` |
| `/api/items` | `GET` | Key items and functional blocks | `page`, `page_size`, `search`, `category`, `enchantable` |
| `/api/items/{item_id}` | `GET` | Single item detail | `item_id` |
| `/api/structures` | `GET` | World structures | `page`, `page_size`, `search`, `dimension`, `category`, `rarity` |
| `/api/structures/{structure_id}` | `GET` | Single structure detail | `structure_id` |
| `/api/enchantments` | `GET` | Equipment enchantments | `page`, `page_size`, `search`, `category`, `treasure_only` |
| `/api/achievements` | `GET` | Advancements / achievements | `page`, `page_size`, `search`, `tab` |
| `/api/versions` | `GET` | Java Edition version history | `page`, `page_size`, `search`, `release_type` |
| `/api/commands` | `GET` | Server and in-game commands | `page`, `page_size`, `search`, `category` |
| `/api/trades` | `GET` | Villager trade transactions | `page`, `page_size`, `search`, `profession_id`, `level` |
| `/api/villager-professions` | `GET` | 13 villager professions | `page`, `page_size`, `search` |
| `/api/graph/neighbors/{type}/{id}` | `GET` | Localized graph traversal | `depth` (1 or 2), `relationship_types`, `limit` |
| `/api/data-status` | `GET` | Cache health & totals | — |

For complete query documentation, see [`docs/BACKEND_QUERY_API.md`](docs/BACKEND_QUERY_API.md).

---

### 3. Running Data Ingestion & Sync (Offline CLI)

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

### 4. Frontend Setup & Run

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
│   ├── INGESTION_AND_SYNC.md # Phase 4 ingestion, rate limiting & sync documentation
│   ├── BACKEND_QUERY_API.md  # Phase 5 query API reference & parameter guide
│   └── GRAPH_EXPLORER.md     # Phase 7 Cytoscape.js Knowledge Graph Explorer guide
│
├── backend/
│   ├── requirements.txt    # FastAPI, Uvicorn, Pytest, httpx, SQLAlchemy, Alembic
│   ├── .env.example        # Backend environment variables template
│   ├── alembic.ini         # Alembic migration configuration
│   ├── pytest.ini          # Pytest configuration
│   ├── alembic/            # Database schema migrations
│   ├── app/
│   │   ├── main.py         # FastAPI application entrypoint & router registration
│   │   ├── config.py       # Configuration & rate limiting parameters
│   │   ├── clients/        # Rate-limited AstroworldClient
│   │   ├── services/       # Query, graph, ingestion, and rate-limiting services
│   │   │   ├── query_service.py
│   │   │   ├── graph_service.py
│   │   │   ├── rate_limiter.py
│   │   │   ├── normalizers.py
│   │   │   └── ingestion_service.py
│   │   ├── schemas/        # Pydantic v2 response & request validation models
│   │   ├── routers/        # Mobs, biomes, items, structures, reference, graph, search, farms
│   │   ├── db/             # Database connection, base classes, and ORM models
│   │   └── scripts/        # CLI scripts (sync_astroworld.py, audit_astroworld.py, seed_curated_farms.py)
│   ├── data/
│   │   ├── mineatlas.db    # Local SQLite database (ignored by Git)
│   │   └── raw_snapshots/  # Local JSON snapshots (ignored by Git)
│   └── tests/              # 69 Pytest automated unit & integration tests
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
3. **100% Local SQLite Reads:** Normal user requests read from local SQLite and never trigger upstream network traffic.
4. **Internal 50 RPM Rate Limiter:** Local in-process token-bucket limiter protects upstream capacity during offline syncs.
5. **No Heavy Database Infrastructure:** Runs natively on Linux Mint without Docker, Redis, PostgreSQL, or Neo4j. Powered by local SQLite (`backend/data/mineatlas.db`).
6. **Clear Provenance:** Every database record tracks `source_type` (`astroworld_api`, `curated`, or `calculated`), `source_url`, `game_version`, and `last_verified_at`.

---

## License

This project is licensed under the [MIT License](LICENSE).
