# MineAtlas Canonical Data Model (Phase 3 Foundation)

This document specifies the database architecture, entity relational schemas, provenance standards, and knowledge graph edge structure for **MineAtlas**.

---

## 1. Purpose of the SQLite Database

MineAtlas serves as an interactive Minecraft Java Edition Atlas and Knowledge Graph Explorer. While upstream data originates from the Astroworld API, querying external HTTP endpoints on every user action would be slow, fragile, and violate our strict **50 requests-per-minute** rate-limit budget.

The SQLite database provides:
1. **Local Persistent Cache:** Stores upstream entities locally so that future frontend exploration, filtering, and detail views operate at sub-millisecond speeds with zero network overhead.
2. **Relational & Graph Query Engine:** Enables rapid graph traversals (e.g. `Zombie → DROPS → Rotten Flesh`, `Plains → CONTAINS → Village`) across interconnected entities.
3. **Curated Content Repository:** Provides dedicated storage for version-verified farm architectures, game mechanics, and dimensions alongside API-derived data.

---

## 2. Why SQLite Was Selected

MineAtlas is designed to run natively and comfortably on **Linux Mint** and standard desktop environments without requiring cloud accounts, containers, or background daemon processes:
- **Zero Configuration:** Stored entirely in a single file on disk (`backend/data/mineatlas.db`).
- **Zero Background Daemons:** Unlike PostgreSQL, MySQL, or Redis, SQLite requires no background server processes consuming memory or requiring credentials.
- **Fast and Reliable:** Built directly into Python's standard library with ACID transaction guarantees.
- **Strictly No Cloud / Docker Overhead:** No Docker setup, no port binding conflicts, and no cloud billing dependencies.

---

## 3. SQLAlchemy & Alembic Explained for Beginners

To interact with SQLite safely and cleanly in Python, MineAtlas uses two industry-standard libraries:

### What is SQLAlchemy?
**SQLAlchemy** is an **Object Relational Mapper (ORM)**. Instead of writing raw SQL queries like:
```sql
SELECT * FROM mobs WHERE mob_type = 'hostile';
```
SQLAlchemy allows developers to define Python classes (`Mob`, `Biome`, `Item`) that map directly to database tables. You can create, query, and update records using standard Python objects:
```python
creeper = session.scalar(select(Mob).where(Mob.id == "creeper"))
print(creeper.hp)  # 20.0
```
This prevents SQL injection vulnerabilities, provides IDE autocompletion, and enforces column types.

### What is Alembic?
**Alembic** is the companion **database migration tool** for SQLAlchemy. As a software project grows, database schemas evolve (new tables, new columns, altered indexes).
- **Without Alembic:** Modifying a schema requires manually dropping tables or running manual SQL scripts, risking data corruption.
- **With Alembic:** Schema changes are written as version-controlled migration scripts (`backend/alembic/versions/`). Running `alembic upgrade head` reliably transforms any fresh or existing database to the latest schema version.

---

## 4. Master Table Directory

MineAtlas defines **16 canonical tables** organized into four functional groups:

| Table Name | Entity Class | Category | Expected `source_type` | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `biomes` | `Biome` | Core API | `astroworld_api` | Environmental regions, dimensions, temperature, precipitation |
| `mobs` | `Mob` | Core API | `astroworld_api` | Living entities, health, damage tiers, spawn rules, drops |
| `items` | `Item` | Core API | `astroworld_api` | Curated key items, functional blocks, durability, fuel |
| `structures` | `Structure` | Core API | `astroworld_api` | World structures, elevation bounds, biomes, chest loot |
| `enchantments` | `Enchantment` | Core API | `astroworld_api` | Magical modifiers, max levels, applicable equipment, curses |
| `commands` | `Command` | Core API | `astroworld_api` | In-game command syntax, permission levels, arguments |
| `versions` | `Version` | Core API | `astroworld_api` | Java Edition release history, update titles, chronology |
| `achievements` | `Achievement` | Core API | `astroworld_api` | Advancement trees, criteria, rewards, parent references |
| `villager_professions` | `VillagerProfession` | Core API | `astroworld_api` | 13 vanilla professions and workstation job-site blocks |
| `trades` | `Trade` | Core API | `astroworld_api` | Individual tier transactions (Novice → Master) per profession |
| `dimensions` | `Dimension` | Curated | `curated` | World realms (Overworld, Nether, The End) and rules |
| `world_types` | `WorldType` | Curated | `curated` | Generator presets (Default, Superflat, Large Biomes, etc.) |
| `farms` | `Farm` | Curated | `curated` | Handcrafted Java Edition farm guides with verified yields |
| `mechanics` | `Mechanic` | Curated | `curated` | Java Edition mechanics (quasi-connectivity, golem spawning) |
| `relation_edges` | `RelationEdge` | Graph Store | `astroworld_api` / `curated` | Polymorphic graph edges connecting any two entities |
| `sync_runs` | `SyncRun` | Operational | `calculated` | Operational execution logs for upstream sync passes |

