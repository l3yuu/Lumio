import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import User

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total users found: {len(users)}")
        for u in users:
            print(f"ID: {u.id} | Name: {u.name} | Email: {u.email} | Role: {u.role}")
    except Exception as e:
        print(f"Error querying users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
