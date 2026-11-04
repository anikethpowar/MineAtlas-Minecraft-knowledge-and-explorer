"""Query service for MineAtlas cached SQLite data.

Provides fast, indexed, paginated queries, search, and detail retrievals
over local SQLite tables without contacting any external API.
"""

from collections.abc import Sequence
import math
from typing import Any, TypeVar
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models import (
    Achievement,
    Biome,
    Command,
    Enchantment,
    Item,
    Mob,
    Structure,
    Trade,
    Version,
    VillagerProfession,
)
from app.schemas.common import PaginationMeta, ProvenanceResponse
from app.schemas.search import SearchResponse, SearchResultItem

T = TypeVar("T")


def extract_provenance(entity: Any) -> ProvenanceResponse:
    """Build a standard ProvenanceResponse from model attributes."""
    return ProvenanceResponse(
        source_type=getattr(entity, "source_type", "astroworld_api"),
        source_url=getattr(entity, "source_url", None),
        edition=getattr(entity, "edition", "java"),
        game_version=getattr(entity, "game_version", None),
        last_verified_at=getattr(entity, "last_verified_at", None),
    )


def paginate(
    session: Session,
    stmt: Any,
    page: int = 1,
    page_size: int = 20,
    max_page_size: int = 100,
) -> tuple[Sequence[Any], PaginationMeta]:
    """Execute a paginated query returning items and standard PaginationMeta."""
    safe_page = max(1, page)
    safe_page_size = min(max_page_size, max(1, page_size))

    # Count query using subquery
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_items = session.scalar(count_stmt) or 0
    total_pages = math.ceil(total_items / safe_page_size) if total_items > 0 else 0

    offset = (safe_page - 1) * safe_page_size
    items = session.scalars(stmt.offset(offset).limit(safe_page_size)).all()

    pagination = PaginationMeta(
        page=safe_page,
        page_size=safe_page_size,
        total_items=total_items,
        total_pages=total_pages,
    )
    return items, pagination


