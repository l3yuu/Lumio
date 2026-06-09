import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, ensure_runtime_schema
from app.routers import auth, modules, exams, groups, notifications

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

@app.get("/")
async def root():
    return {"message": "Welcome to Lumio API", "status": "online"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
