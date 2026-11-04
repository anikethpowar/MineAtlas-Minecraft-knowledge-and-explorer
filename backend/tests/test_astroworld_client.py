"""Unit tests for Astroworld API client using mocked HTTP responses."""

from typing import Any
import httpx
import pytest

from app.clients.astroworld_client import (
    AstroworldClient,
    AstroworldConnectionError,
    AstroworldHTTPError,
    AstroworldRateLimitError,
    AstroworldResponseError,
    AstroworldTimeoutError,
)


def create_mock_client(handler) -> AstroworldClient:
    """Helper to create an AstroworldClient with an httpx.MockTransport."""
    transport = httpx.MockTransport(handler)
    http_client = httpx.Client(
        transport=transport,
        base_url="https://api.astroworldmc.com",
    )
    return AstroworldClient(client=http_client)


def test_successful_collection_response():
    """Verify that a successful 200 JSON response returns structured data."""
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/v1/mobs"
        return httpx.Response(
            200,
            json={
                "success": True,
                "count": 1,
                "data": [{"id": "zombie", "name": "Zombie", "type": "hostile"}],
            },
        )

    client = create_mock_client(handler)
    result = client.get_mobs()

    assert result["success"] is True
    assert result["count"] == 1
    assert len(result["data"]) == 1
    assert result["data"][0]["id"] == "zombie"


def test_all_audited_endpoints_mapped():
    """Verify each collection method targets the correct path."""
    recorded_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        recorded_paths.append(request.url.path)
        return httpx.Response(200, json={"success": True, "count": 0, "data": []})

    client = create_mock_client(handler)

    client.get_mobs()
    client.get_biomes()
    client.get_items()
    client.get_enchantments()
    client.get_structures()
    client.get_commands()
    client.get_versions()
    client.get_achievements()
    client.get_trades()

    expected = [
        "/api/v1/mobs",
        "/api/v1/biomes",
        "/api/v1/items",
        "/api/v1/enchantments",
        "/api/v1/structures",
        "/api/v1/commands",
        "/api/v1/versions",
        "/api/v1/achievements",
        "/api/v1/trades",
    ]
    assert recorded_paths == expected


def test_malformed_non_json_response():
    """Verify that a non-JSON response raises AstroworldResponseError."""
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            content=b"<html>502 Bad Gateway</html>",
            headers={"Content-Type": "text/html"},
        )

    client = create_mock_client(handler)
    with pytest.raises(AstroworldResponseError) as exc_info:
        client.get_mobs()

    assert "invalid JSON" in str(exc_info.value)


def test_missing_required_fields_in_payload():
    """Verify that responses missing 'success' or 'data' raise AstroworldResponseError."""
    def handler_no_success(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": []})

    client_no_success = create_mock_client(handler_no_success)
    with pytest.raises(AstroworldResponseError) as exc:
        client_no_success.get_biomes()
    assert "missing required 'success' field" in str(exc.value)

    def handler_no_data(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"success": True})

    client_no_data = create_mock_client(handler_no_data)
    with pytest.raises(AstroworldResponseError) as exc:
        client_no_data.get_biomes()
    assert "missing required 'data' field" in str(exc.value)


def test_upstream_indicates_failure():
    """Verify that success=False in JSON raises AstroworldResponseError."""
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={"success": False, "error": "Internal upstream database error"},
        )

    client = create_mock_client(handler)
    with pytest.raises(AstroworldResponseError) as exc:
        client.get_items()
    assert "reported failure" in str(exc.value)


def test_timeout_failure():
    """Verify that timeouts raise AstroworldTimeoutError."""
    def handler(_: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("Server took too long")

    client = create_mock_client(handler)
    with pytest.raises(AstroworldTimeoutError) as exc:
        client.get_structures()
    assert "timed out" in str(exc.value)


def test_connection_network_failure():
    """Verify that connection failures raise AstroworldConnectionError."""
    def handler(_: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Could not resolve host")

    client = create_mock_client(handler)
    with pytest.raises(AstroworldConnectionError) as exc:
        client.get_enchantments()
    assert "connection failed" in str(exc.value)


def test_http_500_error_response():
    """Verify that HTTP 500 status raises AstroworldHTTPError."""
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="Internal Server Error")

    client = create_mock_client(handler)
    with pytest.raises(AstroworldHTTPError) as exc:
        client.get_trades()
    assert exc.value.status_code == 500


def test_rate_limit_429_with_retry_after():
    """Verify HTTP 429 raises AstroworldRateLimitError with parsed Retry-After header."""
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            429,
            headers={"Retry-After": "30"},
            text="Too Many Requests",
        )

    client = create_mock_client(handler)
    with pytest.raises(AstroworldRateLimitError) as exc:
        client.get_mobs()

    assert exc.value.status_code == 429
    assert exc.value.retry_after == 30
    assert "Retry-After: 30s" in str(exc.value)


def test_rate_limit_429_without_retry_after():
    """Verify HTTP 429 without Retry-After header handles None gracefully."""
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(429, text="Too Many Requests")

    client = create_mock_client(handler)
    with pytest.raises(AstroworldRateLimitError) as exc:
        client.get_mobs()

    assert exc.value.status_code == 429
    assert exc.value.retry_after is None