class QueryService:
    """Service layer encapsulating SQLite queries and business validation."""

    def __init__(self, session: Session) -> None:
        self.session = session

    # ==================== GLOBAL SEARCH ====================
    def search_all(
        self,
        query: str,
        types: list[str] | None = None,
        limit: int = 20,
        max_limit: int = 100,
    ) -> SearchResponse:
        """Search across all cached entity types using case-insensitive substrings."""
        q_clean = query.strip()
        if not q_clean:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "invalid_search_query",
                    "message": "Search query parameter 'q' must not be empty or whitespace.",
                },
            )

        safe_limit = min(max_limit, max(1, limit))
        pattern = f"%{q_clean.lower()}%"
        requested_types = [t.strip().lower() for t in types] if types else []

        results: list[SearchResultItem] = []
        by_type: dict[str, int] = {}

        # 1. Mobs
        if not requested_types or "mob" in requested_types or "mobs" in requested_types:
            mob_matches = self.session.scalars(
                select(Mob)
                .where(
                    or_(
                        func.lower(Mob.name).like(pattern),
                        func.lower(Mob.id).like(pattern),
                        func.lower(Mob.category).like(pattern),
                        func.lower(Mob.behavior).like(pattern),
                    )
                )
                .limit(safe_limit)
            ).all()
            for m in mob_matches:
                results.append(
                    SearchResultItem(
                        entity_type="mob",
                        id=m.id,
                        name=m.name,
                        subtitle=f"{m.mob_type or 'Mob'} | {m.category or 'Entity'}",
                        description=m.behavior[:150] if m.behavior else None,
                        source_type=m.source_type,
                        edition=m.edition,
                        game_version=m.version_added,
                    )
                )
            if mob_matches:
                by_type["mob"] = len(mob_matches)

        # 2. Biomes
        if not requested_types or "biome" in requested_types or "biomes" in requested_types:
            biome_matches = self.session.scalars(
                select(Biome)
                .where(
                    or_(
                        func.lower(Biome.name).like(pattern),
                        func.lower(Biome.id).like(pattern),
                        func.lower(Biome.dimension).like(pattern),
                        func.lower(Biome.category).like(pattern),
                    )
                )
                .limit(safe_limit)
            ).all()
            for b in biome_matches:
                results.append(
                    SearchResultItem(
                        entity_type="biome",
                        id=b.id,
                        name=b.name,
                        subtitle=f"{b.dimension or 'Overworld'} | {b.category or 'Biome'}",
                        description=b.notes[:150] if b.notes else None,
                        source_type=b.source_type,
                        edition=b.edition,
                        game_version=b.version_added,
                    )
                )
            if biome_matches:
                by_type["biome"] = len(biome_matches)

        # 3. Items
        if not requested_types or "item" in requested_types or "items" in requested_types:
            item_matches = self.session.scalars(
                select(Item)
                .where(
                    or_(
                        func.lower(Item.name).like(pattern),
                        func.lower(Item.id).like(pattern),
                        func.lower(Item.category).like(pattern),
                        func.lower(Item.description).like(pattern),
                    )
                )
                .limit(safe_limit)
            ).all()
            for i in item_matches:
                results.append(
                    SearchResultItem(
                        entity_type="item",
                        id=i.id,
                        name=i.name,
                        subtitle=f"{i.category or 'Item'} (Stack: {i.stack_size})",
                        description=i.description[:150] if i.description else None,
                        source_type=i.source_type,
                        edition=i.edition,
                        game_version=i.version_added,
                    )
                )
            if item_matches:
                by_type["item"] = len(item_matches)

        # 4. Structures
        if not requested_types or "structure" in requested_types or "structures" in requested_types:
            struct_matches = self.session.scalars(
                select(Structure)
                .where(
                    or_(
                        func.lower(Structure.name).like(pattern),
                        func.lower(Structure.id).like(pattern),
                        func.lower(Structure.dimension).like(pattern),
                        func.lower(Structure.category).like(pattern),
                    )
                )
                .limit(safe_limit)
            ).all()
            for s in struct_matches:
                results.append(
                    SearchResultItem(
                        entity_type="structure",
                        id=s.id,
                        name=s.name,
                        subtitle=f"{s.dimension or 'Dimension'} | {s.category or 'Structure'}",
                        description=s.how_to_find[:150] if s.how_to_find else None,
                        source_type=s.source_type,
                        edition=s.edition,
                        game_version=s.version_added,
                    )
                )
            if struct_matches:
                by_type["structure"] = len(struct_matches)

        # 5. Enchantments
        if not requested_types or "enchantment" in requested_types or "enchantments" in requested_types:
            ench_matches = self.session.scalars(
                select(Enchantment)
                .where(
                    or_(
                        func.lower(Enchantment.name).like(pattern),
                        func.lower(Enchantment.id).like(pattern),
                        func.lower(Enchantment.category).like(pattern),
                        func.lower(Enchantment.description).like(pattern),
                    )
                )
                .limit(safe_limit)
            ).all()
            for e in ench_matches:
                results.append(
                    SearchResultItem(
                        entity_type="enchantment",
                        id=e.id,
                        name=e.name,
                        subtitle=f"Max Level: {e.max_level} | {e.category or 'General'}",
                        description=e.description[:150] if e.description else None,
                        source_type=e.source_type,
                        edition=e.edition,
                        game_version=e.version_added,
                    )
                )
            if ench_matches:
                by_type["enchantment"] = len(ench_matches)

        # 6. Achievements
        if not requested_types or "achievement" in requested_types or "achievements" in requested_types:
            ach_matches = self.session.scalars(
                select(Achievement)
                .where(
                    or_(
                        func.lower(Achievement.name).like(pattern),
                        func.lower(Achievement.slug).like(pattern),
                        func.lower(Achievement.id).like(pattern),
                        func.lower(Achievement.description).like(pattern),
                    )
                )
                .limit(safe_limit)
            ).all()
            for a in ach_matches:
                results.append(
                    SearchResultItem(
                        entity_type="achievement",
                        id=a.id,
                        name=a.name,
                        subtitle=f"Tab: {a.tab or 'General'}",
                        description=a.description[:150] if a.description else None,
                        source_type=a.source_type,
                        edition=a.edition,
                        game_version=a.version_added,
                    )
                )
            if ach_matches:
                by_type["achievement"] = len(ach_matches)

        # 7. Commands
        if not requested_types or "command" in requested_types or "commands" in requested_types:
            cmd_matches = self.session.scalars(
                select(Command)
                .where(
                    or_(
                        func.lower(Command.name).like(pattern),
                        func.lower(Command.syntax).like(pattern),
                        func.lower(Command.description).like(pattern),
                    )
                )
                .limit(safe_limit)
            ).all()
            for c in cmd_matches:
                results.append(
                    SearchResultItem(
                        entity_type="command",
                        id=c.name,
                        name=f"/{c.name}",
                        subtitle=c.syntax,
                        description=c.description[:150] if c.description else None,
                        source_type=c.source_type,
                        edition=c.edition,
                        game_version=c.version_added,
                    )
                )
            if cmd_matches:
                by_type["command"] = len(cmd_matches)

        # 8. Versions
        if not requested_types or "version" in requested_types or "versions" in requested_types:
            ver_matches = self.session.scalars(
                select(Version)
                .where(
                    or_(
                        func.lower(Version.name).like(pattern),
                        func.lower(Version.slug).like(pattern),
                        func.lower(Version.update_name).like(pattern),
                    )
                )
                .limit(safe_limit)
            ).all()
            for v in ver_matches:
                results.append(
                    SearchResultItem(
                        entity_type="version",
                        id=v.slug,
                        name=f"Minecraft {v.name}",
                        subtitle=v.update_name or v.release_type,
                        description=f"Released {v.release_date}" if v.release_date else None,
                        source_type=v.source_type,
                        edition=v.edition,
                        game_version=v.name,
                    )
                )
            if ver_matches:
                by_type["version"] = len(ver_matches)

        # 9. Villager Professions
        if not requested_types or "villager_profession" in requested_types or "professions" in requested_types:
            prof_matches = self.session.scalars(
                select(VillagerProfession)
                .where(
                    or_(
                        func.lower(VillagerProfession.name).like(pattern),
                        func.lower(VillagerProfession.id).like(pattern),
                        func.lower(VillagerProfession.workstation).like(pattern),
                        func.lower(VillagerProfession.description).like(pattern),
                    )
                )
                .limit(safe_limit)
            ).all()
            for p in prof_matches:
                results.append(
                    SearchResultItem(
                        entity_type="villager_profession",
                        id=p.id,
                        name=p.name,
                        subtitle=f"Workstation: {p.workstation or 'None'}",
                        description=p.description[:150] if p.description else None,
                        source_type=p.source_type,
                        edition=p.edition,
                        game_version=None,
                    )
                )
            if prof_matches:
                by_type["villager_profession"] = len(prof_matches)

        # Truncate overall results to safe_limit
        final_results = results[:safe_limit]

        return SearchResponse(
            query=q_clean,
            total_results=len(final_results),
            results=final_results,
            by_type=by_type,
        )

    # ==================== ENTITY DETAIL HELPERS ====================
    def get_mob_or_404(self, mob_id: str) -> Mob:
        clean_id = mob_id.strip().lower()
        mob = self.session.scalar(select(Mob).where(func.lower(Mob.id) == clean_id))
        if not mob:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "entity_not_found",
                    "message": f"No mob with ID '{mob_id}' was found in the local MineAtlas cache.",
                },
            )
        return mob

    def get_biome_or_404(self, biome_id: str) -> Biome:
        clean_id = biome_id.strip().lower()
        # Handle matching with or without 'minecraft:' namespace prefix
        biome = self.session.scalar(
            select(Biome).where(
                or_(
                    func.lower(Biome.id) == clean_id,
                    func.lower(Biome.id) == f"minecraft:{clean_id}",
                    func.lower(Biome.name) == clean_id,
                )
            )
        )
        if not biome:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "entity_not_found",
                    "message": f"No biome with ID '{biome_id}' was found in the local MineAtlas cache.",
                },
            )
        return biome

    def get_item_or_404(self, item_id: str) -> Item:
        clean_id = item_id.strip().lower()
        item = self.session.scalar(
            select(Item).where(
                or_(
                    func.lower(Item.id) == clean_id,
                    func.lower(Item.id) == f"minecraft:{clean_id}",
                    func.lower(Item.name) == clean_id,
                )
            )
        )
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "entity_not_found",
                    "message": f"No item with ID '{item_id}' was found in the local MineAtlas cache.",
                },
            )
        return item

    def get_structure_or_404(self, structure_id: str) -> Structure:
        clean_id = structure_id.strip().lower()
        structure = self.session.scalar(
            select(Structure).where(
                or_(
                    func.lower(Structure.id) == clean_id,
                    func.lower(Structure.name) == clean_id,
                )
            )
        )
        if not structure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "entity_not_found",
                    "message": f"No structure with ID '{structure_id}' was found in the local MineAtlas cache.",
                },
            )
        return structure

    def get_enchantment_or_404(self, enchantment_id: str) -> Enchantment:
        clean_id = enchantment_id.strip().lower()
        ench = self.session.scalar(
            select(Enchantment).where(
                or_(
                    func.lower(Enchantment.id) == clean_id,
                    func.lower(Enchantment.name) == clean_id,
                )
            )
        )
        if not ench:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "entity_not_found",
                    "message": f"No enchantment with ID '{enchantment_id}' was found in the local MineAtlas cache.",
                },
            )
        return ench

    def get_achievement_or_404(self, achievement_slug: str) -> Achievement:
        clean_id = achievement_slug.strip().lower()
        ach = self.session.scalar(
            select(Achievement).where(
                or_(
                    func.lower(Achievement.id) == clean_id,
                    func.lower(Achievement.slug) == clean_id,
                    func.lower(Achievement.id) == f"minecraft:{clean_id}",
                    func.lower(Achievement.name) == clean_id,
                )
            )
        )
        if not ach:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "entity_not_found",
                    "message": f"No achievement with identifier '{achievement_slug}' was found in the local MineAtlas cache.",
                },
            )
        return ach

    def get_version_or_404(self, version_slug: str) -> Version:
        clean_slug = version_slug.strip().lower().replace(".", "-")
        clean_raw = version_slug.strip().lower()
        version = self.session.scalar(
            select(Version).where(
                or_(
                    func.lower(Version.slug) == clean_slug,
                    func.lower(Version.slug) == clean_raw,
                    func.lower(Version.name) == clean_raw,
                )
            )
        )
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "entity_not_found",
                    "message": f"No version with identifier '{version_slug}' was found in the local MineAtlas cache.",
                },
            )
        return version

    def get_command_or_404(self, command_name: str) -> Command:
        clean_name = command_name.strip().lstrip("/").lower()
        cmd = self.session.scalar(select(Command).where(func.lower(Command.name) == clean_name))
        if not cmd:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "entity_not_found",
                    "message": f"No command with name '/{clean_name}' was found in the local MineAtlas cache.",
                },
            )
        return cmd

    def get_trade_or_404(self, trade_id: str) -> Trade:
        clean_id = trade_id.strip().lower()
        # Try trade_id slug first, then fallback to integer ID if numeric
        stmt = select(Trade).where(func.lower(Trade.trade_id) == clean_id)
        if clean_id.isdigit():
            stmt = select(Trade).where(or_(func.lower(Trade.trade_id) == clean_id, Trade.id == int(clean_id)))
        trade = self.session.scalar(stmt)
        if not trade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "entity_not_found",
                    "message": f"No trade with identifier '{trade_id}' was found in the local MineAtlas cache.",
                },
            )
        return trade

    def get_villager_profession_or_404(self, profession_id: str) -> VillagerProfession:
        clean_id = profession_id.strip().lower()
        prof = self.session.scalar(
            select(VillagerProfession).where(
                or_(
                    func.lower(VillagerProfession.id) == clean_id,
                    func.lower(VillagerProfession.name) == clean_id,
                )
            )
        )
        if not prof:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "entity_not_found",
                    "message": f"No villager profession with ID '{profession_id}' was found in the local MineAtlas cache.",
                },
            )
        return prof
