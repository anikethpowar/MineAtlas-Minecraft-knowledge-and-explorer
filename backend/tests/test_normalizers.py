"""Unit tests for data normalizers and probability conversions."""

from app.services.normalizers import (
    normalize_biome,
    normalize_item,
    normalize_mob,
    normalize_probability,
    normalize_structure,
    normalize_villager_profession,
)


def test_probability_normalization_percentage():
    """Verify mob drop percentages (e.g. 2.5%) normalize to decimal 0.025."""
    res = normalize_probability(2.5, scale_hint="percentage")
    assert res["original_value"] == 2.5
    assert res["original_unit"] == "percentage"
    assert res["normalized_probability"] == 0.025

    res_100 = normalize_probability(100, scale_hint="percentage")
    assert res_100["normalized_probability"] == 1.0


def test_probability_normalization_fraction():
    """Verify structure loot fractions (e.g. 0.62) remain 0.62."""
    res = normalize_probability(0.62, scale_hint="fraction")
    assert res["original_value"] == 0.62
    assert res["original_unit"] == "fraction"
    assert res["normalized_probability"] == 0.62


def test_probability_normalization_edge_cases():
    """Verify None and invalid inputs are handled safely without crashing."""
    res_none = normalize_probability(None)
    assert res_none["normalized_probability"] is None
    assert res_none["original_unit"] == "unknown"

    res_invalid = normalize_probability("not-a-number")
    assert res_invalid["normalized_probability"] is None
    assert res_invalid["original_unit"] == "invalid"


def test_normalize_mob_structure():
    """Verify raw mob payload maps into Mob model attributes."""
    raw = {
        "id": "cow",
        "name": "Cow",
        "type": "passive",
        "category": "animal",
        "hp": 10,
        "damage": {"easy": 0, "normal": 0, "hard": 0},
        "xpDrop": {"min": 1, "max": 3},
        "spawnBiomes": ["Plains", "Forest"],
        "spawnConditions": "Spawns on grass",
        "tameable": False,
        "breedable": True,
        "breedingItem": ["Wheat"],
        "versionAdded": "Alpha",
    }
    norm = normalize_mob(raw)
    assert norm["id"] == "cow"
    assert norm["hp"] == 10.0
    assert norm["damage_normal"] == 0.0
    assert norm["xp_min"] == 1
    assert norm["breeding_item"] == "Wheat"
    assert norm["source_type"] == "astroworld_api"
    assert norm["edition"] == "java"
    assert "cow" in norm["raw_payload"]


def test_normalize_structure_ylevel():
    """Verify yLevel bounds extraction for structures."""
    raw = {
        "id": "village",
        "name": "Village",
        "dimension": "overworld",
        "category": "settlement",
        "yLevel": {"min": 60, "max": 80},
    }
    norm = normalize_structure(raw)
    assert norm["id"] == "village"
    assert norm["y_min"] == 60
    assert norm["y_max"] == 80


def test_normalize_trades_extraction():
    """Verify villager profession and nested trade extraction."""
    raw = {
        "id": "armorer",
        "name": "Armorer",
        "workstation": "Blast Furnace",
        "description": "Armor trades",
        "biomeSpecific": True,
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
                        "maxUses": 16,
                    }
                ],
            }
        ],
    }
    prof_data, trades_list = normalize_villager_profession(raw)
    assert prof_data["id"] == "armorer"
    assert prof_data["workstation"] == "Blast Furnace"
    assert len(trades_list) == 1
    assert trades_list[0]["profession_id"] == "armorer"
    assert trades_list[0]["level"] == 1
    assert trades_list[0]["gives_item"] == "Coal"
    assert trades_list[0]["gives_amount"] == 15
    assert "armorer-l1-coal-emerald-1" in trades_list[0]["trade_id"]

