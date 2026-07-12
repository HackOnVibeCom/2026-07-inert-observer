"""
GitDeo database layer.
Uses SQLite through SQLAlchemy. One file, two tables: users and videos.
"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./gitdeo.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    github_token = Column(String, nullable=True)
    github_username = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    videos = relationship("Video", back_populates="owner", cascade="all, delete-orphan")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    repo_full_name = Column(String, nullable=True)
    source_language = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(String, default="processing")  # processing | done | failed
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="videos")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
