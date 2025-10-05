from __future__ import annotations

import time


def monotonic_ms() -> int:
    """Return monotonic clock in milliseconds."""
    return int(time.perf_counter() * 1000)


def elapsed_ms(start_ms: int) -> int:
    """Compute elapsed milliseconds from a captured monotonic timestamp."""
    return max(0, monotonic_ms() - start_ms)
