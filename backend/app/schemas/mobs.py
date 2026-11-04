"""Pydantic schemas for Minecraft mobs."""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PaginationMeta, ProvenanceResponse


class MobListItem(BaseModel):
    """Concise representation of a Mob in paginated lists."""
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Natural mob slug (e.g. 'zombie', 'cow').")
    name: str = Field(..., description="Display title.")
    mob_type: str | None = Field(default=None, description="Behavioral classification ('passive', 'hostile', 'neutral', 'boss').")
    category: str | None = Field(default=None, description="Biological/functional group (e.g. 'animal', 'undead').")
    hp: float | None = Field(default=None, description="Base health points.")
    tameable: bool = Field(default=False, description="Whether player can tame this mob.")
    breedable: bool = Field(default=False, description="Whether player can breed this mob.")
    version_added: str | None = Field(default=None, description="Minecraft version when introduced.")


class MobDetail(BaseModel):
    """Comprehensive representation of a single Mob."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    mob_type: str | None = None
    category: str | None = None
    behavior: str | None = None
    hp: float | None = None
    damage_easy: float | None = None
    damage_normal: float | None = None
    damage_hard: float | None = None
    xp_min: int | None = None
    xp_max: int | None = None
    spawn_conditions: str | None = None
    tameable: bool = False
    taming_method: str | None = None
    breedable: bool = False
    breeding_item: str | None = None
    version_added: str | None = None
    notes: str | None = None
    source: ProvenanceResponse
    coverage_note: str | None = None


class MobListResponse(BaseModel):
    """Paginated collection response for mobs."""
    data: list[MobListItem]
    pagination: PaginationMeta
    filters: dict[str, Any] = Field(default_factory=dict)


class MobDetailResponse(BaseModel):
    """Envelope for a single mob detail response."""
    data: MobDetail

