"""Astroworld API Client for MineAtlas.

This client handles outgoing requests to https://api.astroworldmc.com,
the upstream Minecraft data source.

CRITICAL RULES:
1. Browser/frontend MUST NEVER call Astroworld directly.
2. Only this backend client connects to Astroworld.
3. Astroworld is a public API (no API key required).
4. All calls must be bounded by reasonable timeouts and the strict 50 req/min rate limiter.
"""

from typing import Any
import httpx

from app.config import (
    ASTROWORLD_API_BASE_URL,
    ASTROWORLD_API_TIMEOUT_SECONDS,
    ASTROWORLD_RATE_LIMIT_MAX_REQUESTS,
    ASTROWORLD_RATE_LIMIT_REFILL_SECONDS,
)

_default_rate_limiter = None


def get_default_rate_limiter():
    """Lazily initialize the process-wide token bucket rate limiter."""
    global _default_rate_limiter
    if _default_rate_limiter is None:
        from app.services.rate_limiter import RateLimiter
        _default_rate_limiter = RateLimiter(
            capacity=ASTROWORLD_RATE_LIMIT_MAX_REQUESTS,
            refill_rate=1.0 / ASTROWORLD_RATE_LIMIT_REFILL_SECONDS,
        )
    return _default_rate_limiter


class AstroworldClientError(Exception):
    """Base exception for all Astroworld API client errors."""


class AstroworldConnectionError(AstroworldClientError):
    """Raised when a network connection to Astroworld cannot be established."""


class AstroworldTimeoutError(AstroworldClientError):
    """Raised when an Astroworld request times out."""


class AstroworldHTTPError(AstroworldClientError):
    """Raised when Astroworld returns an HTTP error status code (4xx, 5xx)."""

    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.status_code = status_code


class AstroworldRateLimitError(AstroworldHTTPError):
    """Raised when Astroworld returns HTTP 429 Too Many Requests."""

    def __init__(
        self,
        message: str,
        status_code: int = 429,
        retry_after: int | None = None,
    ):
        super().__init__(message, status_code=status_code)
        self.retry_after = retry_after


class AstroworldResponseError(AstroworldClientError):
    """Raised when Astroworld returns invalid, non-JSON, or unexpectedly structured data."""


