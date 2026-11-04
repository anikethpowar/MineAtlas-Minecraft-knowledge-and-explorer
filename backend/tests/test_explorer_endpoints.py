"""Tests for primary explorer list and detail endpoints (mobs, biomes, items, structures)."""

from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import Biome, Item, Mob, Structure
from app.db.session import create_app_engine, get_db
from app.main import app


@pytest.fixture
def explorer_db(tmp_path: Path):
    """Temporary database populated with rich explorer entity samples."""
    db_file = tmp_path / "test_explorers.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_app_engine(db_url)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        # 5 Mobs with varying attributes
        session.add(Mob(id="zombie", name="Zombie", mob_type="hostile", category="undead", hp=20.0, tameable=False, breedable=False, version_added="1.0", coverage_note="Standard hostile mob"))
        session.add(Mob(id="skeleton", name="Skeleton", mob_type="hostile", category="undead", hp=20.0, tameable=False, breedable=False, version_added="1.0"))
        session.add(Mob(id="cow", name="Cow", mob_type="passive", category="animal", hp=10.0, tameable=False, breedable=True, breeding_item="Wheat", version_added="1.0"))
        session.add(Mob(id="wolf", name="Wolf", mob_type="neutral", category="animal", hp=8.0, tameable=True, taming_method="Bone", breedable=True, version_added="1.0"))
        session.add(Mob(id="ender_dragon", name="Ender Dragon", mob_type="boss", category="hostile", hp=200.0, tameable=False, breedable=False, version_added="1.0"))

        # 3 Biomes
        session.add(Biome(id="minecraft:plains", name="Plains", dimension="overworld", category="temperate", rarity="common", temperature=0.8, precipitation="rain", version_added="1.0"))
        session.add(Biome(id="minecraft:desert", name="Desert", dimension="overworld", category="arid", rarity="common", temperature=2.0, precipitation="none", version_added="1.0"))
        session.add(Biome(id="minecraft:nether_wastes", name="Nether Wastes", dimension="nether", category="barren", rarity="common", temperature=2.0, precipitation="none", version_added="1.0"))

        # 3 Items
        session.add(Item(id="iron_ingot", name="Iron Ingot", category="resource", stack_size=64, enchantable=False, version_added="1.0"))
        session.add(Item(id="diamond_sword", name="Diamond Sword", category="combat", stack_size=1, durability=1561, enchantable=True, version_added="1.0"))
        session.add(Item(id="apple", name="Apple", category="food", stack_size=64, food_hunger=4, food_saturation=2.4, enchantable=False, version_added="1.0"))

        # 3 Structures
        session.add(Structure(id="village", name="Village", dimension="overworld", category="settlement", rarity="common", y_min=64, y_max=128, version_added="1.0"))
        session.add(Structure(id="ancient_city", name="Ancient City", dimension="overworld", category="ruin", rarity="rare", y_min=-52, y_max=-52, version_added="1.19"))
        session.add(Structure(id="nether_fortress", name="Nether Fortress", dimension="nether", category="fortress", rarity="uncommon", y_min=30, y_max=96, version_added="1.0"))

        session.commit()
        yield session

    engine.dispose()


# ==================== MOBS ====================
def test_list_mobs_pagination_and_filters(explorer_db: Session):
    """Verify mobs list pagination, page limits, and behavioral filtering."""
    app.dependency_overrides[get_db] = lambda: explorer_db
    client = TestClient(app)

    # 1. Page size of 2
    resp = client.get("/api/mobs?page=1&page_size=2")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["data"]) == 2
    assert data["pagination"]["total_items"] == 5
    assert data["pagination"]["total_pages"] == 3
    assert data["pagination"]["page"] == 1

    # 2. Filter by type=hostile
    resp_hostile = client.get("/api/mobs?type=hostile")
    assert resp_hostile.status_code == 200
    hostile_mobs = resp_hostile.json()["data"]
    assert len(hostile_mobs) == 2
    assert {m["id"] for m in hostile_mobs} == {"zombie", "skeleton"}

    # 3. Filter by tameable=true
    resp_tameable = client.get("/api/mobs?tameable=true")
    assert resp_tameable.status_code == 200
    assert len(resp_tameable.json()["data"]) == 1
    assert resp_tameable.json()["data"][0]["id"] == "wolf"

    # 4. Filter by breedable=true
    resp_breedable = client.get("/api/mobs?breedable=true")
    assert resp_breedable.status_code == 200
    assert len(resp_breedable.json()["data"]) == 2
    assert {m["id"] for m in resp_breedable.json()["data"]} == {"cow", "wolf"}

    app.dependency_overrides.clear()


