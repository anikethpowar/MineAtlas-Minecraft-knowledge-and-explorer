"""Pydantic schemas for global entity search."""

from pydantic import BaseModel, Field


class SearchResultItem(BaseModel):
    """Individual entity match in global search results."""
    entity_type: str = Field(..., description="Canonical entity category (e.g. 'mob', 'biome', 'item', 'structure').")
    id: str = Field(..., description="Natural stable identifier or slug.")
    name: str = Field(..., description="Display title of the matching entity.")
    subtitle: str | None = Field(default=None, description="Concise secondary context (e.g. category, type, workstation).")
    description: str | None = Field(default=None, description="Brief description snippet if available.")
    source_type: str = Field(default="astroworld_api", description="Provenance classification.")
    edition: str = Field(default="java", description="Target Minecraft edition ('java').")
    game_version: str | None = Field(default=None, description="Minecraft version where entity was added/verified.")


class SearchResponse(BaseModel):
    """Envelope for global multi-entity search results."""
    query: str = Field(..., description="Normalized search term.")
    total_results: int = Field(..., ge=0, description="Total matching items across all entity types.")
    results: list[SearchResultItem] = Field(default_factory=list, description="Array of search matches.")
    by_type: dict[str, int] = Field(default_factory=dict, description="Distribution of matches grouped by entity type.")

