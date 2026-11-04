"""FastAPI router for Minecraft Items and Key Blocks."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models import Item
from app.db.session import get_db
from app.schemas.items import (
    ItemDetail,
    ItemDetailResponse,
    ItemListItem,
    ItemListResponse,
)
from app.services.query_service import QueryService, extract_provenance, paginate

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=ItemListResponse)
def list_items(
    page: int = Query(1, ge=1, description="Page number (1-based)."),
    page_size: int = Query(20, ge=1, le=100, description="Items per page."),
    search: str | None = Query(None, description="Filter by name, ID, or description."),
    category: str | None = Query(None, description="Filter by category (e.g. 'tool', 'combat', 'resource', 'food')."),
    enchantable: bool | None = Query(None, description="Filter by enchantability."),
    db: Session = Depends(get_db),
) -> ItemListResponse:
    """Retrieve a paginated, filterable list of Minecraft items and key blocks from local SQLite cache."""
    stmt = select(Item).order_by(Item.name.asc())

    filters_applied: dict[str, str | bool | None] = {
        "search": search,
        "category": category,
        "enchantable": enchantable,
    }

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Item.name).like(term),
                func.lower(Item.id).like(term),
                func.lower(Item.description).like(term),
            )
        )

    if category and category.strip():
        stmt = stmt.where(func.lower(Item.category) == category.strip().lower())

    if enchantable is not None:
        stmt = stmt.where(Item.enchantable == enchantable)

    items, pagination = paginate(db, stmt, page=page, page_size=page_size)

    return ItemListResponse(
        data=[ItemListItem.model_validate(i) for i in items],
        pagination=pagination,
        filters=filters_applied,
    )


@router.get("/{item_id}", response_model=ItemDetailResponse)
def get_item_detail(
    item_id: str,
    db: Session = Depends(get_db),
) -> ItemDetailResponse:
    """Retrieve comprehensive details and provenance for a single Minecraft item or key block."""
    service = QueryService(db)
    item = service.get_item_or_404(item_id)

    detail = ItemDetail(
        id=item.id,
        name=item.name,
        category=item.category,
        stack_size=item.stack_size,
        durability=item.durability,
        description=item.description,
        enchantable=item.enchantable,
        food_hunger=item.food_hunger,
        food_saturation=item.food_saturation,
        fuel_value=item.fuel_value,
        version_added=item.version_added,
        notes=item.notes,
        source=extract_provenance(item),
        coverage_note=item.coverage_note,
    )
    return ItemDetailResponse(data=detail)

