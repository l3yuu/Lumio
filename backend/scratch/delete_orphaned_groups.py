import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import StudyGroup, User

def delete_orphaned_groups():
    db = SessionLocal()
    try:
        # Fetch groups where creator_id is None
        orphaned_groups = db.query(StudyGroup).filter(StudyGroup.creator_id == None).all()
        count = len(orphaned_groups)
        if count == 0:
            print("No orphaned groups found.")
            return
        
        print(f"Deleting {count} orphaned study groups:")
        for g in orphaned_groups:
            print(f"- deleting Group '{g.name}' (ID: {g.id})")
            db.delete(g)
            
        db.commit()
        print(f"Successfully deleted {count} orphaned study groups!")
    except Exception as e:
        db.rollback()
        print(f"Error during deletion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    delete_orphaned_groups()
