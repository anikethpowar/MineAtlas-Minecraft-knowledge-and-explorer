import os
from pathlib import Path

# Base directories
BACKEND_DIR = Path(__file__).resolve().parent.parent

# Server configuration
HOST: str = os.getenv("HOST", "127.0.0.1")
PORT: int = int(os.getenv("PORT", "8000"))

# CORS configuration - Local Vite frontend URL only
_cors_raw: str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
CORS_ORIGINS: list[str] = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]

# Database configuration (SQLite local database)
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "mineatlas.db"
DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

# Astroworld API upstream configuration (Public API)
ASTROWORLD_API_BASE_URL: str = os.getenv(
    "ASTROWORLD_API_BASE_URL", "https://api.astroworldmc.com"
).rstrip("/")
ASTROWORLD_API_TIMEOUT_SECONDS: float = float(
    os.getenv("ASTROWORLD_API_TIMEOUT_SECONDS", "15.0")
)
ASTROWORLD_AUDIT_DELAY_SECONDS: float = float(
    os.getenv("ASTROWORLD_AUDIT_DELAY_SECONDS", "1.3")
)
