# Farm Blueprint Hub: Architecture & Curated Guide Standards

The **Farm Blueprint Hub** (`/farms`) is MineAtlas's dedicated explorer for handcrafted, version-verified Minecraft Java Edition farm designs. It bridges raw game data (mobs, items, mechanics, and structures) with practical technical gameplay architectures.

---

## 1. Purpose of the Farm Blueprint Hub

Minecraft technical farming relies on specific game engine rules governing mob pathfinding, panic states, village geometry, and spawn algorithms. The Farm Blueprint Hub provides:
- **Mechanics-First Explanations:** Explaining *why* a farm works, not just where blocks go.
- **Architectural Schematics:** Original spatial zone diagrams showing functional relationships rather than copied block-by-block voxel schematics.
- **Integrated Knowledge Graph:** Direct links to the MineAtlas Knowledge Graph Explorer (`/graph`), enabling players to traverse relationships like:
  - `Iron Farm ──[REQUIRES]──> Zombie`
  - `Iron Farm ──[REQUIRES]──> Villager Golem Panic Spawning (Mechanic)`
  - `Raid Farm ──[REQUIRES]──> Village (Structure)`
  - `Raid Farm ──[PRODUCES]──> Totem of Undying`
- **Interactive Checklists:** Convenient material tracking directly in the browser during survival construction.

---

## 2. Why Farm Guides are "Curated" Rather than "API-Backed"

In MineAtlas's 3-tier provenance model:
1. `astroworld_api`: Upstream raw entity records automatically synchronized into SQLite.
2. `curated`: Handcrafted, verified records authored by the MineAtlas maintainers.
3. `calculated`: Algorithmic and derived metrics computed from other tables.

Upstream APIs (such as Astroworld) provide encyclopedic registries (mob health, drops, biome temperatures), but do not publish engineering farm designs. Marking farm guides as `source_type = "curated"` preserves transparency, ensuring users know that these architectures represent curated technical expertise rather than direct upstream API dumps.

---

## 3. Java Edition Exclusivity

**MineAtlas exclusively targets Minecraft Java Edition.**

Minecraft Bedrock Edition uses fundamentally different underlying mechanics:
- **Iron Golems:** Java Edition uses *panic mechanics* (3 villagers observing a zombie with recent sleep). Bedrock Edition requires 10 to 20 villagers and 20 linked workstations/beds without panic.
- **Raids:** Java Edition raid centers calculate around a single bed/villager at specific horizontal and vertical offsets, and Java 1.21 introduced Ominous Bottles and Raid Omen countdowns.
- **Breeding:** Java Edition requires 2 full air blocks of clearance above bed pillows for pathfinding validation.

Every farm record and page carries an explicit `edition = "java"` badge and version compatibility label.

---

## 4. Importance of Version & Compatibility Notes

Farm mechanics evolve across major Java Edition updates. A farm functional in 1.20 may behave differently in 1.21. For example:
- **Tricky Trials (Java 1.21):** Bad Omen is no longer automatically granted upon killing a raid captain. Raid captains drop **Ominous Bottles** (levels I–V). Consuming a bottle grants Bad Omen, which transforms into a 30-second "Raid Omen" preparation timer when entering village boundaries. Stacking raid farms built for 1.20 require timing adaptations.
- **Village & Pillage (Java 1.14):** Introduced modern panic-based iron golem spawning and workstation-linked villager professions.

Every farm guide prominently displays:
- **Compatibility Label:** (e.g., `Minecraft Java Edition 1.14 - 1.21+ (Requires Ominous Bottle in 1.21+)`)
- **Last Verified Date:** The date the underlying mechanics were cross-referenced against authoritative sources.
- **Coverage & Caveat Notice:** Prominently warning builders of version-specific conditions or simulation distance requirements.

---

## 5. Original Simplified Schematics vs Copied Blueprints

MineAtlas does **NOT** copy voxel schematics, Litematica files, or blueprint text from external creators or wikis.

Instead, each farm guide features an **Original Explanatory Schematic**:
- **Zone-Based Vector Graphics:** SVG layouts representing key functional areas:
  - *Villager Enclosure*
  - *Mob Spawning Surface*
  - *Kill / Drop Chute*
  - *Collection & Storage Floor*
  - *Safe Player Position*
- **Mechanics Understanding:** Focuses on spatial rules (e.g. 16-block golem spawn cube, 2-block bed headroom, 28-block lethal fall distance).
- **Full Accessibility:** Every schematic includes SVG `<title>` and `<desc>` attributes, semantic headings, and an adjacent textual zone breakdown for screen readers.

---

## 6. Structure of Every Farm Guide

