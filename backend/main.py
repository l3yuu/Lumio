import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, ensure_runtime_schema
from app.routers import auth, modules, exams, groups, notifications, tutor, admin, payments, flashcards, condenser, essay_grader, notes

from prometheus_fastapi_instrumentator import Instrumentator

# Create database tables automatically
Base.metadata.create_all(bind=engine)
ensure_runtime_schema()

app = FastAPI(title="Lumio API")

# Expose prometheus metrics
Instrumentator().instrument(app).expose(app)

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

from fastapi import Request
from fastapi.responses import JSONResponse
import jwt
from app.system_config import get_system_config_global
from app.database import SessionLocal
from app.models import User

@app.middleware("http")
async def maintenance_mode_middleware(request: Request, call_next):
    # Check if maintenance mode is enabled in configurations
    if get_system_config_global("maintenance_mode") == "true":
        path = request.url.path
        
        # Bypass non-API paths, health endpoint, config endpoints, login and me checks
        bypassed_paths = [
            "/",
            "/api/health",
            "/api/admin/config",
            "/api/auth/login",
            "/api/auth/google",
            "/api/auth/me"
        ]
        
        if not path.startswith("/api") or path in bypassed_paths:
            return await call_next(request)
            
        # Inspect authorization header to check if user is a superadmin
        is_superadmin = False
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                from app.config import settings
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                user_id = payload.get("user_id")
                if user_id:
                    db = SessionLocal()
                    try:
                        user = db.query(User).filter(User.id == user_id).first()
                        if user and user.role == "superadmin":
                            is_superadmin = True
                    finally:
                        db.close()
            except Exception:
                pass
                
        if not is_superadmin:
            return JSONResponse(
                status_code=503,
                content={"detail": "System is currently undergoing scheduled maintenance. Only administrators can access the platform at this time."}
            )

    return await call_next(request)

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
app.include_router(notes.router)


import asyncio
from app.scheduler import exam_reminder_scheduler
from app.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends
from app import models

@app.on_event("startup")
async def start_scheduler():
    from app.redis_client import init_redis
    init_redis()
    asyncio.create_task(exam_reminder_scheduler())

@app.get("/api/stats")
def get_public_stats(db: Session = Depends(get_db)):
    """Public endpoint — returns real counts from the database for the landing page."""
    from app.redis_client import cache_get, cache_set
    
    cache_key = "api:stats"
    cached_data = cache_get(cache_key)
    if cached_data is not None and isinstance(cached_data, dict):
        return cached_data

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

    res_data = {
        "quizzes_generated": total_quizzes,
        "modules_uploaded":  total_modules,
        "score_improvement": avg_score,
        "flashcards_solved": total_flashcard_decks,
        "active_students":   total_users,
    }

    cache_set(cache_key, res_data, expire_seconds=60)
    return res_data


@app.get("/")
async def root():
    return {"message": "Welcome to Lumio API", "status": "online"}

@app.get("/api/health")
async def health_check():
    from app.redis_client import is_redis_available
    return {
        "status": "healthy",
        "version": "1.0.0",
        "maintenance_mode": get_system_config_global("maintenance_mode") == "true",
        "redis_connected": is_redis_available()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
