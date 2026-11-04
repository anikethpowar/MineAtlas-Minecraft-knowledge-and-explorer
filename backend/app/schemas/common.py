"""Common Pydantic models for MineAtlas API responses."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class PaginationMeta(BaseModel):
    """Metadata describing a paginated collection response."""
    page: int = Field(..., ge=1, description="Current 1-based page number.")
    page_size: int = Field(..., ge=1, description="Number of items per page.")
    total_items: int = Field(..., ge=0, description="Total number of items matching filters.")
    total_pages: int = Field(..., ge=0, description="Total number of pages.")


class ProvenanceResponse(BaseModel):
    """Data origin and verification metadata."""
    model_config = ConfigDict(from_attributes=True)

    source_type: str = Field(..., description="Classification of provenance ('astroworld_api', 'curated', 'calculated').")
    source_url: str | None = Field(default=None, description="Direct URL or API endpoint of origin.")
    edition: str = Field(default="java", description="Minecraft edition (always 'java').")
    game_version: str | None = Field(default=None, description="Minecraft Java Edition version when verified.")
    last_verified_at: datetime | None = Field(default=None, description="UTC timestamp of latest verification.")


class ErrorDetail(BaseModel):
    """Standard structured error representation."""
    code: str = Field(..., description="Machine-readable error slug (e.g. 'entity_not_found', 'validation_error').")
    message: str = Field(..., description="Human-readable explanation of the error.")


class ErrorResponse(BaseModel):
    """Standard top-level error response envelope."""
    detail: ErrorDetail

