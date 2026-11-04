"""Pydantic schemas for the public cached data status endpoint."""

from datetime import datetime
from pydantic import BaseModel, Field


class DataStatusResponse(BaseModel):
    """Overall status and freshness of the cached SQLite Minecraft database."""
    status: str = Field(..., description="High-level health state of the local cache ('healthy', 'stale', 'empty').")
    latest_sync_status: str | None = Field(default=None, description="Outcome of latest sync ('success', 'partial_failure', 'failed').")
    latest_sync_started_at: datetime | None = Field(default=None, description="UTC timestamp when latest sync started.")
    latest_sync_completed_at: datetime | None = Field(default=None, description="UTC timestamp when latest sync completed.")
    cache_freshness_seconds: float | None = Field(default=None, description="Seconds elapsed since latest successful sync.")
    cache_freshness_human: str | None = Field(default=None, description="Human-readable elapsed duration (e.g. '12 minutes ago').")
    total_entities: int = Field(..., ge=0, description="Sum of all cached entity rows across all collections.")
    total_relationship_edges: int = Field(..., ge=0, description="Total semantic graph edges in relation_edges.")
    cached_counts: dict[str, int] = Field(default_factory=dict, description="Entity breakdown by table name.")
    edition: str = Field(default="java", description="Target Minecraft edition (always 'java').")
    coverage_summary: str = Field(..., description="Summary of current coverage boundaries (e.g. key items/blocks only).")

