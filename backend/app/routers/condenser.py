import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from .. import schemas, models, auth
from ..database import get_db
from ..quiz_generator import condense_document
from ..time_utils import today_ph_str

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

    # Enforce Daily Quota Limit: 5 for free users, 25 for pro users
    limit = 25 if current_user.is_premium else 5
    today_str = today_ph_str()
    st = current_user.study_time or {}
    if not isinstance(st, dict):
        st = {}

    quota_date = st.get("condenser_quota_date", "")
    quota_used = st.get("condenser_quota_used", 0)

    if quota_date != today_str:
        st["condenser_quota_date"] = today_str
        st["condenser_quota_used"] = 0
        quota_used = 0

    if quota_used >= limit:
        account_type = "Pro" if current_user.is_premium else "Free"
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily limit reached. {account_type} accounts are limited to {limit} summaries per day."
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

        # Increment daily quota
        st["condenser_quota_used"] = quota_used + 1
        current_user.study_time = st
        flag_modified(current_user, "study_time")
        
        db.commit()
        db.refresh(db_history)
        
        return db_history
    except HTTPException:
        raise
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
