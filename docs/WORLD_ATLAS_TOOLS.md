# Calculated World Atlas Tools: Technical Reference & Architecture

The **Calculated World Atlas Tools** (`/world`) provide technical spatial planning utilities and curated dimension references for **Minecraft Java Edition**. The suite combines verified reference data (`source_type = "curated"`) with deterministic mathematical calculators (`source_type = "calculated"`).

---

## 1. Core Principles & Provenance Model

MineAtlas enforces strict data transparency across its three-tier data model:

| Provenance Label | `source_type` | Description in World Atlas |
| :--- | :--- | :--- |
| **Curated Reference** | `curated` | Handcrafted spatial specifications for Java dimensions, Cartesian axes, and travel rules. |
| **Calculated Result** | `calculated` | Algorithmic, deterministic mathematical transformations (8:1 portal scaling, sphere geometry, explainable biome criteria matching). |
| **Cached API Data** | `astroworld_api` | Background-synchronized entity registries (mobs, biomes, structures) stored in local SQLite. |

### Strict Operational Boundaries:
1. **Minecraft Java Edition Exclusivity:** All coordinate scaling, altitude limits, bed rules, and mob despawn radii conform strictly to Java Edition specifications.
2. **Zero Outbound Browser Requests:** The React frontend only contacts the MineAtlas FastAPI backend (`/api/world/*`).
3. **Purely Offline / Cached SQLite:** All calculations run locally in Python without contacting external servers or Astroworld.
4. **No False Simulation Claims:** Results are transparently labeled as geometric targets or criteria matches rather than seed locators or mob-cap simulation engines.

---

## 2. Dimension Reference & Coordinates Explainer

### 2.1 Curated Dimensions Overview

| Dimension ID | Name | Coordinate Scale | Build Limits | Skylight | Bed Behavior | Primary Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `overworld` | The Overworld | 1:1 (Baseline) | Y = -64 to Y = 320 | Yes | Safe to Sleep | Primary habitable realm with day-night cycle and weather. |
| `nether` | The Nether | 8:1 (1N = 8O) | Y = 0 to Y = 256 | No | Explodes! | Subterranean fast travel hub; Respawn Anchors set spawn. |
| `the_end` | The End | Separate Realm | Y = 0 to Y = 256 | No | Explodes! | Final void dimension accessed via Strongholds and End Gateways. |

### 2.2 Coordinate System Rules (Java 1.18+)
- **X-Axis (Horizontal):** East (+) and West (-). Increasing X moves East; decreasing moves West.
- **Y-Axis (Vertical Altitude):**
  - **Y = 320:** Sky build height limit.
  - **Y = 63:** Standard ocean sea level.
  - **Y = 0:** Deepslate transition boundary (historic bedrock floor in pre-1.18).
  - **Y = -64:** Absolute world bedrock floor. Void damage starts below Y < -64.
- **Z-Axis (Horizontal):** South (+) and North (-). Increasing Z moves South; decreasing moves North.
- **Origin (0, 0, 0):** Geometric world center.
- **World Border:** Impassable default boundary located at horizontal coordinates **X/Z &plusmn;29,999,984**.

---

## 3. Nether Portal Coordinate Converter

### 3.1 Mathematical Formulation
In Minecraft Java Edition, horizontal distance in The Nether is compressed relative to the Overworld by an exact 8:1 factor:

$$\text{Nether } X = \frac{\text{Overworld } X}{8}, \quad \text{Nether } Z = \frac{\text{Overworld } Z}{8}$$

$$\text{Overworld } X = \text{Nether } X \times 8, \quad \text{Overworld } Z = \text{Nether } Z \times 8$$

$$\text{Target } Y = \text{Source } Y \quad (\text{Vertical coordinates do not scale horizontally})$$

### 3.2 Endpoint Specification
- **Method:** `POST /api/world/portal-convert`
- **Payload:**
  ```json
  {
    "source_dimension": "overworld",
    "x": 800.0,
    "y": 64.0,
    "z": -1600.0
  }
  ```
- **Response:**
  ```json
  {
    "result_type": "Calculated Result",
    "source_dimension": "overworld",
    "target_dimension": "nether",
    "source_coordinates": { "x": 800.0, "y": 64.0, "z": -1600.0 },
    "target_coordinates": { "x": 100.0, "y": 64.0, "z": -200.0 },
    "formula_name": "8:1 Overworld to Nether Horizontal Compression",
    "formula_expression": "target_x = source_x / 8, target_z = source_z / 8",
    "formula_explanation": "In Minecraft Java Edition, horizontal distance in The Nether is compressed by an 8:1 ratio...",
    "assumptions": [
      "Assumes a direct two-way Nether portal linkage without intermediate portal interference.",
      "Horizontal coordinate scaling strictly uses the canonical 8:1 Java Edition constant.",
      "Vertical Y altitude is displayed unchanged for building height alignment."
    ],
    "limitations": [
      "Actual portal linking can depend on nearby portals, portal search behavior, terrain, construction height, and game-version mechanics. This tool gives the expected coordinate-scale target only.",
      "MineAtlas does not analyze seed generation, terrain obstacles, or nearest portal search caches."
    ],
    "provenance": { "source_type": "calculated", "edition": "java" }
  }
  ```

### 3.3 Explicit Limitation Notice
> **Important:** The tool calculates the mathematical *ideal coordinate target*. When a player enters a portal, the game searches an axis-aligned bounding box within 128 blocks in the target dimension. If multiple portals exist nearby or if terrain creates an obstruction, the player may link to a pre-existing portal rather than the exact mathematical coordinate.

---

## 4. Biome Criteria Explorer

