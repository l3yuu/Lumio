import logging
import json
from typing import Any, Optional
import redis
from .config import settings

logger = logging.getLogger("lumio.redis")

# Global Redis client
_redis_client: Optional[redis.Redis] = None
_redis_available: bool = False

def init_redis():
    """Initialize Redis client and verify connection."""
    global _redis_client, _redis_available
    if not settings.REDIS_URL:
        logger.warning("REDIS_URL is not set. Redis caching will be disabled.")
        _redis_available = False
        return None

    try:
        # Set socket_connect_timeout to 2 seconds so startup/pings don't hang too long if offline
        _redis_client = redis.Redis.from_url(
            settings.REDIS_URL, 
            decode_responses=True,
            socket_connect_timeout=2.0,
            socket_timeout=2.0
        )
        # Test connection
        _redis_client.ping()
        _redis_available = True
        logger.info("Successfully connected to Redis!")
    except Exception as e:
        logger.warning(f"Could not connect to Redis: {e}. Falling back to in-memory/database operations.")
        _redis_available = False
        _redis_client = None

def get_redis() -> Optional[redis.Redis]:
    """Get the initialized Redis client if available."""
    global _redis_client, _redis_available
    if not _redis_available or _redis_client is None:
        return None
    return _redis_client

def is_redis_available() -> bool:
    """Check if Redis connection is active and healthy."""
    client = get_redis()
    if client is None:
        return False
    try:
        return client.ping()
    except Exception:
        return False

# Caching helpers
def cache_get(key: str) -> Optional[Any]:
    """Retrieve value from cache. Supports stringified JSON parsing."""
    client = get_redis()
    if not client:
        return None
    try:
        val = client.get(key)
        if val is None:
            return None
        try:
            return json.loads(val)
        except json.JSONDecodeError:
            return val
    except Exception as e:
        logger.warning(f"Redis cache_get failed for key '{key}': {e}")
        return None

def cache_set(key: str, value: Any, expire_seconds: Optional[int] = None) -> bool:
    """Set value in cache. Serializes non-string objects to JSON."""
    client = get_redis()
    if not client:
        return False
    try:
        if not isinstance(value, (str, int, float, bool)):
            serialized_val = json.dumps(value)
        else:
            serialized_val = str(value)
        
        if expire_seconds:
            client.setex(key, expire_seconds, serialized_val)
        else:
            client.set(key, serialized_val)
        return True
    except Exception as e:
        logger.warning(f"Redis cache_set failed for key '{key}': {e}")
        return False

def cache_delete(key: str) -> bool:
    """Delete a key from Redis cache."""
    client = get_redis()
    if not client:
        return False
    try:
        client.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Redis cache_delete failed for key '{key}': {e}")
        return False

def cache_delete_pattern(pattern: str) -> bool:
    """Delete keys matching a pattern (e.g. system_config:*)."""
    client = get_redis()
    if not client:
        return False
    try:
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)
        return True
    except Exception as e:
        logger.warning(f"Redis cache_delete_pattern failed for pattern '{pattern}': {e}")
        return False
