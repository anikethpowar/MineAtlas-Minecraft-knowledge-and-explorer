# Knowledge Graph Explorer Guide

> **MineAtlas Minecraft Java Edition Knowledge Graph Explorer**  
> **Visualization Engine:** Cytoscape.js (Directed, Focused, Local-Only)  
> **Route:** `/graph`  
> **Applies to:** Minecraft Java Edition only  
> **Data Origin:** Local SQLite Cache (`backend/data/mineatlas.db`)  
> **Phase:** Phase 7

---

## 1. Purpose of the Graph Explorer

The **MineAtlas Knowledge Graph Explorer** turns static Minecraft entity registries into an interactive, visual web of game relationships. Instead of reading disconnected tables, players can see how entities influence, produce, drop, or generate one another:

* A **Mob** drops an **Item** (e.g. `Zombie -> DROPS -> Rotten Flesh`).
* A **Structure** generates inside a **Biome** (e.g. `Village -> FOUND_IN -> Plains`).
* A **Structure** contains chest loot (e.g. `Bastion Remnant -> CONTAINS_LOOT -> Spectral Arrow`).
* A **Mob** spawns in a natural environment (e.g. `Bee -> SPAWNS_IN -> Plains`).

---

## 2. Why Only One or Two Relationship Levels?

The Graph Explorer strictly restricts neighborhood traversal to **Depth 1** (direct connections) and **Depth 2** (extended 2-hop connections). 

In Minecraft:
1. **Depth 1** shows immediate context: what does this entity drop, breed with, or spawn in?
2. **Depth 2** reveals transitive relationships: what biomes spawn the mobs that drop this resource?

By capping radius at 2 hops, every graph remains immediately readable, informative, and visually comprehensible without overwhelming the player.

---

## 3. Why the Full Graph is Never Loaded at Once

In game knowledge bases, attempting to render a global graph of hundreds of entities and thousands of edges results in:
* **"Hairball" Visual Chaos:** Massive graphs become unreadable tangles of overlapping lines where insights are impossible to discern.
* **Severe Performance Degradation:** Laying out hundreds of nodes in canvas engines causes high CPU and battery usage, leading to dropped frames on mobile browsers and laptops.
* **Loss of Player Context:** Players investigate specific problems (e.g. "Where do I find this item?" or "What spawns in this biome?"). Localized radial graphs answer these questions instantly.

---

## 4. Frontend-to-Backend Graph Data Flow

```text
+--------------------------------------------------------------------------+
| 1. User Interaction (Browser)                                            |
|    - Selects root entity via search or detail page "Explore connections" |
|    - URL updates: /graph?type=structure&id=village&depth=1              |
+--------------------------------------------------------------------------+
                                     |
                                     v HTTP GET (Local)
+--------------------------------------------------------------------------+
| 2. FastAPI Backend Endpoint                                              |
|    GET /api/graph/neighbors/{entity_type}/{entity_id}?depth=1            |
+--------------------------------------------------------------------------+
                                     |
                                     v Indexed SQL Query
+--------------------------------------------------------------------------+
| 3. Local SQLite Cache (backend/data/mineatlas.db)                        |
|    - Queries RelationEdge table indexed on source and target IDs         |
|    - Zero external network requests (Astroworld is never contacted)      |
|    - Sub-millisecond execution time                                      |
+--------------------------------------------------------------------------+
                                     |
                                     v JSON GraphNeighborsResponse
+--------------------------------------------------------------------------+
| 4. Frontend Transformation (graphTransformers.ts)                       |
|    - Sanitizes node & edge payloads                                      |
|    - Applies client-side relationship filters                            |
|    - Generates stable IDs and prevents duplicate elements                |
+--------------------------------------------------------------------------+
                                     |
                                     v ElementDefinition[]
+--------------------------------------------------------------------------+
| 5. Cytoscape.js Canvas & Accessible Relationship List                    |
|    - Concentric layout centers root entity                               |
|    - Interactive node/edge tap reveals deterministic explanations        |
+--------------------------------------------------------------------------+
```

---

## 5. What Cytoscape.js Does (in Simple Language)

**Cytoscape.js** is a fast, mature graph visualization library for JavaScript. In MineAtlas:
* It acts like an interactive canvas that positions items (**nodes**) and draws connecting arrows (**edges**) between them.
* It calculates optimal spacing so nodes do not overlap.
* It handles smooth panning (moving around the board) and zooming in and out.
* It detects when you click or tap on an entity or arrow, letting MineAtlas display full details in the side panel.

---

## 6. Supported Entity & Relationship Types

### A. Supported Entity Types
* `mob`: Living entities (hostile, passive, neutral, boss).
* `biome`: World environments across Overworld, Nether, and The End.
* `item`: Curated representative items and key blocks.
* `structure`: World-generated temples, villages, bastions, and ruins.
* `enchantment`: Equipment modifiers.
* `version`: Java Edition release milestones.
* `achievement`: Advancement progression milestones.
* `trade`: Villager merchant transactions.
* `villager_profession`: Villager vocations and job blocks.
* `dimension`: Overworld, Nether, and The End realms.

