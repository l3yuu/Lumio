import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth
from ..config import settings
from ..time_utils import today_ph_str

router = APIRouter(prefix="/api/tutor", tags=["tutor"])

# Disabled for local testing — re-enable before production
TUTOR_DAILY_QUOTA_ENABLED = False
TUTOR_DAILY_QUOTA_LIMIT = 5

def generate_mock_tutor_response(query: str) -> str:
    query_lower = query.lower()
    if "mitochondria" in query_lower or "powerhouse" in query_lower:
        return "Mitochondria are double-membraned organelles found in most eukaryotic organisms. They generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy, earning them the nickname 'the powerhouse of the cell'."
    elif "protein" in query_lower or "ribosome" in query_lower:
        return "Protein synthesis is performed by ribosomes, which link amino acids together in the order specified by messenger RNA (mRNA) molecules. This occurs in the cellular cytoplasm or on the rough endoplasmic reticulum."
    elif "demand" in query_lower or "price" in query_lower:
        return "According to the Law of Demand, as the price of a normal good increases, the quantity demanded decreases, holding everything else constant (ceteris paribus). This creates a downward-sloping demand curve."
    elif "market" in query_lower or "monopoly" in query_lower:
        return "A monopoly market structure features a single supplier selling a unique product with no close substitutes and high barriers to entry. Other structures include perfect competition, oligopoly, and monopolistic competition."
    else:
        return f"I analyzed your study content, but couldn't find a specific section explaining '{query}'. Based on general knowledge, it is an academic concept related to your courses. Please upload more textbook files for detailed tutor guidance!"

@router.post("/ask", response_model=schemas.TutorResponse)
def ask_tutor(
    body: schemas.TutorQuery,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Enforce Daily Quota Limit of 5 tutor queries
    today_str = today_ph_str()
    st = current_user.study_time or {}
    if not isinstance(st, dict):
        st = {}
        
    tutor_date = st.get("tutor_quota_date", "")
    tutor_used = st.get("tutor_quota_used", 0)
    
    if tutor_date != today_str:
        # Reset count for the new day
        st["tutor_quota_date"] = today_str
        st["tutor_quota_used"] = 0
        tutor_used = 0
        
    if TUTOR_DAILY_QUOTA_ENABLED and tutor_used >= TUTOR_DAILY_QUOTA_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily limit reached. Free accounts are limited to 5 AI Concept Tutor queries per day."
        )

    # Retrieve textbook content from all user modules to construct study context
    modules = db.query(models.Module).filter(models.Module.user_id == current_user.id).all()
    context_texts = [m.source_content for m in modules if m.source_content]
    context = "\n\n".join(context_texts).strip()

    # Search context textbooks locally as a fallback option
    def search_local_context(query_str: str, full_context: str) -> str:
        import re
        # Normalize single newlines inside full_context to spaces to merge wrapped lines
        normalized_context = re.sub(r'(?<!\n)\n(?![\n\r])', ' ', full_context)
        paragraphs = [p.strip() for p in normalized_context.split('\n\n') if p.strip()]
        
        # Get keywords of length >= 3
        words = re.findall(r'\b\w{3,}\b', query_str.lower())
        # Filter out common stop words
        stopwords = {'what', 'is', 'the', 'and', 'for', 'are', 'about', 'how', 'why', 'who', 'where', 'when', 'with', 'explain', 'summarize', 'define'}
        keywords = [w for w in words if w not in stopwords]
        if not keywords:
            return ""
            
        def clean_paragraph_text(text: str) -> str:
            # Replace bullet markers with clean list structures and newlines
            text = text.replace("●", "\n• ")
            text = text.replace("○", "\n  - ")
            text = text.replace("•", "\n• ")
            text = text.replace("■", "\n• ")
            
            # Clean up double newlines or empty bullet items
            text = re.sub(r'\n+', '\n', text)
            text = text.strip()
            
            # Ensure the paragraph begins with a bullet point for consistent list display
            if text and not text.startswith("•") and not text.startswith("-"):
                text = "• " + text
                
            return text

        matches = []
        for para in paragraphs:
            # Score based on keyword presence
            score = sum(1 for kw in keywords if kw in para.lower())
            if score > 0:
                matches.append((score, clean_paragraph_text(para)))
                
        if matches:
            # Sort by match score descending, then length descending to prefer detailed explanations
            matches.sort(key=lambda x: (x[0], len(x[1])), reverse=True)
            best_matches = [m[1] for m in matches[:3]]
            return "\n\n".join(best_matches)
        return ""

    local_explanation = search_local_context(body.query, context)

    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key == "YOUR_GEMINI_API_KEY":
        if local_explanation:
            answer = local_explanation
        else:
            answer = generate_mock_tutor_response(body.query)
    else:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            
            # Construct a clear explanation prompt
            prompt = f"""
You are an expert academic tutor.
Explain the concept queried by the student.
If the study context provided below is relevant, use it as the primary source for the explanation.
Keep the explanation clear, educational, and structured using bullet points or simple paragraphs.

Study Context from student's textbooks:
---
{context[:12000]}
---

Student Query:
"{body.query}"
"""
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            answer = response.text if response.text else "No explanation generated. Try another query."
        except Exception as e:
            print(f"Error querying Gemini API for tutor: {e}")
            if local_explanation:
                answer = local_explanation
            else:
                answer = generate_mock_tutor_response(body.query)

    if TUTOR_DAILY_QUOTA_ENABLED:
        st["tutor_quota_used"] = tutor_used + 1
        current_user.study_time = {**st}
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(current_user, "study_time")
        db.commit()
    
    return schemas.TutorResponse(query=body.query, answer=answer)


@router.get("/sessions", response_model=List[schemas.ChatSessionOut])
def get_chat_sessions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(models.ChatSession).filter(models.ChatSession.user_id == current_user.id).order_by(models.ChatSession.updated_at.desc()).all()
    return sessions


@router.post("/sessions", response_model=schemas.ChatSessionOut)
def upsert_chat_session(
    body: schemas.ChatSessionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if session exists
    session = db.query(models.ChatSession).filter(
        models.ChatSession.session_id == body.session_id,
        models.ChatSession.user_id == current_user.id
    ).first()
    
    # We must serialize the messages to matching dict format for JSON column
    serialized_messages = [msg.model_dump() for msg in body.messages]
    
    if session:
        session.title = body.title
        session.messages = serialized_messages
        from ..time_utils import now_ph_naive
        session.updated_at = now_ph_naive()
    else:
        session = models.ChatSession(
            session_id=body.session_id,
            user_id=current_user.id,
            title=body.title,
            messages=serialized_messages
        )
        db.add(session)
        
    db.commit()
    db.refresh(session)
    return session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat_session(
    session_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.session_id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
        
    db.delete(session)
    db.commit()
    return None


@router.delete("/sessions", status_code=status.HTTP_204_NO_CONTENT)
def clear_all_chat_sessions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db.query(models.ChatSession).filter(models.ChatSession.user_id == current_user.id).delete(synchronize_session=False)
    db.commit()
    return None

