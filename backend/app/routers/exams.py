from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from .. import models, schemas, auth
from ..time_utils import now_ph

router = APIRouter(prefix="/api/exams", tags=["exams"])

def calculate_days_remaining(target_date_str: str) -> int:
    try:
        # Standard raw date is YYYY-MM-DD
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        today = now_ph().date()
        delta = target_date - today
        return max(0, delta.days)
    except Exception:
        # Fallback to formatting
        try:
            target_date = datetime.strptime(target_date_str, "%b %d, %Y").date()
            today = now_ph().date()
            delta = target_date - today
            return max(0, delta.days)
        except Exception:
            return 0

@router.get("", response_model=List[schemas.ExamOut])
def get_exams(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    exams = db.query(models.ExamDeadline).filter(
        models.ExamDeadline.user_id == current_user.id,
        models.ExamDeadline.completed == False
    ).all()
    # Populate dynamic days_remaining
    for e in exams:
        e.days_remaining = calculate_days_remaining(e.raw_date or e.date)
    return exams

@router.get("/completed", response_model=List[schemas.ExamOut])
def get_completed_exams(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    exams = db.query(models.ExamDeadline).filter(
        models.ExamDeadline.user_id == current_user.id,
        models.ExamDeadline.completed == True
    ).order_by(models.ExamDeadline.id.desc()).all()
    for e in exams:
        e.days_remaining = 0
    return exams

@router.post("", response_model=schemas.ExamOut)
def create_exam(exam_in: schemas.ExamCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_exam = models.ExamDeadline(
        title=exam_in.title,
        subject=exam_in.subject,
        date=exam_in.date,
        raw_date=exam_in.raw_date,
        priority=exam_in.priority,
        user_id=current_user.id
    )
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    db_exam.days_remaining = calculate_days_remaining(db_exam.raw_date or db_exam.date)
    return db_exam

@router.put("/{exam_id}/complete", response_model=schemas.ExamOut)
def complete_exam(
    exam_id: int,
    complete_in: schemas.ExamComplete = schemas.ExamComplete(),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    exam = db.query(models.ExamDeadline).filter(
        models.ExamDeadline.id == exam_id,
        models.ExamDeadline.user_id == current_user.id
    ).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    exam.completed = True
    if complete_in.score and complete_in.score.strip():
        exam.score = complete_in.score.strip()
    
    # Award 50 XP to user for finishing their exam!
    current_user.xp += 50
    xp_needed = current_user.level * 100
    if current_user.xp >= xp_needed:
        current_user.level += 1
        current_user.xp = current_user.xp - xp_needed
        
    db.commit()
    db.refresh(exam)
    
    exam.days_remaining = calculate_days_remaining(exam.raw_date or exam.date)
    return exam

@router.delete("/{exam_id}")
def delete_exam(exam_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    exam = db.query(models.ExamDeadline).filter(models.ExamDeadline.id == exam_id, models.ExamDeadline.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted successfully"}

@router.post("/trigger-reminders")
def trigger_reminders(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    from ..email import send_exam_reminder_email_sync, send_spaced_recall_email_sync
    from sqlalchemy.orm.attributes import flag_modified
    from datetime import datetime
    from ..time_utils import now_ph
    
    # 1. Exam Reminders
    exams = db.query(models.ExamDeadline).filter(models.ExamDeadline.reminder_sent == False).all()
    sent_count = 0
    for exam in exams:
        days_left = calculate_days_remaining(exam.raw_date or exam.date)
        if 0 < days_left <= 3:
            user = exam.owner
            if user and user.email:
                send_exam_reminder_email_sync(
                    user_email=user.email,
                    user_name=user.name,
                    exam_title=exam.title,
                    exam_date=exam.date,
                    days_remaining=days_left
                )
                exam.reminder_sent = True
                sent_count += 1
                
    # 2. Spaced Recall Reminders
    users = db.query(models.User).filter(models.User.spaced_recall != None).all()
    spaced_sent_count = 0
    for u in users:
        if not u.spaced_recall:
            continue
        recall_list = list(u.spaced_recall)
        modified = False
        for item in recall_list:
            due_at_str = item.get("due_at")
            if not due_at_str or item.get("reminder_sent", False):
                continue
            try:
                due_at = datetime.fromisoformat(due_at_str)
                now = now_ph()
                if due_at <= now or (due_at - now).total_seconds() <= 86400:
                    send_spaced_recall_email_sync(
                        user_email=u.email,
                        user_name=u.name,
                        module_name=item.get("name"),
                        subject_name=item.get("subject", "General Study"),
                        progress=item.get("progress", 20)
                    )
                    item["reminder_sent"] = True
                    modified = True
                    spaced_sent_count += 1
            except Exception:
                pass
        if modified:
            u.spaced_recall = recall_list
            flag_modified(u, "spaced_recall")
            
    db.commit()
    return {
        "message": "Reminders triggered successfully",
        "sent_count": sent_count,
        "spaced_sent_count": spaced_sent_count
    }