### B. Supported Relationship Types
* `SPAWNS_IN`: Mob naturally generates in a Biome.
* `DROPS`: Mob drops an Item upon defeat or harvest.
* `BREEDS_WITH`: Items used to breed living entities.
* `TAMED_WITH`: Items used to tame mobs.
* `FOUND_IN`: Structure generates inside a Biome.
* `LOCATED_IN`: Structure exists within a Dimension.
* `CONTAINS_LOOT`: Structure chests can contain an Item.
* `TRADED_BY`: Item is offered by a Villager Profession.
* `UNLOCKS`: Achievement prerequisites or triggers.
* `ADDED_IN`: Version in which an entity was introduced to Java Edition.

---

## 7. Node Shapes and Edge Directions

MineAtlas uses shape coding in addition to color to ensure clear visual distinction without relying solely on color vision:

| Entity Type | Shape | Accent Color | Visual Purpose |
|---|---|---|---|
| **Mob** | Rounded Rectangle | Crimson Red | Living entity |
| **Biome** | Hexagon | Emerald Green | Terrain & Climate |
| **Item / Key Block** | Diamond | Diamond Cyan | Resource & Tool |
| **Structure** | Rectangle | Amber Gold | World Architecture |
| **Enchantment** | Ellipse | Arcane Purple | Magical Modifier |
| **Version** | Compact Tag | Slate Blue | Game Timeline |
| **Achievement** | Star Badge | Sun Yellow | Progression Milestone |
| **Trade** | Parallelogram (Rhomboid) | Teal | Merchant Exchange |
| **Villager Profession** | Rounded Square | Indigo | Vocation |
| **Dimension** | Rounded Container | Portal Violet | World Realm |

* **Root Entity Indicator:** The focal entity is highlighted with an emphasized 4px emerald border and placed in the center of the concentric layout.
* **Arrow Direction:** Always points from the **Subject** (source) to the **Object** (target). For example, in `Bee -> DROPS -> Honey Bottle`, the arrow points towards `Honey Bottle`.

---

## 8. How Relationship Filters Work

1. When a neighborhood graph loads, MineAtlas inspects the actual `available_relationship_types` returned in the backend metadata.
2. By default, all returned relationship types are active.
3. Users can toggle individual types (e.g. turn off `ADDED_IN` to focus only on gameplay drops and spawning).
4. Filtering executes instantly **client-side** on the loaded graph data without making new server round-trips.
5. If all filters are disabled, an informational banner appears with a one-click **"Reset Relationship Filters"** action.

---

## 9. The Accessibility Alternative: Relationship List

MineAtlas believes graph data must be accessible to all players, including screen-reader users, keyboard navigators, and players on small mobile devices.

A visible toggle at the top of the explorer switches between **Visual Graph** and **Relationship List**:
* **Semantic HTML:** Renders relationships as structured semantic cards with clear `role="article"` and `aria-label` attributes.
* **Keyboard Navigable:** Supports `Tab` cycling and `Enter`/`Space` activation.
* **Full Context:** Displays Subject, Predicate, Object, drop probabilities, and deterministic explanations.
* **Interactive Navigation:** Allows opening full detail pages or pivoting the graph center around any listed entity.

---

## 10. Deterministic "Why Connected?" Explanations

MineAtlas avoids vague or unpredictable text generation. Every relationship edge provides a deterministic, human-readable explanation derived from verified game facts stored in SQLite:

* `village -> FOUND_IN -> minecraft:plains`: *"Village naturally generates in Plains."*
* `bee -> DROPS -> honey_bottle`: *"Bee produces Honey Bottle when harvested with glass bottle."*
* `bastion-remnant -> CONTAINS_LOOT -> spectral_arrow`: *"Bastion Remnant chest loot can contain Spectral Arrow (33.0% probability)."*

These explanations are surfaced immediately in both the Graph Details Panel and the Accessible Relationship List.

---

## 11. Current Limitations & Scope Boundaries

* **Curated Source Catalog:** Upstream Astroworld API indexes 100 representative items/blocks. Entities whose drops or spawn conditions reference items outside this 100-item catalog intentionally have 0 derived edges (e.g. `Zombie`, which drops Rotten Flesh).
* **Graceful Empty States:** Entities with 0 derived edges display an informational notice explaining the scope rather than failing.
* **Minecraft Java Edition Exclusivity:** All mechanics, drop rates, and structures reflect Java Edition rules.
* **Future Work:** Curated farm guides (`Iron Farm -> PRODUCES -> Iron Ingot`) and World Atlas calculators are reserved for future phases.

---

## 12. Looking Ahead: Phase 8 Preparation

Phase 8 will build upon this Knowledge Graph foundation by introducing **Curated Java Edition Farm Guides**:
* Structured blueprints showing required entities (`Iron Farm -> REQUIRES -> Villager`).
* Output rates and production edges (`Iron Farm -> PRODUCES -> Iron Ingot`).
* Deep links connecting farm guides directly into the Graph Explorer.

