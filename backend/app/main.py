from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routers import (
    biomes,
    development,
    farms,
    graph,
    health,
    items,
    mobs,
    reference,
    search,
    status,
    structures,
)

app = FastAPI(
    title="MineAtlas API",
    description="Backend API for MineAtlas - Minecraft Java Edition Atlas & Knowledge Graph Explorer",
    version="0.5.0",
)

# Configure CORS only for local Vite frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Register all query, explorer, and operational routers under /api
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(status.router, prefix="/api", tags=["status"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(mobs.router, prefix="/api", tags=["mobs"])
app.include_router(biomes.router, prefix="/api", tags=["biomes"])
app.include_router(items.router, prefix="/api", tags=["items"])
app.include_router(structures.router, prefix="/api", tags=["structures"])
app.include_router(reference.router, prefix="/api", tags=["reference"])
app.include_router(farms.router, prefix="/api", tags=["farms"])
app.include_router(graph.router, prefix="/api", tags=["graph"])
app.include_router(development.router, prefix="/api", tags=["development"])


@app.get("/")
def root() -> dict[str, str]:
    """Root status endpoint providing guidance for API consumers."""
    return {
        "message": "Welcome to MineAtlas API. Visit /api/health for status or /docs for API documentation."
    }
