"""Unit tests for the MineAtlas database schema, models, and migrations."""

from datetime import datetime, timezone
from pathlib import Path
from alembic import command
from alembic.config import Config
import pytest
from sqlalchemy import inspect, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Base
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
    SyncRun,
    Trade,
    Version,
    VillagerProfession,
    WorldType,
)
from app.db.session import create_app_engine


EXPECTED_TABLES = {
    "achievements",
    "biomes",
    "commands",
    "dimensions",
    "enchantments",
    "farms",
    "items",
    "mechanics",
    "mobs",
    "relation_edges",
    "structures",
    "sync_runs",
    "trades",
    "versions",
    "villager_professions",
    "world_types",
}


@pytest.fixture
def temp_db(tmp_path: Path):
    """Fixture providing a brand-new temporary SQLite database engine and session."""
    db_file = tmp_path / "test_mineatlas.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_app_engine(db_url)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        yield session, engine

    engine.dispose()


def test_alembic_migration_on_fresh_database(tmp_path: Path):
    """Verify that Alembic migrations run cleanly against a fresh SQLite database."""
    temp_db_file = tmp_path / "fresh_migrated.db"
    temp_db_url = f"sqlite:///{temp_db_file}"

    # Configure Alembic to target the temporary database
    backend_dir = Path(__file__).resolve().parent.parent
    alembic_ini_path = backend_dir / "alembic.ini"
    alembic_cfg = Config(str(alembic_ini_path))
    alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    alembic_cfg.set_main_option("sqlalchemy.url", temp_db_url)

    # Run Alembic upgrade head
    command.upgrade(alembic_cfg, "head")

    # Inspect created tables in the fresh database
    temp_engine = create_app_engine(temp_db_url)
    inspector = inspect(temp_engine)
    created_tables = set(inspector.get_table_names())
    temp_engine.dispose()

    # All 16 application tables must exist
    missing_tables = EXPECTED_TABLES - created_tables
    assert not missing_tables, f"Missing tables after migration: {missing_tables}"
    assert "alembic_version" in created_tables


def test_model_initialization_and_provenance(temp_db):
    """Verify that core entities initialize, persist provenance, and set timestamps."""
    session, _ = temp_db

    # 1. API-derived mob record
    creeper = Mob(
        id="creeper",
        name="Creeper",
        mob_type="hostile",
        category="monster",
        hp=20.0,
        damage_normal=49.0,
        xp_min=5,
        xp_max=5,
        spawn_conditions="Light level 0 on solid blocks",
        source_type="astroworld_api",
        source_url="https://api.astroworldmc.com/api/v1/mobs",
        edition="java",
        game_version="1.21",
        last_verified_at=datetime.now(timezone.utc),
        coverage_note="Verified against Astroworld audit snapshot",
        raw_payload='{"id": "creeper", "name": "Creeper"}',
    )
    session.add(creeper)

    # 2. Curated farm guide
    iron_farm = Farm(
        id="iron-farm-simple",
        name="Compact 3-Villager Iron Farm",
        category="iron",
        difficulty="beginner",
        estimated_output_per_hour="320-360 Iron Ingots/hour",
        summary="Standard panic-spawning cell with 3 villagers and 1 zombie.",
        source_type="curated",
        edition="java",
        game_version="1.21",
        coverage_note="Verified Java 1.21 village mechanics",
    )
    session.add(iron_farm)

    session.commit()

    # Query back mob
    saved_mob = session.scalar(select(Mob).where(Mob.id == "creeper"))
    assert saved_mob is not None
    assert saved_mob.name == "Creeper"
    assert saved_mob.hp == 20.0
    assert saved_mob.source_type == "astroworld_api"
    assert saved_mob.edition == "java"
    assert saved_mob.created_at is not None
    assert saved_mob.raw_payload == '{"id": "creeper", "name": "Creeper"}'

    # Query back curated farm
    saved_farm = session.scalar(select(Farm).where(Farm.id == "iron-farm-simple"))
    assert saved_farm is not None
    assert saved_farm.source_type == "curated"
    assert saved_farm.category == "iron"
    assert "3-Villager" in saved_farm.name


def test_unique_constraint_rejects_duplicate_natural_keys(temp_db):
    """Verify that stable natural key collisions raise IntegrityError."""
    session, _ = temp_db

    diamond1 = Item(
        id="diamond",
        name="Diamond",
        category="resource",
        stack_size=64,
        source_type="astroworld_api",
    )
    session.add(diamond1)
    session.commit()

    # Expunge to test database-level primary key / unique constraint enforcement
    session.expunge_all()

    diamond2 = Item(
        id="diamond",
        name="Diamond Duplicate",
        category="resource",
        stack_size=64,
        source_type="astroworld_api",
    )
    session.add(diamond2)

    with pytest.raises(IntegrityError):
        session.commit()

    session.rollback()


