from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base

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
    verification_code = Column(String(6), nullable=True)
    reset_code = Column(String(6), nullable=True)

    modules = relationship("Module", back_populates="owner", cascade="all, delete-orphan")
    exams = relationship("ExamDeadline", back_populates="owner", cascade="all, delete-orphan")
    joined_groups = relationship("StudyGroup", secondary=group_members, back_populates="members")

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date = Column(String(255), nullable=False)
    size = Column(String(50), nullable=False)
    subject = Column(String(100), nullable=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    owner = relationship("User", back_populates="modules")
    questions = relationship("QuizQuestion", back_populates="module", cascade="all, delete-orphan")
    groups = relationship("StudyGroup", secondary=group_modules, back_populates="modules")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # List of strings
    correct_answer_index = Column(Integer, nullable=False)
    module_id = Column(Integer, ForeignKey('modules.id', ondelete='CASCADE'), nullable=False)

    module = relationship("Module", back_populates="questions")

class ExamDeadline(Base):
    __tablename__ = "exam_deadlines"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(100), nullable=False)
    date = Column(String(100), nullable=False)
    raw_date = Column(String(100), nullable=True)
    priority = Column(String(20), nullable=False)  # high, medium, low
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    owner = relationship("User", back_populates="exams")

class StudyGroup(Base):
    __tablename__ = "study_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    creator_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    members = relationship("User", secondary=group_members, back_populates="joined_groups")
    modules = relationship("Module", secondary=group_modules, back_populates="groups")
    quiz_sessions = relationship("QuizSession", back_populates="group", cascade="all, delete-orphan")

class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=False)
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
