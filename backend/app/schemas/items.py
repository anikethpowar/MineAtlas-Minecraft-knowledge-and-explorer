"""Pydantic schemas for Minecraft items and key blocks."""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PaginationMeta, ProvenanceResponse


class ItemListItem(BaseModel):
    """Concise representation of an Item or Key Block in paginated lists."""
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Natural item slug (e.g. 'diamond_sword', 'iron_ingot').")
    name: str = Field(..., description="Display title.")
    category: str | None = Field(default=None, description="Category (e.g. 'tool', 'combat', 'resource', 'food').")
    stack_size: int = Field(default=64, description="Max stack size.")
    durability: int | None = Field(default=None, description="Max durability points.")
    enchantable: bool = Field(default=False, description="Whether item accepts enchantments.")
    version_added: str | None = Field(default=None, description="Minecraft version when introduced.")


class ItemDetail(BaseModel):
    """Comprehensive representation of a single Item or Key Block."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str | None = None
    stack_size: int = 64
    durability: int | None = None
    description: str | None = None
    enchantable: bool = False
    food_hunger: int | None = None
    food_saturation: float | None = None
    fuel_value: int | None = None
    version_added: str | None = None
    notes: str | None = None
    source: ProvenanceResponse
    coverage_note: str | None = None


class ItemListResponse(BaseModel):
    """Paginated collection response for items."""
    data: list[ItemListItem]
    pagination: PaginationMeta
    filters: dict[str, Any] = Field(default_factory=dict)


class ItemDetailResponse(BaseModel):
    """Envelope for a single item detail response."""
    data: ItemDetail

