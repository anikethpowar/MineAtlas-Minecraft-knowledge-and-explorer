# MineAtlas Scope & Project Boundaries

This document defines the scope, constraints, and operational boundaries for **MineAtlas**.

---

## 1. Target Minecraft Edition

- **Java Edition Exclusively:** MineAtlas focuses solely on **Minecraft Java Edition**.
- **No Bedrock Edition Mechanics:** Features, recipes, redstone behaviors, spawning rules, and entity properties that differ between Java and Bedrock (e.g., mob despawning distances, piston quasi-connectivity, villager curing discounts, wither behavior) are strictly modeled for Java Edition only.

---

## 2. Upstream Data Sources & Integration Rules

- **Primary Upstream Source:** The upstream data source for entities, biomes, items, and structures in future phases will be [Astroworld API](https://api.astroworldmc.com).
- **Strict Backend-Only Access:** Under **no circumstances** may browser clients or frontend applications call the Astroworld API directly. All requests must route through our FastAPI backend.
- **Strict Rate Limiting:** The backend will enforce a maximum rate of **50 requests per minute** to the Astroworld API to maintain good API citizenship and prevent service abuse.
- **Phase 1 Restriction:** In Phase 1 (Foundation), **zero requests are made to Astroworld**. Integration will be implemented in subsequent phases.

---

## 3. Infrastructure & Technology Guardrails

To ensure MineAtlas runs comfortably and natively on **Linux Mint** and standard desktop environments:
- **No Heavy Databases:** No Docker, PostgreSQL, MySQL, Redis, MongoDB, or Neo4j.
- **Local SQLite Database:** In later phases, a local **SQLite** file will serve as the relational cache and graph node/edge store.
- **No Cloud Services:** The entire application is self-contained and runnable locally without cloud infrastructure dependencies or third-party paid services.

---

## 4. Entity & Content Scope

- **Items & Key Blocks Explorer:** MineAtlas does **not** claim complete coverage of all 1,000+ decorative Minecraft blocks (e.g., all 16 colored wool/concrete/terracotta variations or stair variants). Instead, it focuses on items, key functional blocks (e.g., crafters, hoppers, brewing stands, redstone components, enchanting tables, workstations), and essential world blocks.
- **No Wiki Prose Scraping:** We do not scrape, copy, or redistribute lengthy descriptive prose from the official Minecraft Wiki.
- **Curated Content vs. API Data:**
  - **API-backed Data:** Standard entity statistics, drops, biomes, and raw trade tables from Astroworld.
  - **Curated Farm Guides:** Handcrafted, community-verified farm architectures tailored to Java Edition mechanics (without copying external proprietary blueprints).
  - **Calculated Scores / Difficulty Metrics:** System-calculated metrics based on farm complexity, resource investment, and output rates.
  - **Visible Labeling:** In future phases, the UI must clearly label the provenance of each data point (e.g., `[API]`, `[Curated]`, `[Calculated]`).

---

## 5. Development Phases & Final Status

MineAtlas was implemented across 10 structured phases:

1. **Phase 1: Foundation:** FastAPI backend, React + Vite frontend, CI workflow, and initial architecture.
2. **Phase 2: API Audit:** In-process rate-limited audit verifying all 9 Astroworld collection endpoints.
3. **Phase 3: Database Schema:** SQLite persistence with SQLAlchemy ORM and Alembic migrations across 16 tables.
4. **Phase 4: Ingestion & Relationship Derivation:** Token-bucket rate limiter (50 req/min), idempotent sync engine, probability normalizers, and automated derivation of 650 semantic graph edges.
5. **Phase 5: Backend Query API:** Typed, paginated REST endpoints with filters, global search, localized graph neighbors (depth 1 & 2), and public cache status reporting.
6. **Phase 6: Core Frontend Explorer:** Browser explorer for Mobs, Biomes, Items & Key Blocks (100 representative entries), Structures, Search, and data transparency.
7. **Phase 7: Knowledge Graph Explorer:** Cytoscape.js interactive graph canvas (`/graph`) with shape-coded entity nodes, directed relationship arrows, deterministic "Why connected?" explanations, and accessible Relationship List view.
8. **Phase 8: Curated Farm Blueprint Hub:** Dedicated hub (`/farms`) and guide details for verified Java Edition architectures (Iron Farm, Raid Farm, Villager Breeder) with interactive checklists and SVG schematics.
9. **Phase 9: Calculated World Atlas Tools:** Spatial reference at `/world`, responsive coordinate diagrams, deterministic 8:1 Nether portal converter, explainable biome criteria matcher, and geometric spawn sphere visualizer.
10. **Phase 10: Portfolio Release & QA (Current):** Full regression testing, accessibility audit, live desktop screenshots, documentation overhaul, and final portfolio polish.

