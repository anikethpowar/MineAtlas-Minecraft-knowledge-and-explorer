"""Tests for global multi-entity search endpoint."""

from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Achievement,
    Biome,
    Command,
    Enchantment,
    Item,
    Mob,
    Structure,
    Version,
    VillagerProfession,
)
from app.db.session import create_app_engine, get_db
from app.main import app


@pytest.fixture
def populated_db(tmp_path: Path):
    """Temporary database populated with representative Minecraft entities."""
    db_file = tmp_path / "test_search.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_app_engine(db_url)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        # Add sample entities across various categories
        session.add(Mob(id="zombie", name="Zombie", mob_type="hostile", category="undead", behavior="Attacks players"))
        session.add(Mob(id="zombie_villager", name="Zombie Villager", mob_type="hostile", category="undead", behavior="Can be cured"))
        session.add(Mob(id="cow", name="Cow", mob_type="passive", category="animal", behavior="Yields milk and leather"))
        session.add(Biome(id="minecraft:plains", name="Plains", dimension="overworld", category="temperate"))
        session.add(Biome(id="minecraft:desert", name="Desert", dimension="overworld", category="arid"))
        session.add(Item(id="iron_ingot", name="Iron Ingot", category="resource", stack_size=64, description="Smelted iron ore"))
        session.add(Item(id="zombie_head", name="Zombie Head", category="decorative", stack_size=64, description="Severed zombie skull"))
        session.add(Structure(id="village", name="Village", dimension="overworld", category="settlement"))
        session.add(Enchantment(id="sharpness", name="Sharpness", category="weapons", max_level=5, description="Increases melee damage"))
        session.add(Achievement(id="minecraft:story/root", slug="root", name="Minecraft", tab="story", description="The heart and story of the game"))
        session.add(Command(name="give", syntax="/give <player> <item> [amount]", description="Gives an item to a player"))
        session.add(Version(slug="1-21", name="1.21", edition="java", update_name="Tricky Trials"))
        session.add(VillagerProfession(id="armorer", name="Armorer", workstation="Blast Furnace", description="Trades armor"))
        session.commit()

        yield session

    engine.dispose()


def test_search_case_insensitive_multiple_types(populated_db: Session):
    """Verify case-insensitive search finds matches across different entity tables."""
    app.dependency_overrides[get_db] = lambda: populated_db
    client = TestClient(app)

    # Search 'zombie' should match Mob (Zombie, Zombie Villager) and Item (Zombie Head)
    response = client.get("/api/search?q=ZoMbIe")
    assert response.status_code == 200
    data = response.json()

    assert data["query"] == "ZoMbIe"
    assert data["total_results"] == 3
    assert "mob" in data["by_type"]
    assert "item" in data["by_type"]

    types_found = {r["entity_type"] for r in data["results"]}
    assert "mob" in types_found
    assert "item" in types_found

    # Ensure no raw_payload is leaked
    for item in data["results"]:
        assert "raw_payload" not in item
        assert "name" in item
        assert "id" in item
        assert "source_type" in item

    app.dependency_overrides.clear()


def test_search_type_filtering(populated_db: Session):
    """Verify that specifying 'types' parameter restricts matches to requested entity types."""
    app.dependency_overrides[get_db] = lambda: populated_db
    client = TestClient(app)

    # Search 'zombie' restricted to items only
    response = client.get("/api/search?q=zombie&types=item")
    assert response.status_code == 200
    data = response.json()

    assert data["total_results"] == 1
    assert data["results"][0]["id"] == "zombie_head"
    assert data["results"][0]["entity_type"] == "item"
    assert "mob" not in data["by_type"]

    app.dependency_overrides.clear()


def test_search_empty_or_whitespace_query_validation(populated_db: Session):
    """Verify that an empty or whitespace-only query string returns a clean validation error."""
    app.dependency_overrides[get_db] = lambda: populated_db
    client = TestClient(app)

    # Empty query parameter
    resp_empty = client.get("/api/search?q=")
    assert resp_empty.status_code == 422

    # Whitespace-only query parameter
    resp_spaces = client.get("/api/search?q=   ")
    assert resp_spaces.status_code == 422
    assert "must not be empty" in str(resp_spaces.json())

    app.dependency_overrides.clear()


def test_search_limit_enforcement(populated_db: Session):
    """Verify that search respects the limit query parameter."""
    app.dependency_overrides[get_db] = lambda: populated_db
    client = TestClient(app)

    # Search 'e' matches multiple entities; restrict to 2
    response = client.get("/api/search?q=e&limit=2")
    assert response.status_code == 200
    data = response.json()

    assert len(data["results"]) == 2
    assert data["total_results"] == 2

    app.dependency_overrides.clear()

