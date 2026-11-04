"""Tests for the public cached data status endpoint."""

from datetime import datetime, timezone
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import Mob, RelationEdge, SyncRun
from app.db.session import create_app_engine, get_db
from app.main import app


@pytest.fixture
def status_db(tmp_path: Path):
    """Temporary database with sample sync run and entities."""
    db_file = tmp_path / "test_status.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_app_engine(db_url)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        # Add a successful sync run
        now = datetime.now(timezone.utc)
        sync = SyncRun(
            started_at=now,
            completed_at=now,
            status="success",
            trigger_type="manual",
            endpoints_synced=9,
            records_ingested=2,
        )
        session.add(sync)
        session.add(Mob(id="zombie", name="Zombie", mob_type="hostile"))
        session.add(
            RelationEdge(
                source_entity_type="mob",
                source_entity_id="zombie",
                relationship_type="DROPS",
                target_entity_type="item",
                target_entity_id="rotten_flesh",
            )
        )
        session.commit()
        yield session

    engine.dispose()


def test_data_status_returns_cached_metrics(status_db: Session):
    """Verify /api/data-status returns cached counts, freshness, and status."""
    app.dependency_overrides[get_db] = lambda: status_db
    client = TestClient(app)

    response = client.get("/api/data-status")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "healthy"
    assert data["latest_sync_status"] == "success"
    assert data["edition"] == "java"
    assert data["total_entities"] == 1
    assert data["total_relationship_edges"] == 1
    assert "cached_counts" in data
    assert data["cached_counts"]["mobs"] == 1
    assert data["cache_freshness_seconds"] is not None
    assert "coverage_summary" in data

    app.dependency_overrides.clear()


def test_data_status_empty_database(tmp_path: Path):
    """Verify /api/data-status returns 'empty' status when database has zero entities."""
    db_file = tmp_path / "test_empty.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_app_engine(db_url)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        app.dependency_overrides[get_db] = lambda: session
        client = TestClient(app)

        response = client.get("/api/data-status")
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "empty"
        assert data["total_entities"] == 0
        assert data["total_relationship_edges"] == 0
        assert data["latest_sync_status"] is None

        app.dependency_overrides.clear()

    engine.dispose()