Every curated guide in MineAtlas conforms to a strict 12-section layout:
1. **Hero Header:** Farm title, category, difficulty, dimension, curated badge, Java Edition badge, and last verified date.
2. **Compatibility Warning:** Prominent callout detailing version variations and prerequisites.
3. **Purpose & Expected Outputs:** Structured yield table highlighting primary and secondary outputs with realistic rates.
4. **How It Works:** Plain-English breakdown of the underlying Java Edition mechanics.
5. **Prerequisites:** Necessary tools, locations, and hostile/passive mob access before breaking ground.
6. **Materials Checklist:** Interactive checkboxes allowing survival players to check off collected resources with a reset button.
7. **Construction Process:** Ordered numbered steps with explicit "Why this step matters" mechanical context.
8. **Original Schematic:** Responsive, labeled geometric diagram.
9. **Maintenance & Safety:** Lightning rod placement, witch prevention, and chest overflow avoidance.
10. **Troubleshooting:** Friendly `Issue` &rarr; `Likely Cause` &rarr; `Suggested Check` resolution grid.
11. **Knowledge Graph Entry:** "Explore this farm's connections" button launching `/graph?type=farm&id={slug}&depth=1`.
12. **Provenance & Source References:** Transparent citations to authoritative Minecraft mechanics documentation.

---

## 7. How Farm Records & Graph Edges are Seeded

Curated records are seeded into SQLite using an explicit, offline command:

```bash
cd ~/Desktop/mineatlas
source venv/bin/activate
cd backend
python -m app.scripts.seed_curated_farms
```

### Seeder Principles:
- **Strictly Offline:** Never contacts Astroworld or any network endpoint.
- **Idempotent:** Re-running the script updates existing farm and mechanic records without creating duplicates.
- **Honest Reference Verification:** When creating relationship edges (e.g. `Iron Farm -> PRODUCES -> Iron Ingot`), the seeder checks whether the target entity actually exists in the local database. If an item (such as `iron_ingot` or `bed`) is not present in the current 100-item catalog, the edge is safely skipped and logged:
  ```text
  [SKIP] Unresolved edge: farm:iron-farm -[PRODUCES]-> item:iron_ingot (Missing in SQLite: item:iron_ingot)
  ```
- **Exit Code Guarantee:** Returns exit code 0 on success and non-zero on error.

---

## 8. Farm Connection to the Knowledge Graph

Curated farms participate fully in the Cytoscape.js Knowledge Graph Explorer (`/graph`):
- **Node Shape & Color:** Octagon shape (`#f97316`, warm amber/orange), visually distinguishing engineering blueprints from mobs (rounded rectangle crimson), biomes (hexagon emerald), items (diamond cyan), and structures (rectangle gold).
- **Mechanics Nodes:** Connected to core mechanics nodes (e.g. `villager-golem-panic-spawning`).
- **Entity Links:** Connected to required mobs (`zombie`, `iron_golem`, `pillager`, `evoker`) and items (`hopper`, `name_tag`, `bread`, `totem_of_undying`, `redstone_dust`).
- **Deterministic Explanations:**
  - `Iron Golem Farm requires Zombie to operate effectively.`
  - `Bad Omen Raid Farm requires Village to operate effectively.`
  - `Bad Omen Raid Farm produces Totem of Undying as primary output.`

---

## 9. Interactive Checklist State

The Materials Checklist on each farm detail page:
- Uses client-side React state local to the active browser session.
- Requires no login, user account, cookies, or database writes.
- Provides a one-click "Reset Checklist" button to start over.
- Is fully accessible with standard semantic `<input type="checkbox">` elements.

---

## 10. Known Limitations

- **Java Edition Only:** Will not function properly on Bedrock Edition.
- **Simulation Distances:** Certain farms require simulation distance &ge; 6 or specific mob despawn sphere radii (128 blocks from the player).
- **100-Item Catalog Scope:** Items outside the current 100-item catalog are documented in the guide text and checklist, but omitted from the graph database until those item rows are synchronized.

---

## 11. Adding a Future Curated Farm Guide Responsibly

To add a new curated farm guide to MineAtlas:
1. Verify underlying mechanics in Java Edition across current versions.
2. Draft original text, build steps, troubleshooting notes, and why-it-matters explanations.
3. Define the geometric zones for the SVG schematic.
4. Add the record dictionary to `CURATED_FARMS` in `backend/app/scripts/seed_curated_farms.py`.
5. Add any resolvable graph relation edges to `CURATED_GRAPH_EDGE_CANDIDATES`.
6. Run the seeder: `cd backend && python -m app.scripts.seed_curated_farms`.
7. Verify the farm detail page renders at `/farms/{slug}` and tests pass.

