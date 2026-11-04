"""In-process Token-Bucket Rate Limiter for MineAtlas.

Enforces the strict project rule:
- Maximum 50 requests per rolling minute to Astroworld API.
- Refill rate: 1 token every 1.2 seconds (50 tokens / 60 seconds = ~0.8333 tokens/sec).
- Capacity: 50 tokens.
"""

import threading
import time
from typing import Callable


class RateLimiter:
    """Thread-safe in-process token-bucket rate limiter.

    Allows token acquisition with automated sleeping when capacity is depleted.
    Time and sleep callables are injectable to enable sub-millisecond unit testing.
    """

    def __init__(
        self,
        capacity: float = 50.0,
        refill_rate: float = 1.0 / 1.2,  # 1 token per 1.2 seconds (~0.8333 tokens/sec)
        initial_tokens: float | None = None,
        time_func: Callable[[], float] | None = None,
        sleep_func: Callable[[float], None] | None = None,
    ) -> None:
        self.capacity = float(capacity)
        self.refill_rate = float(refill_rate)
        self.tokens = float(initial_tokens if initial_tokens is not None else capacity)
        self.time_func = time_func or time.monotonic
        self.sleep_func = sleep_func or time.sleep
        self.last_refill_time = self.time_func()
        self._lock = threading.Lock()

    def _refill(self, now: float) -> None:
        """Add refilled tokens based on time elapsed since last check."""
        elapsed = now - self.last_refill_time
        if elapsed > 0:
            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
            self.last_refill_time = now

    def acquire(self, tokens: float = 1.0) -> float:
        """Acquire the requested number of tokens, sleeping if depleted.

        Args:
            tokens: Number of tokens requested (default: 1.0).

        Returns:
            float: Time in seconds slept (0.0 if tokens were immediately available).
        """
        with self._lock:
            now = self.time_func()
            self._refill(now)

            if self.tokens >= tokens:
                self.tokens -= tokens
                return 0.0

            # Calculate wait time required to refill the deficit
            deficit = tokens - self.tokens
            wait_time = deficit / self.refill_rate
            self.sleep_func(wait_time)

            # Consume tokens after sleeping
            now_after = self.time_func()
            self.last_refill_time = now_after
            self.tokens = 0.0
            return wait_time

    def get_available_tokens(self) -> float:
        """Inspect current token count without consuming."""
        with self._lock:
            now = self.time_func()
            self._refill(now)
            return self.tokens