---

## 5. Model Schema Summaries

### 5.1 Biome (`biomes`)
- `id` (PK, string, natural ID e.g. `'minecraft:plains'`)
- `name` (string, index)
- `dimension` (string, index: `'overworld'`, `'nether'`, `'the_end'`)
- `category` (string, index: `'temperate'`, `'arid'`, `'cold'`, `'aquatic'`, `'caves'`)
- `temperature` (float)
- `precipitation` (string: `'rain'`, `'snow'`, `'none'`)
- `rarity` (string: `'common'`, `'uncommon'`, `'rare'`)
- `version_added` (string)
- `notes` (text)
- `source_type`, `source_url`, `edition`, `game_version`, `last_verified_at`, `coverage_note`
- `created_at`, `updated_at`, `raw_payload`

### 5.2 Mob (`mobs`)
- `id` (PK, string, natural slug e.g. `'cow'`, `'zombie'`, `'creeper'`)
- `name` (string, index)
- `mob_type` (string, index: `'passive'`, `'hostile'`, `'neutral'`, `'boss'`)
- `category` (string, index: `'animal'`, `'undead'`, `'arthropod'`, etc.)
- `behavior` (text summary)
- `hp` (float base health points)
- `damage_easy`, `damage_normal`, `damage_hard` (floats for difficulty tiers)
- `xp_min`, `xp_max` (integers)
- `spawn_conditions` (text description of lighting/block/group conditions)
- `tameable` (boolean), `taming_method` (text)
- `breedable` (boolean), `breeding_item` (text)
- `version_added` (string), `notes` (text)
- Provenance, timestamp, and `raw_payload` columns

### 5.3 Item & Key Block (`items`)
- `id` (PK, string, natural slug e.g. `'wooden_pickaxe'`, `'diamond'`)
- `name` (string, index)
- `category` (string, index: `'tool'`, `'combat'`, `'resource'`, `'food'`, `'redstone'`)
- `stack_size` (integer, default 64)
- `durability` (integer, nullable for non-tool items)
- `description` (text)
- `enchantable` (boolean)
- `food_hunger` (integer, hunger points), `food_saturation` (float)
- `fuel_value` (integer, smelting ticks)
- `version_added` (string), `notes` (text)
- Provenance, timestamp, and `raw_payload` columns

### 5.4 Structure (`structures`)
- `id` (PK, string, natural slug e.g. `'village'`, `'ancient_city'`)
- `name` (string, index)
- `dimension` (string, index)
- `category` (string, index: `'settlement'`, `'dungeon'`, `'ruin'`, `'temple'`)
- `rarity` (string)
- `y_min`, `y_max` (integers for elevation bounds)
- `how_to_find` (text)
- `version_added` (string), `notes` (text)
- Provenance, timestamp, and `raw_payload` columns

### 5.5 Enchantment (`enchantments`)
- `id` (PK, string, natural slug e.g. `'sharpness'`, `'mending'`)
- `name` (string, index)
- `category` (string, index: `'weapons'`, `'armor'`, `'tools'`, etc.)
- `max_level` (integer, default 1)
- `description` (text)
- `treasure_only` (boolean), `curse_of` (boolean)
- `weight` (integer, table selection weight)
- `version_added` (string), `notes` (text)
- Provenance, timestamp, and `raw_payload` columns

### 5.6 Command (`commands`)
- `name` (PK, string natural command e.g. `'give'`, `'teleport'`)
- `syntax` (text, e.g. `'/give <targets> <item> [<count>]'`)
- `description` (text)
- `permission_level` (integer, 0 to 4)
- `category` (string, index)
- `version_added` (string), `notes` (text)
- Provenance, timestamp, and `raw_payload` columns

### 5.7 Version (`versions`)
- `slug` (PK, string e.g. `'1-21'`, `'1-0'`)
- `name` (string, index e.g. `'1.21'`)
- `edition` (string, default `'java'`)
- `release_date` (string YYYY-MM-DD)
- `release_type` (string: `'major-release'`, `'minor-release'`)
- `update_name` (string e.g. `'Tricky Trials'`)
- `previous_version_slug`, `next_version_slug` (strings)
- Provenance, timestamp, and `raw_payload` columns

