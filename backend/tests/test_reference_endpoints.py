"""Tests for supporting reference endpoints (enchantments, achievements, versions, commands, trades, professions)."""

from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Achievement,
    Command,
    Enchantment,
    Trade,
    Version,
    VillagerProfession,
)
from app.db.session import create_app_engine, get_db
from app.main import app


@pytest.fixture
def reference_db(tmp_path: Path):
    """Temporary database populated with supporting reference entities."""
    db_file = tmp_path / "test_reference.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_app_engine(db_url)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        # Enchantments
        session.add(Enchantment(id="sharpness", name="Sharpness", category="weapons", max_level=5, treasure_only=False, description="Melee damage bonus"))
        session.add(Enchantment(id="mending", name="Mending", category="tools", max_level=1, treasure_only=True, description="Repairs durability via XP"))

        # Achievements
        session.add(Achievement(id="minecraft:story/root", slug="root", name="Minecraft", tab="story", description="Heart of the game"))
        session.add(Achievement(id="minecraft:nether/fast_travel", slug="fast_travel", name="Subspace Bubble", tab="nether", description="Use the Nether to travel 7km in the Overworld"))

        # Versions
        session.add(Version(slug="1-21", name="1.21", edition="java", release_date="2024-06-13", release_type="major-release", update_name="Tricky Trials"))
        session.add(Version(slug="1-20", name="1.20", edition="java", release_date="2023-06-07", release_type="major-release", update_name="Trails & Tales"))

        # Commands
        session.add(Command(name="give", syntax="/give <targets> <item> [count]", permission_level=2, category="player", description="Gives an item"))
        session.add(Command(name="time", syntax="/time <set|add|query> <value>", permission_level=2, category="world", description="Changes world time"))

        # Villager Professions & Trades
        prof = VillagerProfession(id="armorer", name="Armorer", workstation="Blast Furnace", description="Trades armor pieces")
        session.add(prof)
        session.flush()

        trade1 = Trade(trade_id="armorer_novice_1", profession_id="armorer", level=1, level_name="Novice", gives_item="Coal", gives_amount=15, receives_item="Emerald", receives_amount=1)
        session.add(trade1)

        session.commit()
        yield session

    engine.dispose()


def test_enchantments_endpoints(reference_db: Session):
    """Verify enchantment list filtering and detail endpoint."""
    app.dependency_overrides[get_db] = lambda: reference_db
    client = TestClient(app)

    # Filter treasure_only=true
    resp_list = client.get("/api/enchantments?treasure_only=true")
    assert resp_list.status_code == 200
    items = resp_list.json()["data"]
    assert len(items) == 1
    assert items[0]["id"] == "mending"

    # Detail
    resp_detail = client.get("/api/enchantments/sharpness")
    assert resp_detail.status_code == 200
    assert resp_detail.json()["data"]["name"] == "Sharpness"
    assert resp_detail.json()["data"]["max_level"] == 5

    # 404
    resp_404 = client.get("/api/enchantments/unknown_curse")
    assert resp_404.status_code == 404
    assert resp_404.json()["detail"]["code"] == "entity_not_found"

    app.dependency_overrides.clear()


def test_achievements_endpoints(reference_db: Session):
    """Verify achievements list, tab filter, and detail slug resolution."""
    app.dependency_overrides[get_db] = lambda: reference_db
    client = TestClient(app)

    # List with tab filter
    resp_tab = client.get("/api/achievements?tab=nether")
    assert resp_tab.status_code == 200
    assert len(resp_tab.json()["data"]) == 1
    assert resp_tab.json()["data"][0]["slug"] == "fast_travel"

    # Detail by full ID or slug
    resp_detail1 = client.get("/api/achievements/minecraft:story/root")
    assert resp_detail1.status_code == 200
    assert resp_detail1.json()["data"]["name"] == "Minecraft"

    resp_detail2 = client.get("/api/achievements/root")
    assert resp_detail2.status_code == 200
    assert resp_detail2.json()["data"]["name"] == "Minecraft"

    app.dependency_overrides.clear()


def test_versions_endpoints(reference_db: Session):
    """Verify versions list, search, and detail resolution."""
    app.dependency_overrides[get_db] = lambda: reference_db
    client = TestClient(app)

    # List
    resp = client.get("/api/versions?search=Tricky")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 1
    assert resp.json()["data"][0]["slug"] == "1-21"

    # Detail by slug
    resp_detail = client.get("/api/versions/1-21")
    assert resp_detail.status_code == 200
    assert resp_detail.json()["data"]["name"] == "1.21"
    assert resp_detail.json()["data"]["update_name"] == "Tricky Trials"

    # Detail by dotted version string
    resp_dotted = client.get("/api/versions/1.20")
    assert resp_dotted.status_code == 200
    assert resp_dotted.json()["data"]["name"] == "1.20"

    app.dependency_overrides.clear()


def test_commands_endpoints(reference_db: Session):
    """Verify commands list and detail (with or without leading slash)."""
    app.dependency_overrides[get_db] = lambda: reference_db
    client = TestClient(app)

    # Detail with URL-encoded leading slash
    resp_slash = client.get("/api/commands/%2Fgive")
    assert resp_slash.status_code == 200
    assert resp_slash.json()["data"]["name"] == "give"

    # Detail without slash
    resp_clean = client.get("/api/commands/time")
    assert resp_clean.status_code == 200
    assert resp_clean.json()["data"]["name"] == "time"

    app.dependency_overrides.clear()


def test_trades_and_villager_professions_endpoints(reference_db: Session):
    """Verify villager professions list/detail with nested trades, and trades endpoint."""
    app.dependency_overrides[get_db] = lambda: reference_db
    client = TestClient(app)

    # Profession detail with nested trades
    resp_prof = client.get("/api/villager-professions/armorer")
    assert resp_prof.status_code == 200
    prof_data = resp_prof.json()["data"]
    assert prof_data["name"] == "Armorer"
    assert prof_data["workstation"] == "Blast Furnace"
    assert len(prof_data["trades"]) == 1
    assert prof_data["trades"][0]["gives_item"] == "Coal"

    # Trade detail
    resp_trade = client.get("/api/trades/armorer_novice_1")
    assert resp_trade.status_code == 200
    trade_data = resp_trade.json()["data"]
    assert trade_data["gives_item"] == "Coal"
    assert trade_data["receives_item"] == "Emerald"
    assert trade_data["level"] == 1

    app.dependency_overrides.clear()
