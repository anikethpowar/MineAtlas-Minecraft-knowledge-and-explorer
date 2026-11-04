"""Astroworld API Audit Service for MineAtlas.

Coordinates safe, sequential inspection of Astroworld collection endpoints
and records raw snapshots and a summary report in backend/data/raw_snapshots/.

ARCHITECTURAL RULES:
1. Endpoints are queried sequentially, never concurrently.
2. A delay of at least 1.3 seconds is observed between outgoing requests.
3. Total requests per audit run = 9, well within the 50 req/min rule.
4. Raw data is stored ONLY under backend/data/raw_snapshots/.
"""

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
import time
from typing import Any, Callable

from app.clients.astroworld_client import (
    AstroworldClient,
    AstroworldClientError,
    AstroworldRateLimitError,
)
from app.config import (
    ASTROWORLD_API_BASE_URL,
    ASTROWORLD_AUDIT_DELAY_SECONDS,
)

# Central definition of the 9 audited endpoints
AUDIT_TARGETS: list[dict[str, str]] = [
    {
        "resource": "mobs",
        "path": "/api/v1/mobs",
        "filename": "mobs.json",
        "method": "get_mobs",
    },
    {
        "resource": "biomes",
        "path": "/api/v1/biomes",
        "filename": "biomes.json",
        "method": "get_biomes",
    },
    {
        "resource": "items",
        "path": "/api/v1/items",
        "filename": "items.json",
        "method": "get_items",
    },
    {
        "resource": "enchantments",
        "path": "/api/v1/enchantments",
        "filename": "enchantments.json",
        "method": "get_enchantments",
    },
    {
        "resource": "structures",
        "path": "/api/v1/structures",
        "filename": "structures.json",
        "method": "get_structures",
    },
    {
        "resource": "commands",
        "path": "/api/v1/commands",
        "filename": "commands.json",
        "method": "get_commands",
    },
    {
        "resource": "versions",
        "path": "/api/v1/versions",
        "filename": "versions.json",
        "method": "get_versions",
    },
    {
        "resource": "achievements",
        "path": "/api/v1/achievements",
        "filename": "achievements.json",
        "method": "get_achievements",
    },
    {
        "resource": "trades",
        "path": "/api/v1/trades",
        "filename": "trades.json",
        "method": "get_trades",
    },
]

DEFAULT_SNAPSHOTS_BASE_DIR = (
    Path(__file__).resolve().parent.parent.parent / "data" / "raw_snapshots"
)


@dataclass
class EndpointAuditRecord:
    """Metadata recorded for each audited endpoint."""

    resource: str
    path: str
    status: str  # "success" or "failed"
    http_status: int
    timestamp_utc: str
    filename: str
    response_count: int = 0
    top_level_fields: list[str] | None = None
    first_record_fields: list[str] | None = None
    null_fields_sampled: list[str] | None = None
    coverage_note: str = ""
    error_message: str | None = None


@dataclass
class AuditResult:
    """Overall outcome of an audit execution."""

    base_url: str
    started_at_utc: str
    completed_at_utc: str
    delay_seconds: float
    snapshot_directory: str
    total_endpoints: int
    successful_endpoints: int
    failed_endpoints: int
    endpoints: list[EndpointAuditRecord]

    def to_dict(self) -> dict[str, Any]:
        """Convert result to a serializable dictionary."""
        return {
            "audit_version": "1.0",
            "base_url": self.base_url,
            "started_at_utc": self.started_at_utc,
            "completed_at_utc": self.completed_at_utc,
            "delay_seconds": self.delay_seconds,
            "snapshot_directory": self.snapshot_directory,
            "total_endpoints": self.total_endpoints,
            "successful_endpoints": self.successful_endpoints,
            "failed_endpoints": self.failed_endpoints,
            "endpoints": [asdict(record) for record in self.endpoints],
        }


