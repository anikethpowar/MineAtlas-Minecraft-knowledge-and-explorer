"""FastAPI router for Minecraft Structures."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models import Structure
from app.db.session import get_db
from app.schemas.structures import (
    StructureDetail,
    StructureDetailResponse,
    StructureListItem,
    StructureListResponse,
)
from app.services.query_service import QueryService, extract_provenance, paginate

router = APIRouter(prefix="/structures", tags=["structures"])


@router.get("", response_model=StructureListResponse)
def list_structures(
    page: int = Query(1, ge=1, description="Page number (1-based)."),
    page_size: int = Query(20, ge=1, le=100, description="Items per page."),
    search: str | None = Query(None, description="Filter by name, ID, or guidance."),
    dimension: str | None = Query(None, description="Filter by dimension ('overworld', 'nether', 'the_end')."),
    category: str | None = Query(None, description="Filter by category (e.g. 'settlement', 'dungeon', 'ruin')."),
    rarity: str | None = Query(None, description="Filter by rarity ('common', 'uncommon', 'rare')."),
    db: Session = Depends(get_db),
) -> StructureListResponse:
    """Retrieve a paginated, filterable list of Minecraft world structures from local SQLite cache."""
    stmt = select(Structure).order_by(Structure.name.asc())

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
                func.lower(Structure.name).like(term),
                func.lower(Structure.id).like(term),
                func.lower(Structure.how_to_find).like(term),
            )
        )

    if dimension and dimension.strip():
        stmt = stmt.where(func.lower(Structure.dimension) == dimension.strip().lower())

    if category and category.strip():
        stmt = stmt.where(func.lower(Structure.category) == category.strip().lower())

    if rarity and rarity.strip():
        stmt = stmt.where(func.lower(Structure.rarity) == rarity.strip().lower())

    items, pagination = paginate(db, stmt, page=page, page_size=page_size)

    return StructureListResponse(
        data=[StructureListItem.model_validate(s) for s in items],
        pagination=pagination,
        filters=filters_applied,
    )


@router.get("/{structure_id}", response_model=StructureDetailResponse)
def get_structure_detail(
    structure_id: str,
    db: Session = Depends(get_db),
) -> StructureDetailResponse:
    """Retrieve comprehensive details and provenance for a single Minecraft structure."""
    service = QueryService(db)
    structure = service.get_structure_or_404(structure_id)

    detail = StructureDetail(
        id=structure.id,
        name=structure.name,
        dimension=structure.dimension,
        category=structure.category,
        rarity=structure.rarity,
        y_min=structure.y_min,
        y_max=structure.y_max,
        how_to_find=structure.how_to_find,
        version_added=structure.version_added,
        notes=structure.notes,
        source=extract_provenance(structure),
        coverage_note=structure.coverage_note,
    )
    return StructureDetailResponse(data=detail)

