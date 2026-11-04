"""Global multi-entity search endpoint."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.search import SearchResponse
from app.services.query_service import QueryService

router = APIRouter(tags=["search"])


@router.get("/search", response_model=SearchResponse)
def search_entities(
    q: str = Query(..., min_length=1, description="Case-insensitive search string."),
    types: str | None = Query(None, description="Optional comma-separated list of entity types to filter (e.g. 'mob,item')."),
    limit: int = Query(20, ge=1, le=100, description="Max total search results to return."),
    db: Session = Depends(get_db),
) -> SearchResponse:
    """Search across cached Minecraft mobs, biomes, items, structures, enchantments, achievements, commands, versions, and villager professions."""
    service = QueryService(db)
    type_list = [t.strip() for t in types.split(",") if t.strip()] if types else None
    return service.search_all(query=q, types=type_list, limit=limit)

