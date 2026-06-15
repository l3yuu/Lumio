import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import StudyGroup, User

def list_groups():
    db = SessionLocal()
    try:
        groups = db.query(StudyGroup).all()
        print(f"Total groups found: {len(groups)}")
        for g in groups:
            creator = db.query(User).filter(User.id == g.creator_id).first() if g.creator_id else None
            creator_email = creator.email if creator else "None"
            print(f"ID: {g.id} | Name: {g.name} | Creator Email: {creator_email}")
    except Exception as e:
        print(f"Error querying groups: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_groups()
