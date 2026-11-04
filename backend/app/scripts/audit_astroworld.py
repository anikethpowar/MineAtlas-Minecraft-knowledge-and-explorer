"""CLI script to audit Astroworld collection endpoints.

Usage (from backend/ directory with venv activated):
    python -m app.scripts.audit_astroworld

This tool queries 9 collection endpoints sequentially with a safe delay
and writes raw responses and audit_summary.json to backend/data/raw_snapshots/.
"""

import sys
from typing import Any

from app.clients.astroworld_client import AstroworldClient
from app.config import (
    ASTROWORLD_API_BASE_URL,
    ASTROWORLD_AUDIT_DELAY_SECONDS,
)
from app.services.api_audit_service import (
    AUDIT_TARGETS,
    ApiAuditService,
    AuditResult,
)


def on_audit_progress(event: dict[str, Any]) -> None:
    """Callback printing clean CLI progress events."""
    stage = event.get("stage")
    index = event.get("index")
    total = event.get("total")
    path = event.get("path")

    if stage == "starting_endpoint":
        print(f"[{index}/{total}] Querying {path} ... ", end="", flush=True)
    elif stage == "endpoint_success":
        count = event.get("count", 0)
        print(f"[OK] (Retrieved {count} records)")
    elif stage == "endpoint_failed":
        err = event.get("error", "Unknown error")
        print(f"[FAILED] Error: {err}")


def main() -> int:
    """Main CLI entrypoint."""
    print("=" * 70)
    print(" MineAtlas - Astroworld API Data Audit (Phase 2)")
    print("=" * 70)
    print(f" Upstream Base URL : {ASTROWORLD_API_BASE_URL}")
    print(f" Endpoints to Audit: {len(AUDIT_TARGETS)}")
    print(f" Inter-call Delay  : {ASTROWORLD_AUDIT_DELAY_SECONDS}s (Sequential)")
    print(f" Rate Budget       : 9 calls (safe under 50 req/min rule)")
    print("=" * 70)
    print()

    client = AstroworldClient()
    service = ApiAuditService(client=client)

    try:
        result: AuditResult = service.run_audit(progress_callback=on_audit_progress)
    except Exception as exc:  # pylint: disable=broad-except
        print(f"\n[FATAL] Audit execution aborted due to unexpected error: {exc}")
        return 1
    finally:
        client.close()

    print()
    print("-" * 70)
    print(" Audit Summary")
    print("-" * 70)
    print(f" Total Endpoints Tested : {result.total_endpoints}")
    print(f" Successful             : {result.successful_endpoints}")
    print(f" Failed                 : {result.failed_endpoints}")
    print(f" Snapshot Folder        : {result.snapshot_directory}")
    print("-" * 70)

    # Detailed results listing
    print("\nEndpoint Breakdown:")
    for record in result.endpoints:
        status_marker = "[OK]    " if record.status == "success" else "[FAILED]"
        print(
            f"  {status_marker} {record.path:<25} -> "
            f"{record.response_count:>5} records ({record.filename})"
        )
        if record.error_message:
            print(f"           Error: {record.error_message}")

    print()
    if result.failed_endpoints > 0:
        print(f"[!] Audit completed with {result.failed_endpoints} failure(s).")
        return 1

    print("[✓] All 9 collection endpoints audited and saved successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

