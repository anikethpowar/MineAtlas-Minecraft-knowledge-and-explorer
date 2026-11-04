"""Unit tests for the Astroworld Ingestion and Caching Service."""

import json
from pathlib import Path
from typing import Any
import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.clients.astroworld_client import AstroworldClient
from app.db.base import Base
from app.db.models import (
    Biome,
    Item,
    Mob,
    RelationEdge,
    SyncRun,
)
from app.db.session import create_app_engine
from app.services.ingestion_service import IngestionService
from app.services.rate_limiter import RateLimiter


@pytest.fixture
def temp_db(tmp_path: Path):
    """Fixture providing an isolated temporary database with schema initialized."""
    db_file = tmp_path / "test_ingest.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_app_engine(db_url)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        yield session

    engine.dispose()


def get_mock_collection_data(path: str) -> dict[str, Any]:
    """Return synthetic mock data for each collection endpoint."""
    if path == "/api/v1/mobs":
        return {
            "success": True,
            "count": 2,
            "data": [
                {
                    "id": "cow",
                    "name": "Cow",
                    "type": "passive",
                    "hp": 10,
                    "spawnBiomes": ["Plains"],
                    "drops": [{"item": "Leather", "chance": 100, "count": {"min": 1, "max": 2}}],
                    "breedingItem": ["Wheat"],
                    "versionAdded": "1.0",
                },
                {
                    "id": "creeper",
                    "name": "Creeper",
                    "type": "hostile",
                    "hp": 20,
                    "versionAdded": "1.0",
                },
            ],
        }
    if path == "/api/v1/biomes":
        return {
            "success": True,
            "count": 1,
            "data": [
                {
                    "id": "minecraft:plains",
                    "name": "Plains",
                    "dimension": "overworld",
                    "category": "temperate",
                    "temperature": 0.8,
                    "versionAdded": "1.0",
                }
            ],
        }
    if path == "/api/v1/items":
        return {
            "success": True,
            "count": 2,
            "data": [
                {
                    "id": "leather",
                    "name": "Leather",
                    "category": "resource",
                    "stackSize": 64,
                    "versionAdded": "1.0",
                },
                {
                    "id": "wheat",
                    "name": "Wheat",
                    "category": "food",
                    "stackSize": 64,
                    "versionAdded": "1.0",
                },
            ],
        }
    if path == "/api/v1/enchantments":
        return {
            "success": True,
            "count": 1,
            "data": [
                {
                    "id": "sharpness",
                    "name": "Sharpness",
                    "category": "weapons",
                    "maxLevel": 5,
                    "versionAdded": "1.0",
                }
            ],
        }
    if path == "/api/v1/structures":
        return {
            "success": True,
            "count": 1,
            "data": [
                {
                    "id": "village",
                    "name": "Village",
                    "dimension": "overworld",
                    "biomes": ["Plains"],
                    "loot": [{"item": "Leather", "chance": 0.5}],
                    "versionAdded": "1.0",
                }
            ],
        }
    if path == "/api/v1/commands":
        return {
            "success": True,
            "count": 1,
            "data": [
                {
                    "name": "give",
                    "syntax": "/give <targets> <item>",
                    "permissionLevel": 2,
                    "versionAdded": "1.0",
                }
            ],
        }
    if path == "/api/v1/versions":
        return {
            "success": True,
            "count": 1,
            "data": [
                {
                    "slug": "1-0",
                    "name": "1.0",
                    "edition": "java",
                }
            ],
        }
    if path == "/api/v1/achievements":
        return {
            "success": True,
            "count": 1,
            "data": [
                {
                    "id": "minecraft:story/root",
                    "slug": "root",
                    "name": "Minecraft",
                    "tab": "minecraft",
                    "versionAdded": "1.0",
                }
            ],
        }
    if path == "/api/v1/trades":
        return {
            "success": True,
            "count": 1,
            "data": [
                {
                    "id": "armorer",
                    "name": "Armorer",
                    "workstation": "Blast Furnace",
                    "levels": [
                        {
                            "level": 1,
                            "name": "Novice",
                            "trades": [
                                {
                                    "gives": "Coal",
                                    "givesAmount": 15,
                                    "receives": "Emerald",
                                    "receivesAmount": 1,
                                }
                            ],
                        }
                    ],
                }
            ],
        }
    return {"success": True, "count": 0, "data": []}


def create_test_client(handler) -> AstroworldClient:
    """Helper to create AstroworldClient with mock transport and fast rate limiter."""
    transport = httpx.MockTransport(handler)
    http_client = httpx.Client(transport=transport, base_url="https://api.astroworldmc.com")
    fast_limiter = RateLimiter(
        capacity=100.0,
        refill_rate=100.0,
        initial_tokens=100.0,
        sleep_func=lambda s: None,
    )
    return AstroworldClient(client=http_client, rate_limiter=fast_limiter)


