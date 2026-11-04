# Backend Query API Reference

> **MineAtlas Architecture & API Specification**  
> **Applies to:** Minecraft Java Edition only  
> **Data Origin:** Local SQLite Cache (`backend/data/mineatlas.db`)  
> **FastAPI Interactive Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
> **Phase:** Phase 5 (FastAPI Query API, Global Search, Explorers & Graph Neighbors)

---

## 1. Purpose of the Query API

The MineAtlas Query API exposes the local SQLite database through a clean, typed REST interface. It empowers frontend components, search widgets, and graph visualizers to inspect Minecraft Java Edition entities and their interconnected relationships without latency, external network dependencies, or rate-limit concerns.

---

## 2. Invariant: 100% Local SQLite Reads

All public endpoints in this API read **strictly from the local SQLite cache**.
* **Zero Upstream Network Calls:** No endpoint initiates HTTP requests to Astroworld or external APIs during user requests.
* **Separation of Ingestion from Query:** Upstream data ingestion is exclusively initiated through the standalone CLI tool (`python -m app.scripts.sync_astroworld`).
* **Sub-Millisecond Performance:** Indexed queries execute locally on the Linux host machine with deterministic, near-instantaneous response times.

---

## 3. Endpoints Reference

### A. Global Search

#### `GET /api/search`
Searches across all cached Minecraft entity tables using case-insensitive substring matching.

| Parameter | Type | Required | Default | Description |
|---|---|:---:|:---:|---|
| `q` | `string` | **Yes** | — | Search term (minimum 1 character; non-whitespace). |
| `types` | `string` | No | `all` | Comma-separated entity types (e.g. `mob,item,structure`). |
| `limit` | `integer` | No | `20` | Max matches to return (1 to 100). |

**Example Request:**
```bash
curl "http://127.0.0.1:8000/api/search?q=zombie&types=mob,item"
```

**Example Response:**
```json
{
  "query": "zombie",
  "total_results": 2,
  "results": [
    {
      "entity_type": "mob",
      "id": "zombie",
      "name": "Zombie",
      "subtitle": "hostile | undead",
      "description": "Attacks players and villagers in low light levels.",
      "source_type": "astroworld_api",
      "edition": "java",
      "game_version": "1.0"
    },
    {
      "entity_type": "mob",
      "id": "zombie_villager",
      "name": "Zombie Villager",
      "subtitle": "hostile | undead",
      "description": "Can be cured with a Golden Apple and Weakness potion.",
      "source_type": "astroworld_api",
      "edition": "java",
      "game_version": "1.4.2"
    }
  ],
  "by_type": {
    "mob": 2
  }
}
```

---

### B. Primary Explorers (List & Detail)

#### 1. Mobs
* `GET /api/mobs` — Paginated list of Minecraft mobs.
* `GET /api/mobs/{mob_id}` — Full mob detail by natural slug (`zombie`, `cow`, `allay`).

**Query Filters for `/api/mobs`:**
| Filter | Type | Description |
|---|---|---|
| `page` | `integer` | Page number (default: 1). |
| `page_size` | `integer` | Items per page (default: 20, max: 100). |
| `search` | `string` | Substring search matching name, slug, or behavior. |
| `type` | `string` | Behavioral category: `hostile`, `passive`, `neutral`, `boss`. |
| `category` | `string` | Biological group: `animal`, `undead`, `arthropod`, `illager`. |
| `tameable` | `boolean` | Filter by whether players can tame the mob. |
| `breedable` | `boolean` | Filter by whether players can breed the mob. |

**Example Detail Response (`GET /api/mobs/zombie`):**
```json
{
  "data": {
    "id": "zombie",
    "name": "Zombie",
    "mob_type": "hostile",
    "category": "undead",
    "behavior": "Hostile melee attacker.",
    "hp": 20.0,
    "damage_easy": 2.5,
    "damage_normal": 3.0,
    "damage_hard": 4.5,
    "xp_min": 5,
    "xp_max": 5,
    "spawn_conditions": "Light level 0",
    "tameable": false,
    "taming_method": null,
    "breedable": false,
    "breeding_item": null,
    "version_added": "Classic 0.24",
    "notes": "Burns in daylight unless wearing a helmet.",
    "source": {
      "source_type": "astroworld_api",
      "source_url": "https://api.astroworldmc.com/api/v1/mobs",
      "edition": "java",
      "game_version": null,
      "last_verified_at": "2026-11-04T13:57:40+00:00"
    },
    "coverage_note": "Core vanilla mob from Astroworld API"
  }
}
```

---

#### 2. Biomes
* `GET /api/biomes` — Paginated list of Minecraft biomes.
* `GET /api/biomes/{biome_id}` — Single biome detail (accepts namespaced `minecraft:plains` or bare `plains`).

**Query Filters for `/api/biomes`:**
| Filter | Type | Description |
|---|---|---|
| `page`, `page_size`, `search` | — | Standard pagination and substring matching. |
| `dimension` | `string` | Target dimension: `overworld`, `nether`, `the_end`. |
| `category` | `string` | Climatic group: `temperate`, `arid`, `cold`, `aquatic`. |
| `rarity` | `string` | Generation rarity: `common`, `uncommon`, `rare`. |

