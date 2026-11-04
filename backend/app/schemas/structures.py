"""Pydantic schemas for Minecraft structures."""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PaginationMeta, ProvenanceResponse


class StructureListItem(BaseModel):
    """Concise representation of a Structure in paginated lists."""
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Natural structure slug (e.g. 'village', 'ancient_city').")
    name: str = Field(..., description="Display title.")
    dimension: str | None = Field(default=None, description="Dimension ('overworld', 'nether', 'the_end').")
    category: str | None = Field(default=None, description="Category (e.g. 'settlement', 'dungeon', 'ruin').")
    rarity: str | None = Field(default=None, description="Generation rarity ('common', 'uncommon', 'rare').")
    y_min: int | None = Field(default=None, description="Min typical Y-coordinate.")
    y_max: int | None = Field(default=None, description="Max typical Y-coordinate.")
    version_added: str | None = Field(default=None, description="Minecraft version when introduced.")


class StructureDetail(BaseModel):
    """Comprehensive representation of a single Structure."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    dimension: str | None = None
    category: str | None = None
    rarity: str | None = None
    y_min: int | None = None
    y_max: int | None = None
    how_to_find: str | None = None
    version_added: str | None = None
    notes: str | None = None
    source: ProvenanceResponse
    coverage_note: str | None = None


class StructureListResponse(BaseModel):
    """Paginated collection response for structures."""
    data: list[StructureListItem]
    pagination: PaginationMeta
    filters: dict[str, Any] = Field(default_factory=dict)


class StructureDetailResponse(BaseModel):
    """Envelope for a single structure detail response."""
    data: StructureDetail

