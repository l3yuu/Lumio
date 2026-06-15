import sqlalchemy
from sqlalchemy import text
from datetime import datetime, timedelta

DB_URL = "postgresql://postgres:postgres@localhost:5433/lumio"

try:
    engine = sqlalchemy.create_engine(DB_URL)
    with engine.connect() as conn:
        # Check current status
        result = conn.execute(text("SELECT id, email, role FROM users WHERE email = 'binas.leumar1@gmail.com'"))
        user = result.fetchone()
        if user:
            print(f"Found user. Current role: {user[2]}")
            
            # Upgrade user
            expiry = datetime.utcnow() + timedelta(days=30)
            conn.execute(text("UPDATE users SET role = 'premium', stripe_subscription_status = 'active', premium_expires_at = :expiry WHERE email = 'binas.leumar1@gmail.com'"), {"expiry": expiry})
            conn.commit()
            print("Successfully upgraded user 'binas.leumar1@gmail.com' to 'premium' (Pro Student) for 30 days!")
        else:
            print("User 'binas.leumar1@gmail.com' not found in database.")
except Exception as e:
    print(f"Database Upgrade Failed: {e}")
