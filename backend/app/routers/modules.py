from datetime import datetime
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth
from ..quiz_generator import generate_quiz_questions
from ..ratelimit import modules_limiter

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")

router = APIRouter(prefix="/api/modules", tags=["modules"])


def get_source_media_type(filename: Optional[str]) -> str:
    if not filename:
        return "application/octet-stream"
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    return {
        "pdf": "application/pdf",
        "txt": "text/plain",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }.get(ext, "application/octet-stream")

@router.get("", response_model=List[schemas.ModuleOut])
def get_modules(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Module).filter(models.Module.user_id == current_user.id).order_by(models.Module.id.desc()).all()

@router.post("", response_model=schemas.ModuleOut)
def create_module(
    request: Request,
    name: str = Form(...),
    subject: str = Form("General"),
    size: str = Form("0.0 MB"),
    text_content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Enforce request rate limit (10 per minute)
    client_ip = request.client.host if request.client else "unknown"
    limiter_key = f"modules_create:{client_ip}:{current_user.id}"
    if modules_limiter.is_limited(limiter_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again in a minute."
        )
    modules_limiter.record(limiter_key)

    # Enforce Daily Quota Limit of 5 quiz generations
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    st = current_user.study_time or {}
    if not isinstance(st, dict):
        st = {}
        
    quota_date = st.get("quota_date", "")
    quota_used = st.get("quota_used", 0)
    
    if quota_date != today_str:
        # Reset count for the new day
        st["quota_date"] = today_str
        st["quota_used"] = 0
        quota_used = 0
        
    if quota_used >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily limit reached. Free accounts are limited to 5 quiz generations per day."
        )
        
    # Read file bytes if provided
    file_bytes = None
    file_filename = None
    if file:
        file_bytes = file.file.read()
        file_filename = file.filename
        
    # Generate 10 multiple choice questions using AI (or fallback)
    questions_data, extracted_text = generate_quiz_questions(
        module_name=name,
        text_content=text_content,
        file_bytes=file_bytes,
        file_filename=file_filename
    )
    
    # Format date nicely
    date_str = datetime.utcnow().strftime("%b %d, %Y")
    db_module = models.Module(
        name=name,
        date=date_str,
        size=size,
        subject=subject,
        user_id=current_user.id,
        source_content=extracted_text if extracted_text else None,
        source_filename=file_filename if file_filename else None,
        source_file_data=file_bytes if file_bytes else None,
        source_file_mime=get_source_media_type(file_filename) if file_filename else None
    )
    db.add(db_module)
    db.commit()
    db.refresh(db_module)

    # Save uploaded file to disk
    if file_bytes and file_filename:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        safe_name = f"{db_module.id}_{uuid.uuid4().hex[:8]}_{file_filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        try:
            with open(file_path, "wb") as f:
                f.write(file_bytes)
            db_module.source_file_path = file_path
            db.commit()
        except Exception as e:
            print(f"Warning: Failed to save source file: {e}")
    
    # Create associated questions in the database
    for q in questions_data:
        db_question = models.QuizQuestion(
            question=q["question"],
            options=q["options"],
            correct_answer_index=q["correct_answer_index"],
            module_id=db_module.id
        )
        db.add(db_question)
        
    # Increment quota count and update study_time JSON
    st["quota_used"] = quota_used + 1
    current_user.study_time = {**st}
    
    db.commit()
    db.refresh(db_module)
    return db_module


@router.put("/{module_id}/score", response_model=schemas.ModuleOut)
def update_module_score(
    module_id: int,
    body: schemas.ModuleScoreUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    module = db.query(models.Module).filter(
        models.Module.id == module_id,
        models.Module.user_id == current_user.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    module.last_score = body.score
    db.commit()
    db.refresh(module)
    return module

@router.delete("/{module_id}")
def delete_module(module_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    module = db.query(models.Module).filter(models.Module.id == module_id, models.Module.user_id == current_user.id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if module.source_file_path and os.path.exists(module.source_file_path):
        try:
            os.remove(module.source_file_path)
        except Exception as e:
            print(f"Warning: Failed to delete source file: {e}")

    db.delete(module)
    db.commit()
    return {"message": "Module deleted successfully"}


@router.get("/{module_id}/source", response_model=schemas.ModuleSourceOut)
def get_module_source(
    module_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    module = db.query(models.Module).filter(
        models.Module.id == module_id,
        models.Module.user_id == current_user.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return schemas.ModuleSourceOut(
        id=module.id,
        source_filename=module.source_filename,
        source_content=module.source_content
    )


@router.get("/{module_id}/file")
def get_module_file(
    module_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    module = db.query(models.Module).filter(
        models.Module.id == module_id,
        models.Module.user_id == current_user.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    if module.source_file_data:
        return Response(
            content=module.source_file_data,
            media_type=module.source_file_mime or get_source_media_type(module.source_filename),
            headers={"Content-Disposition": f'inline; filename="{module.source_filename or "file"}"'}
        )

    if not module.source_file_path or not os.path.exists(module.source_file_path):
        raise HTTPException(status_code=404, detail="Source file not available")

    return FileResponse(
        path=module.source_file_path,
        filename=module.source_filename or "file",
        media_type=module.source_file_mime or get_source_media_type(module.source_filename)
    )


@router.delete("")
def delete_all_modules(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db.query(models.Module).filter(models.Module.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All modules deleted"}
