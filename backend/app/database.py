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
        if "is_public" not in group_columns:
            if engine.dialect.name == "postgresql":
                statements.append("ALTER TABLE study_groups ADD COLUMN is_public BOOLEAN DEFAULT FALSE")
            else:
                statements.append("ALTER TABLE study_groups ADD COLUMN is_public INTEGER DEFAULT 0")

    # Add indexes on foreign keys to optimize query performance (joins and filters)
    statements.append("CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules(user_id)")
    statements.append("CREATE INDEX IF NOT EXISTS idx_quiz_questions_module_id ON quiz_questions(module_id)")
    statements.append("CREATE INDEX IF NOT EXISTS idx_exam_deadlines_user_id ON exam_deadlines(user_id)")
    statements.append("CREATE INDEX IF NOT EXISTS idx_study_groups_creator_id ON study_groups(creator_id)")
    statements.append("CREATE INDEX IF NOT EXISTS idx_quiz_sessions_group_id ON quiz_sessions(group_id)")
    statements.append("CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id)")
    statements.append("CREATE INDEX IF NOT EXISTS idx_group_posts_user_id ON group_posts(user_id)")
    statements.append("CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id)")
    statements.append("CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)")

    if "notes" in table_names:
        note_columns = {column["name"] for column in inspector.get_columns("notes")}
        if "is_pinned" not in note_columns:
            if engine.dialect.name == "postgresql":
                statements.append("ALTER TABLE notes ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE")
            else:
                statements.append("ALTER TABLE notes ADD COLUMN is_pinned INTEGER DEFAULT 0")

    if "quiz_questions" in table_names:
        qq_columns = {column["name"] for column in inspector.get_columns("quiz_questions")}
        if "explanation" not in qq_columns:
            statements.append("ALTER TABLE quiz_questions ADD COLUMN explanation TEXT")
        if "hint" not in qq_columns:
            statements.append("ALTER TABLE quiz_questions ADD COLUMN hint TEXT")
        if "question_type" not in qq_columns:
            statements.append("ALTER TABLE quiz_questions ADD COLUMN question_type VARCHAR(50) DEFAULT 'multiple_choice'")
        if "reference" not in qq_columns:
            statements.append("ALTER TABLE quiz_questions ADD COLUMN reference VARCHAR(255)")

    if "ai_usage_logs" not in table_names:
        create_sql = """
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    feature VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    prompt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""
        if engine.dialect.name == "postgresql":
            create_sql = """
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    feature VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    prompt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""
        statements.append(create_sql)
    else:
        ai_columns = {column["name"] for column in inspector.get_columns("ai_usage_logs")}
        if "prompt" not in ai_columns:
            statements.append("ALTER TABLE ai_usage_logs ADD COLUMN prompt TEXT")
        if "response" not in ai_columns:
            statements.append("ALTER TABLE ai_usage_logs ADD COLUMN response TEXT")
        if "tokens_used" not in ai_columns:
            statements.append("ALTER TABLE ai_usage_logs ADD COLUMN tokens_used INTEGER")

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
