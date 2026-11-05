"""Seed script for curated Minecraft Java Edition dimensions and world types.

Idempotent execution:
- Seeds or updates the 3 canonical Minecraft dimensions (Overworld, The Nether, The End).
- Seeds or updates standard Java Edition world generator presets.
- Preserves provenance metadata (source_type = 'curated', edition = 'java').
- Strictly offline: never makes external network calls.
"""

from datetime import datetime, timezone
import logging
import sys
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Dimension, WorldType
from app.db.session import SessionLocal

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed_world_reference")

NOW_UTC = datetime(2026, 11, 5, 0, 0, 0, tzinfo=timezone.utc)

CURATED_DIMENSIONS: list[dict[str, Any]] = [
    {
        "id": "overworld",
        "name": "The Overworld",
        "description": "The primary starting dimension featuring varied biomes, day-night cycle, weather, and civil structures.",
        "has_skylight": True,
        "bed_works": True,
        "respawn_anchor_works": False,
        "min_y": -64,
        "max_y": 320,
        "source_type": "curated",
        "edition": "java",
        "game_version": "1.18+",
        "last_verified_at": NOW_UTC,
        "coverage_note": "Java Edition dimensions: Overworld range Y=-64 to Y=320 introduced in Caves & Cliffs Part II.",
    },
    {
        "id": "nether",
        "name": "The Nether",
        "description": "Fiery subterranean dimension with ceiling bedrock, lava seas, and an 8:1 horizontal travel ratio relative to the Overworld.",
        "has_skylight": False,
        "bed_works": False,
        "respawn_anchor_works": True,
        "min_y": 0,
        "max_y": 256,
        "source_type": "curated",
        "edition": "java",
        "game_version": "1.16+",
        "last_verified_at": NOW_UTC,
        "coverage_note": "Beds explode when clicked in The Nether. Respawn Anchors charged with Glowstone set safe spawn points.",
    },
    {
        "id": "the_end",
        "name": "The End",
        "description": "Dark void dimension consisting of central and outer end stone islands hovering over an infinite void.",
        "has_skylight": False,
        "bed_works": False,
        "respawn_anchor_works": False,
        "min_y": 0,
        "max_y": 256,
        "source_type": "curated",
        "edition": "java",
        "game_version": "1.9+",
        "last_verified_at": NOW_UTC,
        "coverage_note": "Accessed through Stronghold End Portals. Both beds and respawn anchors explode if used in The End.",
    },
]

CURATED_WORLD_TYPES: list[dict[str, Any]] = [
    {
        "id": "default",
        "name": "Default",
        "description": "Standard Minecraft terrain generation featuring realistic biome transitions, mountain ranges, and multi-layered cave aquifers.",
        "generator_type": "minecraft:normal",
        "source_type": "curated",
        "edition": "java",
        "game_version": "1.18+",
        "last_verified_at": NOW_UTC,
    },
    {
        "id": "flat",
        "name": "Superflat",
        "description": "Completely level terrain consisting of customizable layers (default: 1 bedrock, 2 dirt, 1 grass block) with customizable structure generation.",
        "generator_type": "minecraft:flat",
        "source_type": "curated",
        "edition": "java",
        "game_version": "1.0+",
        "last_verified_at": NOW_UTC,
    },
    {
        "id": "large_biomes",
        "name": "Large Biomes",
        "description": "Generates world terrain identical to Default but with biome scale expanded horizontally by 4x (16x area).",
        "generator_type": "minecraft:large_biomes",
        "source_type": "curated",
        "edition": "java",
        "game_version": "1.3+",
        "last_verified_at": NOW_UTC,
    },
    {
        "id": "amplified",
        "name": "Amplified",
        "description": "Extreme terrain elevation with towering mountains and sheer cliffs reaching up to world build limit (Y=320). Requires powerful hardware.",
        "generator_type": "minecraft:amplified",
        "source_type": "curated",
        "edition": "java",
        "game_version": "1.7+",
        "last_verified_at": NOW_UTC,
    },
    {
        "id": "single_biome",
        "name": "Single Biome",
        "description": "World generator preset that constrains world generation to an endless expanse of one chosen biome.",
        "generator_type": "minecraft:single_biome_surface",
        "source_type": "curated",
        "edition": "java",
        "game_version": "1.13+",
        "last_verified_at": NOW_UTC,
    },
]


def seed_world_reference(session: Session) -> dict[str, int]:
    """Seed or update curated dimensions and world types in SQLite."""
    stats = {
        "dimensions_seeded": 0,
        "dimensions_created": 0,
        "dimensions_updated": 0,
        "world_types_seeded": 0,
        "world_types_created": 0,
        "world_types_updated": 0,
    }

    logger.info("=== Seeding Curated Java Edition Dimensions ===")
    for d_data in CURATED_DIMENSIONS:
        dim = session.scalar(select(Dimension).where(Dimension.id == d_data["id"]))
        if dim is None:
            dim = Dimension(id=d_data["id"])
            session.add(dim)
            stats["dimensions_created"] += 1
            logger.info("  [CREATE] Dimension: %s (%s)", d_data["name"], d_data["id"])
        else:
            stats["dimensions_updated"] += 1
            logger.info("  [UPDATE] Dimension: %s (%s)", d_data["name"], d_data["id"])

        for k, v in d_data.items():
            setattr(dim, k, v)
        stats["dimensions_seeded"] += 1

    session.flush()

    logger.info("=== Seeding Curated World Types ===")
    for w_data in CURATED_WORLD_TYPES:
        wt = session.scalar(select(WorldType).where(WorldType.id == w_data["id"]))
        if wt is None:
            wt = WorldType(id=w_data["id"])
            session.add(wt)
            stats["world_types_created"] += 1
            logger.info("  [CREATE] WorldType: %s (%s)", w_data["name"], w_data["id"])
        else:
            stats["world_types_updated"] += 1
            logger.info("  [UPDATE] WorldType: %s (%s)", w_data["name"], w_data["id"])

        for k, v in w_data.items():
            setattr(wt, k, v)
        stats["world_types_seeded"] += 1

    session.commit()
    return stats


def main() -> None:
    """CLI Entrypoint for seeding curated world reference records."""
    logger.info("Starting curated world reference seeder...")
    session = SessionLocal()
    try:
        stats = seed_world_reference(session)
        logger.info(
            "World reference seeding completed successfully: %d dimensions, %d world types.",
            stats["dimensions_seeded"],
            stats["world_types_seeded"],
        )
    except Exception as exc:
        session.rollback()
        logger.exception("World reference seeding failed: %s", exc)
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()
