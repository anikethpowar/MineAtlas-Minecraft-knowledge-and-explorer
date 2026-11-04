"""Pydantic schemas for the focused graph-neighbour endpoint."""

from typing import Any
from pydantic import BaseModel, Field


class GraphRoot(BaseModel):
    """The central focus entity of the neighborhood traversal."""
    entity_type: str = Field(..., description="Root entity type (e.g. 'mob', 'biome', 'item', 'structure').")
    entity_id: str = Field(..., description="Root entity identifier.")
    name: str = Field(..., description="Display title of the root entity.")


class GraphNode(BaseModel):
    """A node in the localized graph neighborhood."""
    entity_type: str = Field(..., description="Node entity type (e.g. 'mob', 'item', 'biome').")
    id: str = Field(..., description="Natural identifier or slug.")
    name: str = Field(..., description="Display title.")
    source_type: str = Field(default="astroworld_api", description="Provenance origin.")
    edition: str = Field(default="java", description="Minecraft Java Edition.")
    game_version: str | None = Field(default=None, description="Game version when added/verified.")


class GraphEdge(BaseModel):
    """A directed semantic edge between two entities."""
    id: int | None = Field(default=None, description="RelationEdge ID.")
    source_entity_type: str = Field(..., description="Source entity type.")
    source_entity_id: str = Field(..., description="Source entity ID.")
    relationship_type: str = Field(..., description="Predicate verb (e.g. 'DROPS', 'SPAWNS_IN', 'FOUND_IN').")
    target_entity_type: str = Field(..., description="Target entity type.")
    target_entity_id: str = Field(..., description="Target entity ID.")
    source_type: str = Field(default="astroworld_api", description="Provenance origin.")
    metadata: dict[str, Any] | None = Field(default=None, description="Normalized chance, count, or trade metadata.")
    explanation: str = Field(..., description="Deterministic human-readable explanation of why entities are linked.")


class GraphMetadata(BaseModel):
    """Metadata detailing the graph neighborhood traversal."""
    depth: int = Field(..., ge=1, le=2, description="Explored traversal radius.")
    truncated: bool = Field(default=False, description="Whether node or edge limits truncated further traversal.")
    available_relationship_types: list[str] = Field(default_factory=list, description="Unique relationship predicates present in this neighborhood.")
    total_nodes: int = Field(..., ge=0, description="Total nodes returned.")
    total_edges: int = Field(..., ge=0, description="Total edges returned.")


class GraphNeighborsResponse(BaseModel):
    """Response envelope for graph neighborhood queries."""
    root: GraphRoot
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    metadata: GraphMetadata

