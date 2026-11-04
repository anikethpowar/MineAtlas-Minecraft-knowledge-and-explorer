"""FastAPI router for public cached data status and coverage reporting."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import (
    Achievement,
    Biome,
    Command,
    Enchantment,
    Item,
    Mob,
    RelationEdge,
    Structure,
    SyncRun,
    Trade,
    Version,
    VillagerProfession,
)
from app.db.session import get_db
from app.schemas.status import DataStatusResponse

router = APIRouter(tags=["status"])


def format_freshness(seconds: float | None) -> str | None:
    """Format elapsed seconds into a friendly human-readable duration."""
    if seconds is None:
        return None
    sec = int(seconds)
    if sec < 60:
        return f"{sec} seconds ago"
    minutes = sec // 60
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    days = hours // 24
    return f"{days} day{'s' if days != 1 else ''} ago"


@router.get("/data-status", response_model=DataStatusResponse)
def get_cached_data_status(db: Session = Depends(get_db)) -> DataStatusResponse:
    """Retrieve public cache health, record totals, sync freshness, and coverage scope.

    Reads exclusively from local SQLite database and never triggers external network calls.
    """
    latest_run = db.scalars(
        select(SyncRun).order_by(SyncRun.started_at.desc()).limit(1)
    ).first()

    now = datetime.now(timezone.utc)
    freshness_sec: float | None = None
    if latest_run and latest_run.completed_at:
        comp_at = latest_run.completed_at
        if comp_at.tzinfo is None:
            comp_at = comp_at.replace(tzinfo=timezone.utc)
        freshness_sec = max(0.0, (now - comp_at).total_seconds())

    counts = {
        "mobs": db.scalar(select(func.count()).select_from(Mob)) or 0,
        "biomes": db.scalar(select(func.count()).select_from(Biome)) or 0,
        "items": db.scalar(select(func.count()).select_from(Item)) or 0,
        "enchantments": db.scalar(select(func.count()).select_from(Enchantment)) or 0,
        "structures": db.scalar(select(func.count()).select_from(Structure)) or 0,
        "commands": db.scalar(select(func.count()).select_from(Command)) or 0,
        "versions": db.scalar(select(func.count()).select_from(Version)) or 0,
        "achievements": db.scalar(select(func.count()).select_from(Achievement)) or 0,
        "villager_professions": db.scalar(select(func.count()).select_from(VillagerProfession)) or 0,
        "trades": db.scalar(select(func.count()).select_from(Trade)) or 0,
    }

    total_entities = sum(counts.values())
    total_edges = db.scalar(select(func.count()).select_from(RelationEdge)) or 0

    if total_entities == 0:
        health_status = "empty"
    elif latest_run and latest_run.status == "failed":
        health_status = "stale"
    else:
        health_status = "healthy"

    coverage = (
        "Minecraft Java Edition only. Covers curated core mobs, biomes, 100 key items/blocks, "
        "structures, enchantments, commands, versions, villager trades, and derived graph relationships. "
        "Does not claim exhaustive coverage of every decorative block state."
    )

    return DataStatusResponse(
        status=health_status,
        latest_sync_status=latest_run.status if latest_run else None,
        latest_sync_started_at=latest_run.started_at if latest_run else None,
        latest_sync_completed_at=latest_run.completed_at if latest_run else None,
        cache_freshness_seconds=round(freshness_sec, 1) if freshness_sec is not None else None,
        cache_freshness_human=format_freshness(freshness_sec),
        total_entities=total_entities,
        total_relationship_edges=total_edges,
        cached_counts=counts,
        edition="java",
        coverage_summary=coverage,
    )