class ApiAuditService:
    """Executes sequential audits of Astroworld collection endpoints."""

    def __init__(
        self,
        client: AstroworldClient | None = None,
        output_base_dir: Path | str | None = None,
        delay_seconds: float | None = None,
    ) -> None:
        self.client = client or AstroworldClient()
        self.output_base_dir = (
            Path(output_base_dir)
            if output_base_dir is not None
            else DEFAULT_SNAPSHOTS_BASE_DIR
        )
        self.delay_seconds = (
            delay_seconds
            if delay_seconds is not None
            else ASTROWORLD_AUDIT_DELAY_SECONDS
        )

    def run_audit(
        self,
        progress_callback: Callable[[dict[str, Any]], None] | None = None,
    ) -> AuditResult:
        """Execute a full sequential audit of all nine collection endpoints.

        Args:
            progress_callback: Optional callable receiving progress updates.

        Returns:
            AuditResult containing metadata and list of endpoint results.
        """
        now = datetime.now(timezone.utc)
        started_at_utc = now.isoformat()
        folder_timestamp = now.strftime("%Y-%m-%dT%H-%M-%SZ")

        # Destination folder under backend/data/raw_snapshots/
        snapshot_dir = self.output_base_dir / folder_timestamp
        snapshot_dir.mkdir(parents=True, exist_ok=True)

        records: list[EndpointAuditRecord] = []
        successful_count = 0
        failed_count = 0

        total_targets = len(AUDIT_TARGETS)

        for index, target in enumerate(AUDIT_TARGETS):
            # Observe required sequential delay between calls (skip before the first call)
            if index > 0 and self.delay_seconds > 0:
                time.sleep(self.delay_seconds)

            resource = target["resource"]
            path = target["path"]
            filename = target["filename"]
            req_timestamp = datetime.now(timezone.utc).isoformat()

            if progress_callback:
                progress_callback({
                    "stage": "starting_endpoint",
                    "index": index + 1,
                    "total": total_targets,
                    "resource": resource,
                    "path": path,
                })

            try:
                # Query client method (e.g. client.get_mobs())
                method = getattr(self.client, target["method"])
                payload: dict[str, Any] = method()

                # Extract top-level keys
                top_level_fields = sorted(list(payload.keys()))

                # Extract count
                if "count" in payload and isinstance(payload["count"], int):
                    response_count = payload["count"]
                elif "data" in payload and isinstance(payload["data"], list):
                    response_count = len(payload["data"])
                elif "data" in payload and isinstance(payload["data"], dict):
                    response_count = len(payload["data"])
                else:
                    response_count = 0

                # Analyze data structure & sample first record
                first_record_fields: list[str] = []
                null_fields: set[str] = set()

                raw_data = payload.get("data")
                if isinstance(raw_data, list) and len(raw_data) > 0:
                    first_item = raw_data[0]
                    if isinstance(first_item, dict):
                        first_record_fields = sorted(list(first_item.keys()))

                    # Sample up to first 25 records to observe null values
                    for item in raw_data[:25]:
                        if isinstance(item, dict):
                            for k, v in item.items():
                                if v is None:
                                    null_fields.add(k)

                elif isinstance(raw_data, dict):
                    first_record_fields = sorted(list(raw_data.keys()))
                    for k, v in raw_data.items():
                        if v is None:
                            null_fields.add(k)

                coverage_note = (
                    f"Observed {response_count} {resource} records from {path}."
                )

                # Save raw response file in snapshot directory
                file_path = snapshot_dir / filename
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(payload, f, indent=2, ensure_ascii=False)

                record = EndpointAuditRecord(
                    resource=resource,
                    path=path,
                    status="success",
                    http_status=200,
                    timestamp_utc=req_timestamp,
                    filename=filename,
                    response_count=response_count,
                    top_level_fields=top_level_fields,
                    first_record_fields=first_record_fields,
                    null_fields_sampled=sorted(list(null_fields)),
                    coverage_note=coverage_note,
                    error_message=None,
                )
                successful_count += 1

                if progress_callback:
                    progress_callback({
                        "stage": "endpoint_success",
                        "index": index + 1,
                        "total": total_targets,
                        "resource": resource,
                        "path": path,
                        "count": response_count,
                    })

            except AstroworldRateLimitError as exc:
                failed_count += 1
                record = EndpointAuditRecord(
                    resource=resource,
                    path=path,
                    status="failed",
                    http_status=429,
                    timestamp_utc=req_timestamp,
                    filename=filename,
                    error_message=str(exc),
                    coverage_note=f"Rate limited (HTTP 429). Retry-After: {exc.retry_after}",
                )
                if progress_callback:
                    progress_callback({
                        "stage": "endpoint_failed",
                        "index": index + 1,
                        "total": total_targets,
                        "resource": resource,
                        "path": path,
                        "error": str(exc),
                    })

            except AstroworldClientError as exc:
                failed_count += 1
                status_code = getattr(exc, "status_code", 500)
                record = EndpointAuditRecord(
                    resource=resource,
                    path=path,
                    status="failed",
                    http_status=status_code,
                    timestamp_utc=req_timestamp,
                    filename=filename,
                    error_message=str(exc),
                    coverage_note=f"Request failed: {exc}",
                )
                if progress_callback:
                    progress_callback({
                        "stage": "endpoint_failed",
                        "index": index + 1,
                        "total": total_targets,
                        "resource": resource,
                        "path": path,
                        "error": str(exc),
                    })

            except Exception as exc:  # pylint: disable=broad-except
                failed_count += 1
                record = EndpointAuditRecord(
                    resource=resource,
                    path=path,
                    status="failed",
                    http_status=500,
                    timestamp_utc=req_timestamp,
                    filename=filename,
                    error_message=f"Unexpected error: {exc}",
                    coverage_note=f"Unexpected error: {exc}",
                )
                if progress_callback:
                    progress_callback({
                        "stage": "endpoint_failed",
                        "index": index + 1,
                        "total": total_targets,
                        "resource": resource,
                        "path": path,
                        "error": str(exc),
                    })

            records.append(record)

        completed_at_utc = datetime.now(timezone.utc).isoformat()

        audit_result = AuditResult(
            base_url=self.client.base_url,
            started_at_utc=started_at_utc,
            completed_at_utc=completed_at_utc,
            delay_seconds=self.delay_seconds,
            snapshot_directory=str(snapshot_dir),
            total_endpoints=total_targets,
            successful_endpoints=successful_count,
            failed_endpoints=failed_count,
            endpoints=records,
        )

        # Write audit_summary.json into snapshot directory
        summary_path = snapshot_dir / "audit_summary.json"
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(audit_result.to_dict(), f, indent=2, ensure_ascii=False)

        return audit_result

