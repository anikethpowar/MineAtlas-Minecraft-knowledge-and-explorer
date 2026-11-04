"""Data normalizers and probability converters for MineAtlas."""

from datetime import datetime, timezone
import json
from typing import Any


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


def normalize_probability(
    value: float | int | str | None,
    scale_hint: str = "auto",
) -> dict[str, Any]:
    """Normalize probabilities across different scales into a consistent decimal [0.0, 1.0].

    Astroworld uses different scales:
    - Mob drop chance is expressed as a percentage: e.g. 2.5 means 2.5% -> 0.025.
    - Structure loot chance is expressed as a fraction: e.g. 0.62 means 62% -> 0.62.

    Preserves:
    - original_value
    - original_unit ('percentage' or 'fraction')
    - normalized_probability (float between 0.0 and 1.0)
    """
    if value is None:
        return {
            "original_value": None,
            "original_unit": "unknown",
            "normalized_probability": None,
        }

    try:
        val = float(value)
    except (ValueError, TypeError):
        return {
            "original_value": value,
            "original_unit": "invalid",
            "normalized_probability": None,
        }

    if scale_hint == "percentage" or (scale_hint == "auto" and val > 1.0):
        norm = max(0.0, min(1.0, val / 100.0))
        unit = "percentage"
    elif scale_hint == "fraction" or (scale_hint == "auto" and 0.0 <= val <= 1.0):
        norm = max(0.0, min(1.0, val))
        unit = "fraction"
    else:
        norm = max(0.0, min(1.0, val / 100.0 if val > 1.0 else val))
        unit = "percentage" if val > 1.0 else "fraction"

    return {
        "original_value": val,
        "original_unit": unit,
        "normalized_probability": round(norm, 6),
    }


def normalize_mob(record: dict[str, Any]) -> dict[str, Any]:
    """Normalize raw mob API record into Mob model fields."""
    damage_obj = record.get("damage") or {}
    xp_obj = record.get("xpDrop") or {}

    damage_easy = None
    damage_normal = None
    damage_hard = None

    if isinstance(damage_obj, dict):
        damage_easy = damage_obj.get("easy")
        damage_normal = damage_obj.get("normal")
        damage_hard = damage_obj.get("hard")
    elif isinstance(damage_obj, (int, float)):
        damage_normal = float(damage_obj)

    breeding_item_val = record.get("breedingItem")
    if isinstance(breeding_item_val, list):
        breeding_item_str = ", ".join(str(i) for i in breeding_item_val)
    elif breeding_item_val is not None:
        breeding_item_str = str(breeding_item_val)
    else:
        breeding_item_str = None

    return {
        "id": str(record.get("id")),
        "name": str(record.get("name")),
        "mob_type": record.get("type"),
        "category": record.get("category"),
        "behavior": record.get("behavior"),
        "hp": float(record["hp"]) if record.get("hp") is not None else None,
        "damage_easy": float(damage_easy) if damage_easy is not None else None,
        "damage_normal": float(damage_normal) if damage_normal is not None else None,
        "damage_hard": float(damage_hard) if damage_hard is not None else None,
        "xp_min": xp_obj.get("min") if isinstance(xp_obj, dict) else None,
        "xp_max": xp_obj.get("max") if isinstance(xp_obj, dict) else None,
        "spawn_conditions": record.get("spawnConditions"),
        "tameable": bool(record.get("tameable", False)),
        "taming_method": record.get("tamingMethod"),
        "breedable": bool(record.get("breedable", False)),
        "breeding_item": breeding_item_str,
        "version_added": record.get("versionAdded"),
        "notes": record.get("notes"),
        "source_type": "astroworld_api",
        "source_url": "https://api.astroworldmc.com/api/v1/mobs",
        "edition": "java",
        "game_version": record.get("versionAdded"),
        "last_verified_at": utc_now(),
        "coverage_note": "Synchronized from Astroworld API collection /api/v1/mobs",
        "raw_payload": json.dumps(record, ensure_ascii=False),
    }


def normalize_biome(record: dict[str, Any]) -> dict[str, Any]:
    """Normalize raw biome API record into Biome model fields."""
    return {
        "id": str(record.get("id")),
        "name": str(record.get("name")),
        "dimension": record.get("dimension"),
        "category": record.get("category"),
        "temperature": float(record["temperature"]) if record.get("temperature") is not None else None,
        "precipitation": record.get("precipitation"),
        "rarity": record.get("rarity"),
        "version_added": record.get("versionAdded"),
        "notes": record.get("notes"),
        "source_type": "astroworld_api",
        "source_url": "https://api.astroworldmc.com/api/v1/biomes",
        "edition": "java",
        "game_version": record.get("versionAdded"),
        "last_verified_at": utc_now(),
        "coverage_note": "Synchronized from Astroworld API collection /api/v1/biomes",
        "raw_payload": json.dumps(record, ensure_ascii=False),
    }