### 5.8 Achievement (`achievements`)
- `id` (PK, string namespaced ID e.g. `'minecraft:story/root'`)
- `slug` (string, index e.g. `'minecraft'`)
- `name` (string, index)
- `tab` (string, index: `'minecraft'`, `'nether'`, `'end'`, `'adventure'`, `'husbandry'`)
- `description` (text), `icon` (string)
- `parent_id` (string, index, points to parent advancement ID)
- `how_to_complete` (text), `xp_reward` (integer)
- `is_goal` (boolean), `is_challenge` (boolean), `difficulty` (string)
- `version_added` (string)
- Provenance, timestamp, and `raw_payload` columns

### 5.9 VillagerProfession & Trade (`villager_professions`, `trades`)
- **`VillagerProfession`**:
  - `id` (PK, string natural slug e.g. `'armorer'`, `'librarian'`)
  - `name` (string, index)
  - `workstation` (string job-site block e.g. `'Blast Furnace'`, `'Lectern'`)
  - `description` (text), `biome_specific` (boolean)
  - Relationship `trades`: one-to-many cascade to `Trade`
- **`Trade`**:
  - `id` (PK, integer autoincrement)
  - `trade_id` (string, unique, index e.g. `'armorer-1-coal-emerald'`)
  - `profession_id` (FK → `villager_professions.id` ON DELETE CASCADE)
  - `level` (integer 1 to 5), `level_name` (string: `'Novice'` to `'Master'`)
  - `gives_item` (string), `gives_amount` (integer)
  - `receives_item` (string), `receives_amount` (integer)
  - `max_uses` (integer), `price_multiplier` (float), `notes` (text)

### 5.10 Curated Entities (`dimensions`, `world_types`, `farms`, `mechanics`)
- **`Dimension`**: `id` (PK, e.g. `'overworld'`), `name`, `description`, `has_skylight`, `bed_works`, `respawn_anchor_works`, `min_y`, `max_y`.
- **`WorldType`**: `id` (PK, e.g. `'default'`, `'flat'`), `name`, `description`, `generator_type`.
- **`Farm`**: `id` (PK, e.g. `'iron-farm-simple'`), `name`, `category`, `difficulty`, `estimated_output_per_hour`, `summary`, `description`, `notes`.
- **`Mechanic`**: `id` (PK, e.g. `'villager-golem-spawning'`), `name`, `category`, `summary`, `description`, `java_specific_notes`.

### 5.11 RelationEdge (`relation_edges`)
- `id` (PK, integer autoincrement)
- `source_entity_type` (string, e.g. `'mob'`, `'structure'`, `'farm'`)
- `source_entity_id` (string, e.g. `'zombie'`, `'village'`)
- `relationship_type` (string, e.g. `'DROPS'`, `'FOUND_IN'`, `'PRODUCES'`)
- `target_entity_type` (string, e.g. `'item'`, `'biome'`)
- `target_entity_id` (string, e.g. `'rotten_flesh'`, `'minecraft:plains'`)
- `metadata_json` (text, optional attributes like drop chance or quantity)
- Provenance and timestamps

### 5.12 SyncRun (`sync_runs`)
- `id` (PK, integer autoincrement)
- `started_at` (datetime UTC), `completed_at` (datetime UTC, nullable)
- `status` (string, index: `'pending'`, `'running'`, `'success'`, `'failed'`)
- `trigger_type` (string: `'manual'`, `'audit'`, `'scheduled'`)
- `endpoints_synced` (integer), `records_ingested` (integer)
- `error_message` (text, nullable), `summary_json` (text, nullable)
- `created_at` (datetime UTC)

---

## 6. Planned Graph Relationships

| Relationship Type | Source Entity | Target Entity | Example Real-World Fact |
| :--- | :--- | :--- | :--- |
| `SPAWNS_IN` | `Mob` | `Biome` | `Cow` SPAWNS_IN `minecraft:plains` |
| `FOUND_IN` | `Structure` | `Biome` | `Village` FOUND_IN `minecraft:plains` |
| `DROPS` | `Mob` | `Item` | `Zombie` DROPS `rotten_flesh` |
| `CRAFTS_INTO` | `Item` | `Item` | `Iron Ingot` CRAFTS_INTO `Iron Pickaxe` |
| `USED_FOR` | `Item` | `Mechanic` / `Farm` | `Villager` USED_FOR `Iron Golem Spawning` |
| `TAMED_WITH` | `Mob` | `Item` | `Wolf` TAMED_WITH `Bone` |
| `BREEDS_WITH` | `Mob` | `Item` | `Cow` BREEDS_WITH `Wheat` |
| `CONTAINS_LOOT` | `Structure` | `Item` | `Ancient City` CONTAINS_LOOT `Echo Shard` |
| `LOCATED_IN` | `Biome` / `Structure` | `Dimension` | `Crimson Forest` LOCATED_IN `The Nether` |
| `TRADED_BY` | `Item` | `VillagerProfession` | `Diamond Armor` TRADED_BY `Armorer` |
| `REQUIRES` | `Farm` | `Mob` / `Item` | `Iron Farm` REQUIRES `Villager` |
| `PRODUCES` | `Farm` | `Item` | `Iron Farm` PRODUCES `Iron Ingot` |
| `UNLOCKS` | `Item` / `Mob` | `Achievement` | `Diamond` UNLOCKS `Diamonds!` |
| `ADDED_IN` | Any Entity | `Version` | `Crafter` ADDED_IN `1.21` |

