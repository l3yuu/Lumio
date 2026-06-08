from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/modules", tags=["modules"])

@router.get("", response_model=List[schemas.ModuleOut])
def get_modules(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Module).filter(models.Module.user_id == current_user.id).order_by(models.Module.id.desc()).all()

@router.post("", response_model=schemas.ModuleOut)
def create_module(module_in: schemas.ModuleCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Format date nicely
    date_str = datetime.utcnow().strftime("%b %d, %Y")
    db_module = models.Module(
        name=module_in.name,
        date=date_str,
        size=module_in.size,
        subject=module_in.subject,
        user_id=current_user.id
    )
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    
    # Create associated questions
    for q in module_in.questions:
        db_question = models.QuizQuestion(
            question=q.question,
            options=q.options,
            correct_answer_index=q.correct_answer_index,
            module_id=db_module.id
        )
        db.add(db_question)
        
    db.commit()
    db.refresh(db_module)
    return db_module

@router.delete("/{module_id}")
def delete_module(module_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    module = db.query(models.Module).filter(models.Module.id == module_id, models.Module.user_id == current_user.id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    db.delete(module)
    db.commit()
    return {"message": "Module deleted successfully"}

@router.delete("")
def delete_all_modules(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db.query(models.Module).filter(models.Module.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All modules deleted"}
