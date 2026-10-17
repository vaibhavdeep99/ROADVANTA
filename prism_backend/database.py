import os
import uuid
import datetime
from typing import Optional, List
from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./prism_road.db")

engine = create_engine(DB_URL, connect_args={"check_same_thread": False} if "sqlite" in DB_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(50), primary_key=True, index=True)
    report_number = Column(String(50), unique=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    category = Column(String(50), default="pothole", index=True) # pothole, broken_surface, road_crack, waterlogging, etc.
    estimated_severity = Column(String(30), default="moderate", index=True) # low, moderate, high, requires_inspection
    priority_score = Column(Integer, default=50) # 0 - 100
    
    # Workflow statuses: submitted, awaiting_review, under_inspection, confirmed, maintenance_planned, resolved, rejected
    workflow_status = Column(String(50), default="submitted", index=True)
    verification_status = Column(String(50), default="pending", index=True) # pending, verified, rejected, unverified_demo
    
    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String(255), default="")
    city = Column(String(100), default="Indore", index=True)
    location_verified = Column(Boolean, default=False)

    # Imagery
    original_image_url = Column(String(500), nullable=True)
    annotated_image_url = Column(String(500), nullable=True)
    enhanced_image_url = Column(String(500), nullable=True)

    # Detection & Source Metadata
    model_name = Column(String(100), default="YOLOv8-Pothole-Adapter")
    model_confidence = Column(Float, nullable=True)
    detections_count = Column(Integer, default=0)
    is_demo = Column(Boolean, default=False, index=True)
    source_note = Column(String(255), default="Citizen Submission")
    reporter_name = Column(String(100), default="Anonymous Citizen")
    reporter_email = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    detections = relationship("Detection", back_populates="report", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="report", cascade="all, delete-orphan")

class Detection(Base):
    __tablename__ = "detections"

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(50), ForeignKey("reports.id"), nullable=False)
    class_name = Column(String(50), default="pothole")
    confidence = Column(Float, default=0.0)
    x1 = Column(Float, default=0.0) # normalized 0-1 or pixel
    y1 = Column(Float, default=0.0)
    x2 = Column(Float, default=0.0)
    y2 = Column(Float, default=0.0)
    apparent_area_pct = Column(Float, default=0.0)

    report = relationship("Report", back_populates="detections")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(50), ForeignKey("reports.id"), nullable=False)
    reviewer_name = Column(String(100), default="Municipal Inspector")
    decision = Column(String(50), default="confirmed") # confirmed, rejected, severity_override
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    report = relationship("Report", back_populates="reviews")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
