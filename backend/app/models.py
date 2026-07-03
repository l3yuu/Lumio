import os
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table, Text, JSON, DateTime, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
from .time_utils import now_ph_naive

# Association Tables
group_members = Table(
    'group_members',
    Base.metadata,
    Column('group_id', Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
)

group_modules = Table(
    'group_modules',
    Base.metadata,
    Column('group_id', Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), primary_key=True),
    Column('module_id', Integer, ForeignKey('modules.id', ondelete='CASCADE'), primary_key=True)
)

group_notes = Table(
    'group_notes',
    Base.metadata,
    Column('group_id', Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), primary_key=True),
    Column('note_id', Integer, ForeignKey('notes.id', ondelete='CASCADE'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    avatar = Column(Text, nullable=True)
    school = Column(String(255), nullable=True)
    username = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    grade_level = Column(String(100), nullable=True)
    study_goal = Column(String(100), nullable=True)
    study_language = Column(String(100), nullable=True)
    timezone = Column(String(50), nullable=True)
    streak_goal = Column(Integer, nullable=True)
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    is_suspended = Column(Boolean, default=False, nullable=False)
    role = Column(String(50), default="user", nullable=False)
    verification_code = Column(String(6), nullable=True)
    reset_code = Column(String(6), nullable=True)
    streak = Column(Integer, default=0)
    quizzes_count = Column(Integer, default=0)
    quiz_history = Column(JSON, default=lambda: [])
    study_time = Column(JSON, default=lambda: {
        "Biology": 0,
        "Economics": 0,
        "Mathematics": 0,
        "General Study": 0
    })
    heatmap_data = Column(JSON, default=lambda: [
        {"label": "Mon", "hours": 0, "level": 0},
        {"label": "Tue", "hours": 0, "level": 0},
        {"label": "Wed", "hours": 0, "level": 0},
        {"label": "Thu", "hours": 0, "level": 0},
        {"label": "Fri", "hours": 0, "level": 0},
        {"label": "Sat", "hours": 0, "level": 0},
        {"label": "Sun", "hours": 0, "level": 0},
        {"label": "Mon", "hours": 0, "level": 0},
        {"label": "Tue", "hours": 0, "level": 0},
        {"label": "Wed", "hours": 0, "level": 0},
        {"label": "Thu", "hours": 0, "level": 0},
        {"label": "Fri", "hours": 0, "level": 0},
        {"label": "Sat", "hours": 0, "level": 0},
        {"label": "Sun", "hours": 0, "level": 0}
    ])
    focus_areas = Column(JSON, default=lambda: [])
    spaced_recall = Column(JSON, default=lambda: [])
    quests = Column(JSON, default=lambda: [])
    quests_date = Column(String(50), default="")
    last_check_in = Column(String(50), default="")
    last_seen = Column(DateTime, nullable=True)
    folders = Column(JSON, default=lambda: ["General"])
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    stripe_subscription_status = Column(String(50), nullable=True)
    stripe_price_id = Column(String(255), nullable=True)
    premium_expires_at = Column(DateTime, nullable=True)

    @property
    def is_premium(self) -> bool:
        if self.role in ("superadmin", "premium"):
            return True
        if self.stripe_subscription_status in ("active", "trialing"):
            return True
        if self.premium_expires_at:
            from datetime import datetime
            return self.premium_expires_at > datetime.utcnow()
        return False

    @property
    def online(self) -> bool:
        from datetime import datetime, timedelta
        if self.last_seen is None:
            return False
        return datetime.utcnow() - self.last_seen < timedelta(minutes=2)

    modules = relationship("Module", back_populates="owner", cascade="all, delete-orphan")
    exams = relationship("ExamDeadline", back_populates="owner", cascade="all, delete-orphan")
    joined_groups = relationship("StudyGroup", secondary=group_members, back_populates="members")
    posts = relationship("GroupPost", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date = Column(String(255), nullable=False)
    size = Column(String(50), nullable=False)
    subject = Column(String(100), nullable=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    source_content = Column(Text, nullable=True)
    source_filename = Column(String(255), nullable=True)
    source_file_path = Column(String(500), nullable=True)
    source_file_data = Column(LargeBinary, nullable=True)
    source_file_mime = Column(String(100), nullable=True)
    last_score = Column(String(50), nullable=True)
    difficulty = Column(String(20), default="medium", nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)

    @property
    def has_source_file(self) -> bool:
        return bool(self.source_file_data) or (bool(self.source_file_path) and os.path.exists(self.source_file_path))

    @property
    def shared_by_name(self) -> Optional[str]:
        return self.owner.name if self.owner else None

    owner = relationship("User", back_populates="modules")
    questions = relationship("QuizQuestion", back_populates="module", cascade="all, delete-orphan")
    groups = relationship("StudyGroup", secondary=group_modules, back_populates="modules")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # List of strings
    correct_answer_index = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=True)
    hint = Column(Text, nullable=True)
    question_type = Column(String(50), nullable=True)
    reference = Column(String(255), nullable=True)
    module_id = Column(Integer, ForeignKey('modules.id', ondelete='CASCADE'), nullable=False, index=True)

    module = relationship("Module", back_populates="questions")

class ExamDeadline(Base):
    __tablename__ = "exam_deadlines"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(100), nullable=False)
    date = Column(String(100), nullable=False)
    raw_date = Column(String(100), nullable=True)
    priority = Column(String(20), nullable=False)  # high, medium, low
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    reminder_sent = Column(Boolean, default=False)
    completed = Column(Boolean, default=False)
    score = Column(String(50), nullable=True)
    topics = Column(JSON, nullable=True)

    owner = relationship("User", back_populates="exams")

class StudyGroup(Base):
    __tablename__ = "study_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    creator_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    is_banned = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)

    members = relationship("User", secondary=group_members, back_populates="joined_groups")
    modules = relationship("Module", secondary=group_modules, back_populates="groups")
    notes = relationship("Note", secondary=group_notes, back_populates="groups")
    quiz_sessions = relationship("QuizSession", back_populates="group", cascade="all, delete-orphan")
    posts = relationship("GroupPost", back_populates="group", cascade="all, delete-orphan")

class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    module_name = Column(String(255), nullable=False)
    date = Column(String(255), nullable=False)
    avg_score = Column(String(50), nullable=False)

    group = relationship("StudyGroup", back_populates="quiz_sessions")
    rankings = relationship("QuizRanking", back_populates="session", cascade="all, delete-orphan")

class QuizRanking(Base):
    __tablename__ = "quiz_rankings"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('quiz_sessions.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    score = Column(String(50), nullable=False)
    percentage = Column(Integer, nullable=False)
    time = Column(String(50), nullable=False)
    is_user = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    session = relationship("QuizSession", back_populates="rankings")

class GroupInvitation(Base):
    __tablename__ = "group_invitations"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=False)
    inviter_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    invitee_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    status = Column(String(20), default='pending')  # pending, accepted, declined
    created_at = Column(DateTime, nullable=False)

    group = relationship("StudyGroup")
    inviter = relationship("User", foreign_keys=[inviter_id])
    invitee = relationship("User", foreign_keys=[invitee_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # group_invite, group_invite_accepted, module_shared, quiz_completed, etc.
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    related_id = Column(Integer, nullable=True)      # e.g. group_id, invitation_id, module_id
    related_type = Column(String(50), nullable=True) # e.g. "group", "invitation", "module"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False, default=now_ph_naive)

    user = relationship("User", foreign_keys=[user_id])


class GroupNotificationPref(Base):
    __tablename__ = "group_notification_prefs"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    enabled = Column(Boolean, default=True)


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    messages = Column(JSON, default=lambda: [])
    created_at = Column(DateTime, default=now_ph_naive)
    updated_at = Column(DateTime, default=now_ph_naive, onupdate=now_ph_naive)

    owner = relationship("User")


class GroupPost(Base):
    __tablename__ = "group_posts"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True)
    user_name = Column(String(255), nullable=False)
    user_avatar = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(String(100), nullable=False)
    is_ai = Column(Boolean, default=False)

    group = relationship("StudyGroup", back_populates="posts")
    user = relationship("User", back_populates="posts")


class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    cards = Column(JSON, default=lambda: [])
    created_at = Column(DateTime, default=now_ph_naive)

    user = relationship("User")


class CondenserHistory(Base):
    __tablename__ = "condenser_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    takeaways = Column(JSON, default=lambda: [])
    vocabulary = Column(JSON, default=lambda: [])
    created_at = Column(DateTime, default=now_ph_naive)

    user = relationship("User")


class EssayGraderHistory(Base):
    __tablename__ = "essay_grader_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    prompt = Column(Text, nullable=True)
    essay_text = Column(Text, nullable=False)
    grade = Column(String(10), nullable=False)
    thesis_score = Column(Integer, nullable=False)
    grammar_score = Column(Integer, nullable=False)
    structure_score = Column(Integer, nullable=False)
    critique = Column(Text, nullable=False)
    recommendations = Column(JSON, default=lambda: [])
    created_at = Column(DateTime, default=now_ph_naive)

    user = relationship("User")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    attempt_type = Column(String(50), nullable=False) # 'study_module', 'exam', 'group_quiz'
    score = Column(String(50), nullable=False)
    percentage = Column(Integer, nullable=False)
    date = Column(String(255), nullable=False)

    user = relationship("User", back_populates="quiz_attempts")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    subject = Column(String(100), nullable=False, default="General")
    is_pinned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=now_ph_naive)
    updated_at = Column(DateTime, default=now_ph_naive, onupdate=now_ph_naive)

    user = relationship("User", back_populates="notes")
    groups = relationship("StudyGroup", secondary=group_notes, back_populates="notes")


class AiUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    feature = Column(String(50), nullable=False, index=True)
    model = Column(String(100), nullable=True)
    prompt = Column(Text, nullable=True)
    response = Column(Text, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=now_ph_naive)

    user = relationship("User", backref="ai_usage_logs")


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=True)



