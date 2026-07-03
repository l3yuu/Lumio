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
import re
import base64
from ..redis_client import cache_get, cache_set, cache_delete, cache_delete_pattern

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")

router = APIRouter(prefix="/api/modules", tags=["modules"])

# Caches migrated to Redis (modules:public:listings:*, modules:public:source:*, modules:public:file:*)

def _invalidate_public_listings():
    cache_delete_pattern("modules:public:listings:*")

ALLOWED_EXTENSIONS = {"pdf", "txt", "docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

def sanitize_filename(filename: str) -> str:
    # Keep only the base filename (strip folder paths)
    filename = os.path.basename(filename)
    # Strip directory traversal characters, control characters, and unsafe characters
    filename = re.sub(r'[\x00-\x1f\\/*?:"<>|]', '_', filename)
    # Remove leading dots to prevent dot-dot execution or hidden files
    filename = filename.lstrip('.')
    if not filename:
        filename = 'file'
    return filename

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
def get_modules(
    search: Optional[str] = None,
    subject: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Module).filter(models.Module.user_id == current_user.id)
    if search:
        query = query.filter(models.Module.name.ilike(f"%{search}%"))
    if subject:
        query = query.filter(models.Module.subject.ilike(f"%{subject}%"))
    return query.order_by(models.Module.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=schemas.ModuleOut)
def create_module(
    request: Request,
    name: str = Form(...),
    subject: str = Form("General"),
    size: str = Form("0.0 MB"),
    text_content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    difficulty: str = Form("medium"),
    num_questions: int = Form(10),
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

    # Enforce Daily Quota Limit: 5 for free users, 25 (5x) for pro users
    limit = 25 if current_user.is_premium else 5
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
        
    if quota_used >= limit:
        account_type = "Pro" if current_user.is_premium else "Free"
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily limit reached. {account_type} accounts are limited to {limit} quiz generations per day."
        )

    # Enforce difficulty level limits: Free can only generate easy quizzes
    if not current_user.is_premium and difficulty.lower() != "easy":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Difficulty Level Restricted: Free accounts can only generate Easy difficulty quizzes. Upgrade to Pro Student to unlock Medium and Hard."
        )
        
    # Read file bytes if provided
    file_bytes = None
    file_filename = None
    if file:
        # 1. Validate file size (avoid loading huge files into memory)
        try:
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)
        except Exception:
            file_size = 0

        max_file_size = 10 * 1024 * 1024 if current_user.is_premium else 2 * 1024 * 1024
        limit_str = "10MB" if current_user.is_premium else "2MB"
        if file_size > max_file_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security Alert: File size exceeds the maximum limit of {limit_str}."
            )

        # 2. Validate file extension
        orig_filename = file.filename or ""
        ext = orig_filename.lower().split('.')[-1] if '.' in orig_filename else ''
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security Alert: Invalid file format. Only PDF, TXT, and DOCX files are allowed."
            )

        # 3. Validate MIME type
        content_type = file.content_type or ""
        is_octet_stream_txt = (ext == "txt" and content_type == "application/octet-stream")
        if content_type not in ALLOWED_MIME_TYPES and not is_octet_stream_txt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security Alert: File content type does not match allowed types."
            )

        # 4. Sanitize filename to prevent directory traversal
        file_filename = sanitize_filename(orig_filename)
        file_bytes = file.file.read()
        
    # Generate multiple choice questions using AI (or fallback)
    questions_data, extracted_text = generate_quiz_questions(
        module_name=name,
        text_content=text_content,
        file_bytes=file_bytes,
        file_filename=file_filename,
        difficulty=difficulty,
        num_questions=num_questions
    )

    from ..system_config import get_system_config
    model_name = get_system_config(db, "default_llm_model") or "gemini-2.5-flash"
    try:
        prompt_text = f"{name}: {(text_content or '')[:1800]}".strip()[:2000]
        q_preview = "\n".join(
            f"Q{i+1}: {q.get('question', '')[:120]}"
            for i, q in enumerate((questions_data or [])[:5])
        )
        if len(questions_data or []) > 5:
            q_preview += f"\n… (+{len(questions_data) - 5} more questions)"
        response_text = f"Generated {len(questions_data or [])} questions for '{name}':\n{q_preview}"
        db.add(models.AiUsageLog(
            user_id=current_user.id,
            feature="quiz",
            model=model_name,
            prompt=prompt_text,
            response=response_text[:3000],
            tokens_used=len(prompt_text) // 4
        ))
        db.commit()
    except Exception:
        db.rollback()
    
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
    
    _invalidate_public_listings()

    # Create associated questions in the database
    for q in questions_data:
        db_question = models.QuizQuestion(
            question=q["question"],
            options=q["options"],
            correct_answer_index=q["correct_answer_index"],
            explanation=q.get("explanation"),
            hint=q.get("hint"),
            question_type=q.get("question_type", "multiple_choice"),
            reference=q.get("reference"),
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

    cache_delete(f"modules:public:source:{module_id}")
    cache_delete(f"modules:public:file:{module_id}")
    _invalidate_public_listings()
    db.delete(module)
    db.commit()
    return {"message": "Module deleted successfully"}


@router.get("/{module_id}/source", response_model=schemas.ModuleSourceOut)
def get_module_source(
    module_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    cache_key = f"modules:public:source:{module_id}"
    cached_source = cache_get(cache_key)
    if cached_source is not None:
        return cached_source

    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module or (module.user_id != current_user.id and not module.is_public):
        raise HTTPException(status_code=404, detail="Module not found")
        
    res_obj = schemas.ModuleSourceOut(
        id=module.id,
        source_filename=module.source_filename,
        source_content=module.source_content
    )
    if module.is_public:
        cache_set(cache_key, res_obj.model_dump() if hasattr(res_obj, "model_dump") else res_obj.dict(), expire_seconds=86400)
    return res_obj


@router.get("/{module_id}/file")
def get_module_file(
    module_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    cache_key = f"modules:public:file:{module_id}"
    cached_file = cache_get(cache_key)
    if cached_file is not None and isinstance(cached_file, dict):
        try:
            content_bytes = base64.b64decode(cached_file["content_b64"])
            media_type = cached_file["media_type"]
            filename = cached_file["filename"]
            return Response(
                content=content_bytes,
                media_type=media_type,
                headers={
                    "Content-Disposition": f'inline; filename="{filename}"',
                    "Cache-Control": "public, max-age=31536000"
                }
            )
        except Exception:
            pass

    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module or (module.user_id != current_user.id and not module.is_public):
        raise HTTPException(status_code=404, detail="Module not found")
        
    content_bytes = None
    media_type = module.source_file_mime or get_source_media_type(module.source_filename)
    filename = module.source_filename or "file"

    if module.source_file_data:
        content_bytes = module.source_file_data
    elif module.source_file_path and os.path.exists(module.source_file_path):
        try:
            with open(module.source_file_path, "rb") as f:
                content_bytes = f.read()
        except Exception:
            raise HTTPException(status_code=500, detail="Error reading file from storage")

    if content_bytes is None:
        raise HTTPException(status_code=404, detail="Source file not available")

    if module.is_public:
        try:
            b64_content = base64.b64encode(content_bytes).decode("utf-8")
            cache_set(cache_key, {
                "content_b64": b64_content,
                "media_type": media_type,
                "filename": filename
            }, expire_seconds=86400)
        except Exception:
            pass

    return Response(
        content=content_bytes,
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "public, max-age=31536000"
        }
    )


@router.get("/public", response_model=List[schemas.ModuleOut])
def get_public_modules(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    cache_key = f"modules:public:listings:{search or ''}:{skip}:{limit}"
    cached_listings = cache_get(cache_key)
    if cached_listings is not None:
        return cached_listings

    query = db.query(models.Module).filter(
        models.Module.is_public == True
    )
    if search:
        query = query.filter(
            (models.Module.name.ilike(f"%{search}%")) |
            (models.Module.subject.ilike(f"%{search}%"))
        )
    results = query.order_by(models.Module.id.desc()).offset(skip).limit(limit).all()
    
    try:
        serialized = []
        for m in results:
            if hasattr(schemas.ModuleOut, "model_validate"):
                serialized.append(schemas.ModuleOut.model_validate(m).model_dump())
            else:
                serialized.append(schemas.ModuleOut.from_orm(m).dict())
        cache_set(cache_key, serialized, expire_seconds=3600)
    except Exception:
        pass

    return results


@router.post("/{module_id}/copy", response_model=schemas.ModuleOut)
def copy_public_module(
    module_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    source_module = db.query(models.Module).filter(
        models.Module.id == module_id,
        models.Module.is_public == True
    ).first()
    if not source_module:
        raise HTTPException(status_code=404, detail="Public module not found")
        
    cloned_module = models.Module(
        name=source_module.name,
        date=today_ph_str(),
        size=source_module.size,
        subject=source_module.subject,
        user_id=current_user.id,
        source_content=source_module.source_content,
        source_filename=source_module.source_filename,
        source_file_path=source_module.source_file_path,
        source_file_data=source_module.source_file_data,
        source_file_mime=source_module.source_file_mime,
        difficulty=source_module.difficulty,
        is_public=False
    )
    db.add(cloned_module)
    db.flush()
    
    for q in source_module.questions:
        cloned_q = models.QuizQuestion(
            question=q.question,
            options=q.options,
            correct_answer_index=q.correct_answer_index,
            explanation=q.explanation,
            hint=q.hint,
            question_type=q.question_type,
            reference=q.reference,
            module_id=cloned_module.id
        )
        db.add(cloned_q)
        
    db.commit()
    db.refresh(cloned_module)
    return cloned_module


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

    if body.subject is not None:
        module.subject = body.subject
    if body.name is not None:
        module.name = body.name
    if body.is_public is not None:
        module.is_public = body.is_public
    PUBLIC_SOURCE_CACHE.pop(module_id, None)
    PUBLIC_FILE_CACHE.pop(module_id, None)
    _invalidate_public_listings()
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
    _invalidate_public_listings()
    db.commit()
    return {"message": "All modules deleted"}


@router.post("/generate-consolidated-exam", response_model=schemas.ModuleOut)
def generate_consolidated_exam(
    body: schemas.ConsolidatedExamRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if len(body.module_ids) < 2:
        raise HTTPException(status_code=400, detail="Please select at least 2 modules to generate an exam.")

    # Fetch selected modules
    modules = db.query(models.Module).filter(
        models.Module.id.in_(body.module_ids),
        models.Module.user_id == current_user.id
    ).all()

    if len(modules) != len(body.module_ids):
        raise HTTPException(status_code=404, detail="One or more selected modules could not be found.")

    # Enforce difficulty restrictions
    difficulty = body.difficulty or "medium"
    if not current_user.is_premium and difficulty.lower() != "easy":
        raise HTTPException(
            status_code=400,
            detail="Difficulty Level Restricted: Free accounts can only generate Easy difficulty exams. Upgrade to Pro Student to unlock Medium and Hard."
        )

    # 1. Concatenate the text contents
    combined_content_parts = []
    module_names = []
    for m in modules:
        module_names.append(m.name)
        if m.source_content:
            combined_content_parts.append(m.source_content)

    combined_text = "\n\n".join(combined_content_parts)
    if not combined_text:
        raise HTTPException(status_code=400, detail="The selected modules do not contain enough study content to generate an exam.")

    exam_name = body.name or f"Exam: " + " & ".join(module_names[:3]) + ("..." if len(module_names) > 3 else "")

    # Generate 50 questions
    questions_data, extracted_text = generate_quiz_questions(
        module_name=exam_name,
        text_content=combined_text,
        file_bytes=None,
        file_filename=None,
        difficulty=difficulty,
        num_questions=50
    )

    from ..system_config import get_system_config
    model_name = get_system_config(db, "default_llm_model") or "gemini-2.5-flash"
    try:
        prompt_text = f"{exam_name}: {combined_text[:1800]}".strip()[:2000]
        q_preview = "\n".join(
            f"Q{i+1}: {q.get('question', '')[:120]}"
            for i, q in enumerate((questions_data or [])[:5])
        )
        if len(questions_data or []) > 5:
            q_preview += f"\n… (+{len(questions_data) - 5} more questions)"
        response_text = f"Generated {len(questions_data or [])} questions for '{exam_name}':\n{q_preview}"
        db.add(models.AiUsageLog(
            user_id=current_user.id,
            feature="consolidated_exam",
            model=model_name,
            prompt=prompt_text,
            response=response_text[:3000],
            tokens_used=len(prompt_text) // 4
        ))
        db.commit()
    except Exception:
        db.rollback()

    # Format date and save
    date_str = now_ph().strftime("%b %d, %Y")
    db_module = models.Module(
        name=exam_name,
        date=date_str,
        size="0.0 MB",
        subject="Consolidated Exam",
        user_id=current_user.id,
        source_content=combined_text,
        difficulty=difficulty
    )
    db.add(db_module)
    db.flush()

    # Add questions
    for q in questions_data:
        db_question = models.QuizQuestion(
            question=q["question"],
            options=q["options"],
            correct_answer_index=q["correct_answer_index"],
            explanation=q.get("explanation"),
            hint=q.get("hint"),
            question_type=q.get("question_type", "multiple_choice"),
            reference=q.get("reference"),
            module_id=db_module.id
        )
        db.add(db_question)

    db.commit()
    db.refresh(db_module)
    return db_module


@router.post("/quiz-attempts", response_model=schemas.QuizAttemptOut)
def record_quiz_attempt(
    attempt: schemas.QuizAttemptCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_attempt = models.QuizAttempt(
        user_id=current_user.id,
        title=attempt.title,
        attempt_type=attempt.attempt_type,
        score=attempt.score,
        percentage=attempt.percentage,
        date=attempt.date
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    return db_attempt


@router.get("/quiz-attempts", response_model=List[schemas.QuizAttemptOut])
def get_quiz_attempts(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == current_user.id
    ).order_by(models.QuizAttempt.id.desc()).all()

