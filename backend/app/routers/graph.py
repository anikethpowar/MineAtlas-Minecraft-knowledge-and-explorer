"""FastAPI router for localized knowledge graph neighborhood exploration."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.graph import GraphNeighborsResponse
from app.services.graph_service import GraphService

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/neighbors/{entity_type}/{entity_id}", response_model=GraphNeighborsResponse)
def get_graph_neighbors(
    entity_type: str,
    entity_id: str,
    depth: int = Query(1, ge=1, le=2, description="Traversal radius depth (1 or 2)."),
    relationship_types: str | None = Query(None, description="Optional comma-separated relationship types to filter (e.g. 'DROPS,SPAWNS_IN')."),
    limit: int = Query(50, ge=1, le=100, description="Max total graph edges to return."),
    db: Session = Depends(get_db),
) -> GraphNeighborsResponse:
    """Retrieve localized knowledge graph neighborhood up to depth 2 for an entity.

    Strictly reads from cached RelationEdge and entity tables in local SQLite.
    Never traverses the entire global graph.
    """
    service = GraphService(db)
    rel_types = [r.strip() for r in relationship_types.split(",") if r.strip()] if relationship_types else None
    return service.get_neighbors(
        entity_type=entity_type,
        entity_id=entity_id,
        depth=depth,
        relationship_types=rel_types,
        limit=limit,
    )

