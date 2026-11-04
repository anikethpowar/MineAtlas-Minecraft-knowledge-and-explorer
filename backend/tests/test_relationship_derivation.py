"""Unit tests for knowledge graph relationship derivation."""

import json
from pathlib import Path
import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Achievement,
    Biome,
    Item,
    Mob,
    RelationEdge,
    Structure,
    Trade,
    Version,
    VillagerProfession,
)
from app.db.session import create_app_engine
from app.services.relationship_derivation import RelationshipDerivationService


@pytest.fixture
def temp_db(tmp_path: Path):
    """Fixture providing an isolated temporary database with schema initialized."""
    db_file = tmp_path / "test_deriv.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_app_engine(db_url)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        yield session

    engine.dispose()


def test_derive_relationships_and_idempotency(temp_db: Session):
    """Verify semantic edge extraction, unresolvable entity skipping, and idempotency."""
    session = temp_db

    # Seed base entities
    plains = Biome(
        id="minecraft:plains",
        name="Plains",
        dimension="overworld",
        source_type="astroworld_api",
    )
    leather = Item(
        id="leather",
        name="Leather",
        category="resource",
        source_type="astroworld_api",
    )
    wheat = Item(
        id="wheat",
        name="Wheat",
        category="food",
        source_type="astroworld_api",
    )
    bread = Item(
        id="bread",
        name="Bread",
        category="food",
        source_type="astroworld_api",
    )
    v121 = Version(
        slug="1-21",
        name="1.21",
        edition="java",
        source_type="astroworld_api",
    )
    armorer = VillagerProfession(
        id="armorer",
        name="Armorer",
        workstation="Blast Furnace",
        source_type="astroworld_api",
    )
    armorer_trade = Trade(
        trade_id="armorer-l1-coal-emerald-1",
        profession_id="armorer",
        level=1,
        gives_item="Coal",
        gives_amount=15,
        receives_item="Emerald",
        receives_amount=1,
        source_type="astroworld_api",
    )
    root_ach = Achievement(
        id="minecraft:story/root",
        slug="story_root",
        name="Minecraft",
        source_type="astroworld_api",
    )
    child_ach = Achievement(
        id="minecraft:story/mine_stone",
        slug="stone_age",
        name="Stone Age",
        parent_id="minecraft:story/root",
        source_type="astroworld_api",
    )

    # Seed entities with raw payloads referencing items/biomes
    cow = Mob(
        id="cow",
        name="Cow",
        mob_type="passive",
        version_added="1.21",
        source_type="astroworld_api",
        raw_payload=json.dumps({
            "spawnBiomes": ["Plains", "Desert_Unknown_Biome"],  # One valid, one unresolvable
            "drops": [
                {"item": "Leather", "count": {"min": 1, "max": 2}, "chance": 100},
                {"item": "Raw Beef", "chance": 100},  # Raw Beef not in items table
            ],
            "breedingItem": ["Wheat"],
        }),
    )

    village = Structure(
        id="village",
        name="Village",
        dimension="overworld",
        source_type="astroworld_api",
        raw_payload=json.dumps({
            "biomes": ["Plains"],
            "loot": [{"item": "Bread", "chance": 0.62, "count": {"min": 1, "max": 4}}],
            "uniqueLoot": ["Unobtainable_Bell_Template"],  # Not in items table
        }),
    )

    session.add_all([
        plains, leather, wheat, bread, v121, armorer, armorer_trade,
        root_ach, child_ach, cow, village,
    ])
    session.commit()

    service = RelationshipDerivationService(session)
    res = service.derive_all_relationships()

    assert res["derived_edges_created"] > 0
    total_edges_first_pass = res["total_edges"]

    # 1. Verify Mob -> SPAWNS_IN -> Biome
    spawn_edge = session.scalar(
        select(RelationEdge).where(
            RelationEdge.source_entity_id == "cow",
            RelationEdge.relationship_type == "SPAWNS_IN",
        )
    )
    assert spawn_edge is not None
    assert spawn_edge.target_entity_id == "minecraft:plains"

    # 2. Verify Mob -> DROPS -> Item with probability
    drop_edge = session.scalar(
        select(RelationEdge).where(
            RelationEdge.source_entity_id == "cow",
            RelationEdge.relationship_type == "DROPS",
        )
    )
    assert drop_edge is not None
    assert drop_edge.target_entity_id == "leather"
    assert drop_edge.metadata_json is not None
    meta = json.loads(drop_edge.metadata_json)
    assert meta["chance"]["normalized_probability"] == 1.0

    # 3. Verify Mob -> BREEDS_WITH -> Item
    breed_edge = session.scalar(
        select(RelationEdge).where(
            RelationEdge.source_entity_id == "cow",
            RelationEdge.relationship_type == "BREEDS_WITH",
        )
    )
    assert breed_edge is not None
    assert breed_edge.target_entity_id == "wheat"

    # 4. Verify Structure -> FOUND_IN -> Biome
    struct_biome = session.scalar(
        select(RelationEdge).where(
            RelationEdge.source_entity_id == "village",
            RelationEdge.relationship_type == "FOUND_IN",
        )
    )
    assert struct_biome is not None
    assert struct_biome.target_entity_id == "minecraft:plains"

    # 5. Verify Structure -> CONTAINS_LOOT -> Item with fraction probability
    loot_edge = session.scalar(
        select(RelationEdge).where(
            RelationEdge.source_entity_id == "village",
            RelationEdge.relationship_type == "CONTAINS_LOOT",
        )
    )
    assert loot_edge is not None
    assert loot_edge.target_entity_id == "bread"
    loot_meta = json.loads(loot_edge.metadata_json)
    assert loot_meta["chance"]["normalized_probability"] == 0.62

    # 6. Verify Achievement parent unlocks child
    ach_edge = session.scalar(
        select(RelationEdge).where(
            RelationEdge.source_entity_id == "minecraft:story/root",
            RelationEdge.relationship_type == "UNLOCKS",
        )
    )
    assert ach_edge is not None
    assert ach_edge.target_entity_id == "minecraft:story/mine_stone"

    # 7. Verify unresolvable entities were safely skipped without creating fake items
    assert "mob_drop_item:Raw Beef" in res["unresolved_references"]
    assert "structure_unique_loot_item:Unobtainable_Bell_Template" in res["unresolved_references"]
    fake_item = session.scalar(select(Item).where(Item.id == "Raw Beef"))
    assert fake_item is None

    # 8. Test Idempotency: re-running derivation produces 0 new edges
    second_service = RelationshipDerivationService(session)
    second_res = second_service.derive_all_relationships()
    assert second_res["derived_edges_created"] == 0
    assert second_res["total_edges"] == total_edges_first_pass

