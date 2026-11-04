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

## 5. Development Phases Overview

1. **Phase 1: Project Foundation (Current)**
   - Git repository setup & remote linkage.
   - FastAPI backend with `/api/health` and CORS configuration.
   - React + TypeScript + Vite frontend with Tailwind CSS and dark exploration theme.
   - Automated Pytest test suite and GitHub Actions CI workflow.
   - Architecture & Scope documentation.

2. **Phase 2: Database & Upstream Ingestion (Future)**
   - SQLite schema for items, mobs, biomes, and relationships.
   - Rate-limited Astroworld client (50 req/min).

3. **Phase 3: Knowledge Graph Explorer & Farm Guides (Future)**
   - Interactive relationship visualization (e.g., `Plains → CONTAINS → Village`).
   - Curated Java Edition farm guides with verified production rates.

