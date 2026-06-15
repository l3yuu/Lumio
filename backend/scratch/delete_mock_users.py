import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import User

def delete_mock_users():
    db = SessionLocal()
    try:
        mock_users = db.query(User).filter(User.email.like("%@example.com")).all()
        count = len(mock_users)
        if count == 0:
            print("No mock users found in the database.")
            return
        
        print(f"Found {count} mock users to delete:")
        for u in mock_users:
            print(f"- deleting {u.name} ({u.email})")
            db.delete(u)
        
        db.commit()
        print(f"Successfully deleted {count} mock users from the database!")
    except Exception as e:
        db.rollback()
        print(f"Error during deletion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    delete_mock_users()
