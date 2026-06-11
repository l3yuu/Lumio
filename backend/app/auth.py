from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from . import models

# Standard OAuth2 scheme points to login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    # Use bcrypt directly to hash the password safely
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    # Dynamically format spaced recall dueIn values
    if user.spaced_recall:
        from .time_utils import now_ph, PH_TIMEZONE
        from datetime import datetime
        updated = []
        for item in user.spaced_recall:
            item_copy = dict(item)
            due_at_str = item_copy.get("due_at", "")
            due_in_str = "1 day"
            if due_at_str:
                try:
                    due_at = datetime.fromisoformat(due_at_str)
                    if due_at.tzinfo is None or due_at.tzinfo.utcoffset(due_at) is None:
                        due_at = due_at.replace(tzinfo=PH_TIMEZONE)
                    now = now_ph()
                    delta = due_at - now
                    if delta.total_seconds() <= 0:
                        due_in_str = "now"
                    else:
                        days = delta.days
                        hours = int(delta.seconds / 3600)
                        if days > 0:
                            due_in_str = "1 day" if days == 1 else f"{days} days"
                        else:
                            if hours <= 0:
                                due_in_str = "now"
                            elif hours == 1:
                                due_in_str = "1 hour"
                            else:
                                due_in_str = f"{hours} hours"
                except Exception:
                    pass
            item_copy["dueIn"] = due_in_str
            updated.append(item_copy)
        user.spaced_recall = updated
        
    return user
