"""FastAPI router for supporting reference entities.

Covers enchantments, achievements, versions, commands, trades, and villager professions.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models import (
    Achievement,
    Command,
    Enchantment,
    Trade,
    Version,
    VillagerProfession,
)
from app.db.session import get_db
from app.schemas.reference import (
    AchievementDetail,
    AchievementDetailResponse,
    AchievementListItem,
    AchievementListResponse,
    CommandDetail,
    CommandDetailResponse,
    CommandListItem,
    CommandListResponse,
    EnchantmentDetail,
    EnchantmentDetailResponse,
    EnchantmentListItem,
    EnchantmentListResponse,
    TradeDetail,
    TradeDetailResponse,
    TradeListItem,
    TradeListResponse,
    VersionDetail,
    VersionDetailResponse,
    VersionListItem,
    VersionListResponse,
    VillagerProfessionDetail,
    VillagerProfessionDetailResponse,
    VillagerProfessionListItem,
    VillagerProfessionListResponse,
)
from app.services.query_service import QueryService, extract_provenance, paginate

router = APIRouter(tags=["reference"])


# ==================== ENCHANTMENTS ====================
@router.get("/enchantments", response_model=EnchantmentListResponse)
def list_enchantments(
    page: int = Query(1, ge=1, description="Page number."),
    page_size: int = Query(20, ge=1, le=100, description="Items per page."),
    search: str | None = Query(None, description="Search by name, ID, or description."),
    category: str | None = Query(None, description="Filter by category (e.g. 'weapons', 'armor')."),
    treasure_only: bool | None = Query(None, description="Filter treasure-only enchantments."),
    db: Session = Depends(get_db),
) -> EnchantmentListResponse:
    """Retrieve paginated Minecraft enchantments from local SQLite cache."""
    stmt = select(Enchantment).order_by(Enchantment.name.asc())
    filters_applied = {"search": search, "category": category, "treasure_only": treasure_only}

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Enchantment.name).like(term),
                func.lower(Enchantment.id).like(term),
                func.lower(Enchantment.description).like(term),
            )
        )
    if category and category.strip():
        stmt = stmt.where(func.lower(Enchantment.category) == category.strip().lower())
    if treasure_only is not None:
        stmt = stmt.where(Enchantment.treasure_only == treasure_only)

    items, pagination = paginate(db, stmt, page=page, page_size=page_size)
    return EnchantmentListResponse(
        data=[EnchantmentListItem.model_validate(e) for e in items],
        pagination=pagination,
        filters=filters_applied,
    )


@router.get("/enchantments/{enchantment_id}", response_model=EnchantmentDetailResponse)
def get_enchantment_detail(enchantment_id: str, db: Session = Depends(get_db)) -> EnchantmentDetailResponse:
    """Retrieve single enchantment details and provenance."""
    service = QueryService(db)
    ench = service.get_enchantment_or_404(enchantment_id)
    return EnchantmentDetailResponse(
        data=EnchantmentDetail(
            id=ench.id,
            name=ench.name,
            category=ench.category,
            max_level=ench.max_level,
            description=ench.description,
            treasure_only=ench.treasure_only,
            curse_of=ench.curse_of,
            weight=ench.weight,
            version_added=ench.version_added,
            notes=ench.notes,
            source=extract_provenance(ench),
            coverage_note=ench.coverage_note,
        )
    )


# ==================== ACHIEVEMENTS / ADVANCEMENTS ====================
@router.get("/achievements", response_model=AchievementListResponse)
def list_achievements(
    page: int = Query(1, ge=1, description="Page number."),
    page_size: int = Query(20, ge=1, le=100, description="Items per page."),
    search: str | None = Query(None, description="Search title, ID, slug, or description."),
    tab: str | None = Query(None, description="Filter by tab ('story', 'nether', 'end', 'adventure', 'husbandry')."),
    db: Session = Depends(get_db),
) -> AchievementListResponse:
    """Retrieve paginated Minecraft advancements / achievements."""
    stmt = select(Achievement).order_by(Achievement.name.asc())
    filters_applied = {"search": search, "tab": tab}

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Achievement.name).like(term),
                func.lower(Achievement.id).like(term),
                func.lower(Achievement.slug).like(term),
                func.lower(Achievement.description).like(term),
            )
        )
    if tab and tab.strip():
        stmt = stmt.where(func.lower(Achievement.tab) == tab.strip().lower())

    items, pagination = paginate(db, stmt, page=page, page_size=page_size)
    return AchievementListResponse(
        data=[AchievementListItem.model_validate(a) for a in items],
        pagination=pagination,
        filters=filters_applied,
    )


@router.get("/achievements/{achievement_slug:path}", response_model=AchievementDetailResponse)
def get_achievement_detail(achievement_slug: str, db: Session = Depends(get_db)) -> AchievementDetailResponse:
    """Retrieve single advancement / achievement details and provenance."""
    service = QueryService(db)
    ach = service.get_achievement_or_404(achievement_slug)
    return AchievementDetailResponse(
        data=AchievementDetail(
            id=ach.id,
            slug=ach.slug,
            name=ach.name,
            tab=ach.tab,
            description=ach.description,
            icon=ach.icon,
            parent_id=ach.parent_id,
            how_to_complete=ach.how_to_complete,
            xp_reward=ach.xp_reward,
            is_goal=ach.is_goal,
            is_challenge=ach.is_challenge,
            difficulty=ach.difficulty,
            version_added=ach.version_added,
            source=extract_provenance(ach),
            coverage_note=ach.coverage_note,
        )
    )


# ==================== VERSIONS ====================
@router.get("/versions", response_model=VersionListResponse)
def list_versions(
    page: int = Query(1, ge=1, description="Page number."),
    page_size: int = Query(20, ge=1, le=100, description="Items per page."),
    search: str | None = Query(None, description="Search version title or update name."),
    release_type: str | None = Query(None, description="Filter release type ('major-release', 'minor-release')."),
    db: Session = Depends(get_db),
) -> VersionListResponse:
    """Retrieve paginated Minecraft Java Edition version history."""
    stmt = select(Version).order_by(Version.name.desc())
    filters_applied = {"search": search, "release_type": release_type}

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Version.name).like(term),
                func.lower(Version.slug).like(term),
                func.lower(Version.update_name).like(term),
            )
        )
    if release_type and release_type.strip():
        stmt = stmt.where(func.lower(Version.release_type) == release_type.strip().lower())

    items, pagination = paginate(db, stmt, page=page, page_size=page_size)
    return VersionListResponse(
        data=[VersionListItem.model_validate(v) for v in items],
        pagination=pagination,
        filters=filters_applied,
    )


@router.get("/versions/{version_slug}", response_model=VersionDetailResponse)
def get_version_detail(version_slug: str, db: Session = Depends(get_db)) -> VersionDetailResponse:
    """Retrieve single Minecraft version details."""
    service = QueryService(db)
    version = service.get_version_or_404(version_slug)
    return VersionDetailResponse(
        data=VersionDetail(
            slug=version.slug,
            name=version.name,
            edition=version.edition,
            release_date=version.release_date,
            release_type=version.release_type,
            update_name=version.update_name,
            previous_version_slug=version.previous_version_slug,
            next_version_slug=version.next_version_slug,
            source=extract_provenance(version),
            coverage_note=version.coverage_note,
        )
    )


# ==================== COMMANDS ====================
@router.get("/commands", response_model=CommandListResponse)
def list_commands(
    page: int = Query(1, ge=1, description="Page number."),
    page_size: int = Query(20, ge=1, le=100, description="Items per page."),
    search: str | None = Query(None, description="Search command name, syntax, or description."),
    category: str | None = Query(None, description="Filter by category (e.g. 'player', 'world')."),
    db: Session = Depends(get_db),
) -> CommandListResponse:
    """Retrieve paginated Minecraft server/in-game commands."""
    stmt = select(Command).order_by(Command.name.asc())
    filters_applied = {"search": search, "category": category}

    if search and search.strip():
        term = f"%{search.strip().lstrip('/').lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Command.name).like(term),
                func.lower(Command.syntax).like(term),
                func.lower(Command.description).like(term),
            )
        )
    if category and category.strip():
        stmt = stmt.where(func.lower(Command.category) == category.strip().lower())

    items, pagination = paginate(db, stmt, page=page, page_size=page_size)
    return CommandListResponse(
        data=[CommandListItem.model_validate(c) for c in items],
        pagination=pagination,
        filters=filters_applied,
    )


@router.get("/commands/{command_name:path}", response_model=CommandDetailResponse)
def get_command_detail(command_name: str, db: Session = Depends(get_db)) -> CommandDetailResponse:
    """Retrieve single Minecraft command details."""
    service = QueryService(db)
    cmd = service.get_command_or_404(command_name)
    return CommandDetailResponse(
        data=CommandDetail(
            name=cmd.name,
            syntax=cmd.syntax,
            description=cmd.description,
            permission_level=cmd.permission_level,
            category=cmd.category,
            version_added=cmd.version_added,
            notes=cmd.notes,
            source=extract_provenance(cmd),
            coverage_note=cmd.coverage_note,
        )
    )


# ==================== TRADES ====================
@router.get("/trades", response_model=TradeListResponse)
def list_trades(
    page: int = Query(1, ge=1, description="Page number."),
    page_size: int = Query(20, ge=1, le=100, description="Items per page."),
    search: str | None = Query(None, description="Search by gives_item or receives_item."),
    profession_id: str | None = Query(None, description="Filter by profession ID (e.g. 'armorer')."),
    level: int | None = Query(None, ge=1, le=5, description="Filter by mastery tier (1-5)."),
    db: Session = Depends(get_db),
) -> TradeListResponse:
    """Retrieve paginated villager trade offers."""
    stmt = select(Trade).order_by(Trade.profession_id.asc(), Trade.level.asc(), Trade.id.asc())
    filters_applied = {"search": search, "profession_id": profession_id, "level": level}

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Trade.gives_item).like(term),
                func.lower(Trade.receives_item).like(term),
                func.lower(Trade.trade_id).like(term),
            )
        )
    if profession_id and profession_id.strip():
        stmt = stmt.where(func.lower(Trade.profession_id) == profession_id.strip().lower())
    if level is not None:
        stmt = stmt.where(Trade.level == level)

    items, pagination = paginate(db, stmt, page=page, page_size=page_size)
    return TradeListResponse(
        data=[TradeListItem.model_validate(t) for t in items],
        pagination=pagination,
        filters=filters_applied,
    )


@router.get("/trades/{trade_id}", response_model=TradeDetailResponse)
def get_trade_detail(trade_id: str, db: Session = Depends(get_db)) -> TradeDetailResponse:
    """Retrieve single villager trade details."""
    service = QueryService(db)
    trade = service.get_trade_or_404(trade_id)
    return TradeDetailResponse(
        data=TradeDetail(
            id=trade.id,
            trade_id=trade.trade_id,
            profession_id=trade.profession_id,
            level=trade.level,
            level_name=trade.level_name,
            gives_item=trade.gives_item,
            gives_amount=trade.gives_amount,
            receives_item=trade.receives_item,
            receives_amount=trade.receives_amount,
            max_uses=trade.max_uses,
            price_multiplier=trade.price_multiplier,
            notes=trade.notes,
            source=extract_provenance(trade),
            coverage_note=trade.coverage_note,
        )
    )


# ==================== VILLAGER PROFESSIONS ====================
@router.get("/villager-professions", response_model=VillagerProfessionListResponse)
def list_villager_professions(
    page: int = Query(1, ge=1, description="Page number."),
    page_size: int = Query(20, ge=1, le=100, description="Items per page."),
    search: str | None = Query(None, description="Search by name, ID, or workstation block."),
    db: Session = Depends(get_db),
) -> VillagerProfessionListResponse:
    """Retrieve all 13 Minecraft villager professions."""
    stmt = select(VillagerProfession).order_by(VillagerProfession.name.asc())
    filters_applied = {"search": search}

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(VillagerProfession.name).like(term),
                func.lower(VillagerProfession.id).like(term),
                func.lower(VillagerProfession.workstation).like(term),
            )
        )

    items, pagination = paginate(db, stmt, page=page, page_size=page_size)
    return VillagerProfessionListResponse(
        data=[VillagerProfessionListItem.model_validate(p) for p in items],
        pagination=pagination,
        filters=filters_applied,
    )


@router.get("/villager-professions/{profession_id}", response_model=VillagerProfessionDetailResponse)
def get_villager_profession_detail(profession_id: str, db: Session = Depends(get_db)) -> VillagerProfessionDetailResponse:
    """Retrieve villager profession details including all offered trades."""
    service = QueryService(db)
    prof = service.get_villager_profession_or_404(profession_id)
    return VillagerProfessionDetailResponse(
        data=VillagerProfessionDetail(
            id=prof.id,
            name=prof.name,
            workstation=prof.workstation,
            description=prof.description,
            biome_specific=prof.biome_specific,
            trades=[TradeListItem.model_validate(t) for t in prof.trades],
            source=extract_provenance(prof),
            coverage_note=prof.coverage_note,
        )
    )
