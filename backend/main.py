import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, ensure_runtime_schema
from app.routers import auth, modules, exams, groups, notifications, tutor, admin, payments, flashcards, condenser, essay_grader

# Create database tables automatically
Base.metadata.create_all(bind=engine)
ensure_runtime_schema()

app = FastAPI(title="Lumio API")

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    origins.extend([o.strip().rstrip("/") for o in env_origins.split(",")])

print(f"CORS Allowed Origins: {origins}")


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(modules.router)
app.include_router(exams.router)
app.include_router(groups.router)
app.include_router(notifications.router)
app.include_router(tutor.router)
app.include_router(admin.router)
app.include_router(payments.router)
app.include_router(flashcards.router)
app.include_router(condenser.router)
app.include_router(essay_grader.router)


import asyncio
from app.scheduler import exam_reminder_scheduler
from app.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends
from app import models

@app.on_event("startup")
async def start_scheduler():
    asyncio.create_task(exam_reminder_scheduler())

@app.get("/api/stats")
def get_public_stats(db: Session = Depends(get_db)):
    """Public endpoint — returns real counts from the database for the landing page."""
    total_quizzes   = db.query(models.Module).count()
    total_modules   = db.query(models.Module).count()
    total_flashcard_decks = db.query(models.FlashcardDeck).count()
    total_users     = db.query(models.User).filter(models.User.is_verified == True).count()

    # Score improvement: average score across all quiz history entries
    users_with_history = db.query(models.User).filter(
        models.User.quiz_history.isnot(None)
    ).all()
    scores = []
    for u in users_with_history:
        if isinstance(u.quiz_history, list):
            for entry in u.quiz_history:
                if isinstance(entry, dict) and "score" in entry:
                    scores.append(entry["score"])
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        "quizzes_generated": total_quizzes,
        "modules_uploaded":  total_modules,
        "score_improvement": avg_score,
        "flashcards_solved": total_flashcard_decks,
        "active_students":   total_users,
    }


@app.get("/")
async def root():
    return {"message": "Welcome to Lumio API", "status": "online"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
