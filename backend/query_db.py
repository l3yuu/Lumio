import sqlalchemy
from sqlalchemy import text

DB_URL = "postgresql://neondb_owner:npg_9iVHNW8IXRPu@ep-ancient-hall-aqa0n9bp.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"

try:
    print("Connecting to database...")
    engine = sqlalchemy.create_engine(DB_URL)
    with engine.connect() as conn:
        print("Connected! Fetching users...")
        result = conn.execute(text("SELECT id, email, name, is_verified, verification_code FROM users ORDER BY id DESC LIMIT 5"))
        users = result.fetchall()
        print("\nRecent users:")
        for u in users:
            print(f"ID: {u[0]} | Email: {u[1]} | Name: {u[2]} | Verified: {u[3]} | Code: {u[4]}")
except Exception as e:
    print(f"Database Query Failed: {e}")
