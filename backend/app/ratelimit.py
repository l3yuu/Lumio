import time
import logging
from collections import defaultdict
from .redis_client import get_redis

logger = logging.getLogger("lumio.ratelimit")

class RateLimiter:
    def __init__(self, max_attempts: int = 5, window_seconds: int = 300, prefix: str = "ratelimit"):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.prefix = prefix
        self._store: dict[str, list[float]] = defaultdict(list)

    def _get_redis_key(self, key: str) -> str:
        return f"{self.prefix}:{key}"

    def _clean_local(self, key: str):
        now = time.time()
        self._store[key] = [t for t in self._store[key] if now - t < self.window_seconds]
        if not self._store[key]:
            self._store.pop(key, None)

    def is_limited(self, key: str) -> bool:
        client = get_redis()
        if client:
            redis_key = self._get_redis_key(key)
            try:
                now = time.time()
                clear_before = now - self.window_seconds
                
                # Run cleanup and card check in a pipeline
                pipe = client.pipeline()
                pipe.zremrangebyscore(redis_key, 0, clear_before)
                pipe.zcard(redis_key)
                _, count = pipe.execute()
                
                return count >= self.max_attempts
            except Exception as e:
                logger.warning(f"Redis rate limiting failed for is_limited({key}): {e}. Falling back to in-memory.")
                # Fall through to local memory limit check
        
        self._clean_local(key)
        return len(self._store[key]) >= self.max_attempts

    def remaining(self, key: str) -> int:
        client = get_redis()
        if client:
            redis_key = self._get_redis_key(key)
            try:
                now = time.time()
                clear_before = now - self.window_seconds
                
                pipe = client.pipeline()
                pipe.zremrangebyscore(redis_key, 0, clear_before)
                pipe.zcard(redis_key)
                _, count = pipe.execute()
                
                return max(0, self.max_attempts - count)
            except Exception as e:
                logger.warning(f"Redis rate limiting failed for remaining({key}): {e}. Falling back to in-memory.")
                # Fall through to local memory limit check
        
        self._clean_local(key)
        return max(0, self.max_attempts - len(self._store[key]))

    def record(self, key: str):
        client = get_redis()
        if client:
            redis_key = self._get_redis_key(key)
            try:
                now = time.time()
                clear_before = now - self.window_seconds
                # Use high-precision timestamp to make elements unique inside Sorted Set
                unique_val = f"{now}:{time.time_ns()}"
                
                pipe = client.pipeline()
                pipe.zadd(redis_key, {unique_val: now})
                pipe.zremrangebyscore(redis_key, 0, clear_before)
                pipe.expire(redis_key, self.window_seconds)
                pipe.execute()
                return
            except Exception as e:
                logger.warning(f"Redis rate limiting failed for record({key}): {e}. Falling back to in-memory.")
                # Fall through to local memory recording
        
        self._store[key].append(time.time())

    def reset(self, key: str):
        client = get_redis()
        if client:
            redis_key = self._get_redis_key(key)
            try:
                client.delete(redis_key)
                return
            except Exception as e:
                logger.warning(f"Redis rate limiting failed for reset({key}): {e}. Falling back to in-memory.")
                # Fall through to local memory reset
        
        self._store.pop(key, None)


# Shared instances for different auth endpoints
login_limiter = RateLimiter(max_attempts=5, window_seconds=300, prefix="ratelimit:login")       # 5 attempts / 5 min
register_limiter = RateLimiter(max_attempts=3, window_seconds=3600, prefix="ratelimit:register")    # 3 attempts / hour
verify_limiter = RateLimiter(max_attempts=5, window_seconds=300, prefix="ratelimit:verify")      # 5 attempts / 5 min
resend_limiter = RateLimiter(max_attempts=3, window_seconds=600, prefix="ratelimit:resend")      # 3 attempts / 10 min
forgot_limiter = RateLimiter(max_attempts=3, window_seconds=3600, prefix="ratelimit:forgot")    # 3 attempts / hour
reset_limiter = RateLimiter(max_attempts=5, window_seconds=300, prefix="ratelimit:reset")      # 5 attempts / 5 min
modules_limiter = RateLimiter(max_attempts=10, window_seconds=60, prefix="ratelimit:modules")    # 10 attempts / minute
condenser_limiter = RateLimiter(max_attempts=10, window_seconds=60, prefix="ratelimit:condenser")  # 10 attempts / minute



