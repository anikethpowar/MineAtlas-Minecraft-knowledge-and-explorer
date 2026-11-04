from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def get_health() -> dict[str, str]:
    """Health check endpoint for MineAtlas API.

    Returns operational status, service identity, targeted Minecraft edition,
    and current phase.
    """
    return {
        "status": "ok",
        "service": "MineAtlas API",
        "edition": "Java Edition",
        "phase": "foundation",
    }

