"""FastAPI router for Minecraft Biomes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models import Biome
from app.db.session import get_db
from app.schemas.biomes import (
    BiomeDetail,
    BiomeDetailResponse,
    BiomeListItem,
    BiomeListResponse,
)
from app.services.query_service import QueryService, extract_provenance, paginate

router = APIRouter(prefix="/biomes", tags=["biomes"])


@router.get("", response_model=BiomeListResponse)
def list_biomes(
    page: int = Query(1, ge=1, description="Page number (1-based)."),
    page_size: int = Query(20, ge=1, le=100, description="Items per page."),
    search: str | None = Query(None, description="Filter by name, ID, or notes."),
    dimension: str | None = Query(None, description="Filter by dimension ('overworld', 'nether', 'the_end')."),
    category: str | None = Query(None, description="Filter by category (e.g. 'temperate', 'arid', 'cold')."),
    rarity: str | None = Query(None, description="Filter by spawn rarity ('common', 'uncommon', 'rare')."),
    db: Session = Depends(get_db),
) -> BiomeListResponse:
    """Retrieve a paginated, filterable list of Minecraft biomes from local SQLite cache."""
    stmt = select(Biome).order_by(Biome.name.asc())

    filters_applied: dict[str, str | None] = {
        "search": search,
        "dimension": dimension,
        "category": category,
        "rarity": rarity,
    }

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Biome.name).like(term),
                func.lower(Biome.id).like(term),
                func.lower(Biome.notes).like(term),
            )
        )

    if dimension and dimension.strip():
        stmt = stmt.where(func.lower(Biome.dimension) == dimension.strip().lower())

    if category and category.strip():
        stmt = stmt.where(func.lower(Biome.category) == category.strip().lower())

    if rarity and rarity.strip():
        stmt = stmt.where(func.lower(Biome.rarity) == rarity.strip().lower())

    items, pagination = paginate(db, stmt, page=page, page_size=page_size)

    return BiomeListResponse(
        data=[BiomeListItem.model_validate(b) for b in items],
        pagination=pagination,
        filters=filters_applied,
    )


@router.get("/{biome_id}", response_model=BiomeDetailResponse)
def get_biome_detail(
    biome_id: str,
    db: Session = Depends(get_db),
) -> BiomeDetailResponse:
    """Retrieve comprehensive details and provenance for a single Minecraft biome."""
    service = QueryService(db)
    biome = service.get_biome_or_404(biome_id)

    detail = BiomeDetail(
        id=biome.id,
        name=biome.name,
        dimension=biome.dimension,
        category=biome.category,
        temperature=biome.temperature,
        precipitation=biome.precipitation,
        rarity=biome.rarity,
        version_added=biome.version_added,
        notes=biome.notes,
        source=extract_provenance(biome),
        coverage_note=biome.coverage_note,
    )
    return BiomeDetailResponse(data=detail)

