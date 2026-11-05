"""Tests for Calculated World Atlas Tools and Curated World Reference."""

from pathlib import Path
from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import Biome, Dimension, RelationEdge, WorldType
from app.db.session import create_app_engine, get_db
from app.main import app
from app.scripts.seed_world_reference import seed_world_reference


@pytest.fixture
def world_db(tmp_path: Path) -> Generator[Session, None, None]:
    """Temporary SQLite database populated with base entities and world schemas."""
    db_file = tmp_path / "test_world.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_app_engine(db_url)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        # Pre-populate sample test biomes
        session.add(
            Biome(
                id="minecraft:plains",
                name="Plains",
                dimension="overworld",
                category="plains",
                rarity="common",
                temperature=0.8,
                precipitation="rain",
                source_type="astroworld_api",
                edition="java",
            )
        )
        session.add(
            Biome(
                id="minecraft:desert",
                name="Desert",
                dimension="overworld",
                category="desert",
                rarity="common",
                temperature=2.0,
                precipitation="none",
                source_type="astroworld_api",
                edition="java",
            )
        )
        session.add(
            Biome(
                id="minecraft:nether_wastes",
                name="Nether Wastes",
                dimension="nether",
                category="nether",
                rarity="common",
                temperature=2.0,
                precipitation="none",
                source_type="astroworld_api",
                edition="java",
            )
        )
        session.add(
            Biome(
                id="minecraft:the_end",
                name="The End",
                dimension="end",
                category="the_end",
                rarity="rare",
                temperature=0.5,
                precipitation="none",
                source_type="astroworld_api",
                edition="java",
            )
        )

        # Pre-populate relation edges for village and tameable mob opportunities
        session.add(
            RelationEdge(
                source_entity_type="structure",
                source_entity_id="village",
                relationship_type="FOUND_IN",
                target_entity_type="biome",
                target_entity_id="minecraft:plains",
            )
        )
        session.add(
            RelationEdge(
                source_entity_type="mob",
                source_entity_id="horse",
                relationship_type="SPAWNS_IN",
                target_entity_type="biome",
                target_entity_id="minecraft:plains",
            )
        )

        session.commit()
        yield session

    engine.dispose()


@pytest.fixture
def client(world_db: Session) -> Generator[TestClient, None, None]:
    """TestClient wired to the test database session."""
    app.dependency_overrides[get_db] = lambda: world_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==================== SEEDER TESTS ====================

def test_seed_world_reference_creates_records(world_db: Session) -> None:
    """1. Curated world reference seeder creates 3 dimensions and 5 world types."""
    stats = seed_world_reference(world_db)
    assert stats["dimensions_created"] == 3
    assert stats["world_types_created"] == 5

    dims = world_db.scalars(select(Dimension).order_by(Dimension.id)).all()
    assert len(dims) == 3
    dim_ids = [d.id for d in dims]
    assert dim_ids == ["nether", "overworld", "the_end"]

    types = world_db.scalars(select(WorldType).order_by(WorldType.id)).all()
    assert len(types) == 5
    type_ids = [t.id for t in types]
    assert "default" in type_ids
    assert "flat" in type_ids


def test_seed_world_reference_idempotency(world_db: Session) -> None:
    """2. Running the seeder multiple times updates existing rows without duplicates."""
    stats1 = seed_world_reference(world_db)
    assert stats1["dimensions_created"] == 3

    stats2 = seed_world_reference(world_db)
    assert stats2["dimensions_created"] == 0
    assert stats2["dimensions_updated"] == 3
    assert stats2["world_types_created"] == 0
    assert stats2["world_types_updated"] == 5

    total_dims = len(world_db.scalars(select(Dimension)).all())
    assert total_dims == 3


# ==================== WORLD REFERENCE API TESTS ====================

def test_get_world_reference_endpoint(client: TestClient, world_db: Session) -> None:
    """3. GET /api/world/reference returns dimensions, coordinate explainer, and rules."""
    seed_world_reference(world_db)
    response = client.get("/api/world/reference")
    assert response.status_code == 200

    data = response.json()
    assert data["edition"] == "java"
    assert data["provenance"]["source_type"] == "curated"

    dims = data["dimensions"]
    assert len(dims) == 3
    dim_names = [d["name"] for d in dims]
    assert "The Overworld" in dim_names
    assert "The Nether" in dim_names
    assert "The End" in dim_names

    coords = data["coordinate_system"]
    assert "East (+) / West (-)" in coords["x_axis"]
    assert "Altitude" in coords["y_axis"]
    assert "South (+) / North (-)" in coords["z_axis"]
    assert "29,999,984" in coords["world_border"]

    assert len(data["dimension_travel_rules"]) >= 3
    assert "does not analyse arbitrary seeds" in data["seed_limitation_statement"]


# ==================== NETHER PORTAL CONVERTER TESTS ====================

