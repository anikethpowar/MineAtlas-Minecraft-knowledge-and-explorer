"""Router for Calculated World Atlas Tools and Curated World Reference."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.world import (
    BiomeMatchesResponse,
    PortalConvertRequest,
    PortalConvertResponse,
    SpawnSphereRequest,
    SpawnSphereResponse,
    WorldReferenceResponse,
)
from app.services.world_service import WorldService

router = APIRouter(prefix="/world", tags=["world"])


@router.get("/reference", response_model=WorldReferenceResponse)
def get_world_reference(
    db: Session = Depends(get_db),
) -> WorldReferenceResponse:
    """Retrieve curated Java Edition dimensions, coordinate system rules, and travel guidelines."""
    return WorldService.get_world_reference(db)


@router.post(
    "/portal-convert",
    response_model=PortalConvertResponse,
    status_code=status.HTTP_200_OK,
)
def convert_portal_coordinates(
    payload: PortalConvertRequest,
) -> PortalConvertResponse:
    """Calculate corresponding horizontal Nether or Overworld portal coordinates using Java 8:1 ratio."""
    return WorldService.convert_portal_coordinates(payload)


@router.get("/biome-matches", response_model=BiomeMatchesResponse)
def get_biome_matches(
    dimension: str | None = Query(None, description="Dimension filter ('overworld', 'nether', 'end')."),
    category: str | None = Query(None, description="Climate or environment category."),
    rarity: str | None = Query(None, description="Rarity filter ('common', 'uncommon', 'rare')."),
    precipitation: str | None = Query(None, description="Precipitation type ('none', 'rain', 'snow')."),
    temperature_min: float | None = Query(None, description="Minimum ambient temperature."),
    temperature_max: float | None = Query(None, description="Maximum ambient temperature."),
    has_village_opportunity: bool | None = Query(None, description="Only biomes with village generation relations."),
    has_tameable_mob_opportunity: bool | None = Query(None, description="Only biomes spawning tameable mobs."),
    beginner_friendly: bool | None = Query(None, description="Preset for temperate, common Overworld biomes."),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of matches to return."),
    db: Session = Depends(get_db),
) -> BiomeMatchesResponse:
    """Query cached biomes matching specified environmental criteria with explainable match reasons."""
    return WorldService.get_biome_matches(
        session=db,
        dimension=dimension,
        category=category,
        rarity=rarity,
        precipitation=precipitation,
        temperature_min=temperature_min,
        temperature_max=temperature_max,
        has_village_opportunity=has_village_opportunity,
        has_tameable_mob_opportunity=has_tameable_mob_opportunity,
        beginner_friendly=beginner_friendly,
        limit=limit,
    )


@router.post(
    "/spawn-sphere",
    response_model=SpawnSphereResponse,
    status_code=status.HTTP_200_OK,
)
def calculate_spawn_sphere(
    payload: SpawnSphereRequest,
) -> SpawnSphereResponse:
    """Calculate 2D area, 3D volume, and perimeter metrics for a mob spawn or planning sphere."""
    return WorldService.calculate_spawn_sphere(payload)

