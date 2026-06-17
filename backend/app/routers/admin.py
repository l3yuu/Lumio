import time
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import os
import mimetypes
from io import BytesIO
from ..email import (
    send_pro_status_email,
    send_admin_status_email,
    send_account_suspension_email,
    send_account_deletion_email,
    send_gemini_unhealthy_email
)
from ..config import settings
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Save startup time
START_TIME = time.time()
LAST_GEMINI_ALERT_TIME = 0.0

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

class UserSuspendUpdate(BaseModel):
    is_suspended: bool

class GroupBanUpdate(BaseModel):
    is_banned: bool
    reason: Optional[str] = None

@router.get("/config", response_model=schemas.SystemConfigOut)
def get_system_configurations(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    from ..system_config import get_all_system_configs
    configs = get_all_system_configs(db)
    
    return schemas.SystemConfigOut(
        allow_registrations=configs.get("allow_registrations") == "true",
        require_email_verification=configs.get("require_email_verification") == "true",
        allow_circle_creation=configs.get("allow_circle_creation") == "true",
        default_llm_model=configs.get("default_llm_model"),
        ai_temperature=float(configs.get("ai_temperature", "0.2")),
        free_summaries_limit=int(configs.get("free_summaries_limit", "5")),
        pro_summaries_limit=int(configs.get("pro_summaries_limit", "25")),
        maintenance_mode=configs.get("maintenance_mode") == "true"
    )

@router.put("/config", response_model=schemas.SystemConfigOut)
def update_system_configurations(
    config_update: schemas.SystemConfigUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    from ..system_config import set_system_config, get_all_system_configs
    
    if config_update.allow_registrations is not None:
        set_system_config(db, "allow_registrations", "true" if config_update.allow_registrations else "false")
    if config_update.require_email_verification is not None:
        set_system_config(db, "require_email_verification", "true" if config_update.require_email_verification else "false")
    if config_update.allow_circle_creation is not None:
        set_system_config(db, "allow_circle_creation", "true" if config_update.allow_circle_creation else "false")
    if config_update.default_llm_model is not None:
        set_system_config(db, "default_llm_model", config_update.default_llm_model)
    if config_update.ai_temperature is not None:
        set_system_config(db, "ai_temperature", str(config_update.ai_temperature))
    if config_update.free_summaries_limit is not None:
        set_system_config(db, "free_summaries_limit", str(config_update.free_summaries_limit))
    if config_update.pro_summaries_limit is not None:
        set_system_config(db, "pro_summaries_limit", str(config_update.pro_summaries_limit))
    if config_update.maintenance_mode is not None:
        set_system_config(db, "maintenance_mode", "true" if config_update.maintenance_mode else "false")
        
    configs = get_all_system_configs(db)
    return schemas.SystemConfigOut(
        allow_registrations=configs.get("allow_registrations") == "true",
        require_email_verification=configs.get("require_email_verification") == "true",
        allow_circle_creation=configs.get("allow_circle_creation") == "true",
        default_llm_model=configs.get("default_llm_model"),
        ai_temperature=float(configs.get("ai_temperature", "0.2")),
        free_summaries_limit=int(configs.get("free_summaries_limit", "5")),
        pro_summaries_limit=int(configs.get("pro_summaries_limit", "25")),
        maintenance_mode=configs.get("maintenance_mode") == "true"
    )

@router.get("/health")
def get_admin_health(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    global LAST_GEMINI_ALERT_TIME

    # Test DB connection and measure latency
    try:
        start_time = time.time()
        db.execute(text("SELECT 1"))
        db_latency = round((time.time() - start_time) * 1000, 2)
        db_status = "connected"
    except Exception as e:
        db_latency = -1
        db_status = f"error: {str(e)}"

    # Test Gemini connection
    gemini_status = "healthy"
    gemini_error = None
    try:
        api_key = settings.GEMINI_API_KEY
        if not api_key or api_key == "YOUR_GEMINI_API_KEY":
            raise ValueError("GEMINI_API_KEY is not set or configured.")
        
        from google import genai
        client = genai.Client(api_key=api_key)
        # Check connection by listing models, avoiding quota exhaustion of free tier generate_content
        next(iter(client.models.list()))
    except Exception as e:
        gemini_status = "unhealthy"
        gemini_error = str(e)

        # Email the admin if Gemini health check fails, throttled to at most once per hour
        current_time = time.time()
        if current_time - LAST_GEMINI_ALERT_TIME > 3600:
            try:
                send_gemini_unhealthy_email(background_tasks, current_admin.email, current_admin.name, gemini_error)
                LAST_GEMINI_ALERT_TIME = current_time
            except Exception as mail_err:
                print(f"[ERROR] Failed to send Gemini unhealthy alert email: {mail_err}")

    # Get system statistics (uptime and item counts)
    uptime_seconds = int(time.time() - START_TIME)
    
    total_users = db.query(models.User).count()
    total_modules = db.query(models.Module).count()
    total_groups = db.query(models.StudyGroup).count()
    total_exams = db.query(models.ExamDeadline).count()

    overall_status = "healthy"
    if db_status != "connected" or gemini_status != "healthy":
        overall_status = "unhealthy"

    return {
        "status": overall_status,
        "uptime_seconds": uptime_seconds,
        "database": {
            "status": db_status,
            "latency_ms": db_latency
        },
        "gemini": {
            "status": gemini_status,
            "error": gemini_error
        },
        "counts": {
            "users": total_users,
            "modules": total_modules,
            "groups": total_groups,
            "exams": total_exams
        }
    }

@router.get("/users", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    users = db.query(models.User).filter(~models.User.email.like("%@example.com")).order_by(models.User.id.desc()).all()
    return users

@router.put("/users/{user_id}/role", response_model=schemas.UserOut)
def update_user_role(
    user_id: int,
    role_data: RoleUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    if role_data.role not in ["user", "premium", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'user', 'premium', or 'superadmin'"
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
        
    old_role = user.role
    user.role = role_data.role
    db.commit()
    db.refresh(user)

    # Notify and email user of role changes
    if old_role != user.role:
        # 1. Pro Status change
        if (old_role == "premium" or user.role == "premium") and (old_role != "superadmin" and user.role != "superadmin"):
            is_pro = user.role == "premium"
            action_text = "upgraded to Pro (Premium)" if is_pro else "downgraded to Standard"
            notif = models.Notification(
                user_id=user.id,
                type="role_update",
                title="Account Role Updated",
                message=f"Your account role has been {action_text} by the administrator.",
                related_type="user"
            )
            db.add(notif)
            db.commit()
            send_pro_status_email(background_tasks, user.email, user.name, is_pro)
        # 2. Admin status change
        elif old_role == "superadmin" or user.role == "superadmin":
            is_admin = user.role == "superadmin"
            action_text = "promoted to Superadmin" if is_admin else "demoted to Standard User"
            notif = models.Notification(
                user_id=user.id,
                type="admin_update",
                title="Account Privileges Updated",
                message=f"Your account privileges have been updated: you were {action_text} by the administrator.",
                related_type="user"
            )
            db.add(notif)
            db.commit()
            send_admin_status_email(background_tasks, user.email, user.name, is_admin)

    return user

@router.put("/users/{user_id}/suspend", response_model=schemas.UserOut)
def update_user_suspension(
    user_id: int,
    suspend_data: UserSuspendUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot suspend yourself"
        )
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    old_suspension = user.is_suspended
    user.is_suspended = suspend_data.is_suspended
    db.commit()
    db.refresh(user)

    if old_suspension != user.is_suspended:
        action_text = "suspended" if user.is_suspended else "re-activated"
        notif_type = "account_suspension" if user.is_suspended else "account_reactivation"
        notif_title = "Account Suspended" if user.is_suspended else "Account Re-activated"
        msg = (
            "Your Lumio account has been suspended by the administrator due to platform policy violations."
            if user.is_suspended else
            "Great news! Your Lumio account has been re-activated by the administrator."
        )
        notif = models.Notification(
            user_id=user.id,
            type=notif_type,
            title=notif_title,
            message=msg,
            related_type="user"
        )
        db.add(notif)
        db.commit()
        send_account_suspension_email(background_tasks, user.email, user.name, user.is_suspended)

    return user

@router.get("/modules")
def list_admin_modules(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    results = db.query(models.Module, models.User).join(
        models.User, models.Module.user_id == models.User.id, isouter=True
    ).order_by(models.Module.id.desc()).all()
    result = []
    for m, owner in results:
        result.append({
            "id": m.id,
            "name": m.name,
            "subject": m.subject,
            "date": m.date,
            "owner_email": owner.email if owner else "Unknown",
            "owner_name": owner.name if owner else "Unknown",
            "questions_count": len(m.questions) if m.questions else 0,
            "difficulty": m.difficulty or "medium",
            "has_source_file": m.has_source_file
        })
    return result


@router.get("/exams")
def list_admin_exams(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    from .exams import calculate_days_remaining
    results = db.query(models.ExamDeadline, models.User).join(
        models.User, models.ExamDeadline.user_id == models.User.id, isouter=True
    ).order_by(models.ExamDeadline.id.desc()).all()
    result = []
    for e, owner in results:
        result.append({
            "id": e.id,
            "title": e.title,
            "subject": e.subject,
            "date": e.date,
            "priority": e.priority,
            "completed": e.completed,
            "score": e.score,
            "days_remaining": calculate_days_remaining(e.raw_date or e.date),
            "owner_email": owner.email if owner else "Unknown",
            "owner_name": owner.name if owner else "Unknown",
        })
    return result


@router.get("/groups")
def list_admin_groups(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    results = db.query(models.StudyGroup, models.User).join(
        models.User, models.StudyGroup.creator_id == models.User.id, isouter=True
    ).order_by(models.StudyGroup.id.desc()).all()
    result = []
    for g, creator in results:
        if creator and not creator.email.endswith("@example.com"):
            result.append({
                "id": g.id,
                "name": g.name,
                "creator_email": creator.email,
                "creator_name": creator.name,
                "members_count": len(g.members) if g.members else 0,
                "modules_count": len(g.modules) if g.modules else 0,
                "is_banned": g.is_banned,
                "members": [{"id": m.id, "name": m.name, "email": m.email, "role": m.role} for m in g.members] if g.members else []
            })
    return result

@router.get("/sales")
def get_admin_sales(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    users = db.query(models.User).order_by(models.User.id.asc()).all()
    total_users_count = len(users)
    premium_users = [u for u in users if u.is_premium]
    premium_count = len(premium_users)
    
    # Fallback to mock data if there are no real premium users yet
    if premium_count == 0:
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

@router.get("/notes")
def list_admin_notes(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    results = db.query(models.Note, models.User).join(
        models.User, models.Note.user_id == models.User.id
    ).filter(
        ~models.User.email.like("%@example.com")
    ).order_by(models.Note.updated_at.desc()).all()
    return [
        {
            "id": n.id,
            "user_id": n.user_id,
            "title": n.title,
            "content": n.content,
            "subject": n.subject,
            "is_pinned": n.is_pinned,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "updated_at": n.updated_at.isoformat() if n.updated_at else None,
            "owner_email": owner.email,
            "owner_name": owner.name,
        }
        for n, owner in results
    ]


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    background_tasks: BackgroundTasks,
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
        
    # Cache user email and name before deletion
    user_email = user.email
    user_name = user.name

    db.delete(user)
    db.commit()

    # Trigger deletion email
    send_account_deletion_email(background_tasks, user_email, user_name)

    return {"message": "User deleted successfully"}

@router.get("/modules/{module_id}", response_model=schemas.ModuleOut)
def get_admin_module(
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
    return module

@router.get("/modules/{module_id}/file")
def get_admin_module_file(
    module_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    """Return the uploaded source file for a module as an inline stream for preview."""
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found"
        )
    if not module.has_source_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No source file associated with this module"
        )
    # Prefer binary data stored in DB
    if module.source_file_data:
        data = module.source_file_data
        filename = module.source_filename or f"module_{module.id}"
        mime_type = module.source_file_mime or "application/octet-stream"
        return StreamingResponse(BytesIO(data), media_type=mime_type,
                                 headers={"Content-Disposition": f"inline; filename={filename}"})
    # Fallback to file on disk
    file_path = module.source_file_path
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source file not found on server"
        )
    mime_type, _ = mimetypes.guess_type(file_path)
    mime_type = mime_type or "application/octet-stream"
    file_handle = open(file_path, "rb")
    filename = os.path.basename(file_path)
    return StreamingResponse(file_handle, media_type=mime_type,
                             headers={"Content-Disposition": f"inline; filename={filename}"})

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

@router.delete("/exams/{exam_id}")
def admin_delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    exam = db.query(models.ExamDeadline).filter(models.ExamDeadline.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted successfully"}

@router.delete("/groups/{group_id}")
def admin_delete_group(
    group_id: int,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Cache group name and members before deletion
    members = list(group.members)
    group_name = group.name

    db.delete(group)
    db.commit()

    # Notify members of the group deletion
    for member in members:
        msg = f"The study group \"{group_name}\" has been deleted by the administrator."
        if reason:
            msg += f" Reason: {reason}"
        notif = models.Notification(
            user_id=member.id,
            type="group_delete",
            title="Study Group Deleted",
            message=msg,
            related_type="group"
        )
        db.add(notif)
    db.commit()

    return {"message": "Group deleted successfully"}

@router.put("/groups/{group_id}/ban")
def update_group_ban_status(
    group_id: int,
    ban_data: GroupBanUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superadmin)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Cache members and name
    members = list(group.members)
    group_name = group.name

    group.is_banned = ban_data.is_banned
    db.commit()
    db.refresh(group)

    # Notify members of the ban status update
    action_text = "banned" if ban_data.is_banned else "unbanned"
    notif_type = "group_ban" if ban_data.is_banned else "group_unban"
    notif_title = "Study Group Banned" if ban_data.is_banned else "Study Group Re-activated"

    for member in members:
        msg = f"The study group \"{group_name}\" has been {action_text} by the administrator."
        if ban_data.reason:
            msg += f" Reason: {ban_data.reason}"
        notif = models.Notification(
            user_id=member.id,
            type=notif_type,
            title=notif_title,
            message=msg,
            related_type="group"
        )
        db.add(notif)
    db.commit()

    return {"message": "Group ban status updated successfully", "is_banned": group.is_banned}

@router.get("/groups/{group_id}/discussion")
def get_admin_group_discussion(
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
    posts = db.query(models.GroupPost).filter(models.GroupPost.group_id == group_id).order_by(models.GroupPost.id.asc()).all()
    return posts
