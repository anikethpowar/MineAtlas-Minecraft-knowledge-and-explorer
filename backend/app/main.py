from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routers import development, health

app = FastAPI(
    title="MineAtlas API",
    description="Backend API for MineAtlas - Minecraft Java Edition Atlas & Knowledge Graph Explorer",
    version="0.4.0",
)

# Configure CORS only for local Vite frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(development.router, prefix="/api", tags=["development"])


@app.get("/")
def root() -> dict[str, str]:
    """Root status endpoint providing guidance for API consumers."""
    return {
        "message": "Welcome to MineAtlas API. Visit /api/health for status or /docs for API documentation."
    }
