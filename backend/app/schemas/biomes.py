"""Pydantic schemas for Minecraft biomes."""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PaginationMeta, ProvenanceResponse


class BiomeListItem(BaseModel):
    """Concise representation of a Biome in paginated lists."""
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Namespaced biome ID (e.g. 'minecraft:plains').")
    name: str = Field(..., description="Display title.")
    dimension: str | None = Field(default=None, description="Dimension ('overworld', 'nether', 'the_end').")
    category: str | None = Field(default=None, description="Environmental category (e.g. 'temperate', 'arid').")
    temperature: float | None = Field(default=None, description="Ambient climate temperature.")
    precipitation: str | None = Field(default=None, description="Precipitation type ('rain', 'snow', 'none').")
    rarity: str | None = Field(default=None, description="Spawn rarity ('common', 'uncommon', 'rare').")
    version_added: str | None = Field(default=None, description="Minecraft version when introduced.")


class BiomeDetail(BaseModel):
    """Comprehensive representation of a single Biome."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    dimension: str | None = None
    category: str | None = None
    temperature: float | None = None
    precipitation: str | None = None
    rarity: str | None = None
    version_added: str | None = None
    notes: str | None = None
    source: ProvenanceResponse
    coverage_note: str | None = None


class BiomeListResponse(BaseModel):
    """Paginated collection response for biomes."""
    data: list[BiomeListItem]
    pagination: PaginationMeta
    filters: dict[str, Any] = Field(default_factory=dict)


class BiomeDetailResponse(BaseModel):
    """Envelope for a single biome detail response."""
    data: BiomeDetail

