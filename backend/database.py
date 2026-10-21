"""
Database configuration and models for SQLite / PostgreSQL
"""

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# ==========================================================
# DATABASE
# ==========================================================

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./farmers.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


# ==========================================================
# FARMER TABLE
# ==========================================================

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String(50), unique=True, nullable=False)

    email = Column(String(120), unique=True, nullable=False)

    password_hash = Column(String(64), nullable=False)

    village = Column(String(100))

    mobile = Column(String(20))

    profile_image = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    last_login = Column(DateTime)

    scan_history = relationship(
        "ScanHistory",
        back_populates="farmer",
        cascade="all, delete-orphan"
    )  

# ==========================================================
# SCAN HISTORY TABLE
# ==========================================================

class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)

    farmer_id = Column(
        Integer,
        ForeignKey("farmers.id"),
        nullable=False,
    )

    filename = Column(String(255))

    preview = Column(Text)

    disease = Column(String(100))

    marathi_disease = Column(String(150))

    confidence = Column(Float)

    severity = Column(String(50))

    infection_percentage = Column(Float)

    symptoms = Column(Text)

    treatment = Column(Text)

    prevention = Column(Text)

    status = Column(String(50))

    scan_date = Column(
        DateTime,
        default=datetime.utcnow,
    )

    farmer = relationship(
        "Farmer",
        back_populates="scan_history",
    )


# ==========================================================
# CREATE DATABASE
# ==========================================================

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully.")


# ==========================================================
# GET DATABASE SESSION
# ==========================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()