def test_portal_convert_overworld_to_nether(client: TestClient) -> None:
    """4. POST /api/world/portal-convert compresses Overworld horizontal coordinates by 8."""
    payload = {
        "source_dimension": "overworld",
        "x": 800.0,
        "y": 64.0,
        "z": -1600.0,
    }
    response = client.post("/api/world/portal-convert", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["result_type"] == "Calculated Result"
    assert data["source_dimension"] == "overworld"
    assert data["target_dimension"] == "nether"
    assert data["source_coordinates"] == {"x": 800.0, "y": 64.0, "z": -1600.0}
    assert data["target_coordinates"] == {"x": 100.0, "y": 64.0, "z": -200.0}
    assert "8:1" in data["formula_name"]
    assert data["provenance"]["source_type"] == "calculated"
    assert len(data["limitations"]) >= 1


def test_portal_convert_nether_to_overworld(client: TestClient) -> None:
    """5. POST /api/world/portal-convert expands Nether horizontal coordinates by 8."""
    payload = {
        "source_dimension": "nether",
        "x": 100.0,
        "y": 72.0,
        "z": -200.0,
    }
    response = client.post("/api/world/portal-convert", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["source_dimension"] == "nether"
    assert data["target_dimension"] == "overworld"
    assert data["target_coordinates"] == {"x": 800.0, "y": 72.0, "z": -1600.0}
    assert data["target_coordinates"]["y"] == 72.0  # Vertical altitude preserved


def test_portal_convert_decimals_and_origin(client: TestClient) -> None:
    """6. Portal converter handles decimals, negatives, and world origin (0, 0)."""
    # Origin test
    res_origin = client.post(
        "/api/world/portal-convert",
        json={"source_dimension": "overworld", "x": 0.0, "y": 64.0, "z": 0.0},
    )
    assert res_origin.status_code == 200
    assert res_origin.json()["target_coordinates"] == {"x": 0.0, "y": 64.0, "z": 0.0}

    # Decimal test
    res_dec = client.post(
        "/api/world/portal-convert",
        json={"source_dimension": "overworld", "x": 125.5, "y": 80.0, "z": -75.25},
    )
    assert res_dec.status_code == 200
    tgt = res_dec.json()["target_coordinates"]
    assert tgt["x"] == round(125.5 / 8.0, 3)
    assert tgt["z"] == round(-75.25 / 8.0, 3)


def test_portal_convert_invalid_dimension(client: TestClient) -> None:
    """7. Rejects portal conversion for dimensions that do not scale horizontally."""
    payload = {
        "source_dimension": "the_end",
        "x": 100.0,
        "y": 64.0,
        "z": 100.0,
    }
    response = client.post("/api/world/portal-convert", json=payload)
    assert response.status_code == 422
    assert "invalid_dimension" in str(response.json())


def test_portal_convert_out_of_bounds_validation(client: TestClient) -> None:
    """8. Rejects coordinates outside Minecraft Java world boundaries."""
    # Out of X bounds (> 30,000,000)
    res_x = client.post(
        "/api/world/portal-convert",
        json={"source_dimension": "overworld", "x": 35000000.0, "y": 64.0, "z": 0.0},
    )
    assert res_x.status_code == 422

    # Out of Y altitude bounds (< -64)
    res_y = client.post(
        "/api/world/portal-convert",
        json={"source_dimension": "overworld", "x": 100.0, "y": -100.0, "z": 0.0},
    )
    assert res_y.status_code == 422


# ==================== BIOME CRITERIA EXPLORER TESTS ====================

def test_biome_matches_by_dimension_and_rarity(client: TestClient) -> None:
    """9. GET /api/world/biome-matches filters biomes by dimension and rarity."""
    response = client.get("/api/world/biome-matches?dimension=overworld&rarity=common")
    assert response.status_code == 200

    data = response.json()
    assert data["result_type"] == "Calculated Result"
    assert data["total_matches"] == 2  # Plains and Desert
    names = [item["biome"]["name"] for item in data["data"]]
    assert "Plains" in names
    assert "Desert" in names

    # Verify explainable match reasons
    first_item = data["data"][0]
    assert len(first_item["match_reasons"]) >= 2
    assert any("dimension" in r.lower() for r in first_item["match_reasons"])


def test_biome_matches_beginner_friendly_preset(client: TestClient) -> None:
    """10. Beginner-friendly preset matches temperate, common Overworld biomes."""
    response = client.get("/api/world/biome-matches?beginner_friendly=true")
    assert response.status_code == 200

    data = response.json()
    assert data["total_matches"] == 1  # Plains (temp=0.8), Desert excluded (temp=2.0)
    assert data["data"][0]["biome"]["name"] == "Plains"
    assert any("beginner-friendly" in r.lower() for r in data["data"][0]["match_reasons"])


def test_biome_matches_relation_opportunities(client: TestClient) -> None:
    """11. Filters biomes by village opportunity and tameable animal spawns."""
    res_village = client.get("/api/world/biome-matches?has_village_opportunity=true")
    assert res_village.status_code == 200
    data_village = res_village.json()
    assert data_village["total_matches"] == 1
    assert data_village["data"][0]["biome"]["name"] == "Plains"
    assert any("Village" in r for r in data_village["data"][0]["match_reasons"])

    res_tameable = client.get("/api/world/biome-matches?has_tameable_mob_opportunity=true")
    assert res_tameable.status_code == 200
    data_tameable = res_tameable.json()
    assert data_tameable["total_matches"] == 1
    assert data_tameable["data"][0]["biome"]["name"] == "Plains"
    assert any("tameable" in r.lower() for r in data_tameable["data"][0]["match_reasons"])


def test_biome_matches_empty_results_and_limitation(client: TestClient) -> None:
    """12. Returns empty results gracefully with explicit seed disclaimer."""
    response = client.get("/api/world/biome-matches?dimension=overworld&category=non_existent_category")
    assert response.status_code == 200

    data = response.json()
    assert data["total_matches"] == 0
    assert data["data"] == []
    assert any("personal Minecraft seed" in lim for lim in data["limitations"])


# ==================== SPAWN SPHERE VISUALIZER TESTS ====================

def test_spawn_sphere_calculation_128(client: TestClient) -> None:
    """13. POST /api/world/spawn-sphere calculates exact 2D and 3D geometry for r=128."""
    payload = {"radius": 128.0, "player_y": 64.0}
    response = client.post("/api/world/spawn-sphere", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["result_type"] == "Calculated Result"
    m = data["measurements"]
    assert m["radius"] == 128.0
    assert m["diameter"] == 256.0
    assert m["circular_area_blocks"] == 51471.85  # round(pi * 128^2, 2)
    assert m["sphere_volume_blocks"] == 8784529.76  # round(4/3 * pi * 128^3, 2)
    assert m["circumference_blocks"] == 804.25  # round(2 * pi * 128, 2)
    assert m["vertical_range"] == {"min_y": -64.0, "max_y": 192.0}

    assert "hostile mobs instantly despawn" in data["geometric_explanation"]
    assert "2 * r" in data["formulas_used"]["diameter"]
    assert len(data["limitations"]) >= 1


def test_spawn_sphere_presets_24_and_32(client: TestClient) -> None:
    """14. Calculates metrics for 24-block spawn exclusion and 32-block pathfinding spheres."""
    # 24-block inner exclusion zone
    res_24 = client.post("/api/world/spawn-sphere", json={"radius": 24.0})
    assert res_24.status_code == 200
    m24 = res_24.json()["measurements"]
    assert m24["diameter"] == 48.0
    assert m24["circular_area_blocks"] == 1809.56
    assert m24["vertical_range"] is None

    # 32-block active pathfinding range
    res_32 = client.post("/api/world/spawn-sphere", json={"radius": 32.0})
    assert res_32.status_code == 200
    m32 = res_32.json()["measurements"]
    assert m32["diameter"] == 64.0
    assert m32["circular_area_blocks"] == 3216.99


def test_spawn_sphere_invalid_radius(client: TestClient) -> None:
    """15. Rejects non-positive or excessively large radii."""
    # Radius = 0
    res_zero = client.post("/api/world/spawn-sphere", json={"radius": 0.0})
    assert res_zero.status_code == 422

    # Negative radius
    res_neg = client.post("/api/world/spawn-sphere", json={"radius": -10.0})
    assert res_neg.status_code == 422

    # Excessively large radius (> 512)
    res_large = client.post("/api/world/spawn-sphere", json={"radius": 600.0})
    assert res_large.status_code == 422


# ==================== OFFLINE CONTRACT TEST ====================

def test_world_endpoints_strictly_offline(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """16. Verifies all world endpoints execute purely offline without external calls."""
    def forbidden_call(*args, **kwargs):
        raise RuntimeError("Outbound network request attempted during world tool execution!")

    monkeypatch.setattr("httpx.get", forbidden_call)
    monkeypatch.setattr("httpx.post", forbidden_call)
    monkeypatch.setattr("httpx.AsyncClient.get", forbidden_call)
    monkeypatch.setattr("httpx.AsyncClient.post", forbidden_call)

    # All endpoints succeed without external HTTP requests
    assert client.get("/api/world/reference").status_code == 200
    assert client.post("/api/world/portal-convert", json={"source_dimension": "overworld", "x": 100, "y": 64, "z": 100}).status_code == 200
    assert client.get("/api/world/biome-matches?dimension=overworld").status_code == 200
    assert client.post("/api/world/spawn-sphere", json={"radius": 32}).status_code == 200