---

#### 3. Items & Key Blocks
* `GET /api/items` — Paginated list of items and functional blocks.
* `GET /api/items/{item_id}` — Single item detail (`diamond_sword`, `iron_pickaxe`).

**Query Filters for `/api/items`:**
| Filter | Type | Description |
|---|---|---|
| `page`, `page_size`, `search` | — | Standard pagination and substring matching. |
| `category` | `string` | Classification: `tool`, `combat`, `resource`, `food`, `redstone`. |
| `enchantable` | `boolean` | Filter by whether the item accepts enchantments. |

---

#### 4. Structures
* `GET /api/structures` — Paginated list of naturally generating world structures.
* `GET /api/structures/{structure_id}` — Single structure detail (`village`, `ancient_city`).

**Query Filters for `/api/structures`:**
| Filter | Type | Description |
|---|---|---|
| `page`, `page_size`, `search` | — | Standard pagination and substring matching. |
| `dimension` | `string` | Dimension: `overworld`, `nether`, `the_end`. |
| `category` | `string` | Category: `settlement`, `dungeon`, `ruin`, `temple`. |
| `rarity` | `string` | Generation rarity: `common`, `uncommon`, `rare`. |

---

### C. Supporting Reference Endpoints

| Resource Route | Detail Route | Purpose | Supported Filters |
|---|---|---|---|
| `GET /api/enchantments` | `GET /api/enchantments/{id}` | Magical modifiers for equipment | `page`, `page_size`, `search`, `category`, `treasure_only` |
| `GET /api/achievements` | `GET /api/achievements/{slug}` | Advancement progression trees | `page`, `page_size`, `search`, `tab` |
| `GET /api/versions` | `GET /api/versions/{slug}` | Java Edition release history | `page`, `page_size`, `search`, `release_type` |
| `GET /api/commands` | `GET /api/commands/{name}` | In-game command syntax and levels | `page`, `page_size`, `search`, `category` |
| `GET /api/trades` | `GET /api/trades/{trade_id}` | Villager trade transactions | `page`, `page_size`, `search`, `profession_id`, `level` |
| `GET /api/villager-professions` | `GET /api/villager-professions/{id}` | 13 professions and workstations | `page`, `page_size`, `search` |

---

### D. Knowledge Graph Traversal Endpoint

#### `GET /api/graph/neighbors/{entity_type}/{entity_id}`
Returns a localized subgraph neighborhood centered around a root entity up to depth 2.

| Parameter | Type | Required | Default | Description |
|---|---|:---:|:---:|---|
| `depth` | `integer` | No | `1` | Traversal radius: `1` (direct neighbors) or `2` (extended neighbors). Depths > 2 are rejected. |
| `relationship_types`| `string` | No | `all` | Comma-separated predicates (e.g. `SPAWNS_IN,DROPS,FOUND_IN`). |
| `limit` | `integer` | No | `50` | Maximum total graph edges to return (1 to 100). |

**Example Request:**
```bash
curl "http://127.0.0.1:8000/api/graph/neighbors/mob/bee?depth=1"
```

**Example Response:**
```json
{
  "root": {
    "entity_type": "mob",
    "entity_id": "bee",
    "name": "Bee"
  },
  "nodes": [
    {
      "entity_type": "mob",
      "id": "bee",
      "name": "Bee",
      "source_type": "astroworld_api",
      "edition": "java",
      "game_version": "1.15"
    },
    {
      "entity_type": "biome",
      "id": "minecraft:plains",
      "name": "Plains",
      "source_type": "astroworld_api",
      "edition": "java",
      "game_version": "1.0"
    }
  ],
  "edges": [
    {
      "id": 14,
      "source_entity_type": "mob",
      "source_entity_id": "bee",
      "relationship_type": "SPAWNS_IN",
      "target_entity_type": "biome",
      "target_entity_id": "minecraft:plains",
      "source_type": "astroworld_api",
      "metadata": null,
      "explanation": "Bee naturally spawns in Plains."
    }
  ],
  "metadata": {
    "depth": 1,
    "truncated": false,
    "available_relationship_types": ["SPAWNS_IN"],
    "total_nodes": 2,
    "total_edges": 1
  }
}
```

---

### E. Public Cache Status Endpoint

#### `GET /api/data-status`
Provides cache freshness metrics and entity totals for UI badges and operational checks.

**Example Response:**
```json
{
  "status": "healthy",
  "latest_sync_status": "success",
  "latest_sync_started_at": "2026-11-04T13:57:40.338532+00:00",
  "latest_sync_completed_at": "2026-11-04T13:57:44.431213+00:00",
  "cache_freshness_seconds": 320.5,
  "cache_freshness_human": "5 minutes ago",
  "total_entities": 688,
  "total_relationship_edges": 650,
  "cached_counts": {
    "mobs": 76,
    "biomes": 64,
    "items": 100,
    "enchantments": 40,
    "structures": 24,
    "commands": 57,
    "versions": 36,
    "achievements": 111,
    "villager_professions": 13,
    "trades": 167
  },
  "edition": "java",
  "coverage_summary": "Minecraft Java Edition only. Covers curated core mobs, biomes, 100 key items/blocks, structures, enchantments, commands, versions, villager trades, and derived graph relationships."
}
```

