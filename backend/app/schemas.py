from pydantic import BaseModel, EmailStr
from typing import List, Optional

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr
    name: str
    avatar: Optional[str] = None
    school: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    school: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    grade_level: Optional[str] = None
    study_goal: Optional[str] = None
    study_language: Optional[str] = None
    timezone: Optional[str] = None
    streak_goal: Optional[int] = None
    level: Optional[int] = None
    xp: Optional[int] = None
    streak: Optional[int] = None
    quizzes_count: Optional[int] = None
    quiz_history: Optional[List[int]] = None
    study_time: Optional[dict] = None
    heatmap_data: Optional[List[dict]] = None
    focus_areas: Optional[List[dict]] = None
    spaced_recall: Optional[List[dict]] = None
    quests: Optional[List[dict]] = None
    quests_date: Optional[str] = None
    last_check_in: Optional[str] = None

class UserOut(UserBase):
    id: int
    level: int
    xp: int
    is_verified: bool
    username: Optional[str] = None
    bio: Optional[str] = None
    grade_level: Optional[str] = None
    study_goal: Optional[str] = None
    study_language: Optional[str] = None
    timezone: Optional[str] = None
    streak_goal: Optional[int] = None
    streak: Optional[int] = None
    quizzes_count: Optional[int] = None
    quiz_history: Optional[List[int]] = None
    study_time: Optional[dict] = None
    heatmap_data: Optional[List[dict]] = None
    focus_areas: Optional[List[dict]] = None
    spaced_recall: Optional[List[dict]] = None
    quests: Optional[List[dict]] = None
    quests_date: Optional[str] = None
    last_check_in: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class AuthResponse(Token):
    user: UserOut

class RegisterResponse(Token):
    is_verified: bool

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


# --- QUIZ QUESTION SCHEMAS ---
class QuizQuestionBase(BaseModel):
    question: str
    options: List[str]
    correct_answer_index: int

class QuizQuestionOut(QuizQuestionBase):
    id: int
    module_id: int

    class Config:
        from_attributes = True


# --- MODULE SCHEMAS ---
class ModuleBase(BaseModel):
    name: str
    subject: Optional[str] = None
    size: str

class ModuleCreate(ModuleBase):
    questions: List[QuizQuestionBase]

class ModuleOut(ModuleBase):
    id: int
    date: str
    user_id: int
    source_filename: Optional[str] = None
    has_source_file: bool = False
    last_score: Optional[str] = None
    questions: List[QuizQuestionOut]

    class Config:
        from_attributes = True


class ModuleSourceOut(BaseModel):
    id: int
    source_filename: Optional[str] = None
    source_content: Optional[str] = None


class ModuleScoreUpdate(BaseModel):
    score: str


# --- EXAM SCHEMAS ---
class ExamBase(BaseModel):
    title: str
    subject: str
    date: str
    raw_date: Optional[str] = None
    priority: str  # high, medium, low

class ExamCreate(ExamBase):
    pass

class ExamOut(ExamBase):
    id: int
    user_id: int
    days_remaining: int

    class Config:
        from_attributes = True


# --- GROUP MEMBER SCHEMAS ---
class GroupMemberOut(BaseModel):
    name: str
    email: str
    avatar: Optional[str] = None
    online: bool

    class Config:
        from_attributes = True


# --- QUIZ SCORECARD / RANKING SCHEMAS ---
class QuizRankingBase(BaseModel):
    name: str
    score: str
    percentage: int
    time: str
    is_user: bool = False
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

class QuizSessionOut(BaseModel):
    id: int
    module_name: str
    date: str
    avg_score: str
    rankings: List[QuizRankingBase]

    class Config:
        from_attributes = True


# --- STUDY GROUP SCHEMAS ---
class StudyGroupCreate(BaseModel):
    name: str
    members: List[str] = []  # List of emails to add

class StudyGroupOut(BaseModel):
    id: int
    name: str
    creator_id: Optional[int] = None
    members: List[GroupMemberOut]
    modules: List[ModuleOut]
    quiz_sessions: List[QuizSessionOut]

    class Config:
        from_attributes = True

class GroupInviteRequest(BaseModel):
    email: str

class GroupInvitationOut(BaseModel):
    id: int
    group_id: int
    group_name: str
    inviter_name: str
    inviter_avatar: Optional[str] = None
    status: str
    created_at: str

    class Config:
        from_attributes = True


class VerifyRequest(BaseModel):
    email: EmailStr
    code: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    token: str


class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: Optional[str] = None
    related_id: Optional[int] = None
    related_type: Optional[str] = None
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True


# --- GROUP NOTIFICATION PREFERENCE SCHEMAS ---
class GroupNotificationPrefOut(BaseModel):
    group_id: int
    enabled: bool

    class Config:
        from_attributes = True


class GroupMemberWithPrefOut(BaseModel):
    name: str
    email: str
    avatar: Optional[str] = None
    online: bool
    notifications_enabled: bool = True

    class Config:
        from_attributes = True


class GroupMembersWithPrefsOut(BaseModel):
    group_id: int
    group_name: str
    members: List[GroupMemberWithPrefOut]
