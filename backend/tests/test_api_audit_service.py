"""Unit tests for the Astroworld API audit service using mocked data."""

import json
from pathlib import Path
from typing import Any
import httpx
import pytest

from app.clients.astroworld_client import AstroworldClient
from app.services.api_audit_service import (
    AUDIT_TARGETS,
    ApiAuditService,
    AuditResult,
)


def mock_endpoint_response(path: str) -> dict[str, Any]:
    """Generates synthetic response fixture matching Astroworld format."""
    resource_name = path.split("/")[-1]
    return {
        "success": True,
        "count": 2,
        "data": [
            {
                "id": f"{resource_name}_1",
                "name": f"Sample {resource_name} 1",
                "optional_field": None,
            },
            {
                "id": f"{resource_name}_2",
                "name": f"Sample {resource_name} 2",
                "optional_field": "Present",
            },
        ],
    }


def create_mock_service(tmp_path: Path, handler=None) -> ApiAuditService:
    """Creates an ApiAuditService hooked to a mock HTTP client and temporary folder."""
    if handler is None:
        def default_handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=mock_endpoint_response(request.url.path))
        handler = default_handler

    transport = httpx.MockTransport(handler)
    http_client = httpx.Client(
        transport=transport,
        base_url="https://api.astroworldmc.com",
    )
    client = AstroworldClient(client=http_client)
    return ApiAuditService(
        client=client,
        output_base_dir=tmp_path,
        delay_seconds=0.0,  # 0 delay for fast unit tests
    )


def test_audit_targets_contains_all_nine_endpoints():
    """Verify that exactly the required 9 endpoints are defined."""
    paths = [target["path"] for target in AUDIT_TARGETS]
    assert len(paths) == 9
    assert "/api/v1/mobs" in paths
    assert "/api/v1/biomes" in paths
    assert "/api/v1/items" in paths
    assert "/api/v1/enchantments" in paths
    assert "/api/v1/structures" in paths
    assert "/api/v1/commands" in paths
    assert "/api/v1/versions" in paths
    assert "/api/v1/achievements" in paths
    assert "/api/v1/trades" in paths


def test_audit_successful_run(tmp_path: Path):
    """Verify that a successful audit writes all files and summary to tmp_path."""
    call_order: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        call_order.append(request.url.path)
        return httpx.Response(200, json=mock_endpoint_response(request.url.path))

    service = create_mock_service(tmp_path, handler)
    progress_events: list[dict[str, Any]] = []

    result: AuditResult = service.run_audit(
        progress_callback=lambda event: progress_events.append(event)
    )

    # 1. Verify all 9 endpoints were called in sequential order
    expected_order = [target["path"] for target in AUDIT_TARGETS]
    assert call_order == expected_order

    # 2. Verify summary statistics
    assert result.total_endpoints == 9
    assert result.successful_endpoints == 9
    assert result.failed_endpoints == 0

    # 3. Verify snapshot folder was created inside tmp_path
    snapshot_dir = Path(result.snapshot_directory)
    assert snapshot_dir.exists()
    assert snapshot_dir.parent == tmp_path

    # 4. Verify all 9 raw JSON files exist and contain valid JSON
    for target in AUDIT_TARGETS:
        file_path = snapshot_dir / target["filename"]
        assert file_path.exists(), f"Missing snapshot file {target['filename']}"
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            assert data["success"] is True
            assert len(data["data"]) == 2

    # 5. Verify audit_summary.json exists and has correct metadata
    summary_path = snapshot_dir / "audit_summary.json"
    assert summary_path.exists()
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
        assert summary["total_endpoints"] == 9
        assert summary["successful_endpoints"] == 9
        assert len(summary["endpoints"]) == 9

        # Check mob record analysis in summary
        mobs_record = next(e for e in summary["endpoints"] if e["resource"] == "mobs")
        assert mobs_record["status"] == "success"
        assert mobs_record["response_count"] == 2
        assert "optional_field" in mobs_record["null_fields_sampled"]
        assert "id" in mobs_record["first_record_fields"]
        assert "name" in mobs_record["first_record_fields"]

    # 6. Verify progress callback was triggered
    assert len(progress_events) == 18  # 9 starting + 9 success


def test_audit_handles_individual_endpoint_failure(tmp_path: Path):
    """Verify that an error on one endpoint does not stop other endpoints from auditing."""
    def handler(request: httpx.Request) -> httpx.Response:
        # Simulate /api/v1/structures failing with 500
        if request.url.path == "/api/v1/structures":
            return httpx.Response(500, text="Internal error")
        return httpx.Response(200, json=mock_endpoint_response(request.url.path))

    service = create_mock_service(tmp_path, handler)
    result = service.run_audit()

    assert result.total_endpoints == 9
    assert result.successful_endpoints == 8
    assert result.failed_endpoints == 1

    # Check that structures was recorded as failed
    struct_record = next(e for e in result.endpoints if e.resource == "structures")
    assert struct_record.status == "failed"
    assert struct_record.http_status == 500
    assert "HTTP 500" in (struct_record.error_message or "")

    # Check that others succeeded
    mobs_record = next(e for e in result.endpoints if e.resource == "mobs")
    assert mobs_record.status == "success"
