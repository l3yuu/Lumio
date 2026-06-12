import sys
from app.database import SessionLocal
from app.models import User

def promote_user(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Error: User with email '{email}' not found.")
            sys.exit(1)
        
        user.role = "superadmin"
        db.commit()
        print(f"Success: User '{user.name}' ({email}) has been promoted to 'superadmin'!")
    except Exception as e:
        print(f"Database Error: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_user.py <email>")
        sys.exit(1)
    
    email_to_promote = sys.argv[1].strip()
    promote_user(email_to_promote)
