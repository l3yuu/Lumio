from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(
    prefix="/api/notes",
    tags=["notes"]
)

@router.get("", response_model=List[schemas.NoteOut])
def get_notes(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all notes of the current user ordered by pinned first then updated_at desc."""
    return db.query(models.Note).filter(
        models.Note.user_id == current_user.id
    ).order_by(models.Note.is_pinned.desc(), models.Note.updated_at.desc()).all()

@router.post("", response_model=schemas.NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new blank note for the current user."""
    db_note = models.Note(
        user_id=current_user.id,
        title="Untitled Note",
        content="",
        subject="General"
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.put("/{note_id}", response_model=schemas.NoteOut)
def update_note(
    note_id: int,
    note_update: schemas.NoteUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific note by ID."""
    db_note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.user_id == current_user.id
    ).first()
    if not db_note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    if note_update.title is not None:
        db_note.title = note_update.title
    if note_update.content is not None:
        db_note.content = note_update.content
    if note_update.subject is not None:
        db_note.subject = note_update.subject
    if note_update.is_pinned is not None:
        db_note.is_pinned = note_update.is_pinned
        
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific note by ID."""
    db_note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.user_id == current_user.id
    ).first()
    if not db_note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    db.delete(db_note)
    db.commit()
    return
