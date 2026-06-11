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
    engine = create_engine(db_url)

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

    if "users" in table_names:
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        if "folders" not in user_columns:
            statements.append("ALTER TABLE users ADD COLUMN folders JSON")

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
