from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth
from ..email import generate_verification_code, send_verification_email, send_welcome_email, send_reset_code_email
from ..ratelimit import login_limiter, register_limiter, verify_limiter, resend_limiter, forgot_limiter, reset_limiter
from ..time_utils import today_ph_str

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=schemas.RegisterResponse)
def register(user_in: schemas.UserCreate, background_tasks: BackgroundTasks, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    reg_key = f"register:{client_ip}"
    if register_limiter.is_limited(reg_key):
        raise HTTPException(status_code=429, detail="Too many registration attempts. Please try again later.")

    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        register_limiter.record(reg_key)
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(user_in.password)
    code = generate_verification_code()
    user = models.User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        name=user_in.name,
        avatar=user_in.avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
        school=user_in.school or "State University",
        verification_code=code
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    send_verification_email(background_tasks, user.email, user.name, code)
    
    access_token = auth.create_access_token(data={"user_id": user.id, "email": user.email})
    return {"access_token": access_token, "token_type": "bearer", "is_verified": False}

@router.post("/verify")
def verify(body: schemas.VerifyRequest, background_tasks: BackgroundTasks, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    verify_key = f"verify:{client_ip}:{body.email}"
    if verify_limiter.is_limited(verify_key):
        raise HTTPException(status_code=429, detail="Too many verification attempts. Please try again later.")

    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        return {"message": "Email already verified"}
    if user.verification_code != body.code:
        verify_limiter.record(verify_key)
        raise HTTPException(status_code=400, detail="Invalid verification code")
    user.is_verified = True
    user.verification_code = None
    db.commit()
    db.refresh(user)
    send_welcome_email(background_tasks, user.email, user.name)
    access_token = auth.create_access_token(data={"user_id": user.id, "email": user.email})
    return {"message": "Email verified successfully", "access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/resend-code")
def resend_code(body: schemas.ResendVerificationRequest, background_tasks: BackgroundTasks, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    resend_key = f"resend:{client_ip}:{body.email}"
    if resend_limiter.is_limited(resend_key):
        raise HTTPException(status_code=429, detail="Too many resend requests. Please try again later.")

    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    code = generate_verification_code()
    user.verification_code = code
    db.commit()
    send_verification_email(background_tasks, user.email, user.name, code)
    return {"message": "Verification code resent"}

@router.post("/forgot-password")
def forgot_password(body: schemas.ForgotPasswordRequest, background_tasks: BackgroundTasks, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    forgot_key = f"forgot:{client_ip}:{body.email}"
    if forgot_limiter.is_limited(forgot_key):
        raise HTTPException(status_code=429, detail="Too many password reset requests. Please try again later.")

    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        return {"message": "If that email exists, a reset code has been sent"}
    code = generate_verification_code()
    user.reset_code = code
    db.commit()
    send_reset_code_email(background_tasks, user.email, user.name, code)
    return {"message": "If that email exists, a reset code has been sent"}

@router.post("/reset-password")
def reset_password(body: schemas.ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    reset_key = f"reset:{client_ip}:{body.email}"
    if reset_limiter.is_limited(reset_key):
        raise HTTPException(status_code=429, detail="Too many reset attempts. Please try again later.")

    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or user.reset_code != body.code:
        reset_limiter.record(reset_key)
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    user.hashed_password = auth.get_password_hash(body.new_password)
    user.reset_code = None
    db.commit()
    return {"message": "Password reset successfully"}

@router.post("/login", response_model=schemas.AuthResponse)
def login(login_data: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    login_key = f"login:{client_ip}:{login_data.email}"

    if login_limiter.is_limited(login_key):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")

    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        login_limiter.record(login_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    login_limiter.reset(login_key)
    access_token = auth.create_access_token(data={"user_id": user.id, "email": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/google", response_model=schemas.AuthResponse)
def google_login(login_data: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    import requests
    token = login_data.token
    try:
        response = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=10)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to reach Google token validation service: {str(e)}"
        )
        
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google ID Token"
        )
        
    id_info = response.json()
    email = id_info.get("email")
    email_verified = id_info.get("email_verified")
    name = id_info.get("name")
    avatar = id_info.get("picture")
    
    if not email or email_verified not in (True, "true"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email must be verified"
        )
        
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        import secrets
        random_pwd = secrets.token_hex(16)
        hashed_pwd = auth.get_password_hash(random_pwd)
        
        user = models.User(
            email=email,
            hashed_password=hashed_pwd,
            name=name or email.split("@")[0],
            avatar=avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Always sync Google profile photo and display name on every login
        if avatar:
            user.avatar = avatar
        if name:
            user.name = name
        db.commit()
        db.refresh(user)
        
    access_token = auth.create_access_token(data={"user_id": user.id, "email": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Reset daily quota if it's a new day
    today_str = today_ph_str()
    st = current_user.study_time or {}
    if not isinstance(st, dict):
        st = {}
    if st.get("quota_date") != today_str:
        st["quota_date"] = today_str
        st["quota_used"] = 0
        current_user.study_time = {**st}
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(current_user, "study_time")
        db.commit()
        db.refresh(current_user)
    return current_user

@router.put("/profile", response_model=schemas.UserOut)
def update_profile(user_update: schemas.UserUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy.orm.attributes import flag_modified
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar
    if user_update.school is not None:
        current_user.school = user_update.school
    if user_update.username is not None:
        current_user.username = user_update.username
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    if user_update.grade_level is not None:
        current_user.grade_level = user_update.grade_level
    if user_update.study_goal is not None:
        current_user.study_goal = user_update.study_goal
    if user_update.study_language is not None:
        current_user.study_language = user_update.study_language
    if user_update.timezone is not None:
        current_user.timezone = user_update.timezone
    if user_update.streak_goal is not None:
        current_user.streak_goal = user_update.streak_goal
    if user_update.level is not None:
        current_user.level = user_update.level
    if user_update.xp is not None:
        current_user.xp = user_update.xp
    if user_update.streak is not None:
        current_user.streak = user_update.streak
    if user_update.quizzes_count is not None:
        current_user.quizzes_count = user_update.quizzes_count
    if user_update.quiz_history is not None:
        current_user.quiz_history = user_update.quiz_history
    if user_update.study_time is not None:
        current_user.study_time = user_update.study_time
        flag_modified(current_user, "study_time")
    if user_update.heatmap_data is not None:
        current_user.heatmap_data = user_update.heatmap_data
        flag_modified(current_user, "heatmap_data")
    if user_update.focus_areas is not None:
        current_user.focus_areas = user_update.focus_areas
        flag_modified(current_user, "focus_areas")
    if user_update.spaced_recall is not None:
        current_user.spaced_recall = user_update.spaced_recall
        flag_modified(current_user, "spaced_recall")
    if user_update.quests is not None:
        current_user.quests = user_update.quests
        flag_modified(current_user, "quests")
    if user_update.quests_date is not None:
        current_user.quests_date = user_update.quests_date
    if user_update.last_check_in is not None:
        current_user.last_check_in = user_update.last_check_in
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(body: schemas.ChangePasswordRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if not auth.verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = auth.get_password_hash(body.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.delete("/account")
def delete_account(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted"}

@router.post("/heartbeat")
def heartbeat(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Called periodically by the client to mark the user as online."""
    from datetime import datetime
    current_user.last_seen = datetime.utcnow()
    db.commit()
    return {"status": "ok"}
