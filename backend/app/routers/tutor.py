import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth
from ..config import settings
from ..time_utils import today_ph_str

router = APIRouter(prefix="/api/tutor", tags=["tutor"])

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
        
    if tutor_used >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily limit reached. Free accounts are limited to 5 AI Concept Tutor queries per day."
        )

    # Retrieve textbook content from all user modules to construct study context
    modules = db.query(models.Module).filter(models.Module.user_id == current_user.id).all()
    context_texts = [m.source_content for m in modules if m.source_content]
    context = "\n\n".join(context_texts).strip()

    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key == "YOUR_GEMINI_API_KEY":
        # Fallback to local mock tutor response
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
            # Fallback if API fails
            print(f"Error querying Gemini API for tutor: {e}")
            answer = generate_mock_tutor_response(body.query)

    # Increment quota count and update study_time JSON
    st["tutor_quota_used"] = tutor_used + 1
    current_user.study_time = {**st}
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(current_user, "study_time")
    db.commit()
    
    return schemas.TutorResponse(query=body.query, answer=answer)