class AstroworldClient:
    """HTTP client for the Astroworld Minecraft API.

    Supports context management:
        with AstroworldClient() as client:
            mobs = client.get_mobs()
    """

    def __init__(
        self,
        base_url: str | None = None,
        timeout: float | None = None,
        client: httpx.Client | None = None,
        rate_limiter: Any = None,
    ) -> None:
        self.base_url = (base_url or ASTROWORLD_API_BASE_URL).rstrip("/")
        self.timeout = (
            timeout if timeout is not None else ASTROWORLD_API_TIMEOUT_SECONDS
        )
        self._client = client
        self._owns_client = client is None
        self.rate_limiter = (
            rate_limiter if rate_limiter is not None else get_default_rate_limiter()
        )
        self.last_status_code: int | None = None
        self.last_response_headers: dict[str, str] = {}

    def _get_client(self) -> httpx.Client:
        if self._client is None:
            self._client = httpx.Client(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={
                    "Accept": "application/json",
                    "User-Agent": "MineAtlas/0.4.0 (Ingestion Tool; +https://github.com/anikethpowar/MineAtlas)",
                },
                follow_redirects=True,
            )
        return self._client

    def _request(self, endpoint: str) -> dict[str, Any]:
        """Perform a GET request to an Astroworld endpoint and validate structure."""
        url_path = endpoint if endpoint.startswith("/") else f"/{endpoint}"
        client = self._get_client()

        if self.rate_limiter is not None:
            self.rate_limiter.acquire(1.0)

        try:
            response = client.get(url_path)
            self.last_status_code = response.status_code
            self.last_response_headers = dict(response.headers)
        except httpx.TimeoutException as exc:
            self.last_status_code = None
            raise AstroworldTimeoutError(
                f"Request timed out for endpoint '{url_path}': {exc}"
            ) from exc
        except (httpx.NetworkError, httpx.RequestError) as exc:
            self.last_status_code = None
            raise AstroworldConnectionError(
                f"Network connection failed for endpoint '{url_path}': {exc}"
            ) from exc

        # Handle 429 Rate Limiting specifically
        if response.status_code == 429:
            retry_after_header = response.headers.get("retry-after")
            retry_after_seconds: int | None = None
            if retry_after_header:
                try:
                    retry_after_seconds = int(retry_after_header)
                except ValueError:
                    retry_after_seconds = None

            message = (
                f"Astroworld rate limit reached (HTTP 429) for '{url_path}'. "
                f"Retry-After: {retry_after_seconds}s"
                if retry_after_seconds is not None
                else f"Astroworld rate limit reached (HTTP 429) for '{url_path}'."
            )
            raise AstroworldRateLimitError(
                message,
                status_code=429,
                retry_after=retry_after_seconds,
            )

        # Handle other HTTP errors (4xx, 5xx)
        if response.is_error:
            raise AstroworldHTTPError(
                f"Astroworld returned HTTP {response.status_code} for '{url_path}': {response.text[:200]}",
                status_code=response.status_code,
            )

        # Parse and validate JSON
        try:
            payload = response.json()
        except Exception as exc:
            raise AstroworldResponseError(
                f"Astroworld endpoint '{url_path}' returned invalid JSON: {exc}"
            ) from exc

        if not isinstance(payload, dict):
            raise AstroworldResponseError(
                f"Astroworld endpoint '{url_path}' returned non-dict JSON (got {type(payload).__name__})"
            )

        if "success" not in payload:
            raise AstroworldResponseError(
                f"Astroworld endpoint '{url_path}' response missing required 'success' field"
            )

        if not payload.get("success", False):
            err_details = payload.get("error") or payload.get("message") or "Upstream indicates failure"
            raise AstroworldResponseError(
                f"Astroworld endpoint '{url_path}' reported failure: {err_details}"
            )

        if "data" not in payload:
            raise AstroworldResponseError(
                f"Astroworld endpoint '{url_path}' response missing required 'data' field"
            )

        return payload

    def get_endpoint(self, endpoint: str) -> dict[str, Any]:
        """Generic method to fetch any endpoint path."""
        return self._request(endpoint)

    # Audited Collection Endpoints
    def get_mobs(self) -> dict[str, Any]:
        """Fetch all Minecraft mobs."""
        return self._request("/api/v1/mobs")

    def get_biomes(self) -> dict[str, Any]:
        """Fetch all Minecraft biomes."""
        return self._request("/api/v1/biomes")

    def get_items(self) -> dict[str, Any]:
        """Fetch all Minecraft items and key blocks."""
        return self._request("/api/v1/items")

    def get_enchantments(self) -> dict[str, Any]:
        """Fetch all Minecraft enchantments."""
        return self._request("/api/v1/enchantments")

    def get_structures(self) -> dict[str, Any]:
        """Fetch all Minecraft world structures."""
        return self._request("/api/v1/structures")

    def get_commands(self) -> dict[str, Any]:
        """Fetch all Minecraft commands."""
        return self._request("/api/v1/commands")

    def get_versions(self) -> dict[str, Any]:
        """Fetch Minecraft version history."""
        return self._request("/api/v1/versions")

    def get_achievements(self) -> dict[str, Any]:
        """Fetch all Minecraft achievements / advancements."""
        return self._request("/api/v1/achievements")

    def get_trades(self) -> dict[str, Any]:
        """Fetch all villager trades."""
        return self._request("/api/v1/trades")

    def close(self) -> None:
        """Close underlying HTTP client if owned."""
        if self._owns_client and self._client is not None:
            self._client.close()
            self._client = None

    def __enter__(self) -> "AstroworldClient":
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.close()
