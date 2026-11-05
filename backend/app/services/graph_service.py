"""Graph neighborhood service for MineAtlas.

Traverses localized subgraphs from cached RelationEdge and entity tables
in SQLite without contacting any external network or loading the entire graph.
"""

import json
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models import (
    Achievement,
    Biome,
    Command,
    Dimension,
    Enchantment,
    Farm,
    Item,
    Mechanic,
    Mob,
    RelationEdge,
    Structure,
    Trade,
    Version,
    VillagerProfession,
)
from app.schemas.graph import (
    GraphEdge,
    GraphMetadata,
    GraphNeighborsResponse,
    GraphNode,
    GraphRoot,
)


class GraphService:
    """Service handling focused graph neighborhood traversal."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def _resolve_root_name(self, entity_type: str, entity_id: str) -> tuple[bool, str, str | None]:
        """Verify root entity existence and retrieve its display name and game version."""
        e_type = entity_type.strip().lower()
        e_id = entity_id.strip().lower()

        if e_type in ("mob", "mobs"):
            mob = self.session.scalar(select(Mob).where(func.lower(Mob.id) == e_id))
            if mob:
                return True, mob.name, mob.version_added
        elif e_type in ("biome", "biomes"):
            biome = self.session.scalar(
                select(Biome).where(
                    or_(
                        func.lower(Biome.id) == e_id,
                        func.lower(Biome.id) == f"minecraft:{e_id}",
                    )
                )
            )
            if biome:
                return True, biome.name, biome.version_added
        elif e_type in ("item", "items"):
            item = self.session.scalar(
                select(Item).where(
                    or_(
                        func.lower(Item.id) == e_id,
                        func.lower(Item.id) == f"minecraft:{e_id}",
                    )
                )
            )
            if item:
                return True, item.name, item.version_added
        elif e_type in ("structure", "structures"):
            struct = self.session.scalar(
                select(Structure).where(
                    or_(
                        func.lower(Structure.id) == e_id,
                        func.lower(Structure.id) == e_id.replace("_", "-"),
                        func.lower(Structure.id) == e_id.replace("-", "_"),
                    )
                )
            )
            if struct:
                return True, struct.name, struct.version_added
        elif e_type in ("enchantment", "enchantments"):
            ench = self.session.scalar(select(Enchantment).where(func.lower(Enchantment.id) == e_id))
            if ench:
                return True, ench.name, ench.version_added
        elif e_type in ("achievement", "achievements"):
            ach = self.session.scalar(
                select(Achievement).where(
                    or_(
                        func.lower(Achievement.id) == e_id,
                        func.lower(Achievement.slug) == e_id,
                    )
                )
            )
            if ach:
                return True, ach.name, ach.version_added
        elif e_type in ("command", "commands"):
            cmd_name = e_id.lstrip("/")
            cmd = self.session.scalar(select(Command).where(func.lower(Command.name) == cmd_name))
            if cmd:
                return True, f"/{cmd.name}", cmd.version_added
        elif e_type in ("version", "versions"):
            slug_clean = e_id.replace(".", "-")
            ver = self.session.scalar(
                select(Version).where(
                    or_(
                        func.lower(Version.slug) == slug_clean,
                        func.lower(Version.slug) == e_id,
                        func.lower(Version.name) == e_id,
                    )
                )
            )
            if ver:
                return True, f"Minecraft {ver.name}", ver.name
        elif e_type in ("villager_profession", "profession", "professions"):
            prof = self.session.scalar(select(VillagerProfession).where(func.lower(VillagerProfession.id) == e_id))
            if prof:
                return True, prof.name, None
        elif e_type in ("trade", "trades"):
            trade = self.session.scalar(
                select(Trade).where(
                    or_(
                        func.lower(Trade.trade_id) == e_id,
                        Trade.id == int(e_id) if e_id.isdigit() else False,
                    )
                )
            )
            if trade:
                return True, f"Trade: {trade.gives_item} -> {trade.receives_item}", None
        elif e_type in ("dimension", "dimensions"):
            dim = self.session.scalar(select(Dimension).where(func.lower(Dimension.id) == e_id))
            if dim:
                return True, dim.name, None
            if e_id in ("overworld", "nether", "the_end"):
                return True, e_id.replace("_", " ").title(), None
        elif e_type in ("farm", "farms"):
            farm = self.session.scalar(
                select(Farm).where(
                    or_(
                        func.lower(Farm.id) == e_id,
                        func.lower(Farm.id) == e_id.replace("_", "-"),
                        func.lower(Farm.id) == e_id.replace("-", "_"),
                    )
                )
            )
            if farm:
                return True, farm.name, farm.game_version
        elif e_type in ("mechanic", "mechanics"):
            mech = self.session.scalar(
                select(Mechanic).where(
                    or_(
                        func.lower(Mechanic.id) == e_id,
                        func.lower(Mechanic.id) == e_id.replace("_", "-"),
                        func.lower(Mechanic.id) == e_id.replace("-", "_"),
                    )
                )
            )
            if mech:
                return True, mech.name, mech.game_version

        return False, e_id, None

    def _batch_resolve_nodes(self, node_keys: set[tuple[str, str]]) -> dict[tuple[str, str], GraphNode]:
        """Batch-resolve display titles and metadata for all unique graph nodes."""
        nodes: dict[tuple[str, str], GraphNode] = {}
        by_type: dict[str, set[str]] = {}

        for n_type, n_id in node_keys:
            by_type.setdefault(n_type.lower(), set()).add(n_id.lower())

        # Resolve Mobs
        if "mob" in by_type:
            for m in self.session.scalars(select(Mob).where(func.lower(Mob.id).in_(by_type["mob"]))):
                nodes[("mob", m.id)] = GraphNode(
                    entity_type="mob",
                    id=m.id,
                    name=m.name,
                    source_type=m.source_type,
                    edition=m.edition,
                    game_version=m.version_added,
                )

        # Resolve Biomes
        if "biome" in by_type:
            for b in self.session.scalars(select(Biome).where(func.lower(Biome.id).in_(by_type["biome"]))):
                nodes[("biome", b.id)] = GraphNode(
                    entity_type="biome",
                    id=b.id,
                    name=b.name,
                    source_type=b.source_type,
                    edition=b.edition,
                    game_version=b.version_added,
                )

        # Resolve Items
        if "item" in by_type:
            for i in self.session.scalars(select(Item).where(func.lower(Item.id).in_(by_type["item"]))):
                nodes[("item", i.id)] = GraphNode(
                    entity_type="item",
                    id=i.id,
                    name=i.name,
                    source_type=i.source_type,
                    edition=i.edition,
                    game_version=i.version_added,
                )

        # Resolve Structures
        if "structure" in by_type:
            for s in self.session.scalars(select(Structure).where(func.lower(Structure.id).in_(by_type["structure"]))):
                nodes[("structure", s.id)] = GraphNode(
                    entity_type="structure",
                    id=s.id,
                    name=s.name,
                    source_type=s.source_type,
                    edition=s.edition,
                    game_version=s.version_added,
                )

        # Resolve Enchantments
        if "enchantment" in by_type:
            for e in self.session.scalars(select(Enchantment).where(func.lower(Enchantment.id).in_(by_type["enchantment"]))):
                nodes[("enchantment", e.id)] = GraphNode(
                    entity_type="enchantment",
                    id=e.id,
                    name=e.name,
                    source_type=e.source_type,
                    edition=e.edition,
                    game_version=e.version_added,
                )

        # Resolve Achievements
        if "achievement" in by_type:
            for a in self.session.scalars(select(Achievement).where(func.lower(Achievement.id).in_(by_type["achievement"]))):
                nodes[("achievement", a.id)] = GraphNode(
                    entity_type="achievement",
                    id=a.id,
                    name=a.name,
                    source_type=a.source_type,
                    edition=a.edition,
                    game_version=a.version_added,
                )

        # Resolve Commands
        if "command" in by_type:
            for c in self.session.scalars(select(Command).where(func.lower(Command.name).in_(by_type["command"]))):
                nodes[("command", c.name)] = GraphNode(
                    entity_type="command",
                    id=c.name,
                    name=f"/{c.name}",
                    source_type=c.source_type,
                    edition=c.edition,
                    game_version=c.version_added,
                )

        # Resolve Versions
        if "version" in by_type:
            for v in self.session.scalars(select(Version).where(func.lower(Version.slug).in_(by_type["version"]))):
                nodes[("version", v.slug)] = GraphNode(
                    entity_type="version",
                    id=v.slug,
                    name=f"Minecraft {v.name}",
                    source_type=v.source_type,
                    edition=v.edition,
                    game_version=v.name,
                )

        # Resolve Villager Professions
        if "villager_profession" in by_type:
            for p in self.session.scalars(select(VillagerProfession).where(func.lower(VillagerProfession.id).in_(by_type["villager_profession"]))):
                nodes[("villager_profession", p.id)] = GraphNode(
                    entity_type="villager_profession",
                    id=p.id,
                    name=p.name,
                    source_type=p.source_type,
                    edition=p.edition,
                    game_version=None,
                )

        # Resolve Trades
        if "trade" in by_type:
            for t in self.session.scalars(select(Trade).where(func.lower(Trade.trade_id).in_(by_type["trade"]))):
                nodes[("trade", t.trade_id)] = GraphNode(
                    entity_type="trade",
                    id=t.trade_id,
                    name=f"Tier {t.level} Trade ({t.gives_item} -> {t.receives_item})",
                    source_type=t.source_type,
                    edition=t.edition,
                    game_version=None,
                )

        # Resolve Farms
        if "farm" in by_type:
            for f in self.session.scalars(select(Farm).where(func.lower(Farm.id).in_(by_type["farm"]))):
                nodes[("farm", f.id)] = GraphNode(
                    entity_type="farm",
                    id=f.id,
                    name=f.name,
                    source_type=f.source_type,
                    edition=f.edition,
                    game_version=f.game_version,
                )

        # Resolve Mechanics
        if "mechanic" in by_type:
            for m in self.session.scalars(select(Mechanic).where(func.lower(Mechanic.id).in_(by_type["mechanic"]))):
                nodes[("mechanic", m.id)] = GraphNode(
                    entity_type="mechanic",
                    id=m.id,
                    name=m.name,
                    source_type=m.source_type,
                    edition=m.edition,
                    game_version=m.game_version,
                )

        # Fallback for dimensions or unresolved nodes
        for n_type, n_id in node_keys:
            key = (n_type, n_id)
            if key not in nodes:
                title = n_id.replace("_", " ").title()
                nodes[key] = GraphNode(
                    entity_type=n_type,
                    id=n_id,
                    name=title,
                    source_type="astroworld_api",
                    edition="java",
                    game_version=None,
                )

        return nodes

    def _generate_explanation(
        self,
        rel_type: str,
        source_name: str,
        target_name: str,
        meta: dict[str, Any] | None,
    ) -> str:
        """Construct a deterministic human-readable explanation template."""
        verb = rel_type.upper()

        if verb == "SPAWNS_IN":
            return f"{source_name} naturally spawns in {target_name}."
        if verb == "DROPS":
            chance_str = ""
            if meta and "chance" in meta:
                prob = meta["chance"].get("normalized_probability")
                if prob is not None:
                    chance_str = f" with a {round(prob * 100, 1)}% chance"
            count_str = ""
            if meta and "count" in meta and meta["count"] is not None:
                count_str = f" (quantity: {meta['count']})"
            return f"{source_name} drops {target_name}{chance_str}{count_str}."
        if verb == "BREEDS_WITH":
            return f"{source_name} can be bred using {target_name}."
        if verb == "TAMED_WITH":
            return f"{source_name} can be tamed using {target_name}."
        if verb == "FOUND_IN":
            return f"{source_name} naturally generates in {target_name}."
        if verb == "LOCATED_IN":
            return f"{source_name} generates in the {target_name} dimension."
        if verb == "CONTAINS_LOOT":
            chance_str = ""
            if meta and "chance" in meta:
                prob = meta["chance"].get("normalized_probability")
                if prob is not None:
                    chance_str = f" ({round(prob * 100, 1)}% probability)"
            return f"{source_name} chest loot can contain {target_name}{chance_str}."
        if verb == "TRADED_BY":
            level_str = f"tier {meta.get('level', '')}" if meta and "level" in meta else "trades"
            return f"{source_name} is offered by {target_name} ({level_str})."
        if verb == "UNLOCKS":
            return f"{source_name} unlocks advancement {target_name}."
        if verb == "ADDED_IN":
            return f"{source_name} was introduced in Minecraft Java Edition {target_name}."
        if verb == "REQUIRES":
            return f"{source_name} requires {target_name} to operate effectively."
        if verb == "PRODUCES":
            return f"{source_name} produces {target_name} as primary output."
        if verb == "USED_FOR":
            return f"{source_name} is utilized for {target_name}."

        return f"{source_name} is connected to {target_name} via {rel_type}."

    def get_neighbors(
        self,
        entity_type: str,
        entity_id: str,
        depth: int = 1,
        relationship_types: list[str] | None = None,
        limit: int = 50,
        max_limit: int = 100,
    ) -> GraphNeighborsResponse:
        """Traverse graph neighborhood up to depth 2."""
        # 1. Depth validation
        if depth not in (1, 2):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "invalid_depth",
                    "message": f"Traversal depth must be 1 or 2 (requested {depth}).",
                },
            )

        safe_limit = min(max_limit, max(1, limit))
        clean_type = entity_type.strip().lower()
        clean_id = entity_id.strip().lower()

        # 2. Verify root entity exists
        exists, root_name, root_version = self._resolve_root_name(clean_type, clean_id)
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "entity_not_found",
                    "message": f"Root entity of type '{entity_type}' with ID '{entity_id}' was not found in the local MineAtlas cache.",
                },
            )

        if clean_type in ("structure", "structures"):
            clean_type = "structure"
            struct = self.session.scalar(
                select(Structure).where(
                    or_(
                        func.lower(Structure.id) == clean_id,
                        func.lower(Structure.id) == clean_id.replace("_", "-"),
                    )
                )
            )
            if struct:
                clean_id = struct.id.lower()
        elif clean_type in ("farm", "farms"):
            clean_type = "farm"
            farm_obj = self.session.scalar(
                select(Farm).where(
                    or_(
                        func.lower(Farm.id) == clean_id,
                        func.lower(Farm.id) == clean_id.replace("_", "-"),
                        func.lower(Farm.id) == clean_id.replace("-", "_"),
                    )
                )
            )
            if farm_obj:
                clean_id = farm_obj.id.lower()
        elif clean_type in ("mechanic", "mechanics"):
            clean_type = "mechanic"
            mech_obj = self.session.scalar(
                select(Mechanic).where(
                    or_(
                        func.lower(Mechanic.id) == clean_id,
                        func.lower(Mechanic.id) == clean_id.replace("_", "-"),
                        func.lower(Mechanic.id) == clean_id.replace("-", "_"),
                    )
                )
            )
            if mech_obj:
                clean_id = mech_obj.id.lower()

        # Canonicalize root node
        root_info = GraphRoot(
            entity_type=clean_type,
            entity_id=clean_id,
            name=root_name,
        )

        # Filter by relationship types if specified
        rel_filter = [r.strip().upper() for r in relationship_types if r.strip()] if relationship_types else []

        collected_edges: list[RelationEdge] = []
        edge_ids: set[int] = set()
        node_keys: set[tuple[str, str]] = {(clean_type, clean_id)}
        truncated = False

        # Query Depth 1 edges
        stmt_d1 = select(RelationEdge).where(
            or_(
                (RelationEdge.source_entity_type == clean_type) & (func.lower(RelationEdge.source_entity_id) == clean_id),
                (RelationEdge.target_entity_type == clean_type) & (func.lower(RelationEdge.target_entity_id) == clean_id),
            )
        )
        if rel_filter:
            stmt_d1 = stmt_d1.where(RelationEdge.relationship_type.in_(rel_filter))

        d1_edges = self.session.scalars(stmt_d1.limit(safe_limit + 1)).all()
        if len(d1_edges) > safe_limit:
            truncated = True
            d1_edges = d1_edges[:safe_limit]

        d1_neighbors: set[tuple[str, str]] = set()
        for e in d1_edges:
            collected_edges.append(e)
            edge_ids.add(e.id)
            node_keys.add((e.source_entity_type, e.source_entity_id))
            node_keys.add((e.target_entity_type, e.target_entity_id))

            if e.source_entity_type == clean_type and e.source_entity_id.lower() == clean_id:
                d1_neighbors.add((e.target_entity_type, e.target_entity_id))
            else:
                d1_neighbors.add((e.source_entity_type, e.source_entity_id))

        # Query Depth 2 edges if requested and capacity allows
        if depth == 2 and not truncated and d1_neighbors:
            remaining_slots = safe_limit - len(collected_edges)
            if remaining_slots > 0:
                or_conditions = []
                for n_type, n_id in d1_neighbors:
                    or_conditions.append(
                        (RelationEdge.source_entity_type == n_type) & (func.lower(RelationEdge.source_entity_id) == n_id.lower())
                    )
                    or_conditions.append(
                        (RelationEdge.target_entity_type == n_type) & (func.lower(RelationEdge.target_entity_id) == n_id.lower())
                    )

                stmt_d2 = select(RelationEdge).where(or_(*or_conditions))
                if rel_filter:
                    stmt_d2 = stmt_d2.where(RelationEdge.relationship_type.in_(rel_filter))

                d2_candidates = self.session.scalars(stmt_d2.limit(remaining_slots + 10)).all()
                for e in d2_candidates:
                    if e.id in edge_ids:
                        continue
                    if len(collected_edges) >= safe_limit:
                        truncated = True
                        break
                    collected_edges.append(e)
                    edge_ids.add(e.id)
                    node_keys.add((e.source_entity_type, e.source_entity_id))
                    node_keys.add((e.target_entity_type, e.target_entity_id))

        # Batch resolve names and metadata for all nodes
        node_map = self._batch_resolve_nodes(node_keys)
        final_nodes = list(node_map.values())

        # Construct GraphEdge list with explanations
        final_edges: list[GraphEdge] = []
        available_rel_types: set[str] = set()

        for e in collected_edges:
            available_rel_types.add(e.relationship_type)
            src_node = node_map.get((e.source_entity_type, e.source_entity_id))
            tgt_node = node_map.get((e.target_entity_type, e.target_entity_id))
            src_name = src_node.name if src_node else e.source_entity_id
            tgt_name = tgt_node.name if tgt_node else e.target_entity_id

            meta_dict = None
            if e.metadata_json:
                try:
                    meta_dict = json.loads(e.metadata_json)
                except Exception:
                    meta_dict = None

            explanation = self._generate_explanation(
                e.relationship_type,
                src_name,
                tgt_name,
                meta_dict,
            )

            final_edges.append(
                GraphEdge(
                    id=e.id,
                    source_entity_type=e.source_entity_type,
                    source_entity_id=e.source_entity_id,
                    relationship_type=e.relationship_type,
                    target_entity_type=e.target_entity_type,
                    target_entity_id=e.target_entity_id,
                    source_type=e.source_type,
                    metadata=meta_dict,
                    explanation=explanation,
                )
            )

        metadata = GraphMetadata(
            depth=depth,
            truncated=truncated,
            available_relationship_types=sorted(list(available_rel_types)),
            total_nodes=len(final_nodes),
            total_edges=len(final_edges),
        )

        return GraphNeighborsResponse(
            root=root_info,
            nodes=final_nodes,
            edges=final_edges,
            metadata=metadata,
        )

