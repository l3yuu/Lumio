import sys
import os
import time
from unittest import mock

# Ensure the root/backend path is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.redis_client import init_redis, get_redis, cache_set, cache_get, cache_delete, is_redis_available
from app.ratelimit import RateLimiter

def test_redis_connection():
    print("Testing connection to Redis...")
    init_redis()
    if is_redis_available():
        print("[SUCCESS] Connected to Redis successfully!")
    else:
        print("[ERROR] Failed to connect to Redis. Make sure docker is running.")
        sys.exit(1)

def test_basic_caching():
    print("\nTesting basic caching (Set/Get/Delete)...")
    key = "test:temp_key"
    val = {"message": "hello redis!", "success": True}
    
    # Set cache
    if cache_set(key, val, expire_seconds=10):
        print(f"[SUCCESS] Set key '{key}'")
    else:
        print(f"[ERROR] Failed to set key '{key}'")
        sys.exit(1)

    # Get cache
    retrieved = cache_get(key)
    if retrieved == val:
        print(f"[SUCCESS] Retrieved correct value: {retrieved}")
    else:
        print(f"[ERROR] Retrieved incorrect value: {retrieved}")
        sys.exit(1)

    # Delete cache
    if cache_delete(key):
        print(f"[SUCCESS] Deleted key '{key}'")
    else:
        print(f"[ERROR] Failed to delete key '{key}'")
        sys.exit(1)

    # Verify deleted
    if cache_get(key) is None:
        print("[SUCCESS] Verified key is deleted")
    else:
        print("[ERROR] Key still exists after deletion!")
        sys.exit(1)

def test_rate_limiter():
    print("\nTesting Redis Rate Limiter...")
    limiter = RateLimiter(max_attempts=3, window_seconds=2, prefix="test:ratelimit")
    user_key = "user_123"

    # Reset in case of previous run
    limiter.reset(user_key)

    # Attempt 1
    limiter.record(user_key)
    remaining = limiter.remaining(user_key)
    print(f"Record 1: Remaining attempts = {remaining} (expected 2)")
    assert remaining == 2, "Remaining attempts should be 2"

    # Attempt 2
    limiter.record(user_key)
    remaining = limiter.remaining(user_key)
    print(f"Record 2: Remaining attempts = {remaining} (expected 1)")
    assert remaining == 1, "Remaining attempts should be 1"

    # Attempt 3
    limiter.record(user_key)
    limited = limiter.is_limited(user_key)
    remaining = limiter.remaining(user_key)
    print(f"Record 3: Limited? {limited} (expected True), Remaining attempts = {remaining} (expected 0)")
    assert limited is True, "Rate limit should be active"
    assert remaining == 0, "Remaining attempts should be 0"

    # Wait for window to expire
    print("Waiting 2.5 seconds for window to clear...")
    time.sleep(2.5)

    limited = limiter.is_limited(user_key)
    remaining = limiter.remaining(user_key)
    print(f"Post-wait: Limited? {limited} (expected False), Remaining attempts = {remaining} (expected 3)")
    assert limited is False, "Rate limit should be cleared"
    assert remaining == 3, "Remaining attempts should be 3"

    print("[SUCCESS] Redis Rate Limiter verified successfully!")

def test_rate_limiter_fallback():
    print("\nTesting Rate Limiter Fallback (Redis disconnected)...")
    limiter = RateLimiter(max_attempts=2, window_seconds=2, prefix="test:fallback")
    user_key = "user_456"

    # Mock get_redis to return None (simulate Redis being offline)
    with mock.patch("app.ratelimit.get_redis", return_value=None):
        # Reset memory in case of previous runs
        limiter.reset(user_key)

        # Attempt 1
        limiter.record(user_key)
        remaining = limiter.remaining(user_key)
        print(f"Fallback Record 1: Remaining = {remaining} (expected 1)")
        assert remaining == 1, "Fallback remaining attempts should be 1"

        # Attempt 2
        limiter.record(user_key)
        limited = limiter.is_limited(user_key)
        remaining = limiter.remaining(user_key)
        print(f"Fallback Record 2: Limited? {limited} (expected True), Remaining = {remaining} (expected 0)")
        assert limited is True, "Fallback rate limit should be active"
        assert remaining == 0, "Fallback remaining attempts should be 0"

    print("[SUCCESS] Rate Limiter Fallback verified successfully!")

def test_binary_file_caching():
    import base64
    print("\nTesting Base64 Binary File/Image caching in Redis...")
    
    # Simulate binary image file bytes
    original_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    media_type = "image/png"
    filename = "test_image.png"
    
    cache_key = "test:modules:public:file:999"
    
    # 1. Base64 encode and cache
    b64_content = base64.b64encode(original_bytes).decode("utf-8")
    cached_dict = {
        "content_b64": b64_content,
        "media_type": media_type,
        "filename": filename
    }
    
    cache_set(cache_key, cached_dict, expire_seconds=10)
    print(f"[SUCCESS] Encoded and set binary cache for key '{cache_key}'")

    # 2. Retrieve and Base64 decode
    retrieved_dict = cache_get(cache_key)
    assert retrieved_dict is not None, "Failed to retrieve binary cache dict"
    assert retrieved_dict["media_type"] == media_type, "Media type mismatch"
    assert retrieved_dict["filename"] == filename, "Filename mismatch"
    
    decoded_bytes = base64.b64decode(retrieved_dict["content_b64"])
    assert decoded_bytes == original_bytes, "Decoded bytes do not match original bytes!"
    print(f"[SUCCESS] Successfully retrieved and verified decoded bytes matches original size: {len(decoded_bytes)} bytes")
    
    # Cleanup
    cache_delete(cache_key)

def test_listings_caching():
    print("\nTesting Public listings (JSON serialization) caching in Redis...")
    
    cache_key = "test:modules:public:listings:math:0:10"
    
    # Mock some module lists
    listings = [
        {"id": 1, "name": "Calculus 101", "is_public": True, "subject": "Math", "questions": []},
        {"id": 2, "name": "Linear Algebra", "is_public": True, "subject": "Math", "questions": []}
    ]
    
    cache_set(cache_key, listings, expire_seconds=10)
    print(f"[SUCCESS] Saved listings list for key '{cache_key}'")
    
    retrieved_listings = cache_get(cache_key)
    assert retrieved_listings is not None, "Failed to retrieve listings"
    assert len(retrieved_listings) == 2, "Listings length mismatch"
    assert retrieved_listings[0]["name"] == "Calculus 101", "Listings content mismatch"
    print(f"[SUCCESS] Successfully retrieved and validated listings: {retrieved_listings}")
    
    # Cleanup
    cache_delete(cache_key)

if __name__ == "__main__":
    print("=== STARTING REDIS INTEGRATION TESTS ===")
    test_redis_connection()
    test_basic_caching()
    test_rate_limiter()
    test_rate_limiter_fallback()
    test_binary_file_caching()
    test_listings_caching()
    print("=== ALL REDIS INTEGRATION TESTS PASSED ===")
