"""Tests for Curated Farm Blueprint models, seeder, and API endpoints."""

from pathlib import Path
from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import Farm, Mechanic, Mob, RelationEdge
from app.db.session import create_app_engine, get_db
from app.main import app
from app.scripts.seed_curated_farms import seed_curated_farms


@pytest.fixture
def farm_db(tmp_path: Path) -> Generator[Session, None, None]:
    """Temporary SQLite database populated with base entities and schema."""
    db_file = tmp_path / "test_farms.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_app_engine(db_url)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        # Pre-populate required test mobs
        session.add(Mob(id="zombie", name="Zombie", source_type="astroworld_api", edition="java"))
        session.add(Mob(id="iron_golem", name="Iron Golem", source_type="astroworld_api", edition="java"))
        session.commit()
        yield session

    engine.dispose()


@pytest.fixture
def client(farm_db: Session) -> Generator[TestClient, None, None]:
    """TestClient wired to the test database session."""
    app.dependency_overrides[get_db] = lambda: farm_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_seed_curated_farms_creates_expected_records(farm_db: Session) -> None:
    """1. Curated farm seeding creates exactly the expected farm records."""
    stats = seed_curated_farms(farm_db)
    assert stats["farms_seeded"] == 3
    assert stats["mechanics_seeded"] == 3

    farms = farm_db.scalars(select(Farm).order_by(Farm.id)).all()
    assert len(farms) == 3
    farm_ids = [f.id for f in farms]
    assert farm_ids == ["iron-farm", "raid-farm", "villager-breeder"]


def test_seeder_idempotency_no_duplicates(farm_db: Session) -> None:
    """2. Running the seeder twice does not create duplicates."""
    seed_curated_farms(farm_db)
    count_first = len(farm_db.scalars(select(Farm)).all())
    edges_first = len(farm_db.scalars(select(RelationEdge)).all())

    # Re-run
    seed_curated_farms(farm_db)
    count_second = len(farm_db.scalars(select(Farm)).all())
    edges_second = len(farm_db.scalars(select(RelationEdge)).all())

    assert count_first == 3
    assert count_second == 3
    assert edges_first == edges_second


def test_farm_records_have_curated_provenance(farm_db: Session) -> None:
    """3. Farm records have source_type = curated and edition = java."""
    seed_curated_farms(farm_db)
    farms = farm_db.scalars(select(Farm)).all()

    for f in farms:
        assert f.source_type == "curated"
        assert f.edition == "java"
        assert f.last_verified_at is not None
        assert f.compatibility_label is not None
        assert "Java Edition" in f.compatibility_label


def test_farm_graph_edges_resolution_and_honest_skips(farm_db: Session) -> None:
    """5 & 6. Edges created only when entities exist; unresolved skipped safely."""
    stats = seed_curated_farms(farm_db)

    # In our fixture, 'zombie' and 'iron_golem' exist, as do seeded mechanics
    # Other items/structures do not exist in this memory DB, so those edges should be skipped
    assert stats["edges_skipped"] > 0

    edges = farm_db.scalars(select(RelationEdge)).all()
    for e in edges:
        assert e.source_type == "curated"
        assert e.edition == "java"
        assert e.relationship_type in ("REQUIRES", "PRODUCES")


def test_api_farms_pagination_and_filters(client: TestClient, farm_db: Session) -> None:
    """7. /api/farms supports pagination, search, and supported filters."""
    seed_curated_farms(farm_db)

    # Default listing
    res = client.get("/api/farms")
    assert res.status_code == 200
    data = res.json()
    assert len(data["data"]) == 3
    assert data["pagination"]["total_items"] == 3

    # Difficulty filter: Beginner
    res_diff = client.get("/api/farms?difficulty=Beginner")
    assert res_diff.status_code == 200
    assert len(res_diff.json()["data"]) == 1
    assert res_diff.json()["data"][0]["id"] == "villager-breeder"

    # Search filter: 'iron'
    res_search = client.get("/api/farms?search=iron")
    assert res_search.status_code == 200
    assert len(res_search.json()["data"]) == 1
    assert res_search.json()["data"][0]["id"] == "iron-farm"

    # Dimension filter: 'Overworld'
    res_dim = client.get("/api/farms?dimension=Overworld")
    assert res_dim.status_code == 200
    assert len(res_dim.json()["data"]) == 3


def test_api_farm_detail_structure(client: TestClient, farm_db: Session) -> None:
    """8. /api/farms/{farm_slug} returns detailed structured data."""
    seed_curated_farms(farm_db)

    res = client.get("/api/farms/iron-farm")
    assert res.status_code == 200
    detail = res.json()["data"]

    assert detail["id"] == "iron-farm"
    assert detail["name"] == "Iron Golem Farm (Panic Chamber)"
    assert detail["difficulty"] == "Intermediate"
    assert detail["dimension"] == "Overworld"
    assert detail["source_type"] == "curated"
    assert "Java Edition" in detail["compatibility_label"]
    assert len(detail["materials"]) > 0
    assert len(detail["build_steps"]) > 0
    assert len(detail["troubleshooting"]) > 0
    assert len(detail["outputs"]) > 0
    assert detail["safety_note"] is not None
    assert detail["diagram_data"] is not None


def test_api_farm_detail_404(client: TestClient, farm_db: Session) -> None:
    """9. Unknown farm slugs return a useful 404."""
    seed_curated_farms(farm_db)

    res = client.get("/api/farms/non-existent-farm")
    assert res.status_code == 404
    err = res.json()["detail"]
    assert err["code"] == "farm_not_found"
    assert "non-existent-farm" in err["message"]


def test_farm_endpoints_do_not_call_astroworld(client: TestClient, farm_db: Session, monkeypatch: pytest.MonkeyPatch) -> None:
    """10. Farm endpoints do not call Astroworld."""
    def forbidden_call(*args, **kwargs):
        raise RuntimeError("External network call forbidden during farm requests!")

    monkeypatch.setattr("httpx.get", forbidden_call)
    monkeypatch.setattr("httpx.AsyncClient.get", forbidden_call)

    seed_curated_farms(farm_db)

    res1 = client.get("/api/farms")
    assert res1.status_code == 200

    res2 = client.get("/api/farms/raid-farm")
    assert res2.status_code == 200


def test_farm_graph_neighbor_depth_limit(client: TestClient, farm_db: Session) -> None:
    """11. Farm graph-neighbour requests remain limited to depth 1 or 2."""
    seed_curated_farms(farm_db)

    # Valid depth 1
    res1 = client.get("/api/graph/neighbors/farm/iron-farm?depth=1")
    assert res1.status_code == 200
    assert res1.json()["root"]["entity_id"] == "iron-farm"

    # Valid depth 2
    res2 = client.get("/api/graph/neighbors/farm/iron-farm?depth=2")
    assert res2.status_code == 200

    # Invalid depth 3 -> 422 Unprocessable Entity (FastAPI query validation ge=1, le=2)
    res3 = client.get("/api/graph/neighbors/farm/iron-farm?depth=3")
    assert res3.status_code == 422
