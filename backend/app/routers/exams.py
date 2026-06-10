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
    exams = db.query(models.ExamDeadline).filter(models.ExamDeadline.user_id == current_user.id).all()
    # Populate dynamic days_remaining
    for e in exams:
        e.days_remaining = calculate_days_remaining(e.raw_date or e.date)
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

@router.delete("/{exam_id}")
def delete_exam(exam_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    exam = db.query(models.ExamDeadline).filter(models.ExamDeadline.id == exam_id, models.ExamDeadline.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted successfully"}
