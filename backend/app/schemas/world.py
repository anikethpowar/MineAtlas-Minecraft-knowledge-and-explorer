"""Pydantic schemas for Calculated World Atlas Tools and Curated World Reference."""

from typing import Any
from pydantic import BaseModel, Field


# ==================== WORLD REFERENCE ====================
class DimensionReference(BaseModel):
    """Curated reference metadata for a Minecraft dimension."""

    id: str = Field(..., description="Dimension slug ('overworld', 'nether', 'the_end').")
    name: str = Field(..., description="Display title.")
    role: str = Field(..., description="Primary environmental role and gameplay purpose.")
    description: str = Field(..., description="Concise original description.")
    coordinate_scale: str = Field(..., description="Horizontal coordinate scale relative to Overworld.")
    skylight: bool = Field(..., description="Whether sky light and celestial objects exist.")
    bed_safe: bool = Field(..., description="Whether beds can be used safely without exploding.")
    min_y: int = Field(..., description="Minimum build/generation height.")
    max_y: int = Field(..., description="Maximum build height.")
    source_type: str = Field(default="curated", description="Provenance category ('curated').")
    edition: str = Field(default="java", description="Minecraft Java Edition.")


class CoordinatesExplanation(BaseModel):
    """Curated beginner-friendly explanation of the Minecraft coordinate system."""

    x_axis: str = Field(..., description="East/West axis explanation.")
    y_axis: str = Field(..., description="Vertical altitude axis explanation.")
    z_axis: str = Field(..., description="South/North axis explanation.")
    origin_point: str = Field(..., description="Definition of coordinates 0, 0.")
    world_border: str = Field(..., description="Scope and bounds of standard Java Edition world border.")


class WorldReferenceResponse(BaseModel):
    """Response envelope for GET /api/world/reference."""

    title: str = Field(default="Minecraft Java Edition World Atlas Reference")
    edition: str = Field(default="java")
    dimensions: list[DimensionReference]
    coordinate_system: CoordinatesExplanation
    dimension_travel_rules: list[str]
    seed_limitation_statement: str
    provenance: dict[str, str] = Field(default_factory=lambda: {"source_type": "curated", "edition": "java"})


# ==================== NETHER PORTAL CONVERTER ====================
class PortalCoordinates(BaseModel):
    """Three-dimensional coordinate coordinates tuple."""

    x: float = Field(..., description="Horizontal East/West coordinate.")
    y: float = Field(..., description="Vertical altitude coordinate.")
    z: float = Field(..., description="Horizontal South/North coordinate.")


class PortalConvertRequest(BaseModel):
    """Input payload for POST /api/world/portal-convert."""

    source_dimension: str = Field(..., description="Starting dimension ('overworld' or 'nether').")
    x: float = Field(..., ge=-30000000, le=30000000, description="Source X coordinate within standard world bounds.")
    y: float = Field(..., ge=-64, le=320, description="Source Y coordinate.")
    z: float = Field(..., ge=-30000000, le=30000000, description="Source Z coordinate within standard world bounds.")


class PortalConvertResponse(BaseModel):
    """Calculated result payload for POST /api/world/portal-convert."""

    result_type: str = Field(default="Calculated Result")
    source_dimension: str
    target_dimension: str
    source_coordinates: PortalCoordinates
    target_coordinates: PortalCoordinates
    formula_name: str
    formula_expression: str
    formula_explanation: str
    assumptions: list[str]
    limitations: list[str]
    provenance: dict[str, str] = Field(default_factory=lambda: {"source_type": "calculated", "edition": "java"})


# ==================== BIOME CRITERIA EXPLORER ====================
class BiomeMatchSummary(BaseModel):
    """Essential biome attributes returned by criteria matcher."""

    id: str
    name: str
    dimension: str | None = None
    category: str | None = None
    rarity: str | None = None
    temperature: float | None = None
    precipitation: str | None = None


class BiomeMatchItem(BaseModel):
    """A matching biome item with explainable, deterministic match reasons."""

    biome: BiomeMatchSummary
    match_reasons: list[str]
    source: dict[str, str] = Field(default_factory=lambda: {"source_type": "calculated", "edition": "java"})


class BiomeMatchesResponse(BaseModel):
    """Response envelope for GET /api/world/biome-matches."""

    result_type: str = Field(default="Calculated Result")
    criteria: dict[str, Any]
    total_matches: int
    data: list[BiomeMatchItem]
    limitations: list[str]
    provenance: dict[str, str] = Field(default_factory=lambda: {"source_type": "calculated", "edition": "java"})


# ==================== SPAWN SPHERE VISUALIZER ====================
class SpawnSphereRequest(BaseModel):
    """Input payload for POST /api/world/spawn-sphere."""

    radius: float = Field(..., gt=0, le=512, description="Target radius in blocks (e.g. 24, 32, 128).")
    player_y: float | None = Field(default=None, ge=-64, le=320, description="Optional player Y altitude.")


class SpawnSphereMeasurements(BaseModel):
    """Calculated geometric metrics for a radius / sphere."""

    radius: float
    diameter: float
    circular_area_blocks: float
    sphere_volume_blocks: float
    circumference_blocks: float
    vertical_range: dict[str, float] | None = None


class SpawnSphereResponse(BaseModel):
    """Calculated result payload for POST /api/world/spawn-sphere."""

    result_type: str = Field(default="Calculated Result")
    measurements: SpawnSphereMeasurements
    geometric_explanation: str
    formulas_used: dict[str, str]
    assumptions: list[str]
    limitations: list[str]
    provenance: dict[str, str] = Field(default_factory=lambda: {"source_type": "calculated", "edition": "java"})