def test_relation_edge_polymorphic_graph_storage(temp_db):
    """Verify RelationEdge connects disparate entities and prevents duplicates."""
    session, _ = temp_db

    edge1 = RelationEdge(
        source_entity_type="mob",
        source_entity_id="zombie",
        relationship_type="DROPS",
        target_entity_type="item",
        target_entity_id="rotten_flesh",
        metadata_json='{"chance": 0.8, "min": 0, "max": 2}',
        source_type="astroworld_api",
    )
    edge2 = RelationEdge(
        source_entity_type="structure",
        source_entity_id="village",
        relationship_type="FOUND_IN",
        target_entity_type="biome",
        target_entity_id="minecraft:plains",
        source_type="astroworld_api",
    )
    session.add_all([edge1, edge2])
    session.commit()

    # Query outbound edges from zombie
    zombie_edges = session.scalars(
        select(RelationEdge).where(
            RelationEdge.source_entity_type == "mob",
            RelationEdge.source_entity_id == "zombie",
        )
    ).all()
    assert len(zombie_edges) == 1
    assert zombie_edges[0].target_entity_id == "rotten_flesh"
    assert zombie_edges[0].relationship_type == "DROPS"

    # Query inbound edges to plains biome
    plains_edges = session.scalars(
        select(RelationEdge).where(
            RelationEdge.target_entity_type == "biome",
            RelationEdge.target_entity_id == "minecraft:plains",
        )
    ).all()
    assert len(plains_edges) == 1
    assert plains_edges[0].source_entity_id == "village"

    # Verify duplicate edge constraint
    duplicate_edge = RelationEdge(
        source_entity_type="mob",
        source_entity_id="zombie",
        relationship_type="DROPS",
        target_entity_type="item",
        target_entity_id="rotten_flesh",
    )
    session.add(duplicate_edge)
    with pytest.raises(IntegrityError):
        session.commit()

    session.rollback()


def test_sqlite_foreign_key_enforcement_on_trades(temp_db):
    """Verify SQLite foreign key enforcement on Trade -> VillagerProfession."""
    session, _ = temp_db

    # 1. Attempting to insert a Trade referencing an invalid profession must fail
    orphan_trade = Trade(
        trade_id="unknown-novice-1",
        profession_id="nonexistent_profession",
        level=1,
        gives_item="Coal",
        gives_amount=15,
        receives_item="Emerald",
        receives_amount=1,
        source_type="astroworld_api",
    )
    session.add(orphan_trade)

    with pytest.raises(IntegrityError):
        session.commit()

    session.rollback()

    # 2. Inserting with valid profession succeeds
    armorer = VillagerProfession(
        id="armorer",
        name="Armorer",
        workstation="Blast Furnace",
        description="Armorer trades armor pieces for coal/iron.",
        source_type="astroworld_api",
    )
    session.add(armorer)
    session.commit()

    valid_trade = Trade(
        trade_id="armorer-1-coal-emerald",
        profession_id="armorer",
        level=1,
        level_name="Novice",
        gives_item="Coal",
        gives_amount=15,
        receives_item="Emerald",
        receives_amount=1,
        source_type="astroworld_api",
    )
    session.add(valid_trade)
    session.commit()

    # Verify relationship traversal
    loaded_armorer = session.scalar(
        select(VillagerProfession).where(VillagerProfession.id == "armorer")
    )
    assert loaded_armorer is not None
    assert len(loaded_armorer.trades) == 1
    assert loaded_armorer.trades[0].gives_item == "Coal"


def test_sync_run_operational_model(temp_db):
    """Verify SyncRun records operational metadata for future sync passes."""
    session, _ = temp_db

    run = SyncRun(
        status="success",
        trigger_type="manual",
        endpoints_synced=9,
        records_ingested=521,
        summary_json='{"mobs": 76, "biomes": 64, "items": 100}',
    )
    session.add(run)
    session.commit()

    loaded_run = session.scalar(select(SyncRun).where(SyncRun.id == run.id))
    assert loaded_run is not None
    assert loaded_run.status == "success"
    assert loaded_run.records_ingested == 521
    assert loaded_run.started_at is not None
