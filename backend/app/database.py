from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if db_url.startswith("sqlite"):
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        db_url,
        pool_size=10,
        max_overflow=20,
        pool_recycle=300,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_runtime_schema():
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    statements = []

    if "modules" in table_names:
        module_columns = {column["name"] for column in inspector.get_columns("modules")}
        binary_type = "BYTEA" if engine.dialect.name == "postgresql" else "BLOB"
        if "source_file_data" not in module_columns:
            statements.append(f"ALTER TABLE modules ADD COLUMN source_file_data {binary_type}")
        if "source_file_mime" not in module_columns:
            statements.append("ALTER TABLE modules ADD COLUMN source_file_mime VARCHAR(100)")
        if "last_score" not in module_columns:
            statements.append("ALTER TABLE modules ADD COLUMN last_score VARCHAR(50)")
        if "difficulty" not in module_columns:
            statements.append("ALTER TABLE modules ADD COLUMN difficulty VARCHAR(20) DEFAULT 'medium'")

    if "exam_deadlines" in table_names:
        exam_columns = {column["name"] for column in inspector.get_columns("exam_deadlines")}
        if "reminder_sent" not in exam_columns:
            if engine.dialect.name == "postgresql":
                statements.append("ALTER TABLE exam_deadlines ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE")
            else:
                statements.append("ALTER TABLE exam_deadlines ADD COLUMN reminder_sent INTEGER DEFAULT 0")
        if "completed" not in exam_columns:
            if engine.dialect.name == "postgresql":
                statements.append("ALTER TABLE exam_deadlines ADD COLUMN completed BOOLEAN DEFAULT FALSE")
            else:
                statements.append("ALTER TABLE exam_deadlines ADD COLUMN completed INTEGER DEFAULT 0")
        if "score" not in exam_columns:
            statements.append("ALTER TABLE exam_deadlines ADD COLUMN score VARCHAR(50)")
        if "topics" not in exam_columns:
            if engine.dialect.name == "postgresql":
                statements.append("ALTER TABLE exam_deadlines ADD COLUMN topics JSON")
            else:
                statements.append("ALTER TABLE exam_deadlines ADD COLUMN topics TEXT")

    if "users" in table_names:
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        if "folders" not in user_columns:
            statements.append("ALTER TABLE users ADD COLUMN folders JSON")
        if "role" not in user_columns:
            statements.append("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'")
        if "stripe_customer_id" not in user_columns:
            statements.append("ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255)")
        if "stripe_subscription_id" not in user_columns:
            statements.append("ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255)")
        if "stripe_subscription_status" not in user_columns:
            statements.append("ALTER TABLE users ADD COLUMN stripe_subscription_status VARCHAR(50)")
        if "stripe_price_id" not in user_columns:
            statements.append("ALTER TABLE users ADD COLUMN stripe_price_id VARCHAR(255)")
        if "premium_expires_at" not in user_columns:
            statements.append("ALTER TABLE users ADD COLUMN premium_expires_at TIMESTAMP")
        if "is_suspended" not in user_columns:
            if engine.dialect.name == "postgresql":
                statements.append("ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE")
            else:
                statements.append("ALTER TABLE users ADD COLUMN is_suspended INTEGER DEFAULT 0")

    if "study_groups" in table_names:
        group_columns = {column["name"] for column in inspector.get_columns("study_groups")}
        if "is_banned" not in group_columns:
            if engine.dialect.name == "postgresql":
                statements.append("ALTER TABLE study_groups ADD COLUMN is_banned BOOLEAN DEFAULT FALSE")
            else:
                statements.append("ALTER TABLE study_groups ADD COLUMN is_banned INTEGER DEFAULT 0")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