def test_ingestion_service_full_successful_sync(temp_db: Session):
    """Verify that a full sync ingests all 9 endpoints and derives relationships."""
    session = temp_db

    def handler(request: httpx.Request) -> httpx.Response:
        data = get_mock_collection_data(request.url.path)
        return httpx.Response(200, json=data)

    client = create_test_client(handler)
    service = IngestionService(
        session=session,
        client=client,
        sleep_func=lambda s: None,
    )

    sync_run = service.run_sync(trigger_type="manual")

    assert sync_run.status == "success"
    assert sync_run.endpoints_synced == 9
    assert sync_run.records_ingested > 0
    assert sync_run.completed_at is not None

    # Verify records exist in database
    mobs = session.scalars(select(Mob)).all()
    assert len(mobs) == 2
    cow = session.scalar(select(Mob).where(Mob.id == "cow"))
    assert cow is not None
    assert cow.hp == 10.0
    assert cow.source_type == "astroworld_api"

    biomes = session.scalars(select(Biome)).all()
    assert len(biomes) == 1
    assert biomes[0].id == "minecraft:plains"

    # Verify relation edges were derived
    edges = session.scalars(select(RelationEdge)).all()
    assert len(edges) > 0

    # Mob -> SPAWNS_IN -> Biome
    spawn_edge = session.scalar(
        select(RelationEdge).where(
            RelationEdge.source_entity_id == "cow",
            RelationEdge.relationship_type == "SPAWNS_IN",
        )
    )
    assert spawn_edge is not None
    assert spawn_edge.target_entity_id == "minecraft:plains"


def test_ingestion_service_idempotency_and_updates(temp_db: Session):
    """Verify that repeating a sync updates modified values without duplicating rows."""
    session = temp_db
    dynamic_hp = [10.0]

    def handler(request: httpx.Request) -> httpx.Response:
        data = get_mock_collection_data(request.url.path)
        if request.url.path == "/api/v1/mobs":
            data["data"][0]["hp"] = dynamic_hp[0]
        return httpx.Response(200, json=data)

    client = create_test_client(handler)
    service = IngestionService(session=session, client=client, sleep_func=lambda s: None)

    # Pass 1: Initial sync
    run1 = service.run_sync()
    assert run1.status == "success"
    cow1 = session.scalar(select(Mob).where(Mob.id == "cow"))
    assert cow1.hp == 10.0
    initial_mob_count = len(session.scalars(select(Mob)).all())
    initial_edge_count = len(session.scalars(select(RelationEdge)).all())

    # Pass 2: Repeat sync with changed HP
    dynamic_hp[0] = 50.0
    run2 = service.run_sync()
    assert run2.status == "success"

    # Verify no duplicate mob or edge rows were created
    current_mobs = session.scalars(select(Mob)).all()
    current_edges = session.scalars(select(RelationEdge)).all()
    assert len(current_mobs) == initial_mob_count
    assert len(current_edges) == initial_edge_count

    # Verify updated attribute was persisted
    cow2 = session.scalar(select(Mob).where(Mob.id == "cow"))
    assert cow2.hp == 50.0


def test_ingestion_service_handles_partial_failure(temp_db: Session):
    """Verify that if one endpoint fails, remaining endpoints persist as partial_failure."""
    session = temp_db

    def handler(request: httpx.Request) -> httpx.Response:
        # Simulate structures endpoint failing with 500
        if request.url.path == "/api/v1/structures":
            return httpx.Response(500, text="Internal Server Error")
        return httpx.Response(200, json=get_mock_collection_data(request.url.path))

    client = create_test_client(handler)
    service = IngestionService(
        session=session,
        client=client,
        max_retries=1,
        sleep_func=lambda s: None,
    )

    sync_run = service.run_sync()

    assert sync_run.status == "partial_failure"
    assert sync_run.endpoints_synced == 8
    assert "structures" in (sync_run.error_message or "")

    # Mobs and biomes must still be persisted
    mobs = session.scalars(select(Mob)).all()
    assert len(mobs) == 2


def test_ingestion_service_retries_on_429(temp_db: Session):
    """Verify 429 rate limit triggers Retry-After backoff and logs retry attempts."""
    session = temp_db
    mob_call_count = [0]
    sleeps_called: list[float] = []

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/mobs":
            mob_call_count[0] += 1
            if mob_call_count[0] == 1:
                return httpx.Response(429, headers={"Retry-After": "2"}, text="Too Many Requests")
        return httpx.Response(200, json=get_mock_collection_data(request.url.path))

    client = create_test_client(handler)
    service = IngestionService(
        session=session,
        client=client,
        max_retries=2,
        sleep_func=lambda s: sleeps_called.append(s),
    )

    sync_run = service.run_sync()

    assert sync_run.status == "success"
    assert mob_call_count[0] == 2  # 1 failure + 1 retry success
    assert 2.0 in sleeps_called

    # Verify summary JSON tracks retry log
    summary = json.loads(sync_run.summary_json)
    mob_report = next(r for r in summary["endpoint_reports"] if r["resource"] == "mobs")
    assert mob_report["status"] == "success"
    assert len(mob_report["retries"]) == 1
    assert mob_report["retries"][0]["retry_after"] == 2

