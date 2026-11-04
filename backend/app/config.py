import os

# Server configuration
HOST: str = os.getenv("HOST", "127.0.0.1")
PORT: int = int(os.getenv("PORT", "8000"))

# CORS configuration - Local Vite frontend URL only
# Parses comma-separated origin strings into a list
_cors_raw: str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
CORS_ORIGINS: list[str] = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]

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
