# Data Ingestion and SQLite Caching Architecture

> **MineAtlas Architecture & Operations Reference**  
> **Applies to:** Minecraft Java Edition only  
> **Upstream Provider:** [Astroworld API](https://api.astroworldmc.com)  
> **Local Database:** SQLite (`backend/data/mineatlas.db`)  
> **Phase:** Phase 4 (Data Ingestion, Caching, Provenance & Initial Graph Derivation)

---

## 1. What Ingestion Means in MineAtlas

In MineAtlas, **data ingestion** is the automated process of fetching verified Minecraft Java Edition data from the upstream [Astroworld API](https://api.astroworldmc.com), validating and normalizing the payload structures, mapping them onto canonical relational models, and persisting them idempotently into a local SQLite database (`backend/data/mineatlas.db`).

Ingestion is strictly an **offline, controlled backend batch task**. It converts transient JSON network payloads into durable, locally queryable relational records and knowledge graph edges.

---

## 2. Why MineAtlas Caches Astroworld Data in SQLite

MineAtlas never queries the external Astroworld API dynamically during user interactions. Instead, it maintains a complete local cache in SQLite for three core reasons:

1. **Deterministic Latency & High Availability:** Local SQLite reads execute in sub-millisecond timeframes directly on the host machine (Linux Mint). If the external API experiences downtime, maintenance, or high latency, MineAtlas users experience zero disruption.
2. **Upstream Rate Limit Protection:** Astroworld is a shared public resource. Caching prevents redundant network traffic and ensures the project never exceeds upstream capacity.
3. **Relational and Knowledge Graph Queries:** Astroworld provides raw collection endpoints (e.g., `/api/v1/mobs`). Caching allows MineAtlas to index entities, enforce foreign key relationships (such as villager trades), and derive semantic graph edges (`SPAWNS_IN`, `DROPS`, `FOUND_IN`, `CONTAINS_LOOT`, `UNLOCKS`) across disparate datasets.

---

## 3. Why Normal User Requests Must Never Fetch Live Upstream Data

Under the fundamental architectural rules of MineAtlas:

* **The React frontend / browser must NEVER contact Astroworld directly.** Browsers lack rate-limiting coordination across sessions, expose upstream endpoints, and trigger CORS or throttling issues.
* **FastAPI read endpoints must NEVER trigger upstream HTTP calls.** When a user browses a mob, biome, or item in the future React UI, FastAPI reads exclusively from the local SQLite cache.
* **Separation of Concerns:** Live network fetching is quarantined inside the standalone CLI command (`python -m app.scripts.sync_astroworld`) and managed ingestion services.

---

## 4. End-to-End Architectural Data Flow

The following sequence illustrates how data flows from Astroworld to the future frontend presentation layer:

```
+------------------------------------+
|       Astroworld Public API        |  (https://api.astroworldmc.com)
+------------------------------------+
                  |
                  | [Sequential HTTP GET; max 50 req/min]
                  v
+------------------------------------+
|     AstroworldClient (httpx)       |  (backend/app/clients/astroworld_client.py)
|  * Process-wide Token Bucket Limiter
|  * HTTP 429 Retry-After Handling   |
|  * Bounded Exponential Backoff     |
+------------------------------------+
                  |
                  v
+------------------------------------+
|       Normalizers & Parsers        |  (backend/app/services/normalizers.py)
|  * Probability standard (0.0 to 1.0)
|  * Nested structure flattening     |
|  * Slug & Natural key alignment    |
+------------------------------------+
                  |
                  v
+------------------------------------+
|          IngestionService          |  (backend/app/services/ingestion_service.py)
|  * Creates SyncRun audit record    |
|  * Idempotent SQL upserts (SELECT) |
|  * Complete raw_payload & provenance
+------------------------------------+
                  |
                  v
+------------------------------------+
|   RelationshipDerivationService    |  (backend/app/services/relationship_derivation.py)
|  * Resolves entity cross-references|
|  * Skips unresolved targets safely |
|  * Inserts/Updates RelationEdge    |
+------------------------------------+
                  |
                  v
+------------------------------------+
|       Local SQLite Database        |  (backend/data/mineatlas.db)
|  * 16 canonical schema tables      |
|  * Full transactional durability   |
+------------------------------------+
                  |
                  | [Sub-millisecond local reads only]
                  v
+------------------------------------+
|        FastAPI Backend APIs        |  (Future Phase 5 endpoints)
+------------------------------------+
                  |
                  v
+------------------------------------+
|        React / Vite Frontend       |  (Future Explorer & Graph UI)
+------------------------------------+
```

---

## 5. The 50 Requests-Per-Minute Token-Bucket Rate Limiter

To safeguard upstream availability and strictly respect Astroworld API constraints, MineAtlas implements an in-process **Token Bucket Rate Limiter** (`backend/app/services/rate_limiter.py`).

### How It Works:
* **Capacity ($C$):** 50 tokens (allowing safe, controlled bursts up to the one-minute quota).
* **Refill Rate ($r$):** 1 token every 1.2 seconds ($\frac{50 \text{ tokens}}{60 \text{ seconds}} = 0.833\text{ tokens/sec}$).
* **Thread Safety:** State transitions are guarded by a Python threading `Lock()`.
* **Zero Bypass:** All requests initiated by `AstroworldClient` pass through `rate_limiter.acquire(1.0)`. There is no execution pathway that circumvents the token bucket.
* **Injectable Clock:** Accepts custom `time_func` and `sleep_func` dependencies, enabling instant, non-blocking test execution during automated unit testing.

---

## 6. Why Redis Is Intentionally Not Used

MineAtlas runs as a single-machine local application on Linux Mint. Redis was deliberately rejected for the following architectural reasons:

1. **Unnecessary External Dependency:** Introducing Redis would require users to install, configure, monitor, and run a persistent background daemon on their desktop operating system.
2. **Single-Process Python Backend:** Because MineAtlas runs as a single FastAPI / CLI process, thread-safe in-memory data structures (Python standard library `threading.Lock`) manage rate limiting cleanly with zero network overhead.
3. **Simplicity and Maintainability:** Storing cache state in SQLite keeps the entire application self-contained in a single portable file (`mineatlas.db`).

---

## 7. How Idempotent Upserts Work

An operation is **idempotent** if running it multiple times produces the exact same state as running it once.

When `IngestionService` processes an endpoint:
1. **Natural Identifier Matching:** It queries the target table by its natural unique key (e.g. `Mob.id`, `Biome.id`, `Command.name`, `Version.slug`, `VillagerProfession.id`, `Trade.trade_id`).
2. **Conditional Update:**
   * If the record does not exist: Inserts a new row with `created_at = utc_now()`, `updated_at = utc_now()`, full provenance, and `raw_payload`.
   * If the record exists: Compares existing attributes with the new data. If changed, updates values and refreshes `updated_at` and `last_verified_at`.
   * If unchanged: Preserves the existing record, avoiding unnecessary database churn.
3. **Non-Destructive Retention Policy:** If an upstream response no longer includes an entity that was previously ingested, **MineAtlas does NOT delete the cached record**. Minecraft versions and mechanics are additive, and upstream endpoints may temporarily paginate or filter items. Non-destructive caching protects against accidental data loss.

---

## 8. What a `SyncRun` Stores

Every sync execution creates an immutable audit trail in the `sync_runs` table:

| Column | Type | Purpose |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY` | Auto-incrementing identifier for the run. |
| `started_at` | `DATETIME` | UTC timestamp when the sync began. |
| `completed_at` | `DATETIME` | UTC timestamp when all collections finished. |
| `status` | `VARCHAR(32)` | Final outcome: `running`, `success`, `partial_failure`, or `failed`. |
| `trigger_type` | `VARCHAR(32)` | Initiation method: `manual`, `audit`, or `scheduled`. |
| `endpoints_synced`| `INTEGER` | Number of endpoints that completed successfully (out of 9). |
| `records_ingested`| `INTEGER` | Total entity records created and updated in SQLite. |
| `error_message` | `TEXT` | Concise summary of all endpoint errors encountered. |
| `summary_json` | `TEXT` | Detailed structured audit payload (timings, headers, retries, edges). |

### Structured Audit Summary Payload (`summary_json`):
```json
{
  "sync_version": "1.0",
  "trigger_type": "manual",
  "started_at": "2026-11-04T13:45:00.000000+00:00",
  "completed_at": "2026-11-04T13:45:12.450000+00:00",
  "duration_seconds": 12.45,
  "total_endpoints": 9,
  "successful_endpoints": 9,
  "failed_endpoints": 0,
  "records_created": 340,
  "records_updated": 0,
  "total_records_ingested": 340,
  "relationship_derivation": {
    "derived_edges_created": 154,
    "derived_edges_updated": 0,
    "total_edges": 154,
    "unresolved_references": {
      "mob_drop_item:raw beef": 1
    }
  },
  "endpoint_reports": [...]
}
```

---

## 9. Error Handling, Rate Limiting (429), and Transient Retries

Network operations over the internet are inherently prone to temporary glitches and rate throttling. MineAtlas isolates failures through multiple defensive layers:

1. **HTTP 429 (Too Many Requests):**
   * If Astroworld returns HTTP 429, the client inspects the HTTP `Retry-After` header.
   * If present, the sync pauses for the exact number of seconds requested by upstream.
   * If absent, it applies bounded exponential backoff (`backoff_factor * 2^(attempt - 1)`).
   * Upstream 429 events are recorded in `endpoint_reports` within `SyncRun`.
2. **Transient Failures (Timeouts, Network Dropouts, 5xx Server Errors):**
   * Requests automatically retry up to `ASTROWORLD_MAX_RETRIES` (default: 3).
   * Retries apply bounded exponential backoff up to `ASTROWORLD_RETRY_BACKOFF_SECONDS`.
3. **Partial Failure Isolation:**
   * If an endpoint fails after exhausting all retries, the ingestion engine logs the failure, marks the endpoint as failed, and **continues to the next collection**.
   * Successfully imported data from prior endpoints is safely committed.
   * The overall sync status is marked as `partial_failure`. It is never falsely reported as `success`.

---

## 10. Probability Normalization Policy

The Astroworld API uses two conflicting probability formats across its endpoints:
* **Mob drops:** Expressed as percentages (e.g., `2.5` represents 2.5%, `100` represents 100%).
* **Structure chest loot:** Expressed as decimal fractions (e.g., `0.62` represents 62%, `1.0` represents 100%).

To preserve precision and maintain complete data traceability, the normalization helper (`backend/app/services/normalizers.py`) standardizes all probabilities into a uniform schema before persisting into `RelationEdge.metadata_json`:

```json
{
  "normalized_probability": 0.025,
  "original_value": 2.5,
  "original_unit": "percentage"
}
```

* **`normalized_probability`:** Always a floating-point number clamped between `0.0` and `1.0`. Used for programmatic graph queries and calculation.
* **`original_value`:** Exact numerical value supplied by the upstream API.
* **`original_unit`:** Label identifying the original upstream scale (`"percentage"` or `"decimal_fraction"`).

---

## 11. Initial Derived Knowledge Graph Relationships

The `RelationshipDerivationService` extracts semantic graph edges directly from ingested entities into the polymorphic `RelationEdge` table:

| Relationship Type | Source Entity | Target Entity | Provenance & Metadata Captured |
|---|---|---|---|
| `SPAWNS_IN` | `mob` | `biome` | In-game spawn biomes |
| `DROPS` | `mob` | `item` | Normalized drop chance, item count range |
| `BREEDS_WITH` | `mob` | `item` | Breeding food items |
| `TAMED_WITH` | `mob` | `item` | Taming food or items |
| `FOUND_IN` | `structure` | `biome` | Naturally generating world biomes |
| `LOCATED_IN` | `structure` | `dimension` | Dimension (`overworld`, `nether`, `the_end`) |
| `CONTAINS_LOOT` | `structure` | `item` | Normalized chest loot probability, count range |
| `TRADED_BY` | `trade` | `villager_profession` | Trade tier level, offer amounts, required currencies |
| `UNLOCKS` | `achievement` | `achievement` | Advancement tree parent-child progression |
| `ADDED_IN` | `mob`, `biome`, `item`, `structure`, `enchantment` | `version` | Java Edition version when feature was introduced |

### Unresolved Reference Safety Rule:
Astroworld curates a targeted subset of 100 key Minecraft items/blocks. Consequently, some mob drops (e.g. `raw_beef`) or structure loot items do not exist in the ingested items table.
* **Rule:** If an edge's target cannot be verified in the local database, **the edge is skipped**.
* **Integrity Guarantee:** MineAtlas **NEVER creates dummy or phantom entities** to force an edge.
* Unresolved references are aggregated and recorded in `unresolved_references` inside `SyncRun.summary_json`.

---

## 12. Edges and Features Deliberately Not Built Yet

In accordance with the phased development plan, the following are **not part of Phase 4**:
* **Crafting & Smelting Recipes:** Astroworld does not provide recipe graph endpoints.
* **Curated Farm Guides & Farm Mechanics:** Farm models (`Iron Farm -> PRODUCES -> Iron Ingot`) are scheduled for Phase 7 as curated original content.
* **Public REST Query Endpoints:** List/detail endpoints for mobs, biomes, and items will be introduced in Phase 5.
* **Global Text Search:** Fast multi-entity search will be built in Phase 5.
* **Interactive Cytoscape Knowledge Graph:** Visual graph explorer will be built in Phase 6.

---

## 13. Manual Sync Command Reference

To run a synchronization manually against the Astroworld API:

```bash
# 1. Navigate to the repository root
cd ~/Desktop/mineatlas

# 2. Activate the Python virtual environment
source venv/bin/activate

# 3. Enter the backend directory
cd backend

# 4. Execute the sync CLI script
python -m app.scripts.sync_astroworld
```

### Checking Synchronization Status (Development Mode):
With the backend server running (`uvicorn app.main:app`), developers can query the cache freshness and table counts:

```bash
curl http://127.0.0.1:8000/api/development/sync-status
```

---

## 14. Troubleshooting & Operational Guide

### Issue 1: Missing SQLite Database File
* **Symptom:** `sqlite3.OperationalError: no such table` or missing `backend/data/mineatlas.db`.
* **Fix:** Apply Alembic migrations to create all canonical tables:
  ```bash
  cd ~/Desktop/mineatlas/backend
  ../venv/bin/alembic upgrade head
  ```

### Issue 2: Migrations Not Applied
* **Symptom:** Sync fails with `table relation_edges has no column named ...`.
* **Fix:** Check current Alembic revision:
  ```bash
  cd ~/Desktop/mineatlas/backend
  ../venv/bin/alembic current
  ../venv/bin/alembic upgrade head
  ```

### Issue 3: Upstream API Timeout
* **Symptom:** `AstroworldTimeoutError: Request timed out for endpoint '/api/v1/mobs'`.
* **Fix:** Increase timeout in `backend/.env`:
  ```ini
  ASTROWORLD_API_TIMEOUT_SECONDS=30.0
  ```

### Issue 4: Upstream HTTP 429 (Rate Limit Exceeded)
* **Symptom:** `Astroworld rate limit reached (HTTP 429)`.
* **Fix:** MineAtlas automatically obeys the `Retry-After` header. If repeated, increase the token refill interval in `backend/.env`:
  ```ini
  ASTROWORLD_RATE_LIMIT_REFILL_SECONDS=1.5
  ```

### Issue 5: Partial Sync Failure
* **Symptom:** Sync finishes with status `PARTIAL_FAILURE`.
* **Fix:** Review `sync_runs` error message. Data from successful collections is preserved in SQLite. Simply re-run `python -m app.scripts.sync_astroworld` after upstream connectivity is restored; idempotent upserts will resume cleanly without duplicate rows.

### Issue 6: Empty Cache / No Records in Database
* **Symptom:** `SELECT count(*) FROM mobs;` returns `0`.
* **Fix:** The database has not been seeded yet. Run the manual sync command:
  ```bash
  python -m app.scripts.sync_astroworld
  ```

