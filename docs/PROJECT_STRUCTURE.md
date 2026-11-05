# MineAtlas Project Structure

A beginner-friendly map of the **MineAtlas** codebase, explaining where code lives and what each directory is responsible for.

---

## High-Level Overview

```text
mineatlas/
├── backend/            # FastAPI REST backend & local SQLite database
│   ├── alembic/        # Database schema migrations
│   ├── app/            # Application source code
│   │   ├── clients/    # HTTP client for upstream API synchronization
│   │   ├── db/         # SQLAlchemy models and database session management
│   │   ├── routers/    # API endpoint definitions (/api/*)
│   │   ├── schemas/    # Pydantic request & response validation schemas
│   │   ├── scripts/    # Offline CLI tools (audit, sync, and seeders)
│   │   └── services/   # Business logic (querying, graph traversal, calculations)
│   ├── data/           # Local SQLite database file (mineatlas.db)
│   ├── tests/          # Pytest test suite (85 tests)
│   └── requirements.txt# Python backend dependencies
│
├── frontend/           # React + TypeScript + Vite user interface
│   ├── src/
│   │   ├── api/        # Typed API client and backend TypeScript interfaces
│   │   ├── components/ # Reusable UI components organized by domain:
│   │   │   ├── common/     # Badges, loaders, toolbars, error states
│   │   │   ├── explorers/  # Registry cards and filter sidebars
│   │   │   ├── farms/      # Farm schematic diagrams and checklists
│   │   │   ├── graph/      # Cytoscape.js canvas and relation list
│   │   │   ├── layout/     # Header, mobile navigation, page container
│   │   │   └── world/      # Coordinate diagrams, portal and sphere calculators
│   │   ├── pages/      # Route view components (Home, Mobs, Biomes, Farms, World, etc.)
│   │   └── test/       # Vitest unit & integration test suite (48 tests)
│   ├── package.json    # Frontend dependencies and npm scripts
│   └── vite.config.ts  # Vite build and test configuration
│
├── docs/               # System architecture and technical documentation
│   ├── assets/         # Verified desktop application screenshots
│   ├── ARCHITECTURE.md # Three-tier system architecture and isolation model
│   ├── SCOPE.md        # Java Edition scope and operational boundaries
│   ├── QUALITY_ASSURANCE.md # Test strategy, coverage, and QA checklists
│   └── ...             # Deep-dive guides for Graph, Farms, API, and World Tools
│
├── .github/workflows/  # Continuous Integration (CI) configuration
│   └── ci.yml          # GitHub Actions workflow running tests and build on push/PR
│
├── .env.example        # Environment variable templates
├── .gitignore          # Repository ignore rules (excludes venv, .env, *.db, dist)
├── LICENSE             # MIT License
└── README.md           # Master project documentation, setup guide, and screenshots
```

---

## Key Backend Directories (`backend/`)

- **`app/routers/`**: Where HTTP endpoints live. Each domain (e.g. `mobs.py`, `farms.py`, `graph.py`, `world.py`) handles URL routing, incoming query parameters, and passes work to services.
- **`app/services/`**: The "engine room" containing core logic:
  - `query_service.py`: Queries SQLite tables with pagination and sorting.
  - `graph_service.py`: Performs focused depth-1 and depth-2 neighborhood traversals.
  - `world_service.py`: Computes 8:1 Nether portal scaling, spawn sphere math, and biome criteria matching.
  - `astroworld_client.py`: Handles rate-limited requests to upstream APIs.
- **`app/db/models/`**: SQLAlchemy classes defining the SQLite database schema (`mob.py`, `biome.py`, `farm.py`, `relation_edge.py`, `dimension.py`).
- **`app/schemas/`**: Pydantic models ensuring data leaving or entering the backend matches strict type contracts.
- **`app/scripts/`**: CLI commands run directly from the terminal (e.g., `seed_curated_farms.py`, `seed_world_reference.py`, `sync_astroworld.py`).

---

## Key Frontend Directories (`frontend/src/`)

- **`api/`**:
  - `types.ts`: TypeScript definitions matching every backend Pydantic model.
  - `mineatlasApi.ts`: The central doorway for all network requests. No React component calls `fetch()` directly.
- **`components/`**: Modular, reusable UI building blocks:
  - `graph/GraphExplorer.tsx`: The signature Cytoscape.js canvas.
  - `farms/FarmSchematicDiagram.tsx`: Original spatial zone schematics for technical farms.
  - `world/CoordinatesDiagram.tsx`: Responsive SVG 3D coordinate system diagram.
  - `world/PortalConverter.tsx`: Interactive Nether portal calculator.
- **`pages/`**: Full-screen views corresponding to browser routes (`HomePage.tsx`, `MobsPage.tsx`, `FarmsPage.tsx`, `WorldPage.tsx`, `AboutDataPage.tsx`).

---

## Documentation Directory (`docs/`)

- **`ARCHITECTURE.md`**: Three-tier architecture, network isolation, and component responsibilities.
- **`SCOPE.md`**: Java Edition constraints and boundary rules.
- **`QUALITY_ASSURANCE.md`**: Test matrices, accessibility standards, and manual QA sweeps.
- **`DATA_MODEL.md`**: Complete entity-relationship diagram and SQLite schema documentation.
- **`BACKEND_QUERY_API.md`**: Full query parameters and REST specifications.
- **`GRAPH_EXPLORER.md`**: Cytoscape.js mechanics and localized neighborhood traversal design.
- **`FARM_BLUEPRINT_HUB.md`**: Technical standards for curated Java Edition farm guides.
- **`WORLD_ATLAS_TOOLS.md`**: Mathematical formulas for coordinate scaling and spawn sphere geometry.

