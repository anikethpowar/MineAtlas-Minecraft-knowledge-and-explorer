# MineAtlas

**Minecraft Java Edition Atlas & Knowledge Graph Explorer**

MineAtlas is an interactive explorer for Minecraft Java Edition that connects biomes, mobs, items, key blocks, structures, enchantments, villager trades, and curated farm guides into a unified, graph-driven knowledge base.

---

## Current Status: Phase 3 (Database Foundation)

MineAtlas has established its canonical relational and knowledge graph database schema:
- **Phase 1 (Foundation):** Runnable FastAPI backend, React + Vite frontend, and basic CI.
- **Phase 2 (API Audit):** Safe, rate-limited audit tool (`python -m app.scripts.audit_astroworld`) verified all 9 Astroworld collection endpoints.
- **Phase 3 (Database Schema):** SQLite database configured with SQLAlchemy ORM models and Alembic migrations across 16 canonical tables (including `mobs`, `biomes`, `items`, `structures`, `trades`, `farms`, and generic `relation_edges`).

> [!NOTE]
> **Planned for Later Phases:**
> - **Astroworld Ingestion Pipeline:** Automated ingestion of upstream collections into SQLite (Phase 4).
> - **Graph Edge Derivation:** Populate `relation_edges` from entity drops, biomes, trades, and recipes (Phase 4).
> - **Knowledge Graph Visualizer & Data Pages:** Interactive frontend relationship exploration (Phase 5).
> - **Farm Guides:** Handcrafted Java Edition farm blueprints with production metrics (Phase 5).

---

## Technology Stack

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | Python 3.12 + FastAPI | Fast, typed REST API |
| **Database** | SQLite | Zero-config, single-file local relational database (`backend/data/mineatlas.db`) |
| **ORM** | SQLAlchemy 2.0 | Type-safe declarative Python models |
| **Database Migrations** | Alembic | Version-controlled database schema migrations |
| **HTTP Client** | httpx | Upstream API communication and audit tooling |
| **Backend Testing** | Pytest | Automated endpoint and schema test suite |
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

# 5. Run the complete backend test suite
PYTHONPATH=backend pytest backend/tests

# 6. Start the FastAPI development server
uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

The backend is live at:
- Health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- Interactive API Docs (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 2. Running the API Data Audit (Optional)

To execute the Phase 2 Astroworld API audit tool:

```bash
cd ~/Desktop/mineatlas/backend
python -m app.scripts.audit_astroworld
```

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
│   └── DATA_MODEL.md       # Canonical SQLite database schema and graph design
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
│   │   ├── config.py       # Host, port, DB, and CORS configuration
│   │   ├── clients/        # Upstream Astroworld API client
│   │   ├── services/       # Audit & background services
│   │   ├── scripts/        # CLI scripts (audit_astroworld.py)
│   │   ├── db/             # Database connection, base classes, and ORM models
│   │   │   ├── base.py     # DeclarativeBase, ProvenanceMixin, TimestampMixin
│   │   │   ├── session.py  # SQLite foreign key pragma listener & sessionmaker
│   │   │   └── models/     # Canonical entity models (Biome, Mob, Item, RelationEdge, etc.)
│   │   └── routers/
│   │       ├── __init__.py
│   │       └── health.py   # GET /api/health implementation
│   ├── data/
│   │   └── raw_snapshots/  # Local JSON snapshots (ignored by Git)
│   └── tests/
│       ├── test_health.py             # Phase 1 health check tests
│       ├── test_astroworld_client.py  # Phase 2 client tests
│       ├── test_api_audit_service.py  # Phase 2 audit service tests
│       └── test_database_schema.py    # Phase 3 schema, migration & FK tests
│
├── frontend/
│   ├── package.json        # NPM dependencies & scripts
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript configuration
│   ├── tailwind.config.js  # Tailwind CSS dark theme configuration
│   ├── postcss.config.js   # PostCSS configuration for Tailwind
│   ├── .env.example        # Frontend environment variables template
│   ├── index.html          # HTML entrypoint
│   └── src/
│       ├── main.tsx        # React root mounting
│       ├── App.tsx         # Root component with React Router
│       ├── index.css       # Tailwind directives & base styles
│       ├── vite-env.d.ts   # Vite client type declarations
│       ├── api/
│       │   └── mineatlasApi.ts   # Dedicated backend API client
│       ├── components/
│       │   └── layout/
│       │       ├── Header.tsx        # Navigation header & Phase badge
│       │       └── PageContainer.tsx # Responsive container wrapper
│       └── pages/
│           └── HomePage.tsx          # Landing view with live health status
│
└── .github/
    └── workflows/
        └── ci.yml          # GitHub Actions CI workflow (tests + build)
```

---

## Architectural Rules & Guardrails

1. **Minecraft Java Edition Exclusively:** No Bedrock edition data or conflicting game mechanics.
2. **Zero Browser-to-Astroworld Calls:** The frontend only speaks to our FastAPI backend.
3. **No Heavy Database Infrastructure:** Runs natively on Linux Mint without Docker, Redis, PostgreSQL, or Neo4j. Powered by a local SQLite database (`backend/data/mineatlas.db`).
4. **Items & Key Blocks:** Focuses on functional blocks and items rather than every single block variation.
5. **Clear Provenance:** Every database record tracks `source_type` (`astroworld_api`, `curated`, or `calculated`), `source_url`, `game_version`, and `last_verified_at`.

---

## License

This project is licensed under the [MIT License](LICENSE).
