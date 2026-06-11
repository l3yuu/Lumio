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
from ..time_utils import now_ph, today_ph_str

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
    difficulty: str = Form("medium"),
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
    today_str = today_ph_str()
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
        file_filename=file_filename,
        difficulty=difficulty
    )
    
    # Format date nicely
    date_str = now_ph().strftime("%b %d, %Y")
    db_module = models.Module(
        name=name,
        date=date_str,
        size=size,
        subject=subject,
        user_id=current_user.id,
        source_content=extracted_text if extracted_text else None,
        source_filename=file_filename if file_filename else None,
        source_file_data=file_bytes if file_bytes else None,
        source_file_mime=get_source_media_type(file_filename) if file_filename else None,
        difficulty=difficulty
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
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(current_user, "study_time")
    
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
    
    # Update spaced recall scheduling
    from sqlalchemy.orm.attributes import flag_modified
    from ..time_utils import now_ph
    from datetime import timedelta

    spaced_list = list(current_user.spaced_recall or [])
    found = False
    
    for item in spaced_list:
        if item.get("id") == module.id:
            # Advance progress
            current_progress = item.get("progress", 20)
            new_progress = min(100, current_progress + 20)
            
            # Determine new interval
            if new_progress == 40:
                days_delta = 3
            elif new_progress == 60:
                days_delta = 7
            elif new_progress == 80:
                days_delta = 14
            else:
                days_delta = 30
                
            item["progress"] = new_progress
            item["due_at"] = (now_ph() + timedelta(days=days_delta)).isoformat()
            item["reminder_sent"] = False
            found = True
            break
            
    if not found:
        # Create new spaced recall item due tomorrow
        new_item = {
            "id": module.id,
            "name": module.name,
            "subject": module.subject or "General Study",
            "progress": 20,
            "due_at": (now_ph() + timedelta(days=1)).isoformat(),
            "reminder_sent": False
        }
        spaced_list.append(new_item)
        
    current_user.spaced_recall = spaced_list
    flag_modified(current_user, "spaced_recall")

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


@router.put("/{module_id}", response_model=schemas.ModuleOut)
def update_module(
    module_id: int,
    body: schemas.ModuleUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    module = db.query(models.Module).filter(
        models.Module.id == module_id,
        models.Module.user_id == current_user.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    module.subject = body.subject
    db.commit()
    db.refresh(module)
    return module


@router.put("/folders/rename")
def rename_folder(
    body: schemas.FolderRename,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    from sqlalchemy.orm.attributes import flag_modified
    
    old_name = body.old_name.strip()
    new_name = body.new_name.strip()
    
    if not old_name or not new_name:
        raise HTTPException(status_code=400, detail="Invalid folder names")
    if old_name in ("General", "All") or new_name == "All":
        raise HTTPException(status_code=400, detail="System folders cannot be modified")
        
    folders = current_user.folders or ["General"]
    if old_name not in folders:
        raise HTTPException(status_code=404, detail="Folder not found")
    if new_name in folders:
        raise HTTPException(status_code=400, detail="Folder with new name already exists")
        
    # Update user folders list
    folders = [new_name if f == old_name else f for f in folders]
    current_user.folders = folders
    flag_modified(current_user, "folders")
    
    # Update subject field of all associated modules
    db.query(models.Module).filter(
        models.Module.user_id == current_user.id,
        models.Module.subject == old_name
    ).update({models.Module.subject: new_name}, synchronize_session=False)
    
    db.commit()
    return {"status": "success", "folders": folders}


@router.delete("/folders/delete")
def delete_folder(
    folder_name: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    from sqlalchemy.orm.attributes import flag_modified
    
    name = folder_name.strip()
    if name in ("General", "All"):
        raise HTTPException(status_code=400, detail="System folders cannot be deleted")
        
    folders = current_user.folders or ["General"]
    if name not in folders:
        raise HTTPException(status_code=404, detail="Folder not found")
        
    # Remove folder from user folders list
    folders = [f for f in folders if f != name]
    current_user.folders = folders
    flag_modified(current_user, "folders")
    
    # Move all associated modules to "General"
    db.query(models.Module).filter(
        models.Module.user_id == current_user.id,
        models.Module.subject == name
    ).update({models.Module.subject: "General"}, synchronize_session=False)
    
    db.commit()
    return {"status": "success", "folders": folders}


@router.delete("")
def delete_all_modules(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db.query(models.Module).filter(models.Module.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All modules deleted"}
