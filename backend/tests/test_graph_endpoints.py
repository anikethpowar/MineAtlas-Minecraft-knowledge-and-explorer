"""Tests for localized knowledge graph neighborhood exploration endpoint."""

from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Biome,
    Item,
    Mob,
    RelationEdge,
    Structure,
    Version,
)
from app.db.session import create_app_engine, get_db
from app.main import app


@pytest.fixture
def graph_db(tmp_path: Path):
    """Temporary database populated with a multi-level entity relationship graph."""
    db_file = tmp_path / "test_graph.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_app_engine(db_url)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        # Entities
        session.add(Mob(id="zombie", name="Zombie", mob_type="hostile", version_added="1.0"))
        session.add(Biome(id="minecraft:plains", name="Plains", dimension="overworld", version_added="1.0"))
        session.add(Item(id="rotten_flesh", name="Rotten Flesh", category="food", version_added="1.0"))
        session.add(Structure(id="village", name="Village", dimension="overworld", version_added="1.0"))
        session.add(Version(slug="1-0", name="1.0", edition="java"))

        # Edges (Depth 1 from Zombie):
        # Zombie -> SPAWNS_IN -> Plains
        session.add(
            RelationEdge(
                source_entity_type="mob",
                source_entity_id="zombie",
                relationship_type="SPAWNS_IN",
                target_entity_type="biome",
                target_entity_id="minecraft:plains",
                source_type="astroworld_api",
            )
        )
        # Zombie -> DROPS -> Rotten Flesh
        session.add(
            RelationEdge(
                source_entity_type="mob",
                source_entity_id="zombie",
                relationship_type="DROPS",
                target_entity_type="item",
                target_entity_id="rotten_flesh",
                metadata_json='{"chance": {"normalized_probability": 0.8}, "count": "0-2"}',
                source_type="astroworld_api",
            )
        )
        # Edge (Depth 2 from Zombie, through Plains):
        # Village -> FOUND_IN -> Plains
        session.add(
            RelationEdge(
                source_entity_type="structure",
                source_entity_id="village",
                relationship_type="FOUND_IN",
                target_entity_type="biome",
                target_entity_id="minecraft:plains",
                source_type="astroworld_api",
            )
        )
        # Edge (Depth 2 from Zombie, through Rotten Flesh):
        # Rotten Flesh -> ADDED_IN -> Version 1.0
        session.add(
            RelationEdge(
                source_entity_type="item",
                source_entity_id="rotten_flesh",
                relationship_type="ADDED_IN",
                target_entity_type="version",
                target_entity_id="1-0",
                source_type="astroworld_api",
            )
        )

        session.commit()
        yield session

    engine.dispose()


def test_graph_neighbors_depth_one(graph_db: Session):
    """Verify depth 1 traversal returns only immediate neighbours and deterministic explanations."""
    app.dependency_overrides[get_db] = lambda: graph_db
    client = TestClient(app)

    response = client.get("/api/graph/neighbors/mob/zombie?depth=1")
    assert response.status_code == 200
    data = response.json()

    assert data["root"]["entity_type"] == "mob"
    assert data["root"]["entity_id"] == "zombie"
    assert data["root"]["name"] == "Zombie"

    assert data["metadata"]["depth"] == 1
    assert data["metadata"]["total_edges"] == 2
    assert len(data["edges"]) == 2

    # Edges should include deterministic explanations
    drop_edge = next(e for e in data["edges"] if e["relationship_type"] == "DROPS")
    assert "Zombie drops Rotten Flesh" in drop_edge["explanation"]
    assert "80.0% chance" in drop_edge["explanation"]

    spawn_edge = next(e for e in data["edges"] if e["relationship_type"] == "SPAWNS_IN")
    assert "Zombie naturally spawns in Plains" in spawn_edge["explanation"]

    # Nodes returned: root (Zombie) + 2 neighbors (Plains, Rotten Flesh)
    node_ids = {n["id"] for n in data["nodes"]}
    assert node_ids == {"zombie", "minecraft:plains", "rotten_flesh"}
    # Village (depth 2) should NOT be present in depth 1
    assert "village" not in node_ids

    app.dependency_overrides.clear()


def test_graph_neighbors_depth_two(graph_db: Session):
    """Verify depth 2 traversal includes 2nd-degree neighbors (Village, Version 1.0)."""
    app.dependency_overrides[get_db] = lambda: graph_db
    client = TestClient(app)

    response = client.get("/api/graph/neighbors/mob/zombie?depth=2")
    assert response.status_code == 200
    data = response.json()

    assert data["metadata"]["depth"] == 2
    assert data["metadata"]["total_edges"] == 4
    assert len(data["edges"]) == 4

    node_ids = {n["id"] for n in data["nodes"]}
    assert "village" in node_ids
    assert "1-0" in node_ids
    assert "minecraft:plains" in node_ids
    assert "rotten_flesh" in node_ids

    app.dependency_overrides.clear()


def test_graph_neighbors_depth_validation_and_rejection(graph_db: Session):
    """Verify that requesting depth > 2 or depth < 1 is rejected with 400 or 422."""
    app.dependency_overrides[get_db] = lambda: graph_db
    client = TestClient(app)

    resp_too_deep = client.get("/api/graph/neighbors/mob/zombie?depth=3")
    assert resp_too_deep.status_code in (400, 422)

    resp_zero_depth = client.get("/api/graph/neighbors/mob/zombie?depth=0")
    assert resp_zero_depth.status_code in (400, 422)

    app.dependency_overrides.clear()


def test_graph_neighbors_relationship_type_filter(graph_db: Session):
    """Verify filtering edges by relationship_types (e.g. 'DROPS')."""
    app.dependency_overrides[get_db] = lambda: graph_db
    client = TestClient(app)

    response = client.get("/api/graph/neighbors/mob/zombie?depth=1&relationship_types=DROPS")
    assert response.status_code == 200
    data = response.json()

    assert data["metadata"]["total_edges"] == 1
    assert data["edges"][0]["relationship_type"] == "DROPS"
    assert data["edges"][0]["target_entity_id"] == "rotten_flesh"

    app.dependency_overrides.clear()


def test_graph_neighbors_missing_root_returns_404(graph_db: Session):
    """Verify that querying an unknown root entity returns structured 404."""
    app.dependency_overrides[get_db] = lambda: graph_db
    client = TestClient(app)

    response = client.get("/api/graph/neighbors/mob/herobrine")
    assert response.status_code == 404
    err = response.json()
    assert err["detail"]["code"] == "entity_not_found"
    assert "herobrine" in err["detail"]["message"]

    app.dependency_overrides.clear()