### 4.1 Purpose & Deterministic Rule Matching
Players frequently need to identify which biome possesses the climate, structure opportunities, or mob spawns needed for technical projects or survival builds. Rather than requiring users to manually cross-reference wiki pages, the **Biome Criteria Explorer** applies transparent, deterministic filtering against the cached SQLite biome registry.

### 4.2 Endpoint Specification
- **Method:** `GET /api/world/biome-matches`
- **Query Parameters:**
  - `dimension` (e.g. `overworld`, `nether`, `end`)
  - `category` (e.g. `plains`, `desert`, `taiga`, `jungle`, `ocean`)
  - `rarity` (e.g. `common`, `uncommon`, `rare`)
  - `precipitation` (e.g. `rain`, `snow`, `none`)
  - `temperature_min` / `temperature_max`
  - `has_village_opportunity` (cross-references `FOUND_IN` graph edges from `village`)
  - `has_tameable_mob_opportunity` (cross-references `SPAWNS_IN` edges from `horse`, `wolf`, `cat`, etc.)
  - `beginner_friendly` (Overworld, common rarity, temperate range $0.4 \le T \le 0.9$)
  - `limit` (default 50, maximum 100)

### 4.3 Deterministic Match Reasons
Each matching biome returns a list of verifiable reasons, for example:
- `Located in the Overworld dimension.`
- `Matches 'common' world generation rarity.`
- `Precipitation type is 'rain'.`
- `Naturally generates Village settlements according to verified relation edges.`
- `Spawns domestic or tameable animals (e.g. horses, wolves, or cats).`

### 4.4 Mandatory Seed Disclaimer
> **Seed Disclaimer:** These results identify matching biome types from the MineAtlas cache. MineAtlas does **not** locate biomes in an arbitrary player seed and does not simulate seed-specific climate maps or Perlin noise samplers.

---

## 5. Spawn Sphere & Despawn Radius Visualizer

### 5.1 Geometry Formulas
The visualizer models the 3D isotropic sphere centered on the player at coordinates $(X, Y, Z)$:

- **Diameter:** $D = 2r$
- **2D Horizontal Circular Area:** $A = \pi r^2$
- **3D Spherical Volume:** $V = \frac{4}{3} \pi r^3$
- **Horizontal Circumference:** $C = 2\pi r$
- **Vertical Altitude Span:** $\text{Range} = [\text{Player } Y - r, \text{Player } Y + r]$

### 5.2 Java Edition Radius Presets
1. **24 Blocks (Inner Exclusion Zone):**
   - No natural hostile mob spawning can occur within a Euclidean sphere of radius 24 blocks around the player.
   - Farm perimeters must place spawning pads at least 24 blocks away from the player AFK spot.
2. **32 Blocks (Active Pathfinding Range):**
   - Hostile mobs beyond 32 blocks stop pathfinding, wander aimlessly, and have a continuous random despawn chance ($\frac{1}{800}$ chance per game tick after 30 seconds).
3. **128 Blocks (Instant Despawn Boundary):**
   - Hostile mobs outside a 128-block Euclidean sphere instantly despawn on the next tick.
   - Perimeter clearance and cave lighting are designed to eradicate spawnable spaces within this 128-block sphere.

### 5.3 Endpoint Specification
- **Method:** `POST /api/world/spawn-sphere`
- **Payload:**
  ```json
  {
    "radius": 128.0,
    "player_y": 64.0
  }
  ```
- **Response:**
  ```json
  {
    "result_type": "Calculated Result",
    "measurements": {
      "radius": 128.0,
      "diameter": 256.0,
      "circular_area_blocks": 51471.85,
      "sphere_volume_blocks": 8784529.76,
      "circumference_blocks": 804.25,
      "vertical_range": { "min_y": -64.0, "max_y": 192.0 }
    },
    "geometric_explanation": "A planning radius of 128.0 blocks defines a horizontal circular area of 51,471.85 blocks²...",
    "formulas_used": {
      "diameter": "2 * r",
      "circular_area_2d": "π * r²",
      "sphere_volume_3d": "(4/3) * π * r³",
      "circumference": "2 * π * r"
    },
    "assumptions": [
      "Evaluates an isotropic geometric sphere centered at player coordinates with radius r = 128.0.",
      "Vertical and horizontal distances are measured using Euclidean 3D distance: sqrt(dx² + dy² + dz²)."
    ],
    "limitations": [
      "Actual mob spawning/despawning behavior depends on many version, biome, block-light, mob-cap, player-position, server, and game-rule factors. This tool provides geometric planning measurements, not guaranteed spawn simulation.",
      "Does not simulate mob cap counters, light levels, pack spawning routines, or simulation distance chunk ticking."
    ],
    "provenance": { "source_type": "calculated", "edition": "java" }
  }
  ```

---

## 6. Offline Reference Seeder

The offline database seeder populates canonical dimension and world type specifications into SQLite idempotently:

```bash
# Seed curated dimensions and world types
PYTHONPATH=backend ./venv/bin/python -m app.scripts.seed_world_reference
```

- **Output:** 3 canonical Java dimensions (`overworld`, `nether`, `the_end`) and 5 world generator presets (`default`, `flat`, `large_biomes`, `amplified`, `single_biome`).
- **Idempotency:** Executing repeatedly updates records without duplicating primary keys.

---

## 7. Test Suite Summary

- **Backend Pytest (`backend/tests/test_world.py`):** 16 passing tests covering seeder idempotency, world reference endpoints, Nether portal coordinate calculations (positives, negatives, decimals, bounds, dimension validations), explainable biome criteria matching, spawn sphere geometry formulas, and strict offline operation.
- **Frontend Vitest (`frontend/src/test/world.test.tsx`):** 7 passing tests covering responsive SVG diagrams, dimension cards, interactive converter input & clipboard copying, criteria builder, preset buttons, and sub-tab transitions.

