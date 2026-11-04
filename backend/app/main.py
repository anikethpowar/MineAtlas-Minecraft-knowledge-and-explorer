from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routers import health

app = FastAPI(
    title="MineAtlas API",
    description="Backend API for MineAtlas - Minecraft Java Edition Atlas & Knowledge Graph Explorer",
    version="0.1.0",
)

# Configure CORS only for local Vite frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Register health check router under /api
app.include_router(health.router, prefix="/api", tags=["health"])


@app.get("/")
def root() -> dict[str, str]:
    """Root status endpoint providing guidance for API consumers."""
    return {
        "message": "Welcome to MineAtlas API. Visit /api/health for status or /docs for API documentation."
    }

