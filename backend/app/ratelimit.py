import time
from collections import defaultdict


class RateLimiter:
    def __init__(self, max_attempts: int = 5, window_seconds: int = 300):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._store: dict[str, list[float]] = defaultdict(list)

    def _clean(self, key: str):
        now = time.time()
        self._store[key] = [t for t in self._store[key] if now - t < self.window_seconds]
        if not self._store[key]:
            del self._store[key]

    def is_limited(self, key: str) -> bool:
        self._clean(key)
        return len(self._store[key]) >= self.max_attempts

    def remaining(self, key: str) -> int:
        self._clean(key)
        return max(0, self.max_attempts - len(self._store[key]))

    def record(self, key: str):
        self._store[key].append(time.time())

    def reset(self, key: str):
        self._store.pop(key, None)


# Shared instances for different auth endpoints
login_limiter = RateLimiter(max_attempts=5, window_seconds=300)       # 5 attempts / 5 min
register_limiter = RateLimiter(max_attempts=3, window_seconds=3600)    # 3 attempts / hour
verify_limiter = RateLimiter(max_attempts=5, window_seconds=300)      # 5 attempts / 5 min
resend_limiter = RateLimiter(max_attempts=3, window_seconds=600)      # 3 attempts / 10 min
forgot_limiter = RateLimiter(max_attempts=3, window_seconds=3600)    # 3 attempts / hour
reset_limiter = RateLimiter(max_attempts=5, window_seconds=300)      # 5 attempts / 5 min
modules_limiter = RateLimiter(max_attempts=10, window_seconds=60)    # 10 attempts / minute

