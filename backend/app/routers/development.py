"""Development-only endpoints for MineAtlas."""

import json
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import APP_ENV, DEFAULT_DB_PATH
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

router = APIRouter(prefix="/development", tags=["development"])


@router.get("/sync-status")
def get_sync_status(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Retrieve the latest synchronization status and cache freshness.

    Strictly reads from local SQLite database and never triggers an upstream
    request. Returns HTTP 404 if not in development mode.
    """
    if APP_ENV.lower() != "development":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Development endpoints are disabled outside development environment.",
        )

    # Fetch latest SyncRun record
    latest_run = db.scalars(
        select(SyncRun).order_by(SyncRun.started_at.desc()).limit(1)
    ).first()

    latest_run_dict: dict[str, Any] | None = None
    if latest_run:
        summary_parsed = None
        if latest_run.summary_json:
            try:
                summary_parsed = json.loads(latest_run.summary_json)
            except Exception:
                summary_parsed = None

        latest_run_dict = {
            "id": latest_run.id,
            "status": latest_run.status,
            "trigger_type": latest_run.trigger_type,
            "started_at": latest_run.started_at.isoformat() if latest_run.started_at else None,
            "completed_at": latest_run.completed_at.isoformat() if latest_run.completed_at else None,
            "endpoints_synced": latest_run.endpoints_synced,
            "records_ingested": latest_run.records_ingested,
            "error_message": latest_run.error_message,
            "summary": summary_parsed,
        }

    # Count records in all cached tables
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
        "relation_edges": db.scalar(select(func.count()).select_from(RelationEdge)) or 0,
        "sync_runs": db.scalar(select(func.count()).select_from(SyncRun)) or 0,
    }

    return {
        "environment": APP_ENV,
        "database_file": str(DEFAULT_DB_PATH),
        "latest_sync": latest_run_dict,
        "cached_record_counts": counts,
    }
