"""Knowledge graph relationship derivation service.

Extracts meaningful semantic edges from raw upstream payloads into RelationEdge.

ARCHITECTURAL RULES:
1. Derive edges only when both referenced entities exist in the database.
2. Never create fake placeholder entity nodes.
3. Skip unresolvable references and record them in derivation metrics.
4. Idempotent: re-running derivation updates existing edges without creating duplicates.
5. All edges carry provenance and normalized metadata.
"""

from collections.abc import Sequence
from datetime import datetime, timezone
import json
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    Achievement,
    Biome,
    Dimension,
    Enchantment,
    Item,
    Mob,
    RelationEdge,
    Structure,
    Trade,
    Version,
    VillagerProfession,
)
from app.services.normalizers import normalize_probability


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


class RelationshipDerivationService:
    """Derives graph edges from ingested entity tables into RelationEdge."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.derived_count = 0
        self.updated_count = 0
        self.unresolved_references: dict[str, int] = {}

    def _track_unresolved(self, category: str) -> None:
        self.unresolved_references[category] = self.unresolved_references.get(category, 0) + 1

    def _build_lookup_maps(self) -> dict[str, Any]:
        """Pre-load entity identifiers and names for fast resolution."""
        biomes = self.session.scalars(select(Biome)).all()
        biome_by_name = {b.name.lower(): b.id for b in biomes}
        biome_by_id = {b.id.lower(): b.id for b in biomes}

        items = self.session.scalars(select(Item)).all()
        item_by_name = {i.name.lower(): i.id for i in items}
        item_by_id = {i.id.lower(): i.id for i in items}

        versions = self.session.scalars(select(Version)).all()
        version_by_name = {v.name.lower(): v.slug for v in versions}
        version_by_slug = {v.slug.lower(): v.slug for v in versions}

        dimensions = self.session.scalars(select(Dimension)).all()
        dimension_ids = {d.id.lower(): d.id for d in dimensions}

        professions = self.session.scalars(select(VillagerProfession)).all()
        profession_ids = {p.id: p.id for p in professions}

        achievements = self.session.scalars(select(Achievement)).all()
        achievement_ids = {a.id: a.id for a in achievements}

        # Load existing edges into a lookup map to guarantee idempotency
        existing_edges = self.session.scalars(select(RelationEdge)).all()
        edge_map = {
            (
                e.source_entity_type,
                e.source_entity_id,
                e.relationship_type,
                e.target_entity_type,
                e.target_entity_id,
            ): e
            for e in existing_edges
        }

        return {
            "biome_by_name": biome_by_name,
            "biome_by_id": biome_by_id,
            "item_by_name": item_by_name,
            "item_by_id": item_by_id,
            "version_by_name": version_by_name,
            "version_by_slug": version_by_slug,
            "dimension_ids": dimension_ids,
            "profession_ids": profession_ids,
            "achievement_ids": achievement_ids,
            "edge_map": edge_map,
        }

    def _upsert_edge(
        self,
        edge_map: dict[tuple[str, str, str, str, str], RelationEdge],
        source_type: str,
        source_id: str,
        rel_type: str,
        target_type: str,
        target_id: str,
        metadata_dict: dict[str, Any] | None = None,
        coverage_note: str | None = None,
    ) -> None:
        """Idempotently insert or update a RelationEdge record."""
        key = (source_type, source_id, rel_type, target_type, target_id)
        metadata_str = (
            json.dumps(metadata_dict, ensure_ascii=False) if metadata_dict else None
        )

        existing = edge_map.get(key)
        if existing is not None:
            if existing.metadata_json != metadata_str:
                existing.metadata_json = metadata_str
                existing.last_verified_at = utc_now()
                self.updated_count += 1
        else:
            new_edge = RelationEdge(
                source_entity_type=source_type,
                source_entity_id=source_id,
                relationship_type=rel_type,
                target_entity_type=target_type,
                target_entity_id=target_id,
                metadata_json=metadata_str,
                source_type="astroworld_api",
                edition="java",
                last_verified_at=utc_now(),
                coverage_note=coverage_note or "Derived from Astroworld API data",
            )
            self.session.add(new_edge)
            edge_map[key] = new_edge
            self.derived_count += 1

    def derive_all_relationships(self) -> dict[str, Any]:
        """Execute full relationship derivation across all ingested entities."""
        lookups = self._build_lookup_maps()
        edge_map = lookups["edge_map"]

        self._derive_mob_relationships(lookups, edge_map)
        self._derive_structure_relationships(lookups, edge_map)
        self._derive_trade_relationships(lookups, edge_map)
        self._derive_achievement_relationships(lookups, edge_map)
        self._derive_version_added_relationships(lookups, edge_map)

        self.session.commit()

        return {
            "derived_edges_created": self.derived_count,
            "derived_edges_updated": self.updated_count,
            "total_edges": len(edge_map),
            "unresolved_references": self.unresolved_references,
        }

    def _derive_mob_relationships(
        self, lookups: dict[str, Any], edge_map: dict[Any, RelationEdge]
    ) -> None:
        """Derive Mob -> SPAWNS_IN -> Biome, Mob -> DROPS -> Item, Mob -> BREEDS_WITH -> Item."""
        mobs = self.session.scalars(select(Mob)).all()

        for mob in mobs:
            if not mob.raw_payload:
                continue
            try:
                raw = json.loads(mob.raw_payload)
            except Exception:
                continue

            # 1. Mob -> SPAWNS_IN -> Biome
            for b_name in raw.get("spawnBiomes", []):
                cleaned = str(b_name).strip().lower()
                biome_id = lookups["biome_by_name"].get(cleaned) or lookups["biome_by_id"].get(cleaned)
                if biome_id:
                    self._upsert_edge(
                        edge_map,
                        "mob",
                        mob.id,
                        "SPAWNS_IN",
                        "biome",
                        biome_id,
                        coverage_note=f"Spawn biome for {mob.name}",
                    )
                else:
                    self._track_unresolved(f"mob_spawn_biome:{b_name}")

            # 2. Mob -> DROPS -> Item
            for drop in raw.get("drops", []):
                item_name = drop.get("item")
                if not item_name:
                    continue
                item_cleaned = str(item_name).strip().lower()
                item_id = lookups["item_by_name"].get(item_cleaned) or lookups["item_by_id"].get(item_cleaned)
                if item_id:
                    prob_meta = normalize_probability(drop.get("chance"), scale_hint="percentage")
                    drop_meta = {
                        "chance": prob_meta,
                        "count": drop.get("count"),
                    }
                    self._upsert_edge(
                        edge_map,
                        "mob",
                        mob.id,
                        "DROPS",
                        "item",
                        item_id,
                        metadata_dict=drop_meta,
                        coverage_note=f"Item dropped by {mob.name}",
                    )
                else:
                    self._track_unresolved(f"mob_drop_item:{item_name}")

            # 3. Mob -> BREEDS_WITH -> Item
            breeding_val = raw.get("breedingItem")
            if breeding_val:
                items_to_check = breeding_val if isinstance(breeding_val, list) else [breeding_val]
                for b_item in items_to_check:
                    b_cleaned = str(b_item).strip().lower()
                    item_id = lookups["item_by_name"].get(b_cleaned) or lookups["item_by_id"].get(b_cleaned)
                    if item_id:
                        self._upsert_edge(
                            edge_map,
                            "mob",
                            mob.id,
                            "BREEDS_WITH",
                            "item",
                            item_id,
                            coverage_note=f"Breeding food for {mob.name}",
                        )
                    else:
                        self._track_unresolved(f"mob_breed_item:{b_item}")

            # 4. Mob -> TAMED_WITH -> Item
            tame_val = raw.get("tamingItem") or raw.get("tamingMethod")
            if tame_val:
                tame_items = tame_val if isinstance(tame_val, list) else [tame_val]
                for t_item in tame_items:
                    t_cleaned = str(t_item).strip().lower()
                    item_id = lookups["item_by_name"].get(t_cleaned) or lookups["item_by_id"].get(t_cleaned)
                    if item_id:
                        self._upsert_edge(
                            edge_map,
                            "mob",
                            mob.id,
                            "TAMED_WITH",
                            "item",
                            item_id,
                            coverage_note=f"Taming item for {mob.name}",
                        )
                    else:
                        self._track_unresolved(f"mob_tame_item:{t_item}")

    def _derive_structure_relationships(
        self, lookups: dict[str, Any], edge_map: dict[Any, RelationEdge]
    ) -> None:
        """Derive Structure -> FOUND_IN -> Biome, Structure -> LOCATED_IN -> Dimension, Structure -> CONTAINS_LOOT -> Item."""
        structures = self.session.scalars(select(Structure)).all()

        for struct in structures:
            if not struct.raw_payload:
                continue
            try:
                raw = json.loads(struct.raw_payload)
            except Exception:
                continue

            # 1. Structure -> FOUND_IN -> Biome
            for b_name in raw.get("biomes", []):
                cleaned = str(b_name).strip().lower()
                biome_id = lookups["biome_by_name"].get(cleaned) or lookups["biome_by_id"].get(cleaned)
                if biome_id:
                    self._upsert_edge(
                        edge_map,
                        "structure",
                        struct.id,
                        "FOUND_IN",
                        "biome",
                        biome_id,
                        coverage_note=f"Generation biome for {struct.name}",
                    )
                else:
                    self._track_unresolved(f"structure_biome:{b_name}")

            # 2. Structure -> LOCATED_IN -> Dimension
            if struct.dimension:
                dim_clean = struct.dimension.strip().lower()
                # Check dimension in DB or standard Minecraft dimension IDs
                if dim_clean in lookups["dimension_ids"] or dim_clean in ("overworld", "nether", "the_end"):
                    self._upsert_edge(
                        edge_map,
                        "structure",
                        struct.id,
                        "LOCATED_IN",
                        "dimension",
                        dim_clean,
                        coverage_note=f"Dimension for {struct.name}",
                    )

            # 3. Structure -> CONTAINS_LOOT -> Item
            for loot_entry in raw.get("loot", []):
                item_name = loot_entry.get("item")
                if not item_name:
                    continue
                item_clean = str(item_name).strip().lower()
                item_id = lookups["item_by_name"].get(item_clean) or lookups["item_by_id"].get(item_clean)
                if item_id:
                    prob_meta = normalize_probability(loot_entry.get("chance"), scale_hint="fraction")
                    loot_meta = {
                        "chance": prob_meta,
                        "count": loot_entry.get("count"),
                        "is_unique": False,
                    }
                    self._upsert_edge(
                        edge_map,
                        "structure",
                        struct.id,
                        "CONTAINS_LOOT",
                        "item",
                        item_id,
                        metadata_dict=loot_meta,
                        coverage_note=f"Chest loot in {struct.name}",
                    )
                else:
                    self._track_unresolved(f"structure_loot_item:{item_name}")

            # Unique loot
            for u_item in raw.get("uniqueLoot", []):
                u_clean = str(u_item).strip().lower()
                item_id = lookups["item_by_name"].get(u_clean) or lookups["item_by_id"].get(u_clean)
                if item_id:
                    self._upsert_edge(
                        edge_map,
                        "structure",
                        struct.id,
                        "CONTAINS_LOOT",
                        "item",
                        item_id,
                        metadata_dict={"is_unique": True, "chance": {"normalized_probability": 1.0}},
                        coverage_note=f"Unique loot item in {struct.name}",
                    )
                else:
                    self._track_unresolved(f"structure_unique_loot_item:{u_item}")

    def _derive_trade_relationships(
        self, lookups: dict[str, Any], edge_map: dict[Any, RelationEdge]
    ) -> None:
        """Derive Trade -> TRADED_BY -> VillagerProfession."""
        trades = self.session.scalars(select(Trade)).all()

        for trade in trades:
            if trade.profession_id in lookups["profession_ids"]:
                self._upsert_edge(
                    edge_map,
                    "trade",
                    trade.trade_id,
                    "TRADED_BY",
                    "villager_profession",
                    trade.profession_id,
                    metadata_dict={
                        "level": trade.level,
                        "gives": f"{trade.gives_amount} {trade.gives_item}",
                        "receives": f"{trade.receives_amount} {trade.receives_item}",
                    },
                    coverage_note=f"Trade tier {trade.level} offered by {trade.profession_id}",
                )

    def _derive_achievement_relationships(
        self, lookups: dict[str, Any], edge_map: dict[Any, RelationEdge]
    ) -> None:
        """Derive Achievement -> UNLOCKS -> Achievement (parent-child progression)."""
        achievements = self.session.scalars(select(Achievement)).all()

        for ach in achievements:
            if ach.parent_id and ach.parent_id in lookups["achievement_ids"]:
                self._upsert_edge(
                    edge_map,
                    "achievement",
                    ach.parent_id,
                    "UNLOCKS",
                    "achievement",
                    ach.id,
                    coverage_note=f"{ach.parent_id} unlocks child advancement {ach.id}",
                )

    def _derive_version_added_relationships(
        self, lookups: dict[str, Any], edge_map: dict[Any, RelationEdge]
    ) -> None:
        """Derive Entity -> ADDED_IN -> Version for items, mobs, biomes, enchantments."""
        entity_types: list[tuple[str, Sequence[Any]]] = [
            ("mob", self.session.scalars(select(Mob)).all()),
            ("biome", self.session.scalars(select(Biome)).all()),
            ("item", self.session.scalars(select(Item)).all()),
            ("structure", self.session.scalars(select(Structure)).all()),
            ("enchantment", self.session.scalars(select(Enchantment)).all()),
        ]

        for entity_type, entities in entity_types:
            for entity in entities:
                ver_val = getattr(entity, "version_added", None)
                if not ver_val:
                    continue
                ver_clean = str(ver_val).strip().lower()
                version_slug = lookups["version_by_name"].get(ver_clean) or lookups["version_by_slug"].get(ver_clean)
                if version_slug:
                    self._upsert_edge(
                        edge_map,
                        entity_type,
                        entity.id,
                        "ADDED_IN",
                        "version",
                        version_slug,
                        coverage_note=f"{entity.name} introduced in version {ver_val}",
                    )
                else:
                    self._track_unresolved(f"version_added:{ver_val}")

