import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from .. import schemas, models, auth
from ..database import get_db
from ..quiz_generator import generate_flashcards
from ..time_utils import today_ph_str
from ..system_config import get_system_config

logger = logging.getLogger("lumio.flashcards")

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])

USER_FLASHCARD_DECKS_CACHE = {}
FLASHCARD_DECK_CACHE = {}

def _invalidate_flashcard_caches(deck_id: int = None, user_id: int = None):
    if user_id is not None:
        USER_FLASHCARD_DECKS_CACHE.pop(user_id, None)
    if deck_id is not None:
        FLASHCARD_DECK_CACHE.pop(deck_id, None)


@router.post("/generate", response_model=schemas.FlashcardDeckOut)
async def generate_flashcards_endpoint(
    body: schemas.FlashcardGenerateRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not body.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text content is required."
        )

    # 1. Enforce Daily Quota Limit: 5 for free users, 25 for pro users
    limit = 25 if current_user.is_premium else 5
    today_str = today_ph_str()
    st = current_user.study_time or {}
    if not isinstance(st, dict):
        st = {}

    quota_date = st.get("flashcard_quota_date", "")
    quota_used = st.get("flashcard_quota_used", 0)

    if quota_date != today_str:
        st["flashcard_quota_date"] = today_str
        st["flashcard_quota_used"] = 0
        quota_used = 0

    if quota_used >= limit:
        account_type = "Pro" if current_user.is_premium else "Free"
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily limit reached. {account_type} accounts are limited to {limit} flashcard generations per day."
        )

    try:
        # 2. Call Gemini API
        cards = generate_flashcards(body.text, body.count or 10)

        model_name = get_system_config(db, "default_llm_model") or "gemini-2.5-flash"
        try:
            prompt_text = body.text[:2000]
            cards_preview = "\n".join(
                f"Q: {c.get('front', '')} → A: {c.get('back', '')}"
                for c in (cards or [])[:5]
            )
            if len(cards or []) > 5:
                cards_preview += f"\n… (+{len(cards) - 5} more cards)"
            db.add(models.AiUsageLog(
                user_id=current_user.id,
                feature="flashcard",
                model=model_name,
                prompt=prompt_text,
                response=cards_preview[:3000] if cards_preview else None,
                tokens_used=len(prompt_text) // 4
            ))
            db.commit()
        except Exception:
            db.rollback()

        # 3. Create database entry
        deck_title = body.title or f"Flashcards: {body.text[:30].strip()}..."
        db_deck = models.FlashcardDeck(
            user_id=current_user.id,
            title=deck_title,
            cards=[{"front": c["front"], "back": c["back"]} for c in cards]
        )
        db.add(db_deck)
        
        # 4. Increment daily quota
        st["flashcard_quota_used"] = quota_used + 1
        current_user.study_time = st
        flag_modified(current_user, "study_time")
        
        _invalidate_flashcard_caches(user_id=current_user.id)
        db.commit()
        db.refresh(db_deck)
        
        return db_deck
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        logger.error(f"Flashcard generation failed: {msg}")
        if "quota" in msg.lower() or "rate" in msg.lower() or "429" in msg:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests on the server."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=msg or "Failed to generate flashcards."
        )


@router.get("", response_model=List[schemas.FlashcardDeckOut])
def get_flashcard_decks(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id
    if user_id in USER_FLASHCARD_DECKS_CACHE:
        return USER_FLASHCARD_DECKS_CACHE[user_id]

    results = db.query(models.FlashcardDeck).filter(
        models.FlashcardDeck.user_id == current_user.id
    ).order_by(models.FlashcardDeck.created_at.desc()).all()
    USER_FLASHCARD_DECKS_CACHE[user_id] = results
    return results


@router.get("/{deck_id}", response_model=schemas.FlashcardDeckOut)
def get_flashcard_deck(
    deck_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if deck_id in FLASHCARD_DECK_CACHE:
        deck = FLASHCARD_DECK_CACHE[deck_id]
        if deck.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Flashcard deck not found.")
        return deck

    deck = db.query(models.FlashcardDeck).filter(
        models.FlashcardDeck.id == deck_id,
        models.FlashcardDeck.user_id == current_user.id
    ).first()
    
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard deck not found."
        )
    FLASHCARD_DECK_CACHE[deck_id] = deck
    return deck


@router.delete("/{deck_id}")
def delete_flashcard_deck(
    deck_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    deck = db.query(models.FlashcardDeck).filter(
        models.FlashcardDeck.id == deck_id,
        models.FlashcardDeck.user_id == current_user.id
    ).first()
    
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard deck not found."
        )
        
    _invalidate_flashcard_caches(deck_id=deck.id, user_id=current_user.id)
    db.delete(deck)
    db.commit()
    return {"status": "success", "message": "Flashcard deck deleted."}
