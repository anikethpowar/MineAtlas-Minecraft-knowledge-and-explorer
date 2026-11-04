import json
from app.main import app
from app.routers.health import get_health


def test_health_endpoint_data():
    """Verify that get_health() returns the expected foundation payload."""
    payload = get_health()
    assert payload == {
        "status": "ok",
        "service": "MineAtlas API",
        "edition": "Java Edition",
        "phase": "foundation",
    }


def test_health_route_registered():
    """Verify that /api/health route is registered on the FastAPI app OpenAPI schema."""
    openapi_paths = app.openapi()["paths"]
    assert "/api/health" in openapi_paths
    assert "get" in openapi_paths["/api/health"]


def test_api_health_asgi_invocation():
    """Prove /api/health works end-to-end via ASGI invocation."""
    import anyio

    async def run_request():
        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": "GET",
            "scheme": "http",
            "path": "/api/health",
            "raw_path": b"/api/health",
            "query_string": b"",
            "headers": [(b"host", b"localhost:8000")],
            "client": ("127.0.0.1", 50000),
            "server": ("127.0.0.1", 8000),
        }

        sent_messages = []

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(message):
            sent_messages.append(message)

        await app(scope, receive, send)
        return sent_messages

    messages = anyio.run(run_request)

    # Validate response status code
    response_start = next(m for m in messages if m["type"] == "http.response.start")
    assert response_start["status"] == 200

    # Validate response body JSON
    response_body = next(m for m in messages if m["type"] == "http.response.body")
    payload = json.loads(response_body["body"].decode("utf-8"))
    assert payload == {
        "status": "ok",
        "service": "MineAtlas API",
        "edition": "Java Edition",
        "phase": "foundation",
    }
