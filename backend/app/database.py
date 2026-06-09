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
    if "modules" not in inspector.get_table_names():
        return

    module_columns = {column["name"] for column in inspector.get_columns("modules")}
    binary_type = "BYTEA" if engine.dialect.name == "postgresql" else "BLOB"
    statements = []

    if "source_file_data" not in module_columns:
        statements.append(f"ALTER TABLE modules ADD COLUMN source_file_data {binary_type}")
    if "source_file_mime" not in module_columns:
        statements.append("ALTER TABLE modules ADD COLUMN source_file_mime VARCHAR(100)")
    if "last_score" not in module_columns:
        statements.append("ALTER TABLE modules ADD COLUMN last_score VARCHAR(50)")

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
