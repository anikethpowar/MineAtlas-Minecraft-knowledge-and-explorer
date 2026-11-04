"""Idempotent Ingestion and Caching Service for MineAtlas.

Coordinates synchronization of Astroworld collection endpoints into SQLite,
enforces the 50 req/min rate limit, handles retries/backoff, logs SyncRun metadata,
and invokes initial relationship derivation.

CRITICAL RULES:
1. Only collection endpoints are fetched; never loop individual entity detail calls.
2. Every request is gated by the token bucket rate limiter.
3. Database upserts are idempotent; re-running sync never duplicates records.
4. If an endpoint fails, other endpoints continue; status marked as partial_failure.
5. All operations run locally on SQLite with zero external cache or cloud dependency.
"""

from collections.abc import Callable
from datetime import datetime, timezone
import json
import time
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.clients.astroworld_client import (
    AstroworldClient,
    AstroworldClientError,
    AstroworldRateLimitError,
)
from app.config import (
    ASTROWORLD_MAX_RETRIES,
    ASTROWORLD_RETRY_BACKOFF_FACTOR,
)
from app.db.models import (
    Achievement,
    Biome,
    Command,
    Enchantment,
    Item,
    Mob,
    Structure,
    SyncRun,
    Trade,
    Version,
    VillagerProfession,
)
from app.services.normalizers import (
    normalize_achievement,
    normalize_biome,
    normalize_command,
    normalize_enchantment,
    normalize_item,
    normalize_mob,
    normalize_structure,
    normalize_version,
    normalize_villager_profession,
)
from app.services.relationship_derivation import RelationshipDerivationService


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


