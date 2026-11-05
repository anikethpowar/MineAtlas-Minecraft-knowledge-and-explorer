"""Curated Farm Blueprint endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.farms import FarmDetailResponse, FarmListResponse
from app.services.query_service import QueryService

router = APIRouter(prefix="/farms", tags=["farms"])


@router.get("", response_model=FarmListResponse)
def list_farms(
    page: int = Query(1, ge=1, description="Page number."),
    page_size: int = Query(20, ge=1, le=100, description="Records per page."),
    search: str | None = Query(None, description="Filter by title, category, or summary."),
    difficulty: str | None = Query(None, description="Filter by difficulty ('Beginner', 'Intermediate', 'Advanced')."),
    dimension: str | None = Query(None, description="Filter by dimension ('Overworld', 'The Nether', 'The End')."),
    db: Session = Depends(get_db),
) -> FarmListResponse:
    """List curated Minecraft Java Edition farm guides cached in SQLite."""
    service = QueryService(db)
    return service.get_farms(
        page=page,
        page_size=page_size,
        search=search,
        difficulty=difficulty,
        dimension=dimension,
    )


@router.get("/{farm_slug}", response_model=FarmDetailResponse)
def get_farm(
    farm_slug: str,
    db: Session = Depends(get_db),
) -> FarmDetailResponse:
    """Retrieve full structured guide for a curated Minecraft farm."""
    service = QueryService(db)
    return service.get_farm_by_id(farm_slug)

