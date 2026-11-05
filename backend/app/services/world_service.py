"""World Service for Calculated World Atlas Tools and Curated World Reference.

Strictly deterministic calculations and cached SQLite queries:
- Curated reference data for Overworld, Nether, and The End.
- 8:1 Nether portal horizontal coordinate conversions.
- Rule-based biome criteria matching with explicit, explainable reasons.
- Spawn sphere / radius mathematical geometry calculations.
- Strictly offline: never contacts Astroworld or external APIs.
"""

import math
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models import Biome, Dimension, RelationEdge
from app.schemas.world import (
    BiomeMatchesResponse,
    BiomeMatchItem,
    BiomeMatchSummary,
    CoordinatesExplanation,
    DimensionReference,
    PortalCoordinates,
    PortalConvertRequest,
    PortalConvertResponse,
    SpawnSphereMeasurements,
    SpawnSphereRequest,
    SpawnSphereResponse,
    WorldReferenceResponse,
)

# Mandatory limitation statement for all world tools
SEED_LIMITATION_STATEMENT = (
    "A Minecraft seed determines world generation, but MineAtlas does not analyse "
    "arbitrary seeds or locate structures for a seed."
)

PORTAL_LIMITATION_STATEMENT = (
    "Actual portal linking can depend on nearby portals, portal search behavior, "
    "terrain, construction height, and game-version mechanics. This tool gives the "
    "expected coordinate-scale target only."
)

SPAWN_SPHERE_LIMITATION_STATEMENT = (
    "Actual mob spawning/despawning behavior depends on many version, biome, block-light, "
    "mob-cap, player-position, server, and game-rule factors. This tool provides geometric "
    "planning measurements, not guaranteed spawn simulation."
)


