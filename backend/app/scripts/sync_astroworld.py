"""CLI script for manual, controlled Astroworld data synchronization.

Usage:
    cd ~/Desktop/mineatlas
    source venv/bin/activate
    cd backend
    python -m app.scripts.sync_astroworld

This tool contacts https://api.astroworldmc.com and updates the local SQLite cache
using the internal 50 requests/min token bucket rate limiter.
"""

import json
import sys
from typing import Any

from app.clients.astroworld_client import AstroworldClient
from app.config import (
    ASTROWORLD_API_BASE_URL,
    DATABASE_URL,
    DEFAULT_DB_PATH,
)
from app.db.session import SessionLocal
from app.services.ingestion_service import (
    COLLECTION_TARGETS,
    IngestionService,
)


def on_sync_progress(event: dict[str, Any]) -> None:
    """Callback printing clean CLI progress events."""
    stage = event.get("stage")
    index = event.get("index")
    total = event.get("total")
    path = event.get("path")

    if stage == "starting_endpoint":
        print(f"[{index}/{total}] Ingesting {path:<25} ... ", end="", flush=True)
    elif stage == "endpoint_success":
        created = event.get("created", 0)
        updated = event.get("updated", 0)
        count = event.get("count", 0)
        print(f"[OK] ({count:>3} records: +{created} new, ~{updated} updated)")
    elif stage == "endpoint_failed":
        err = event.get("error", "Unknown error")
        print(f"[FAILED] Error: {err}")
    elif stage == "deriving_relationships":
        print("[*] Deriving knowledge graph relationship edges ... ", end="", flush=True)
    elif stage == "sync_complete":
        print("[OK]")


def main() -> int:
    """Main CLI entrypoint."""
    print("=" * 72)
    print(" MineAtlas - Astroworld Ingestion & Relationship Sync (Phase 4)")
    print("=" * 72)
    print(" This tool will contact https://api.astroworldmc.com and update the")
    print(" local SQLite database cache with verified Minecraft Java Edition data.")
    print("-" * 72)
    print(f" Upstream API Base : {ASTROWORLD_API_BASE_URL}")
    print(f" Database Location : {DEFAULT_DB_PATH}")
    print(f" Database URL      : {DATABASE_URL}")
    print(f" Collections       : {len(COLLECTION_TARGETS)} endpoints (sequential)")
    print(f" Rate Limiting     : Strict 50 req/min token bucket (1 token / 1.2s)")
    print("=" * 72)
    print()

    client = AstroworldClient()
    session = SessionLocal()

    try:
        service = IngestionService(session=session, client=client)
        sync_run = service.run_sync(
            trigger_type="manual",
            progress_callback=on_sync_progress,
        )
    except Exception as exc:  # pylint: disable=broad-except
        print(f"\n[FATAL] Ingestion aborted unexpectedly: {exc}")
        return 1
    finally:
        client.close()
        session.close()

    summary: dict[str, Any] = {}
    if sync_run.summary_json:
        try:
            summary = json.loads(sync_run.summary_json)
        except Exception:
            summary = {}

    rel_summary = summary.get("relationship_derivation", {})
    edges_created = rel_summary.get("derived_edges_created", 0)
    edges_updated = rel_summary.get("derived_edges_updated", 0)
    total_edges = rel_summary.get("total_edges", 0)
    unresolved = rel_summary.get("unresolved_references", {})

    print()
    print("-" * 72)
    print(" Synchronization Summary")
    print("-" * 72)
    print(f" SyncRun Record ID : #{sync_run.id}")
    print(f" Started At        : {sync_run.started_at.isoformat() if sync_run.started_at else 'N/A'}")
    print(f" Completed At      : {sync_run.completed_at.isoformat() if sync_run.completed_at else 'N/A'}")
    print(f" Duration          : {summary.get('duration_seconds', 'N/A')}s")
    print(f" Overall Status    : {sync_run.status.upper()}")
    print(f" Endpoints Synced  : {sync_run.endpoints_synced} / {len(COLLECTION_TARGETS)}")
    print(f" Records Created   : {summary.get('records_created', 0)}")
    print(f" Records Updated   : {summary.get('records_updated', 0)}")
    print(f" Total Ingested    : {sync_run.records_ingested}")
    print(f" Derived Edges     : {total_edges} total (+{edges_created} new, ~{edges_updated} updated)")
    if unresolved:
        unresolved_total = sum(unresolved.values())
        print(f" Unresolved Refs   : {unresolved_total} skipped references (no fake nodes created)")
    print(f" Database Path     : {DEFAULT_DB_PATH}")
    print("-" * 72)

    # Print rate limit headers observed from upstream
    rate_limit_info = []
    for report in summary.get("endpoint_reports", []):
        if report.get("rate_limit_headers"):
            rate_limit_info.append(f"{report['resource']}: {report['rate_limit_headers']}")
    if rate_limit_info:
        print("\nUpstream Rate-Limit Headers Observed:")
        for rli in rate_limit_info[:5]:
            print(f" - {rli}")

    if sync_run.error_message:
        print("\nErrors Encountered:")
        print(sync_run.error_message)
        print()

    if sync_run.status == "failed":
        print("\n[!] Ingestion FAILED completely. No successful collection data imported.")
        return 1
    if sync_run.status == "partial_failure":
        print("\n[!] Ingestion completed with PARTIAL FAILURES. Review error logs above.")
        return 0

    print("\n[✓] SUCCESS: All collections and relationship edges cached in SQLite.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
