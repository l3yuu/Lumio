import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from pydantic import BaseModel
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Save startup time
START_TIME = time.time()

# Security dependency for superadmins
def get_current_superadmin(current_user: models.User = Depends(auth.get_current_user)) -> models.User:
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Superadmin access required"
        )
    return current_user

class RoleUpdate(BaseModel):
    role: str

@router.get("/health")
def get_admin_health(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    # Test DB connection and measure latency
    try:
        start_time = time.time()
        db.execute(text("SELECT 1"))
        db_latency = round((time.time() - start_time) * 1000, 2)
        db_status = "connected"
    except Exception as e:
        db_latency = -1
        db_status = f"error: {str(e)}"

    # Get system statistics (uptime and item counts)
    uptime_seconds = int(time.time() - START_TIME)
    
    total_users = db.query(models.User).count()
    total_modules = db.query(models.Module).count()
    total_groups = db.query(models.StudyGroup).count()

    return {
        "status": "healthy",
        "uptime_seconds": uptime_seconds,
        "database": {
            "status": db_status,
            "latency_ms": db_latency
        },
        "counts": {
            "users": total_users,
            "modules": total_modules,
            "groups": total_groups
        }
    }

@router.get("/users", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    users = db.query(models.User).order_by(models.User.id.desc()).all()
    return users

@router.put("/users/{user_id}/role", response_model=schemas.UserOut)
def update_user_role(
    user_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    if role_data.role not in ["user", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'user' or 'superadmin'"
        )
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Prevent demoting oneself
    if user.id == current_admin.id and role_data.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote yourself from superadmin"
        )
        
    user.role = role_data.role
    db.commit()
    db.refresh(user)
    return user

@router.get("/modules")
def list_admin_modules(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    modules = db.query(models.Module).order_by(models.Module.id.desc()).all()
    result = []
    for m in modules:
        owner = db.query(models.User).filter(models.User.id == m.user_id).first()
        result.append({
            "id": m.id,
            "name": m.name,
            "subject": m.subject,
            "date": m.date,
            "owner_email": owner.email if owner else "Unknown",
            "owner_name": owner.name if owner else "Unknown",
            "questions_count": len(m.questions) if m.questions else 0,
            "difficulty": m.difficulty or "medium"
        })
    return result

@router.get("/groups")
def list_admin_groups(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    groups = db.query(models.StudyGroup).order_by(models.StudyGroup.id.desc()).all()
    result = []
    for g in groups:
        creator = db.query(models.User).filter(models.User.id == g.creator_id).first() if g.creator_id else None
        result.append({
            "id": g.id,
            "name": g.name,
            "creator_email": creator.email if creator else "System/Unknown",
            "creator_name": creator.name if creator else "System/Unknown",
            "members_count": len(g.members) if g.members else 0,
            "modules_count": len(g.modules) if g.modules else 0
        })
    return result

@router.get("/sales")
def get_admin_sales(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    users = db.query(models.User).order_by(models.User.id.asc()).all()
    total_users_count = len(users)
    premium_users = [u for u in users if u.id % 3 == 0]
    premium_count = len(premium_users)
    
    # Calculate deterministic mock revenue statistics
    mrr = round(premium_count * 12.99, 2)
    total_revenue = round(total_users_count * 15.50 + premium_count * 45.00, 2)
    churn_rate = 2.4
    
    # Recent transactions
    recent_transactions = []
    for i, u in enumerate(users[:10]):
        plan = "Premium Pro" if u.id % 2 == 0 else "Premium Starter"
        amount = 19.99 if u.id % 2 == 0 else 9.99
        date_str = f"2026-06-{max(1, 12 - i):02d}"
        recent_transactions.append({
            "id": 1000 + u.id,
            "user_name": u.name,
            "user_email": u.email,
            "plan": plan,
            "amount": amount,
            "date": date_str,
            "status": "completed" if u.id % 5 != 0 else "failed"
        })
        
    return {
        "mrr": mrr,
        "total_revenue": total_revenue,
        "premium_count": premium_count,
        "churn_rate": churn_rate,
        "transactions": recent_transactions
    }

@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.delete("/modules/{module_id}")
def admin_delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found"
        )
    db.delete(module)
    db.commit()
    return {"message": "Module deleted successfully"}

@router.delete("/groups/{group_id}")
def admin_delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    db.delete(group)
    db.commit()
    return {"message": "Group deleted successfully"}
