"""Tests for development-only API endpoints."""

from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import APP_ENV
from app.db.base import Base
from app.db.models import Mob, SyncRun
from app.db.session import create_app_engine, get_db
from app.main import app


@pytest.fixture
def temp_db(tmp_path: Path):
    """Fixture providing an isolated temporary database with schema initialized."""
    db_file = tmp_path / "test_dev.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_app_engine(db_url)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        yield session

    engine.dispose()


def test_development_sync_status_in_development(temp_db: Session, monkeypatch: pytest.MonkeyPatch):
    """Verify that /api/development/sync-status returns SQLite sync status when in dev mode."""
    monkeypatch.setattr("app.routers.development.APP_ENV", "development")

    # Override get_db dependency to use temp_db
    app.dependency_overrides[get_db] = lambda: temp_db

    client = TestClient(app)
    response = client.get("/api/development/sync-status")

    assert response.status_code == 200
    data = response.json()
    assert data["environment"] == "development"
    assert "cached_record_counts" in data
    assert "mobs" in data["cached_record_counts"]
    assert "sync_runs" in data["cached_record_counts"]
    assert data["latest_sync"] is None

    # Clean up overrides
    app.dependency_overrides.clear()


def test_development_sync_status_disabled_outside_dev(temp_db: Session, monkeypatch: pytest.MonkeyPatch):
    """Verify that /api/development/sync-status returns 404 in non-development modes."""
    monkeypatch.setattr("app.routers.development.APP_ENV", "production")

    app.dependency_overrides[get_db] = lambda: temp_db

    client = TestClient(app)
    response = client.get("/api/development/sync-status")

    assert response.status_code == 404
    assert "disabled outside development" in response.json()["detail"]

    app.dependency_overrides.clear()
