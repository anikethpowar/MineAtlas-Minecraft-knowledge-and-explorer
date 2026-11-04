"""Pydantic schemas for supporting reference entities."""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PaginationMeta, ProvenanceResponse


# ==================== ENCHANTMENTS ====================
class EnchantmentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Natural slug (e.g. 'sharpness', 'mending').")
    name: str = Field(..., description="Display title.")
    category: str | None = Field(default=None, description="Equipment category.")
    max_level: int = Field(default=1, description="Max level.")
    treasure_only: bool = Field(default=False, description="Whether obtainable exclusively from loot/trades.")
    curse_of: bool = Field(default=False, description="Whether this is a curse.")
    version_added: str | None = Field(default=None, description="Minecraft version when introduced.")


class EnchantmentDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str | None = None
    max_level: int = 1
    description: str | None = None
    treasure_only: bool = False
    curse_of: bool = False
    weight: int | None = None
    version_added: str | None = None
    notes: str | None = None
    source: ProvenanceResponse
    coverage_note: str | None = None


class EnchantmentListResponse(BaseModel):
    data: list[EnchantmentListItem]
    pagination: PaginationMeta
    filters: dict[str, Any] = Field(default_factory=dict)


class EnchantmentDetailResponse(BaseModel):
    data: EnchantmentDetail


# ==================== ACHIEVEMENTS / ADVANCEMENTS ====================
class AchievementListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Full namespaced ID (e.g. 'minecraft:story/root').")
    slug: str = Field(..., description="Short slug.")
    name: str = Field(..., description="Display title.")
    tab: str | None = Field(default=None, description="Advancement tab (e.g. 'story', 'nether').")
    icon: str | None = Field(default=None, description="Icon item.")
    parent_id: str | None = Field(default=None, description="Parent advancement ID.")


class AchievementDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    name: str
    tab: str | None = None
    description: str | None = None
    icon: str | None = None
    parent_id: str | None = None
    how_to_complete: str | None = None
    xp_reward: int = 0
    is_goal: bool = False
    is_challenge: bool = False
    difficulty: str | None = None
    version_added: str | None = None
    source: ProvenanceResponse
    coverage_note: str | None = None


class AchievementListResponse(BaseModel):
    data: list[AchievementListItem]
    pagination: PaginationMeta
    filters: dict[str, Any] = Field(default_factory=dict)


class AchievementDetailResponse(BaseModel):
    data: AchievementDetail


# ==================== VERSIONS ====================
class VersionListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str = Field(..., description="Version slug (e.g. '1-21', '1-20').")
    name: str = Field(..., description="Display version number (e.g. '1.21').")
    edition: str = Field(default="java")
    release_date: str | None = Field(default=None, description="Release date (YYYY-MM-DD).")
    release_type: str | None = Field(default=None, description="Classification ('major-release', 'minor-release').")
    update_name: str | None = Field(default=None, description="Marketing update name (e.g. 'Tricky Trials').")


class VersionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    name: str
    edition: str = "java"
    release_date: str | None = None
    release_type: str | None = None
    update_name: str | None = None
    previous_version_slug: str | None = None
    next_version_slug: str | None = None
    source: ProvenanceResponse
    coverage_note: str | None = None


class VersionListResponse(BaseModel):
    data: list[VersionListItem]
    pagination: PaginationMeta
    filters: dict[str, Any] = Field(default_factory=dict)


class VersionDetailResponse(BaseModel):
    data: VersionDetail


# ==================== COMMANDS ====================
class CommandListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., description="Command name without slash (e.g. 'give', 'teleport').")
    syntax: str = Field(..., description="Invocation syntax string.")
    permission_level: int = Field(default=0, description="Required permission level.")
    category: str | None = Field(default=None, description="Category (e.g. 'player', 'world').")
    version_added: str | None = Field(default=None, description="Minecraft version when introduced.")


class CommandDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    syntax: str
    description: str | None = None
    permission_level: int = 0
    category: str | None = None
    version_added: str | None = None
    notes: str | None = None
    source: ProvenanceResponse
    coverage_note: str | None = None


class CommandListResponse(BaseModel):
    data: list[CommandListItem]
    pagination: PaginationMeta
    filters: dict[str, Any] = Field(default_factory=dict)


class CommandDetailResponse(BaseModel):
    data: CommandDetail


# ==================== TRADES ====================
class TradeListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    trade_id: str = Field(..., description="Unique natural slug.")
    profession_id: str = Field(..., description="Villager profession ID.")
    level: int = Field(..., description="Mastery tier (1 to 5).")
    level_name: str | None = Field(default=None, description="Tier title (e.g. 'Novice', 'Master').")
    gives_item: str = Field(..., description="Item given by player.")
    gives_amount: int = Field(default=1)
    receives_item: str = Field(..., description="Item received by player.")
    receives_amount: int = Field(default=1)


class TradeDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    trade_id: str
    profession_id: str
    level: int
    level_name: str | None = None
    gives_item: str
    gives_amount: int = 1
    receives_item: str
    receives_amount: int = 1
    max_uses: int | None = None
    price_multiplier: float | None = None
    notes: str | None = None
    source: ProvenanceResponse
    coverage_note: str | None = None


class TradeListResponse(BaseModel):
    data: list[TradeListItem]
    pagination: PaginationMeta
    filters: dict[str, Any] = Field(default_factory=dict)


class TradeDetailResponse(BaseModel):
    data: TradeDetail


# ==================== VILLAGER PROFESSIONS ====================
class VillagerProfessionListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Profession slug (e.g. 'armorer', 'librarian').")
    name: str = Field(..., description="Display title.")
    workstation: str | None = Field(default=None, description="Required workstation block.")
    biome_specific: bool = Field(default=False, description="Whether trades vary by biome clothing.")


class VillagerProfessionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    workstation: str | None = None
    description: str | None = None
    biome_specific: bool = False
    trades: list[TradeListItem] = Field(default_factory=list, description="All trades offered by this profession.")
    source: ProvenanceResponse
    coverage_note: str | None = None


class VillagerProfessionListResponse(BaseModel):
    data: list[VillagerProfessionListItem]
    pagination: PaginationMeta
    filters: dict[str, Any] = Field(default_factory=dict)


class VillagerProfessionDetailResponse(BaseModel):
    data: VillagerProfessionDetail
