import sqlalchemy
from sqlalchemy import text

DB_URL = "postgresql://postgres:postgres@localhost:5433/lumio"

try:
    engine = sqlalchemy.create_engine(DB_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, email, name, role, stripe_subscription_status, premium_expires_at FROM users WHERE email = 'binas.leumar1@gmail.com'"))
        user = result.fetchone()
        if user:
            print("\nUser details found:")
            print(f"ID: {user[0]}")
            print(f"Email: {user[1]}")
            print(f"Name: {user[2]}")
            print(f"Role: {user[3]}")
            print(f"Stripe Subscription Status: {user[4]}")
            print(f"Premium Expires At: {user[5]}")
        else:
            print("\nUser 'binas.leumar1@gmail.com' not found.")
except Exception as e:
    print(f"Database Query Failed: {e}")
