from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


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
    folders: Optional[List[str]] = None
    role: Optional[str] = None

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
    folders: Optional[List[str]] = None
    role: Optional[str] = "user"
    is_premium: bool = False
    is_suspended: bool = False
    stripe_subscription_status: Optional[str] = None
    premium_expires_at: Optional[datetime] = None

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

class RoleUpdate(BaseModel):
    role: str


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
    difficulty: Optional[str] = "medium"
    questions: List[QuizQuestionOut]

    class Config:
        from_attributes = True


class ModuleSourceOut(BaseModel):
    id: int
    source_filename: Optional[str] = None
    source_content: Optional[str] = None


class ModuleScoreUpdate(BaseModel):
    score: str


class ModuleUpdate(BaseModel):
    subject: Optional[str] = None
    name: Optional[str] = None


class FolderRename(BaseModel):
    old_name: str
    new_name: str


# --- EXAM SCHEMAS ---
class ExamTopic(BaseModel):
    text: str
    completed: bool

class ExamBase(BaseModel):
    title: str
    subject: str
    date: str
    raw_date: Optional[str] = None
    priority: str  # high, medium, low
    completed: Optional[bool] = False
    topics: Optional[List[ExamTopic]] = None

class ExamCreate(ExamBase):
    pass

class ExamComplete(BaseModel):
    score: Optional[str] = None

class ExamOut(ExamBase):
    id: int
    user_id: int
    days_remaining: int
    reminder_sent: bool
    completed: bool
    score: Optional[str] = None

    class Config:
        from_attributes = True


# --- GROUP MEMBER SCHEMAS ---
class GroupMemberOut(BaseModel):
    id: int
    name: str
    email: str
    avatar: Optional[str] = None
    online: bool
    is_premium: bool = False

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

class StudyGroupUpdate(BaseModel):
    name: str

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


# --- TUTOR SCHEMAS ---
class TutorQuery(BaseModel):
    query: str

class TutorResponse(BaseModel):
    query: str
    answer: str


# --- CHAT SESSION SCHEMAS ---
class ChatMessageSchema(BaseModel):
    id: str
    sender: str
    text: str
    timestamp: str
    isError: Optional[bool] = None

class ChatSessionCreate(BaseModel):
    session_id: str
    title: str
    messages: List[ChatMessageSchema]

class ChatSessionOut(BaseModel):
    id: int
    session_id: str
    title: str
    messages: List[ChatMessageSchema]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- DISCUSSION FORUM SCHEMAS ---
class GroupPostCreate(BaseModel):
    content: str

class GroupPostOut(BaseModel):
    id: int
    group_id: int
    user_id: Optional[int] = None
    user_name: str
    user_avatar: Optional[str] = None
    content: str
    created_at: str
    is_ai: bool

    class Config:
        from_attributes = True


class ConsolidatedExamRequest(BaseModel):
    module_ids: List[int]
    name: Optional[str] = None
    difficulty: Optional[str] = "medium"


class FlashcardItem(BaseModel):
    front: str
    back: str


class FlashcardGenerateRequest(BaseModel):
    text: str
    count: Optional[int] = 10
    title: Optional[str] = None


class FlashcardGenerateResponse(BaseModel):
    cards: List[FlashcardItem]


class FlashcardDeckOut(BaseModel):
    id: int
    user_id: int
    title: str
    cards: List[FlashcardItem]
    created_at: datetime

    class Config:
        from_attributes = True


class CondenserRequest(BaseModel):
    text: str


class CondenserVocabularyItem(BaseModel):
    term: str
    definition: str


class CondenserResponse(BaseModel):
    summary: str
    takeaways: List[str]
    vocabulary: List[CondenserVocabularyItem]


class CondenserHistoryOut(BaseModel):
    id: int
    user_id: int
    title: str
    summary: str
    takeaways: List[str]
    vocabulary: List[CondenserVocabularyItem]
    created_at: datetime

    class Config:
        from_attributes = True


class EssayGradeRequest(BaseModel):
    prompt: Optional[str] = ""
    text: str


class EssayGradeResponse(BaseModel):
    grade: str
    thesis_score: int
    grammar_score: int
    structure_score: int
    critique: str
    recommendations: List[str]


class EssayGraderHistoryOut(BaseModel):
    id: int
    user_id: int
    title: str
    prompt: Optional[str] = ""
    essay_text: str
    grade: str
    thesis_score: int
    grammar_score: int
    structure_score: int
    critique: str
    recommendations: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- QUIZ ATTEMPT SCHEMAS ---
class QuizAttemptCreate(BaseModel):
    title: str
    attempt_type: str  # 'study_module', 'exam', 'group_quiz'
    score: str         # e.g., "8/10"
    percentage: int    # e.g., 80
    date: str          # e.g., "Jun 16, 2026, 9:15 PM"

class QuizAttemptOut(QuizAttemptCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# --- NOTE SCHEMAS ---
class NoteCreate(BaseModel):
    title: str = "Untitled Note"
    content: str = ""
    subject: str = "General"

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    subject: Optional[str] = None

class NoteOut(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    subject: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