class WorldService:
    """Service encapsulating World Atlas reference and calculated planning tools."""

    @staticmethod
    def get_world_reference(session: Session) -> WorldReferenceResponse:
        """Retrieve curated Java Edition dimension references and coordinate system rules."""
        # Query dimension rows from SQLite if seeded, otherwise provide canonical fallbacks
        db_dimensions = session.scalars(select(Dimension).order_by(Dimension.id)).all()

        dim_references: list[DimensionReference] = []
        if db_dimensions:
            for d in db_dimensions:
                scale = "1:1 (Baseline)" if d.id == "overworld" else ("8:1 (1 Nether block = 8 Overworld blocks)" if d.id == "nether" else "Separate Realm (Stronghold portal travel)")
                role = "Primary habitable starting realm with day-night cycle." if d.id == "overworld" else ("Lava-filled subterranean realm used for fast travel and blaze rod resources." if d.id == "nether" else "Floating void islands, home of the Ender Dragon and End Cities.")
                dim_references.append(
                    DimensionReference(
                        id=d.id,
                        name=d.name,
                        role=role,
                        description=d.description or f"The {d.name} dimension in Minecraft Java Edition.",
                        coordinate_scale=scale,
                        skylight=d.has_skylight,
                        bed_safe=d.bed_works,
                        min_y=d.min_y,
                        max_y=d.max_y,
                        source_type="curated",
                        edition="java",
                    )
                )
        else:
            # Canonical fallback definitions matching Java Edition specifications
            dim_references = [
                DimensionReference(
                    id="overworld",
                    name="The Overworld",
                    role="Primary starting dimension featuring diverse biomes, animals, and settlements.",
                    description="The main world realm spanning from Y=-64 to Y=320 with full day-night celestial cycles and natural weather.",
                    coordinate_scale="1:1 (Baseline reference)",
                    skylight=True,
                    bed_safe=True,
                    min_y=-64,
                    max_y=320,
                    source_type="curated",
                    edition="java",
                ),
                DimensionReference(
                    id="nether",
                    name="The Nether",
                    role="Hostile fiery dimension utilized for high-speed travel and unique late-game resources.",
                    description="An underground subterranean realm with ceiling bedrock, lava oceans, and an 8:1 horizontal travel ratio relative to the Overworld.",
                    coordinate_scale="8:1 (1 Nether block = 8 Overworld horizontal blocks)",
                    skylight=False,
                    bed_safe=False,
                    min_y=0,
                    max_y=256,
                    source_type="curated",
                    edition="java",
                ),
                DimensionReference(
                    id="the_end",
                    name="The End",
                    role="Final boss realm and gateway to outer void islands containing End Cities and Elytra.",
                    description="A dark, starless dimension composed of central and outer end stone islands hovering over an infinite void.",
                    coordinate_scale="Separate Realm (Fixed gateway linking)",
                    skylight=False,
                    bed_safe=False,
                    min_y=0,
                    max_y=256,
                    source_type="curated",
                    edition="java",
                ),
            ]

        coordinate_system = CoordinatesExplanation(
            x_axis="East (+) / West (-): Horizontal axis. Increasing X moves East; decreasing X moves West.",
            y_axis="Altitude / Height: Vertical elevation. In Java 1.18+, Overworld ranges from Y=-64 (Bedrock) to Y=320 (Sky build limit). Sea level is at Y=63.",
            z_axis="South (+) / North (-): Horizontal axis. Increasing Z moves South; decreasing Z moves North.",
            origin_point="The coordinates (X:0, Z:0) represent the world origin, typically near initial world spawn.",
            world_border="By default, Minecraft Java Edition worlds feature an impassable world border located at X/Z ±29,999,984 blocks from the origin.",
        )

        travel_rules = [
            "Overworld & The Nether: Horizontal coordinates scale at an exact 8:1 ratio (1 block in the Nether equals 8 blocks in the Overworld). Vertical Y coordinates do not scale.",
            "Nether Portals: Nether portal search checks a 128-block radius in the target dimension to find or create an active portal.",
            "The End: Accessed exclusively via End Portals in Strongholds requiring 12 Eyes of Ender. Outer End islands are reached via End Gateways generated after defeating the Ender Dragon.",
        ]

        return WorldReferenceResponse(
            dimensions=dim_references,
            coordinate_system=coordinate_system,
            dimension_travel_rules=travel_rules,
            seed_limitation_statement=SEED_LIMITATION_STATEMENT,
        )

    @staticmethod
    def convert_portal_coordinates(req: PortalConvertRequest) -> PortalConvertResponse:
        """Convert horizontal coordinates between Overworld and Nether using Java Edition 8:1 ratio."""
        src_dim = req.source_dimension.strip().lower()

        if src_dim in ("overworld", "world"):
            target_dim = "nether"
            # Overworld -> Nether: divide horizontal X and Z by 8
            target_x = round(req.x / 8.0, 3)
            target_z = round(req.z / 8.0, 3)
            formula_name = "8:1 Overworld to Nether Horizontal Compression"
            formula_expression = "target_x = source_x / 8, target_z = source_z / 8"
            formula_explanation = (
                "In Minecraft Java Edition, horizontal distance in The Nether is compressed by an 8:1 ratio. "
                "Divide Overworld horizontal coordinates (X and Z) by 8 to determine the matching target coordinates in The Nether."
            )
        elif src_dim in ("nether", "the_nether"):
            target_dim = "overworld"
            # Nether -> Overworld: multiply horizontal X and Z by 8
            target_x = round(req.x * 8.0, 3)
            target_z = round(req.z * 8.0, 3)
            formula_name = "1:8 Nether to Overworld Horizontal Expansion"
            formula_expression = "target_x = source_x * 8, target_z = source_z * 8"
            formula_explanation = (
                "In Minecraft Java Edition, each horizontal block in The Nether corresponds to 8 horizontal blocks in the Overworld. "
                "Multiply Nether horizontal coordinates (X and Z) by 8 to determine the matching target coordinates in the Overworld."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "code": "invalid_dimension",
                    "message": (
                        f"Unsupported source dimension '{req.source_dimension}'. "
                        "Portal coordinate conversion only applies between 'overworld' and 'nether'. "
                        "The End uses fixed Stronghold and Gateway coordinates."
                    ),
                },
            )

        # Vertical Y altitude remains unchanged as a planning reference
        target_y = req.y

        assumptions = [
            "Assumes a direct two-way Nether portal linkage without intermediate portal interference.",
            "Horizontal coordinate scaling strictly uses the canonical 8:1 Java Edition constant.",
            "Vertical Y altitude is displayed unchanged for building height alignment.",
        ]

        limitations = [
            PORTAL_LIMITATION_STATEMENT,
            "MineAtlas does not analyze seed generation, terrain obstacles, or nearest portal search caches.",
        ]

        return PortalConvertResponse(
            source_dimension=src_dim,
            target_dimension=target_dim,
            source_coordinates=PortalCoordinates(x=req.x, y=req.y, z=req.z),
            target_coordinates=PortalCoordinates(x=target_x, y=target_y, z=target_z),
            formula_name=formula_name,
            formula_expression=formula_expression,
            formula_explanation=formula_explanation,
            assumptions=assumptions,
            limitations=limitations,
        )

    @staticmethod
    def get_biome_matches(
        session: Session,
        dimension: str | None = None,
        category: str | None = None,
        rarity: str | None = None,
        precipitation: str | None = None,
        temperature_min: float | None = None,
        temperature_max: float | None = None,
        has_structures: bool | None = None,
        has_spawning_mobs: bool | None = None,
        beginner_friendly: bool | None = None,
        has_village_opportunity: bool | None = None,
        has_tameable_mob_opportunity: bool | None = None,
        limit: int = 50,
    ) -> BiomeMatchesResponse:
        """Filter cached SQLite biomes by criteria and provide deterministic matching explanations."""
        stmt = select(Biome)
        criteria: dict[str, Any] = {}

        if dimension and dimension.strip():
            dim_clean = dimension.strip().lower()
            if dim_clean in ("the_end", "the-end"):
                dim_clean = "end"
            stmt = stmt.where(func.lower(Biome.dimension) == dim_clean)
            criteria["dimension"] = dim_clean

        if category and category.strip():
            cat_clean = category.strip().lower()
            stmt = stmt.where(func.lower(Biome.category) == cat_clean)
            criteria["category"] = cat_clean

        if rarity and rarity.strip():
            rar_clean = rarity.strip().lower()
            stmt = stmt.where(func.lower(Biome.rarity) == rar_clean)
            criteria["rarity"] = rar_clean

        if precipitation and precipitation.strip():
            precip_clean = precipitation.strip().lower()
            stmt = stmt.where(func.lower(Biome.precipitation) == precip_clean)
            criteria["precipitation"] = precip_clean

        if temperature_min is not None:
            stmt = stmt.where(Biome.temperature >= temperature_min)
            criteria["temperature_min"] = temperature_min

        if temperature_max is not None:
            stmt = stmt.where(Biome.temperature <= temperature_max)
            criteria["temperature_max"] = temperature_max

        # Player-intent preset: beginner_friendly
        if beginner_friendly:
            stmt = stmt.where(
                func.lower(Biome.dimension) == "overworld",
                func.lower(Biome.rarity) == "common",
                Biome.temperature >= 0.4,
                Biome.temperature <= 0.9,
            )
            criteria["beginner_friendly"] = True

        stmt = stmt.order_by(Biome.name.asc()).limit(min(100, max(1, limit)))
        biomes = session.scalars(stmt).all()

        # Batch-check relation edges for village and tameable mobs
        biome_ids = [b.id for b in biomes]

        village_biomes: set[str] = set()
        if biome_ids:
            vb_edges = session.scalars(
                select(RelationEdge.target_entity_id).where(
                    RelationEdge.relationship_type == "FOUND_IN",
                    func.lower(RelationEdge.source_entity_id) == "village",
                    RelationEdge.target_entity_id.in_(biome_ids),
                )
            ).all()
            village_biomes = set(vb_edges)

        tameable_mobs = {"wolf", "cat", "horse", "donkey", "parrot", "llama"}
        tameable_biomes: set[str] = set()
        if biome_ids:
            tb_edges = session.scalars(
                select(RelationEdge.target_entity_id).where(
                    RelationEdge.relationship_type == "SPAWNS_IN",
                    RelationEdge.source_entity_id.in_(tameable_mobs),
                    RelationEdge.target_entity_id.in_(biome_ids),
                )
            ).all()
            tameable_biomes = set(tb_edges)

        matched_items: list[BiomeMatchItem] = []

        for b in biomes:
            reasons: list[str] = []

            # Filter out if specific relation criteria were requested and not met
            has_village = b.id in village_biomes
            has_tameable = b.id in tameable_biomes

            if has_village_opportunity is True and not has_village:
                continue
            if has_tameable_mob_opportunity is True and not has_tameable:
                continue

            # Deterministic, explainable matching reasons
            if b.dimension:
                reasons.append(f"Located in the {b.dimension.capitalize()} dimension.")
            if b.category:
                reasons.append(f"Belongs to the '{b.category}' climate/environmental category.")
            if b.rarity:
                reasons.append(f"Matches '{b.rarity}' world generation rarity.")
            if b.temperature is not None:
                reasons.append(f"Ambient temperature value is {b.temperature}.")
            if b.precipitation:
                reasons.append(f"Precipitation type is '{b.precipitation}'.")
            if has_village:
                reasons.append("Naturally generates Village settlements according to verified relation edges.")
            if has_tameable:
                reasons.append("Spawns domestic or tameable animals (e.g. horses, wolves, or cats).")
            if beginner_friendly:
                reasons.append("Meets beginner-friendly criteria: Overworld, common rarity, and temperate climate.")

            if not reasons:
                reasons.append("Matches general catalogue exploration criteria.")

            matched_items.append(
                BiomeMatchItem(
                    biome=BiomeMatchSummary(
                        id=b.id,
                        name=b.name,
                        dimension=b.dimension,
                        category=b.category,
                        rarity=b.rarity,
                        temperature=b.temperature,
                        precipitation=b.precipitation,
                    ),
                    match_reasons=reasons,
                )
            )

        limitations = [
            "These results identify matching biome types from the MineAtlas cache. They do not locate a biome in your personal Minecraft seed.",
            "MineAtlas does not simulate seed-specific climate maps or continentalness noise samplers.",
        ]

        return BiomeMatchesResponse(
            criteria=criteria,
            total_matches=len(matched_items),
            data=matched_items,
            limitations=limitations,
        )

    @staticmethod
    def calculate_spawn_sphere(req: SpawnSphereRequest) -> SpawnSphereResponse:
        """Calculate geometric planning measurements for a radius or spawn sphere."""
        r = float(req.radius)
        diameter = round(2.0 * r, 2)
        circular_area = round(math.pi * (r ** 2), 2)
        sphere_volume = round((4.0 / 3.0) * math.pi * (r ** 3), 2)
        circumference = round(2.0 * math.pi * r, 2)

        vertical_range = None
        if req.player_y is not None:
            vertical_range = {
                "min_y": round(req.player_y - r, 2),
                "max_y": round(req.player_y + r, 2),
            }

        explanation = (
            f"A planning radius of {r} blocks defines a horizontal circular area of {circular_area:,.2f} blocks² "
            f"and a 3D spherical volume of {sphere_volume:,.2f} blocks³. In Minecraft Java Edition, "
            "128 blocks defines the boundary outside which hostile mobs instantly despawn, "
            "32 blocks defines the range where mobs freely pathfind, and 24 blocks defines the inner exclusion sphere "
            "where natural hostile mob spawning cannot occur around the player."
        )

        formulas_used = {
            "diameter": "2 * r",
            "circular_area_2d": "π * r²",
            "sphere_volume_3d": "(4/3) * π * r³",
            "circumference": "2 * π * r",
        }

        assumptions = [
            f"Evaluates an isotropic geometric sphere centered at player coordinates with radius r = {r}.",
            "Vertical and horizontal distances are measured using Euclidean 3D distance: sqrt(dx² + dy² + dz²).",
        ]

        limitations = [
            SPAWN_SPHERE_LIMITATION_STATEMENT,
            "Does not simulate mob cap counters, light levels, pack spawning routines, or simulation distance chunk ticking.",
        ]

        return SpawnSphereResponse(
            measurements=SpawnSphereMeasurements(
                radius=r,
                diameter=diameter,
                circular_area_blocks=circular_area,
                sphere_volume_blocks=sphere_volume,
                circumference_blocks=circumference,
                vertical_range=vertical_range,
            ),
            geometric_explanation=explanation,
            formulas_used=formulas_used,
            assumptions=assumptions,
            limitations=limitations,
        )