def ensure_utc(dt: datetime) -> datetime:
    """Ensure datetime has UTC timezone."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


COLLECTION_TARGETS = [
    {
        "resource": "mobs",
        "path": "/api/v1/mobs",
        "client_method": "get_mobs",
        "model": Mob,
        "normalizer": normalize_mob,
    },
    {
        "resource": "biomes",
        "path": "/api/v1/biomes",
        "client_method": "get_biomes",
        "model": Biome,
        "normalizer": normalize_biome,
    },
    {
        "resource": "items",
        "path": "/api/v1/items",
        "client_method": "get_items",
        "model": Item,
        "normalizer": normalize_item,
    },
    {
        "resource": "enchantments",
        "path": "/api/v1/enchantments",
        "client_method": "get_enchantments",
        "model": Enchantment,
        "normalizer": normalize_enchantment,
    },
    {
        "resource": "structures",
        "path": "/api/v1/structures",
        "client_method": "get_structures",
        "model": Structure,
        "normalizer": normalize_structure,
    },
    {
        "resource": "commands",
        "path": "/api/v1/commands",
        "client_method": "get_commands",
        "model": Command,
        "normalizer": normalize_command,
    },
    {
        "resource": "versions",
        "path": "/api/v1/versions",
        "client_method": "get_versions",
        "model": Version,
        "normalizer": normalize_version,
    },
    {
        "resource": "achievements",
        "path": "/api/v1/achievements",
        "client_method": "get_achievements",
        "model": Achievement,
        "normalizer": normalize_achievement,
    },
    {
        "resource": "trades",
        "path": "/api/v1/trades",
        "client_method": "get_trades",
        "model": VillagerProfession,
        "normalizer": normalize_villager_profession,
    },
]


class IngestionService:
    """Coordinates upstream Astroworld data synchronization into SQLite."""

    def __init__(
        self,
        session: Session,
        client: AstroworldClient | None = None,
        max_retries: int | None = None,
        backoff_factor: float | None = None,
        sleep_func: Callable[[float], None] | None = None,
        time_func: Callable[[], float] | None = None,
    ) -> None:
        self.session = session
        self.client = client or AstroworldClient()
        self.max_retries = (
            max_retries if max_retries is not None else ASTROWORLD_MAX_RETRIES
        )
        self.backoff_factor = (
            backoff_factor
            if backoff_factor is not None
            else ASTROWORLD_RETRY_BACKOFF_FACTOR
        )
        self.sleep_func = sleep_func or time.sleep
        self.time_func = time_func or time.monotonic

    def run_sync(
        self,
        trigger_type: str = "manual",
        progress_callback: Callable[[dict[str, Any]], None] | None = None,
    ) -> SyncRun:
        """Execute a full, safe synchronization across all approved endpoints.

        Args:
            trigger_type: Initiation label ('manual', 'audit', 'scheduled').
            progress_callback: Optional callable receiving real-time stage updates.

        Returns:
            SyncRun: Persisted database record detailing sync results.
        """
        sync_run = SyncRun(
            started_at=utc_now(),
            status="running",
            trigger_type=trigger_type,
            endpoints_synced=0,
            records_ingested=0,
        )
        self.session.add(sync_run)
        self.session.commit()

        endpoint_reports: list[dict[str, Any]] = []
        successful_endpoints = 0
        total_created = 0
        total_updated = 0
        failed_errors: list[str] = []

        total_targets = len(COLLECTION_TARGETS)

        for idx, target in enumerate(COLLECTION_TARGETS):
            resource = target["resource"]
            path = target["path"]
            method_name = target["client_method"]

            if progress_callback:
                progress_callback({
                    "stage": "starting_endpoint",
                    "index": idx + 1,
                    "total": total_targets,
                    "resource": resource,
                    "path": path,
                })

            req_start_time = utc_now()
            retries_log: list[dict[str, Any]] = []
            payload: dict[str, Any] | None = None
            http_status = None
            rate_limit_headers = {}
            error_msg = None

            attempts = 0
            while attempts <= self.max_retries:
                attempts += 1
                try:
                    client_method = getattr(self.client, method_name)
                    payload = client_method()
                    http_status = self.client.last_status_code or 200
                    rate_limit_headers = {
                        k: v for k, v in self.client.last_response_headers.items()
                        if "ratelimit" in k.lower() or "retry-after" in k.lower()
                    }
                    break
                except AstroworldRateLimitError as exc:
                    http_status = 429
                    retries_log.append({
                        "attempt": attempts,
                        "error_type": "rate_limit_429",
                        "retry_after": exc.retry_after,
                        "timestamp": utc_now().isoformat(),
                    })
                    if attempts > self.max_retries:
                        error_msg = str(exc)
                        break

                    wait_sec = (
                        exc.retry_after
                        if exc.retry_after is not None
                        else (self.backoff_factor * (2 ** (attempts - 1)))
                    )
                    self.sleep_func(wait_sec)

                except AstroworldClientError as exc:
                    http_status = getattr(exc, "status_code", 500)
                    retries_log.append({
                        "attempt": attempts,
                        "error_type": type(exc).__name__,
                        "error": str(exc),
                        "timestamp": utc_now().isoformat(),
                    })
                    if attempts > self.max_retries:
                        error_msg = str(exc)
                        break

                    wait_sec = min(30.0, self.backoff_factor * (2 ** (attempts - 1)))
                    self.sleep_func(wait_sec)

                except Exception as exc:  # pylint: disable=broad-except
                    http_status = 500
                    error_msg = f"Unexpected error: {exc}"
                    break

            req_end_time = utc_now()
            duration_sec = round((req_end_time - req_start_time).total_seconds(), 3)

            # Ingest payload if fetch succeeded
            created = 0
            updated = 0
            count = 0

            if payload and "data" in payload:
                try:
                    created, updated = self._upsert_resource_data(target, payload["data"])
                    successful_endpoints += 1
                    total_created += created
                    total_updated += updated
                    count = len(payload["data"]) if isinstance(payload["data"], list) else 1

                    if progress_callback:
                        progress_callback({
                            "stage": "endpoint_success",
                            "index": idx + 1,
                            "total": total_targets,
                            "resource": resource,
                            "path": path,
                            "count": count,
                            "created": created,
                            "updated": updated,
                        })
                except Exception as exc:
                    self.session.rollback()
                    error_msg = f"Database upsert failed for {resource}: {exc}"
                    failed_errors.append(error_msg)
                    if progress_callback:
                        progress_callback({
                            "stage": "endpoint_failed",
                            "index": idx + 1,
                            "total": total_targets,
                            "resource": resource,
                            "path": path,
                            "error": error_msg,
                        })
            else:
                if error_msg:
                    failed_errors.append(f"{resource} ({path}): {error_msg}")
                if progress_callback:
                    progress_callback({
                        "stage": "endpoint_failed",
                        "index": idx + 1,
                        "total": total_targets,
                        "resource": resource,
                        "path": path,
                        "error": error_msg or "Unknown failure",
                    })

            endpoint_reports.append({
                "resource": resource,
                "path": path,
                "status": "success" if error_msg is None else "failed",
                "http_status": http_status,
                "duration_seconds": duration_sec,
                "retries": retries_log,
                "rate_limit_headers": rate_limit_headers,
                "records_fetched": count,
                "records_created": created,
                "records_updated": updated,
                "error": error_msg,
            })

        # Relationship derivation pass
        derivation_summary: dict[str, Any] = {}
        if successful_endpoints > 0:
            if progress_callback:
                progress_callback({"stage": "deriving_relationships"})
            deriv_service = RelationshipDerivationService(self.session)
            derivation_summary = deriv_service.derive_all_relationships()

        # Determine overall sync outcome
        if successful_endpoints == total_targets:
            final_status = "success"
        elif successful_endpoints > 0:
            final_status = "partial_failure"
        else:
            final_status = "failed"

        sync_completed_at = utc_now()

        started_at_dt = ensure_utc(sync_run.started_at)
        summary_payload = {
            "sync_version": "1.0",
            "trigger_type": trigger_type,
            "started_at": started_at_dt.isoformat(),
            "completed_at": sync_completed_at.isoformat(),
            "duration_seconds": round((sync_completed_at - started_at_dt).total_seconds(), 2),
            "total_endpoints": total_targets,
            "successful_endpoints": successful_endpoints,
            "failed_endpoints": total_targets - successful_endpoints,
            "records_created": total_created,
            "records_updated": total_updated,
            "total_records_ingested": total_created + total_updated,
            "relationship_derivation": derivation_summary,
            "endpoint_reports": endpoint_reports,
        }

        sync_run.completed_at = sync_completed_at
        sync_run.status = final_status
        sync_run.endpoints_synced = successful_endpoints
        sync_run.records_ingested = total_created + total_updated
        sync_run.error_message = "\n".join(failed_errors) if failed_errors else None
        sync_run.summary_json = json.dumps(summary_payload, ensure_ascii=False)

        self.session.commit()

        if progress_callback:
            progress_callback({
                "stage": "sync_complete",
                "status": final_status,
                "records_ingested": sync_run.records_ingested,
                "edges_derived": derivation_summary.get("derived_edges_created", 0),
            })

        return sync_run

    def _upsert_resource_data(
        self, target: dict[str, Any], raw_records: list[dict[str, Any]]
    ) -> tuple[int, int]:
        """Idempotently upsert normalized records into the target SQLAlchemy model."""
        resource = target["resource"]
        model = target["model"]
        normalizer = target["normalizer"]

        created_count = 0
        updated_count = 0

        if resource == "trades":
            # Trades collection returns professions with nested trade arrays
            for prof_raw in raw_records:
                prof_data, trades_data = normalizer(prof_raw)
                prof_id = prof_data["id"]

                existing_prof = self.session.scalar(
                    select(VillagerProfession).where(VillagerProfession.id == prof_id)
                )
                if existing_prof:
                    for k, v in prof_data.items():
                        setattr(existing_prof, k, v)
                    updated_count += 1
                else:
                    new_prof = VillagerProfession(**prof_data)
                    self.session.add(new_prof)
                    created_count += 1

                for t_data in trades_data:
                    trade_id = t_data["trade_id"]
                    existing_trade = self.session.scalar(
                        select(Trade).where(Trade.trade_id == trade_id)
                    )
                    if existing_trade:
                        for k, v in t_data.items():
                            setattr(existing_trade, k, v)
                        updated_count += 1
                    else:
                        new_trade = Trade(**t_data)
                        self.session.add(new_trade)
                        created_count += 1

        elif resource == "commands":
            # Command uses 'name' as primary key
            for rec in raw_records:
                norm = normalizer(rec)
                pk_val = norm["name"]
                existing = self.session.scalar(select(model).where(model.name == pk_val))
                if existing:
                    for k, v in norm.items():
                        setattr(existing, k, v)
                    updated_count += 1
                else:
                    self.session.add(model(**norm))
                    created_count += 1

        elif resource == "versions":
            # Version uses 'slug' as primary key
            for rec in raw_records:
                norm = normalizer(rec)
                pk_val = norm["slug"]
                existing = self.session.scalar(select(model).where(model.slug == pk_val))
                if existing:
                    for k, v in norm.items():
                        setattr(existing, k, v)
                    updated_count += 1
                else:
                    self.session.add(model(**norm))
                    created_count += 1

        else:
            # All other entities use 'id' as primary key
            for rec in raw_records:
                norm = normalizer(rec)
                pk_val = norm["id"]
                existing = self.session.scalar(select(model).where(model.id == pk_val))
                if existing:
                    for k, v in norm.items():
                        setattr(existing, k, v)
                    updated_count += 1
                else:
                    self.session.add(model(**norm))
                    created_count += 1

        self.session.commit()
        return created_count, updated_count