---

## 4. Pagination Behavior

All list endpoints return a uniform pagination envelope:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 76,
    "total_pages": 4
  },
  "filters": {
    "search": null,
    "type": "hostile"
  }
}
```

* **1-based index:** Page numbers start at `1`. Supplying `page=0` or negative numbers automatically defaults to `page=1`.
* **Safe page size:** Bounded between `1` and `100`. Supplying `page_size=500` will be clamped or rejected via FastAPI schema validation.
* **Filter Echoing:** The `filters` block echoes active query parameters for frontend state binding.

---

## 5. Search Behavior and Limits

* Search matches substrings case-insensitively using SQLite `LOWER(column) LIKE '%pattern%'`.
* Empty or whitespace-only queries are rejected with HTTP 422.
* Results are capped at `limit` (default: 20, max: 100).
* Heavy database fields (such as `raw_payload`) are excluded from search results for efficiency.

---

## 6. Supported Entity Types

The following 9 entity types are recognized across search and graph traversal:
1. `mob`
2. `biome`
3. `item`
4. `structure`
5. `enchantment`
6. `achievement`
7. `command`
8. `version`
9. `villager_profession` (and associated `trade`)

---

## 7. Graph-Neighbour Depth and Size Limits

To protect against exponential combinatorial graph explosion:
* **Depth Limit:** Traversal is strictly restricted to `depth=1` or `depth=2`. Depths $> 2$ are rejected with HTTP 400.
* **Edge Limit:** Traversal is capped at `limit` edges (default: 50, max: 100).
* **Truncation Flag:** When edge limits prevent full traversal, `metadata.truncated` is set to `true`.
* **Cycle Prevention:** Visited nodes and edges are tracked across traversal depths to avoid infinite loops and duplicate links.

---

## 8. Provenance and Source Metadata Policy

Every single entity detail response and graph node includes standard provenance metadata:
* **`source_type`:** Origin tier (`astroworld_api`, `curated`, or `calculated`).
* **`source_url`:** Upstream endpoint URL.
* **`edition`:** Exclusively `"java"`.
* **`game_version`:** Minecraft version when verified or introduced.
* **`last_verified_at`:** UTC timestamp of database ingestion.
* **`coverage_note`:** Scope commentary regarding partial coverage or verification boundaries.

---

## 9. Standard Error Response Shapes

Errors return a consistent structured JSON envelope:

```json
{
  "detail": {
    "code": "entity_not_found",
    "message": "No mob with ID 'unknown-mob' was found in the local MineAtlas cache."
  }
}
```

Common error codes:
* `entity_not_found` (HTTP 404): Requested entity does not exist in SQLite.
* `invalid_depth` (HTTP 400): Traversal depth requested was greater than 2 or less than 1.
* `invalid_search_query` (HTTP 422): Blank or whitespace-only search string.

---

## 10. Known Current Coverage Limitations

1. **Items and Key Blocks:** Astroworld curates a targeted subset of 100 functional items and blocks. Decorative blocks, stained glass variants, and building stairs are intentionally not covered.
2. **Unresolved References:** Because Astroworld does not provide exhaustive item tables, mob drops or loot items not present in the 100-item table are safely skipped during relationship derivation. **MineAtlas never invents fake nodes.**
3. **Farm Guides & Blueprints:** Handcrafted farm blueprints and production metrics (`Iron Farm -> PRODUCES -> Iron Ingot`) are scheduled for Phase 7 as curated content.
4. **Seed / Coordinate Mapping:** MineAtlas does not calculate world seed coordinate locations; it models game mechanics, dimensions, elevation bounding boxes, and biomes.

---

## 11. Difference Between `/api/data-status` and `/api/development/sync-status`

| Aspect | `/api/data-status` | `/api/development/sync-status` |
|---|---|---|
| **Audience** | Public / Frontend | Developers / CI / Diagnostics |
| **Environment** | Enabled in all environments | Enabled **only** when `APP_ENV=development` (returns 404 otherwise) |
| **Payload Detail** | Concise counts, cache freshness, high-level health | Deep structured audit log (`SyncRun.summary_json`), endpoint headers, retry logs |
| **Upstream Calls** | None (SQLite only) | None (SQLite only) |

---

## 12. How the Future React Frontend Will Use This API

In upcoming phases, the React frontend will interface with these endpoints:
1. **Global Search Header:** Debounced input calling `GET /api/search?q={query}` to render instant multi-category dropdown results.
2. **Explorer Collection Grids:** Dedicated explorer views (Mobs, Biomes, Items, Structures) consuming paginated collection endpoints with active filter state chips.
3. **Entity Detail Drawers / Modals:** Comprehensive entity detail panels showing stats, drop tables, and provenance badges.
4. **Cytoscape Graph Canvas:** Interactive node-link graph visualization powered directly by `GET /api/graph/neighbors/{type}/{id}?depth=1&depth=2`, expanding neighborhoods on node click.