---

## 7. Data Provenance Policy

Every content record in MineAtlas strictly tracks its provenance to preserve transparency, reproducibility, and version compatibility:

1. **`source_type` (Category):**
   - **`astroworld_api`**: Data fetched and synchronized directly from the upstream Astroworld API. Read-only reflection of upstream facts.
   - **`curated`**: Handcrafted, human-verified Java Edition content (such as farm architecture blueprints, redstone mechanics, and building caveats). Never automatically overwritten by API sync passes.
   - **`calculated`**: Values derived computationally by MineAtlas (such as complexity rankings, yield estimations per hour, and graph distance metrics).
2. **`source_url`:** Full URL or API endpoint identifying the origin (e.g. `https://api.astroworldmc.com/api/v1/mobs`).
3. **`edition`:** Hardcoded to `"java"`. Guarantees no confusion with Bedrock Edition mechanics.
4. **`game_version`:** Minecraft version against which the data was verified (e.g. `"1.21"`).
5. **`last_verified_at`:** Precise UTC timestamp of the last verification or sync pass.
6. **`coverage_note`:** Factual note documenting completeness or known caveats (e.g. `"Partial key item coverage from Astroworld API"`).

---

## 8. Role of `raw_payload`

For all API-backed tables, a `raw_payload` text column stores the original source JSON object verbatim.

**Why retain `raw_payload`?**
- **Traceability:** If an upstream property is added or refined, the original data is preserved locally without requiring re-fetching.
- **Future Unpacking:** Complex structures (such as nested crafting recipe grids, drop rate matrices, or biome color maps) that are not yet modeled into separate columns remain fully accessible.
- **Non-destructive Ingestion:** In Phase 4, the ingestion engine can re-parse local `raw_payload` values to generate new relation edges without hitting the Astroworld rate limit.

---

## 9. Polymorphic `RelationEdge` Design

A standard SQL foreign key (`REFERENCES other_table(id)`) can only point to **one single table**. 

In a Minecraft knowledge graph, an edge connects disparate combinations:
- `Mob -> Biome`
- `Structure -> Item`
- `Farm -> Mob`
- `VillagerProfession -> Item`

Creating separate physical junction tables for every permutation (`mob_biomes`, `structure_biomes`, `farm_mobs`, `farm_items`, `item_enchantments`, etc.) would require dozens of sparse tables and complex `UNION` queries to find all neighbors of an entity.

**The Solution:**
The `relation_edges` table uses a **polymorphic entity reference**:
```text
(source_entity_type, source_entity_id) -[relationship_type]-> (target_entity_type, target_entity_id)
```
- **Indexes:** Dedicated composite indexes on `(source_entity_type, source_entity_id)` and `(target_entity_type, target_entity_id)` enable instant bidirectional queries (e.g. *"Show all entities connected to Zombie"* or *"Show all entities that produce Iron Ingot"*).
- **Uniqueness:** A unique constraint on `(source_entity_type, source_entity_id, relationship_type, target_entity_type, target_entity_id)` prevents duplicate graph links.

---

## 10. Explicit Limitations of Phase 3

To keep Phase 3 controlled and reliable:
1. **No Live Data Imported:** The tables are initialized and migrated, but no live Astroworld records have been populated into `backend/data/mineatlas.db`.
2. **No Generated Graph Edges:** `relation_edges` is created and indexed, but edges have not yet been derived from raw snapshots.
3. **No User-Facing Explorer:** The frontend remains on the Phase 1 health status view.
4. **No Exhaustive Block Coverage:** MineAtlas does not claim to index every block variation. It indexes items and functional key blocks.

---

## 11. Phase 4 Preparation

Phase 4 will build upon this canonical schema:
1. **Astroworld Ingestion Engine:** Read local raw snapshots or execute safe rate-limited sync passes (≤ 50 req/min) into SQLite tables.
2. **Edge Derivation Service:** Parse `raw_payload` arrays (`spawnBiomes`, `drops`, `hostileMobs`, `trades`, `workstation`) to generate populated `RelationEdge` records.
3. **FastAPI Data Endpoints:** Expose filtered read-only query endpoints (e.g. `/api/mobs`, `/api/biomes`, `/api/graph/neighbors/{entity_id}`) for the frontend explorer.

