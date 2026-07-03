import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas, models, auth
from ..database import get_db
from ..quiz_generator import grade_essay
from ..system_config import get_system_config

logger = logging.getLogger("lumio.essay_grader")

router = APIRouter(prefix="/api/essay-grader", tags=["essay-grader"])

@router.post("/grade", response_model=schemas.EssayGraderHistoryOut)
async def grade_essay_endpoint(
    body: schemas.EssayGradeRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not body.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Essay content is required."
        )

    try:
        result = grade_essay(body.text, body.prompt)

        model_name = get_system_config(db, "default_llm_model") or "gemini-2.5-flash"
        try:
            prompt_text = (body.prompt or body.text)[:2000]
            grade_summary = f"Grade: {result.get('grade', '?')} | Thesis: {result.get('thesis_score', '?')}/10 | Grammar: {result.get('grammar_score', '?')}/10 | Structure: {result.get('structure_score', '?')}/10\n\n{result.get('critique', '')}"
            db.add(models.AiUsageLog(
                user_id=current_user.id,
                feature="essay_grader",
                model=model_name,
                prompt=prompt_text,
                response=grade_summary[:3000],
                tokens_used=len(prompt_text) // 4
            ))
            db.commit()
        except Exception:
            db.rollback()

        # Generate a nice title
        prompt_preview = body.prompt.strip() if body.prompt else ""
        text_preview = body.text.strip()
        
        if prompt_preview:
            title = f"Essay: {prompt_preview[:30]}..." if len(prompt_preview) > 30 else f"Essay: {prompt_preview}"
        else:
            title = f"Essay: {text_preview[:30]}..." if len(text_preview) > 30 else f"Essay: {text_preview}"
        
        # Save to database
        db_history = models.EssayGraderHistory(
            user_id=current_user.id,
            title=title,
            prompt=body.prompt,
            essay_text=body.text,
            grade=result["grade"],
            thesis_score=result["thesis_score"],
            grammar_score=result["grammar_score"],
            structure_score=result["structure_score"],
            critique=result["critique"],
            recommendations=result["recommendations"]
        )
        db.add(db_history)
        db.commit()
        db.refresh(db_history)
        
        return db_history
    except Exception as e:
        logger.error(f"Essay grading failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e) or "Failed to grade essay."
        )


@router.get("", response_model=List[schemas.EssayGraderHistoryOut])
def get_essay_histories(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.EssayGraderHistory).filter(
        models.EssayGraderHistory.user_id == current_user.id
    ).order_by(models.EssayGraderHistory.created_at.desc()).all()


@router.get("/{history_id}", response_model=schemas.EssayGraderHistoryOut)
def get_essay_history(
    history_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(models.EssayGraderHistory).filter(
        models.EssayGraderHistory.id == history_id,
        models.EssayGraderHistory.user_id == current_user.id
    ).first()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay grading history entry not found."
        )
    return history


@router.delete("/{history_id}")
def delete_essay_history(
    history_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(models.EssayGraderHistory).filter(
        models.EssayGraderHistory.id == history_id,
        models.EssayGraderHistory.user_id == current_user.id
    ).first()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay grading history entry not found."
        )
        
    db.delete(history)
    db.commit()
    return {"status": "success", "message": "Essay grading history entry deleted."}