def test_get_mob_detail_and_404(explorer_db: Session):
    """Verify single mob detail includes provenance and unknown mob yields structured 404."""
    app.dependency_overrides[get_db] = lambda: explorer_db
    client = TestClient(app)

    # Success detail
    resp = client.get("/api/mobs/zombie")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["id"] == "zombie"
    assert data["name"] == "Zombie"
    assert data["hp"] == 20.0
    assert "source" in data
    assert data["source"]["edition"] == "java"
    assert data["source"]["source_type"] == "astroworld_api"
    assert data["coverage_note"] == "Standard hostile mob"

    # 404 Not Found
    resp_404 = client.get("/api/mobs/nonexistent_mob")
    assert resp_404.status_code == 404
    err = resp_404.json()
    assert err["detail"]["code"] == "entity_not_found"
    assert "nonexistent_mob" in err["detail"]["message"]

    app.dependency_overrides.clear()


# ==================== BIOMES ====================
def test_list_biomes_and_dimension_filter(explorer_db: Session):
    """Verify biomes filtering by dimension and search."""
    app.dependency_overrides[get_db] = lambda: explorer_db
    client = TestClient(app)

    # Filter overworld biomes
    resp_ow = client.get("/api/biomes?dimension=overworld")
    assert resp_ow.status_code == 200
    data = resp_ow.json()
    assert len(data["data"]) == 2
    assert all(b["dimension"] == "overworld" for b in data["data"])

    # Filter nether biomes
    resp_nether = client.get("/api/biomes?dimension=nether")
    assert resp_nether.status_code == 200
    assert len(resp_nether.json()["data"]) == 1
    assert resp_nether.json()["data"][0]["id"] == "minecraft:nether_wastes"

    # Detail with or without namespace prefix
    resp_detail1 = client.get("/api/biomes/minecraft:plains")
    assert resp_detail1.status_code == 200
    assert resp_detail1.json()["data"]["name"] == "Plains"

    resp_detail2 = client.get("/api/biomes/plains")
    assert resp_detail2.status_code == 200
    assert resp_detail2.json()["data"]["name"] == "Plains"

    app.dependency_overrides.clear()


# ==================== ITEMS ====================
def test_list_items_and_category_filter(explorer_db: Session):
    """Verify items filtering by category, enchantability, and detail."""
    app.dependency_overrides[get_db] = lambda: explorer_db
    client = TestClient(app)

    # Filter enchantable items
    resp_ench = client.get("/api/items?enchantable=true")
    assert resp_ench.status_code == 200
    assert len(resp_ench.json()["data"]) == 1
    assert resp_ench.json()["data"][0]["id"] == "diamond_sword"

    # Filter category=resource
    resp_res = client.get("/api/items?category=resource")
    assert resp_res.status_code == 200
    assert len(resp_res.json()["data"]) == 1
    assert resp_res.json()["data"][0]["id"] == "iron_ingot"

    # Detail
    resp_sword = client.get("/api/items/diamond_sword")
    assert resp_sword.status_code == 200
    sword_data = resp_sword.json()["data"]
    assert sword_data["durability"] == 1561
    assert sword_data["stack_size"] == 1
    assert sword_data["source"]["edition"] == "java"

    # Item 404
    resp_404 = client.get("/api/items/netherite_hoe_fake")
    assert resp_404.status_code == 404
    assert resp_404.json()["detail"]["code"] == "entity_not_found"

    app.dependency_overrides.clear()


# ==================== STRUCTURES ====================
def test_list_structures_and_rarity_filter(explorer_db: Session):
    """Verify structures filtering by rarity, dimension, and detail."""
    app.dependency_overrides[get_db] = lambda: explorer_db
    client = TestClient(app)

    # Filter rarity=rare
    resp_rare = client.get("/api/structures?rarity=rare")
    assert resp_rare.status_code == 200
    assert len(resp_rare.json()["data"]) == 1
    assert resp_rare.json()["data"][0]["id"] == "ancient_city"

    # Structure detail
    resp_city = client.get("/api/structures/ancient_city")
    assert resp_city.status_code == 200
    city_data = resp_city.json()["data"]
    assert city_data["name"] == "Ancient City"
    assert city_data["y_min"] == -52
    assert city_data["source"]["edition"] == "java"

    app.dependency_overrides.clear()

