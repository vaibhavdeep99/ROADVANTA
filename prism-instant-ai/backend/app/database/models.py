import uuid
import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid() -> str:
    return str(uuid.uuid4())

# 1. users
class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), default="Citizen Inspector")
    is_active = Column(Boolean, default=True)
    email_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    # Relationships
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    authority_profile = relationship("AuthorityProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    scans = relationship("Scan", back_populates="owner")
    reports = relationship("Report", back_populates="owner", foreign_keys="[Report.owner_id]")

# 2. roles & user_roles
class Role(Base):
    __tablename__ = "roles"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False) # USER, ADMIN, AUTHORITY
    description = Column(String(255), default="")

class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_name = Column(String(50), nullable=False, index=True) # USER, ADMIN, AUTHORITY
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="roles")
    __table_args__ = (UniqueConstraint('user_id', 'role_name', name='_user_role_uc'),)

# 3. authority_profiles
class AuthorityProfile(Base):
    __tablename__ = "authority_profiles"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    organization = Column(String(200), default="Public Works Department (PWD)")
    department = Column(String(100), default="Road Maintenance Division")
    jurisdiction = Column(String(150), default="Indore Municipal Corporation")
    badge_number = Column(String(100), nullable=True)
    verification_status = Column(String(50), default="PENDING", index=True) # PENDING, APPROVED, REJECTED
    reviewed_by = Column(String(50), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="authority_profile")

# 4. scans
class Scan(Base):
    __tablename__ = "scans"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    owner_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    source_type = Column(String(20), default="image") # image, video
    original_filename = Column(String(255), default="")
    storage_key = Column(String(500), nullable=False)
    annotated_storage_key = Column(String(500), nullable=True)
    scan_status = Column(String(30), default="QUEUED", index=True) # QUEUED, PROCESSING, COMPLETED, FAILED
    model_version = Column(String(100), default="YOLOv8-Pothole-v1.0")
    inference_duration_ms = Column(Float, default=0.0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    owner = relationship("User", back_populates="scans")
    detections = relationship("Detection", back_populates="scan", cascade="all, delete-orphan")
    video_frames = relationship("VideoFrame", back_populates="scan", cascade="all, delete-orphan")

# 5. detections
class Detection(Base):
    __tablename__ = "detections"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    scan_id = Column(String(50), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    class_name = Column(String(50), default="pothole")
    confidence = Column(Float, nullable=False)
    bounding_box = Column(JSON, nullable=False) # {"x1": 0, "y1": 0, "x2": 0, "y2": 0}
    frame_timestamp = Column(Float, nullable=True) # for video frame detections
    apparent_area_pct = Column(Float, default=0.0)
    evidence_storage_key = Column(String(500), nullable=True)

    scan = relationship("Scan", back_populates="detections")

# 6. reports
class Report(Base):
    __tablename__ = "reports"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    reference_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. PRISM-2026-X89F
    owner_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    scan_id = Column(String(50), ForeignKey("scans.id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_accuracy = Column(Float, nullable=True)
    address = Column(String(255), default="")
    city = Column(String(100), default="Indore", index=True)
    damage_severity = Column(String(30), default="MODERATE", index=True) # LOW, MODERATE, HIGH, CRITICAL
    priority_score = Column(Integer, default=50) # 0 to 100
    
    # Workflow Status: SUBMITTED -> UNDER_INSPECTION -> CONFIRMED -> IN_REPAIR -> RESOLVED (or REJECTED)
    workflow_status = Column(String(50), default="SUBMITTED", index=True)
    assigned_authority_id = Column(String(50), ForeignKey("users.id"), nullable=True, index=True)
    repair_evidence_key = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", foreign_keys=[owner_id], back_populates="reports")
    assigned_authority = relationship("User", foreign_keys=[assigned_authority_id])
    scan = relationship("Scan")
    status_history = relationship("ReportStatusHistory", back_populates="report", cascade="all, delete-orphan")
    assignments = relationship("ReportAssignment", back_populates="report", cascade="all, delete-orphan")
    evidence_files = relationship("EvidenceFile", back_populates="report", cascade="all, delete-orphan")
    documents = relationship("ReportDocument", back_populates="report", cascade="all, delete-orphan")

# 7. report_status_history
class ReportStatusHistory(Base):
    __tablename__ = "report_status_history"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    report_id = Column(String(50), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    changed_by = Column(String(50), nullable=False) # user_id or actor name
    reason = Column(Text, default="")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    report = relationship("Report", back_populates="status_history")

# 8. report_assignments
class ReportAssignment(Base):
    __tablename__ = "report_assignments"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    report_id = Column(String(50), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    authority_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    assigned_by = Column(String(50), nullable=False)
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow)
    assignment_status = Column(String(30), default="ASSIGNED") # ASSIGNED, ACCEPTED, REASSIGNED, COMPLETED

    report = relationship("Report", back_populates="assignments")

# 9. evidence_files
class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    report_id = Column(String(50), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    file_type = Column(String(50), default="original_image") # original_image, annotated_image, repair_proof, video_clip
    private_storage_key = Column(String(500), nullable=False)
    checksum = Column(String(64), nullable=True) # SHA-256
    mime_type = Column(String(100), default="image/jpeg")
    file_size_bytes = Column(Integer, default=0)
    uploaded_by = Column(String(50), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    report = relationship("Report", back_populates="evidence_files")

# 10. audit_logs
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    actor_id = Column(String(50), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True) # LOGIN, REGISTER, SCAN_IMAGE, UPDATE_STATUS, ASSIGN_REPORT, PROMOTE_USER
    target_type = Column(String(50), nullable=True) # Report, User, Scan, Document
    target_id = Column(String(50), nullable=True)
    request_id = Column(String(50), nullable=True)
    ip_address = Column(String(50), nullable=True)
    safe_metadata = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

# 11. video_frames
class VideoFrame(Base):
    __tablename__ = "video_frames"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    scan_id = Column(String(50), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    frame_number = Column(Integer, nullable=False)
    timestamp_seconds = Column(Float, nullable=False)
    evidence_storage_key = Column(String(500), nullable=False)
    detections_count = Column(Integer, default=0)
    processing_status = Column(String(30), default="PROCESSED")

    scan = relationship("Scan", back_populates="video_frames")

# 12. report_documents
class ReportDocument(Base):
    __tablename__ = "report_documents"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    report_id = Column(String(50), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(50), default="PDF_AUDIT_REPORT")
    storage_key = Column(String(500), nullable=False)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    document_version = Column(Integer, default=1)

    report = relationship("Report", back_populates="documents")
