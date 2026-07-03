from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import SystemConfig

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
    """Get system config by key with database session."""
    try:
        db_config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        if db_config is not None:
            return db_config.value
    except Exception:
        pass
    return DEFAULT_CONFIGS.get(key)

def get_system_config_global(key: str) -> str:
    """Get system config by key opening a one-off database session (for use outside routes)."""
    db = SessionLocal()
    try:
        return get_system_config(db, key)
    finally:
        db.close()

def get_all_system_configs(db: Session) -> dict:
    """Retrieve all current system configurations (with defaults filled in)."""
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
    return config_dict

def set_system_config(db: Session, key: str, value: str):
    """Set system config key and value."""
    db_config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if db_config:
        db_config.value = str(value)
    else:
        db_config = SystemConfig(key=key, value=str(value))
        db.add(db_config)
    db.commit()
    return db_config
