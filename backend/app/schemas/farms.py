"""Pydantic schemas for Curated Farm Blueprint guides."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field

from app.schemas.common import PaginationMeta


class FarmOutputItem(BaseModel):
    """A production output item yield specification."""

    item: str = Field(..., description="Item natural slug.")
    label: str = Field(..., description="Display title for the output item.")
    rate: str = Field(..., description="Estimated production rate per hour or condition.")
    is_primary: bool = Field(default=True, description="Whether this is the principal farm output.")
    note: str | None = Field(default=None, description="Handling or collection detail.")


class FarmMaterialItem(BaseModel):
    """An ingredient or building block required to construct the farm."""

    item: str = Field(..., description="Name or description of material.")
    amount: int = Field(..., ge=1, description="Quantity required.")
    category: str = Field(default="Building", description="Material categorization.")
    note: str | None = Field(default=None, description="Practical builder note or variation.")


class FarmBuildStep(BaseModel):
    """A numbered construction step with architectural reasoning."""

    step_number: int = Field(..., ge=1, description="Sequential step index.")
    title: str = Field(..., description="Concise phase summary.")
    description: str = Field(..., description="Original practical instruction.")
    why_it_matters: str | None = Field(
        default=None,
        description="Underlying Minecraft mechanic explanation for why this step exists.",
    )


class FarmTroubleshootingItem(BaseModel):
    """A common construction failure mode, symptom, and suggested check."""

    issue: str = Field(..., description="Observed symptom or error.")
    likely_cause: str = Field(..., description="Probable mechanic failure or oversight.")
    suggested_check: str = Field(..., description="Actionable verification step to fix the farm.")


class FarmSourceReference(BaseModel):
    """Documentation reference citation."""

    title: str = Field(..., description="Source title or wiki article.")
    url: str | None = Field(default=None, description="External citation URL.")
    note: str | None = Field(default=None, description="Verification note.")


class FarmListItem(BaseModel):
    """Summary item for Farm Blueprint Hub listing."""

    id: str = Field(..., description="Unique farm slug (e.g. 'iron-farm', 'raid-farm').")
    name: str = Field(..., description="Farm title.")
    category: str = Field(..., description="Farm category ('iron', 'mob', 'villager').")
    difficulty: str | None = Field(default=None, description="Difficulty level ('Beginner', 'Intermediate', 'Advanced').")
    dimension: str = Field(default="Overworld", description="Dimension ('Overworld', 'The Nether', 'The End').")
    estimated_output_per_hour: str | None = Field(default=None, description="Summary yield per hour.")
    summary: str | None = Field(default=None, description="Short high-level overview.")
    compatibility_label: str | None = Field(default=None, description="Prominent version compatibility notice.")
    source_type: str = Field(default="curated", description="Provenance origin ('curated').")
    edition: str = Field(default="java", description="Minecraft Java Edition.")
    last_verified_at: datetime | None = Field(default=None, description="Date verified against Java mechanics.")


class FarmListResponse(BaseModel):
    """Paginated response for farm listings."""

    data: list[FarmListItem]
    pagination: PaginationMeta
    filters: dict[str, Any]


class FarmDetail(BaseModel):
    """Complete structured guide for a curated Minecraft farm."""

    id: str = Field(..., description="Unique farm slug.")
    name: str = Field(..., description="Farm title.")
    category: str = Field(..., description="Farm category.")
    difficulty: str | None = Field(default=None, description="Difficulty level.")
    dimension: str = Field(default="Overworld", description="Required dimension.")
    summary: str | None = Field(default=None, description="Short overview.")
    description: str | None = Field(default=None, description="Architectural summary and principles.")
    estimated_output_per_hour: str | None = Field(default=None, description="Output rate summary.")
    compatibility_label: str | None = Field(default=None, description="Version compatibility badge.")
    coverage_note: str | None = Field(default=None, description="Compatibility warnings and caveats.")
    safety_note: str | None = Field(default=None, description="Player safety and lightning protection.")
    maintenance_summary: str | None = Field(default=None, description="Ongoing maintenance procedures.")
    notes: str | None = Field(default=None, description="General builder caveats.")
    outputs: list[FarmOutputItem] = Field(default_factory=list, description="Structured outputs.")
    prerequisites: list[str] = Field(default_factory=list, description="Prerequisite conditions.")
    materials: list[FarmMaterialItem] = Field(default_factory=list, description="Materials checklist.")
    build_steps: list[FarmBuildStep] = Field(default_factory=list, description="Numbered build instructions.")
    troubleshooting: list[FarmTroubleshootingItem] = Field(default_factory=list, description="Troubleshooting guide.")
    diagram_data: dict[str, Any] | None = Field(default=None, description="Explanatory diagram zones.")
    source_references: list[FarmSourceReference] = Field(default_factory=list, description="Authoritative references.")
    source_type: str = Field(default="curated", description="Provenance origin.")
    source_url: str | None = Field(default=None, description="Primary source URL.")
    edition: str = Field(default="java", description="Minecraft Java Edition.")
    game_version: str | None = Field(default=None, description="Target game version.")
    last_verified_at: datetime | None = Field(default=None, description="Verification date.")
    created_at: datetime
    updated_at: datetime


class FarmDetailResponse(BaseModel):
    """Response envelope for single farm detail."""

    data: FarmDetail

