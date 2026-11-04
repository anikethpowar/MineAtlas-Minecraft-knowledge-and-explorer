"""Unit tests for the token-bucket rate limiter."""

from concurrent.futures import ThreadPoolExecutor
from app.services.rate_limiter import RateLimiter


def test_rate_limiter_initial_tokens_and_consumption():
    """Verify rate limiter starts with configured capacity and consumes accurately."""
    mock_time = [100.0]
    sleeps = []

    limiter = RateLimiter(
        capacity=50.0,
        refill_rate=1.0 / 1.2,
        initial_tokens=50.0,
        time_func=lambda: mock_time[0],
        sleep_func=lambda s: sleeps.append(s),
    )

    # 1. Acquire 5 tokens without sleep
    slept = limiter.acquire(5.0)
    assert slept == 0.0
    assert len(sleeps) == 0
    assert round(limiter.get_available_tokens(), 2) == 45.0


def test_rate_limiter_refill_and_capacity_bound():
    """Verify tokens refill over elapsed time and never exceed maximum capacity."""
    mock_time = [100.0]

    limiter = RateLimiter(
        capacity=50.0,
        refill_rate=1.0 / 1.2,  # ~0.8333 tokens per second
        initial_tokens=30.0,
        time_func=lambda: mock_time[0],
    )

    assert limiter.get_available_tokens() == 30.0

    # Advance virtual clock by 12 seconds (refills 12 / 1.2 = 10 tokens)
    mock_time[0] += 12.0
    assert round(limiter.get_available_tokens(), 2) == 40.0

    # Advance clock by 1000 seconds (must cap at 50.0)
    mock_time[0] += 1000.0
    assert limiter.get_available_tokens() == 50.0


def test_rate_limiter_sleeps_on_depletion():
    """Verify that acquiring beyond available tokens calculates exact sleep wait."""
    mock_time = [100.0]
    sleep_calls: list[float] = []

    def mock_sleep(seconds: float):
        sleep_calls.append(seconds)
        # In real execution, sleeping advances time
        mock_time[0] += seconds

    limiter = RateLimiter(
        capacity=50.0,
        refill_rate=1.0 / 1.2,
        initial_tokens=0.0,
        time_func=lambda: mock_time[0],
        sleep_func=mock_sleep,
    )

    # Acquire 1 token when bucket is empty
    slept = limiter.acquire(1.0)

    # Deficit is 1.0 token, wait time = 1.0 / (1 / 1.2) = 1.2 seconds
    assert round(slept, 2) == 1.2
    assert len(sleep_calls) == 1
    assert round(sleep_calls[0], 2) == 1.2


def test_rate_limiter_thread_safety():
    """Verify thread-safe token acquisition under concurrent load."""
    mock_time = [100.0]

    limiter = RateLimiter(
        capacity=100.0,
        refill_rate=1.0 / 1.2,
        initial_tokens=100.0,
        time_func=lambda: mock_time[0],
        sleep_func=lambda s: None,
    )

    def worker():
        limiter.acquire(1.0)

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(worker) for _ in range(50)]
        for f in futures:
            f.result()

    assert round(limiter.get_available_tokens(), 2) == 50.0

