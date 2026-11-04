"""FastAPI router for Minecraft Mobs."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models import Mob
from app.db.session import get_db
from app.schemas.mobs import (
    MobDetail,
    MobDetailResponse,
    MobListItem,
    MobListResponse,
)
from app.services.query_service import QueryService, extract_provenance, paginate

router = APIRouter(prefix="/mobs", tags=["mobs"])


@router.get("", response_model=MobListResponse)
def list_mobs(
    page: int = Query(1, ge=1, description="Page number (1-based)."),
    page_size: int = Query(20, ge=1, le=100, description="Items per page."),
    search: str | None = Query(None, description="Filter by name, ID, or behavior pattern."),
    type: str | None = Query(None, description="Filter by behavioral type ('hostile', 'passive', 'neutral', 'boss')."),
    category: str | None = Query(None, description="Filter by category (e.g. 'animal', 'undead', 'arthropod')."),
    tameable: bool | None = Query(None, description="Filter by tameability."),
    breedable: bool | None = Query(None, description="Filter by breedability."),
    db: Session = Depends(get_db),
) -> MobListResponse:
    """Retrieve a paginated, filterable list of Minecraft mobs from local SQLite cache."""
    stmt = select(Mob).order_by(Mob.name.asc())

    filters_applied: dict[str, str | bool | None] = {
        "search": search,
        "type": type,
        "category": category,
        "tameable": tameable,
        "breedable": breedable,
    }

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Mob.name).like(term),
                func.lower(Mob.id).like(term),
                func.lower(Mob.behavior).like(term),
            )
        )

    if type and type.strip():
        stmt = stmt.where(func.lower(Mob.mob_type) == type.strip().lower())

    if category and category.strip():
        stmt = stmt.where(func.lower(Mob.category) == category.strip().lower())

    if tameable is not None:
        stmt = stmt.where(Mob.tameable == tameable)

    if breedable is not None:
        stmt = stmt.where(Mob.breedable == breedable)

    items, pagination = paginate(db, stmt, page=page, page_size=page_size)

    return MobListResponse(
        data=[MobListItem.model_validate(m) for m in items],
        pagination=pagination,
        filters=filters_applied,
    )


@router.get("/{mob_id}", response_model=MobDetailResponse)
def get_mob_detail(
    mob_id: str,
    db: Session = Depends(get_db),
) -> MobDetailResponse:
    """Retrieve comprehensive details and provenance for a single Minecraft mob."""
    service = QueryService(db)
    mob = service.get_mob_or_404(mob_id)

    detail = MobDetail(
        id=mob.id,
        name=mob.name,
        mob_type=mob.mob_type,
        category=mob.category,
        behavior=mob.behavior,
        hp=mob.hp,
        damage_easy=mob.damage_easy,
        damage_normal=mob.damage_normal,
        damage_hard=mob.damage_hard,
        xp_min=mob.xp_min,
        xp_max=mob.xp_max,
        spawn_conditions=mob.spawn_conditions,
        tameable=mob.tameable,
        taming_method=mob.taming_method,
        breedable=mob.breedable,
        breeding_item=mob.breeding_item,
        version_added=mob.version_added,
        notes=mob.notes,
        source=extract_provenance(mob),
        coverage_note=mob.coverage_note,
    )
    return MobDetailResponse(data=detail)

