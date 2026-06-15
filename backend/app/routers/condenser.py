import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas, models, auth
from ..database import get_db
from ..quiz_generator import condense_document

logger = logging.getLogger("lumio.condenser")

router = APIRouter(prefix="/api/condenser", tags=["condenser"])

@router.post("/condense", response_model=schemas.CondenserHistoryOut)
async def condense_document_endpoint(
    body: schemas.CondenserRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not body.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text content is required."
        )

    try:
        result = condense_document(body.text)
        
        # Generate a nice title
        text_preview = body.text.strip()
        title = f"Summary: {text_preview[:30]}..." if len(text_preview) > 30 else f"Summary: {text_preview}"
        
        # Save to database
        db_history = models.CondenserHistory(
            user_id=current_user.id,
            title=title,
            summary=result["summary"],
            takeaways=result["takeaways"],
            vocabulary=result["vocabulary"]
        )
        db.add(db_history)
        db.commit()
        db.refresh(db_history)
        
        return db_history
    except Exception as e:
        logger.error(f"Document condensing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e) or "Failed to condense document."
        )


@router.get("", response_model=List[schemas.CondenserHistoryOut])
def get_condenser_histories(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.CondenserHistory).filter(
        models.CondenserHistory.user_id == current_user.id
    ).order_by(models.CondenserHistory.created_at.desc()).all()


@router.get("/{history_id}", response_model=schemas.CondenserHistoryOut)
def get_condenser_history(
    history_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(models.CondenserHistory).filter(
        models.CondenserHistory.id == history_id,
        models.CondenserHistory.user_id == current_user.id
    ).first()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Condenser history entry not found."
        )
    return history


@router.delete("/{history_id}")
def delete_condenser_history(
    history_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(models.CondenserHistory).filter(
        models.CondenserHistory.id == history_id,
        models.CondenserHistory.user_id == current_user.id
    ).first()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Condenser history entry not found."
        )
        
    db.delete(history)
    db.commit()
    return {"status": "success", "message": "Condenser history entry deleted."}
