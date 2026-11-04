# MineAtlas

**Minecraft Java Edition Atlas & Knowledge Graph Explorer**

MineAtlas is an interactive explorer for Minecraft Java Edition that connects biomes, mobs, items, key blocks, structures, enchantments, villager trades, and curated farm guides into a unified, graph-driven knowledge base.

---

## Current Status: Phase 1 (Foundation)

MineAtlas is currently in **Phase 1: Project Foundation**. In this phase:
- A runnable, minimal FastAPI backend is established with a verified `/api/health` endpoint and local CORS support.
- A responsive React + TypeScript frontend built with Vite and Tailwind CSS is operational with an initial Home page.
- The frontend connects to the backend health endpoint and clearly displays Loading, Success, and Error states.
- Automated tests (Pytest) and CI workflows (GitHub Actions) are in place.

> [!NOTE]
> **Planned for Later Phases:**
> - **SQLite Database:** Local relational cache and knowledge graph persistence (Phase 2).
> - **Astroworld API Ingestion:** Upstream data ingestion strictly through FastAPI with a 50 req/min rate limit (Phase 2).
> - **Knowledge Graph Visualizer:** Interactive entity relationship exploration (Phase 3).
> - **Farm Guides:** Handcrafted Java Edition farm blueprints with production metrics (Phase 3).

---

## Technology Stack (Phase 1)

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | Python 3.12 + FastAPI | Fast, typed REST API |
| **Backend Server** | Uvicorn | ASGI production & dev server |
| **Backend Testing** | Pytest | Automated endpoint testing |
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

# 4. Run the backend test suite
PYTHONPATH=backend pytest backend/tests

# 5. Start the FastAPI development server
uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

The backend is now live at:
- Health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- Interactive API Docs (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 2. Frontend Setup & Run

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
├── README.md               # Project documentation & setup instructions
├── LICENSE                 # MIT License
├── .gitignore              # Git ignore rules (ignores venv, node_modules, .env, *.db)
├── .env.example            # Root environment variable template
├── docs/
│   ├── SCOPE.md            # Scope boundaries & rules (Java Edition only, rate limits)
│   └── ARCHITECTURE.md     # Architecture overview & data flow diagrams
│
├── backend/
│   ├── requirements.txt    # Minimal backend dependencies (FastAPI, Uvicorn, Pytest)
│   ├── .env.example        # Backend environment variables template
│   ├── pytest.ini          # Pytest configuration
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI application entrypoint & CORS setup
│   │   ├── config.py       # Host, port, and CORS configuration
│   │   └── routers/
│   │       ├── __init__.py
│   │       └── health.py   # GET /api/health implementation
│   └── tests/
│       └── test_health.py  # Pytest test suite for health endpoint
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
3. **No Heavy Database Infrastructure:** Runs natively on Linux Mint without Docker, Redis, PostgreSQL, or Neo4j. SQLite will be used locally in Phase 2.
4. **Items & Key Blocks:** Focuses on functional blocks and items rather than every single block variation.
5. **Clear Provenance:** Future versions will explicitly distinguish API-fetched data, curated farm guides, and calculated metrics.

---

## License

This project is licensed under the [MIT License](LICENSE).