def normalize_item(record: dict[str, Any]) -> dict[str, Any]:
    """Normalize raw item API record into Item model fields."""
    food_obj = record.get("foodValue") or {}
    food_hunger = None
    food_saturation = None

    if isinstance(food_obj, dict):
        food_hunger = food_obj.get("hunger")
        food_saturation = food_obj.get("saturation")

    return {
        "id": str(record.get("id")),
        "name": str(record.get("name")),
        "category": record.get("category"),
        "stack_size": int(record.get("stackSize", 64)),
        "durability": int(record["durability"]) if record.get("durability") is not None else None,
        "description": record.get("description"),
        "enchantable": bool(record.get("enchantable", False)),
        "food_hunger": int(food_hunger) if food_hunger is not None else None,
        "food_saturation": float(food_saturation) if food_saturation is not None else None,
        "fuel_value": int(record["fuelValue"]) if record.get("fuelValue") is not None else None,
        "version_added": record.get("versionAdded"),
        "notes": record.get("notes"),
        "source_type": "astroworld_api",
        "source_url": "https://api.astroworldmc.com/api/v1/items",
        "edition": "java",
        "game_version": record.get("versionAdded"),
        "last_verified_at": utc_now(),
        "coverage_note": "Synchronized from Astroworld API collection /api/v1/items (curated key items/blocks)",
        "raw_payload": json.dumps(record, ensure_ascii=False),
    }


def normalize_structure(record: dict[str, Any]) -> dict[str, Any]:
    """Normalize raw structure API record into Structure model fields."""
    y_obj = record.get("yLevel") or {}
    y_min = None
    y_max = None

    if isinstance(y_obj, dict):
        y_min = y_obj.get("min")
        y_max = y_obj.get("max")

    return {
        "id": str(record.get("id")),
        "name": str(record.get("name")),
        "dimension": record.get("dimension"),
        "category": record.get("category"),
        "rarity": record.get("rarity"),
        "y_min": int(y_min) if y_min is not None else None,
        "y_max": int(y_max) if y_max is not None else None,
        "how_to_find": record.get("howToFind"),
        "version_added": record.get("versionAdded"),
        "notes": record.get("notes"),
        "source_type": "astroworld_api",
        "source_url": "https://api.astroworldmc.com/api/v1/structures",
        "edition": "java",
        "game_version": record.get("versionAdded"),
        "last_verified_at": utc_now(),
        "coverage_note": "Synchronized from Astroworld API collection /api/v1/structures",
        "raw_payload": json.dumps(record, ensure_ascii=False),
    }


def normalize_enchantment(record: dict[str, Any]) -> dict[str, Any]:
    """Normalize raw enchantment API record into Enchantment model fields."""
    weight_raw = record.get("weight")
    weight_int = None
    if weight_raw is not None:
        try:
            weight_int = int(weight_raw)
        except ValueError:
            weight_int = None

    return {
        "id": str(record.get("id")),
        "name": str(record.get("name")),
        "category": record.get("category"),
        "max_level": int(record.get("maxLevel", 1)),
        "description": record.get("description"),
        "treasure_only": bool(record.get("treasureOnly", False)),
        "curse_of": bool(record.get("curseOf", False)),
        "weight": weight_int,
        "version_added": record.get("versionAdded"),
        "notes": record.get("notes"),
        "source_type": "astroworld_api",
        "source_url": "https://api.astroworldmc.com/api/v1/enchantments",
        "edition": "java",
        "game_version": record.get("versionAdded"),
        "last_verified_at": utc_now(),
        "coverage_note": "Synchronized from Astroworld API collection /api/v1/enchantments",
        "raw_payload": json.dumps(record, ensure_ascii=False),
    }


def normalize_command(record: dict[str, Any]) -> dict[str, Any]:
    """Normalize raw command API record into Command model fields."""
    return {
        "name": str(record.get("name")),
        "syntax": str(record.get("syntax", "")),
        "description": record.get("description"),
        "permission_level": int(record.get("permissionLevel", 0)),
        "category": record.get("category"),
        "version_added": record.get("versionAdded"),
        "notes": record.get("notes"),
        "source_type": "astroworld_api",
        "source_url": "https://api.astroworldmc.com/api/v1/commands",
        "edition": "java",
        "game_version": record.get("versionAdded"),
        "last_verified_at": utc_now(),
        "coverage_note": "Synchronized from Astroworld API collection /api/v1/commands",
        "raw_payload": json.dumps(record, ensure_ascii=False),
    }


