from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import SystemConfig
from .redis_client import cache_get, cache_set, cache_delete

DEFAULT_CONFIGS = {
    "allow_registrations": "true",
    "require_email_verification": "true",
    "allow_circle_creation": "true",
    "default_llm_model": "gemini-2.5-flash",
    "ai_temperature": "0.2",
    "free_summaries_limit": "5",
    "pro_summaries_limit": "25",
    "maintenance_mode": "false"
}

def get_system_config(db: Session, key: str) -> str:
    """Get system config by key with database session, checking Redis cache first."""
    cache_key = f"system_config:{key}"
    cached_val = cache_get(cache_key)
    if cached_val is not None:
        return str(cached_val)

    val = None
    try:
        db_config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        if db_config is not None:
            val = db_config.value
    except Exception:
        pass

    if val is None:
        val = DEFAULT_CONFIGS.get(key)

    if val is not None:
        cache_set(cache_key, val, expire_seconds=3600)
    return val

def get_system_config_global(key: str) -> str:
    """Get system config by key. Reads from Redis first, bypassing database connection entirely if cached."""
    cache_key = f"system_config:{key}"
    cached_val = cache_get(cache_key)
    if cached_val is not None:
        return str(cached_val)

    # Fallback to database lookup if cache miss
    db = SessionLocal()
    try:
        return get_system_config(db, key)
    finally:
        db.close()

def get_all_system_configs(db: Session) -> dict:
    """Retrieve all current system configurations, using Redis cache if possible."""
    cache_key = "system_configs:all"
    cached_configs = cache_get(cache_key)
    if cached_configs is not None and isinstance(cached_configs, dict):
        return cached_configs

    config_dict = {}
    try:
        db_configs = db.query(SystemConfig).all()
        config_dict = {cfg.key: cfg.value for cfg in db_configs}
    except Exception:
        pass
    
    # Fill in default values if not present
    for k, v in DEFAULT_CONFIGS.items():
        if k not in config_dict:
            config_dict[k] = v

    cache_set(cache_key, config_dict, expire_seconds=3600)
    return config_dict

def set_system_config(db: Session, key: str, value: str):
    """Set system config key and value, and invalidate the Redis cache."""
    db_config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if db_config:
        db_config.value = str(value)
    else:
        db_config = SystemConfig(key=key, value=str(value))
        db.add(db_config)
    db.commit()

    # Invalidate Redis caches
    cache_delete(f"system_config:{key}")
    cache_delete("system_configs:all")

    return db_config