def normalize_version(record: dict[str, Any]) -> dict[str, Any]:
    """Normalize raw version API record into Version model fields."""
    return {
        "slug": str(record.get("slug")),
        "name": str(record.get("name")),
        "edition": str(record.get("edition", "java")),
        "release_date": record.get("releaseDate"),
        "release_type": record.get("type"),
        "update_name": record.get("updateName"),
        "previous_version_slug": record.get("previousVersion"),
        "next_version_slug": record.get("nextVersion"),
        "source_type": "astroworld_api",
        "source_url": "https://api.astroworldmc.com/api/v1/versions",
        "edition": "java",
        "game_version": record.get("name"),
        "last_verified_at": utc_now(),
        "coverage_note": "Synchronized from Astroworld API collection /api/v1/versions",
        "raw_payload": json.dumps(record, ensure_ascii=False),
    }


def normalize_achievement(record: dict[str, Any]) -> dict[str, Any]:
    """Normalize raw achievement API record into Achievement model fields."""
    return {
        "id": str(record.get("id")),
        "slug": str(record.get("slug", record.get("id"))),
        "name": str(record.get("name")),
        "tab": record.get("tab"),
        "description": record.get("description"),
        "icon": record.get("icon"),
        "parent_id": record.get("parent"),
        "how_to_complete": record.get("howToComplete"),
        "xp_reward": int(record.get("xpReward", 0)),
        "is_goal": bool(record.get("isGoal", False)),
        "is_challenge": bool(record.get("isChallenge", False)),
        "difficulty": record.get("difficulty"),
        "version_added": record.get("versionAdded"),
        "source_type": "astroworld_api",
        "source_url": "https://api.astroworldmc.com/api/v1/achievements",
        "edition": "java",
        "game_version": record.get("versionAdded"),
        "last_verified_at": utc_now(),
        "coverage_note": "Synchronized from Astroworld API collection /api/v1/achievements",
        "raw_payload": json.dumps(record, ensure_ascii=False),
    }


def normalize_villager_profession(
    record: dict[str, Any]
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Normalize villager profession and extract child Trade records.

    Returns:
        tuple: (profession_dict, list_of_trade_dicts)
    """
    prof_id = str(record.get("id"))
    profession_data = {
        "id": prof_id,
        "name": str(record.get("name")),
        "workstation": record.get("workstation"),
        "description": record.get("description"),
        "biome_specific": bool(record.get("biomeSpecific", False)),
        "source_type": "astroworld_api",
        "source_url": "https://api.astroworldmc.com/api/v1/trades",
        "edition": "java",
        "game_version": None,
        "last_verified_at": utc_now(),
        "coverage_note": "Synchronized from Astroworld API collection /api/v1/trades",
        "raw_payload": json.dumps(record, ensure_ascii=False),
    }

    trades_list: list[dict[str, Any]] = []
    raw_levels = record.get("levels", [])

    for lvl_idx, level_obj in enumerate(raw_levels):
        level_num = int(level_obj.get("level", lvl_idx + 1))
        level_name = level_obj.get("name")
        raw_trades = level_obj.get("trades", [])

        for trade_idx, t in enumerate(raw_trades):
            gives_item = str(t.get("gives", "Unknown"))
            gives_amount = int(t.get("givesAmount", 1))
            receives_item = str(t.get("receives", "Unknown"))
            receives_amount = int(t.get("receivesAmount", 1))

            # Build a stable unique trade_id slug
            gives_slug = gives_item.lower().replace(" ", "_")
            receives_slug = receives_item.lower().replace(" ", "_")
            trade_id = f"{prof_id}-l{level_num}-{gives_slug}-{receives_slug}-{trade_idx+1}"

            price_mult = t.get("priceMultiplier")

            trade_data = {
                "trade_id": trade_id,
                "profession_id": prof_id,
                "level": level_num,
                "level_name": level_name,
                "gives_item": gives_item,
                "gives_amount": gives_amount,
                "receives_item": receives_item,
                "receives_amount": receives_amount,
                "max_uses": t.get("maxUses"),
                "price_multiplier": float(price_mult) if price_mult is not None else None,
                "notes": None,
                "source_type": "astroworld_api",
                "source_url": "https://api.astroworldmc.com/api/v1/trades",
                "edition": "java",
                "game_version": None,
                "last_verified_at": utc_now(),
                "coverage_note": f"Trade offer level {level_num} for {prof_id}",
                "raw_payload": json.dumps(t, ensure_ascii=False),
            }
            trades_list.append(trade_data)

    return profession_data, trades_list

