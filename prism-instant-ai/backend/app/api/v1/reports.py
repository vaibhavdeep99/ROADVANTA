import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import (
    User, Report, Scan, Detection, ReportStatusHistory, ReportAssignment, EvidenceFile, ReportDocument, AuthorityProfile
)
from app.services.storage import storage_service
from app.services.pdf_service import pdf_service
from app.services.audit import log_audit_event
from app.api.v1.auth_deps import get_current_user, require_user, require_admin, require_authority
from app.core.security import ROLE_ADMIN, ROLE_AUTHORITY, ROLE_USER

router = APIRouter(prefix="/reports", tags=["Road Defect Reports & Workflow"])

# Permitted Workflow Transitions
VALID_TRANSITIONS = {
    "SUBMITTED": ["UNDER_INSPECTION", "REJECTED"],
    "UNDER_INSPECTION": ["CONFIRMED", "REJECTED"],
    "CONFIRMED": ["IN_REPAIR", "REJECTED"],
    "IN_REPAIR": ["RESOLVED"],
    "RESOLVED": [],
    "REJECTED": ["UNDER_INSPECTION"] # Re-appeal allowed by Admin
}

# Schemas
class CreateReportPayload(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: Optional[str] = ""
    scan_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_accuracy: Optional[float] = None
    address: Optional[str] = "Corridor Route"
    city: Optional[str] = "Indore"
    damage_severity: Optional[str] = "MODERATE"
    priority_score: Optional[int] = 50

class UpdateStatusPayload(BaseModel):
    new_status: str
    reason: Optional[str] = None
    repair_evidence_key: Optional[str] = None

class AssignReportPayload(BaseModel):
    authority_id: str

@router.post("", status_code=status.HTTP_201_CREATED)
def create_report(
    payload: CreateReportPayload,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Submits a verified Road Defect Report:
    Links to an authentic Scan when available, generates public reference ID, and seeds initial workflow history.
    """
    ref_id = f"PRISM-{datetime.datetime.utcnow().year}-{uuid.uuid4().hex[:4].upper()}"

    # If linked to a scan, verify ownership or admin
    scan = None
    if payload.scan_id:
        scan = db.query(Scan).filter(Scan.id == payload.scan_id).first()
        if scan and scan.owner_id != current_user.id:
            user_roles = [r.role_name for r in current_user.roles]
            if ROLE_ADMIN not in user_roles:
                raise HTTPException(status_code=403, detail="Cannot link report to a scan owned by another user.")

    report = Report(
        reference_id=ref_id,
        owner_id=current_user.id,
        scan_id=payload.scan_id,
        title=payload.title,
        description=payload.description or "",
        latitude=payload.latitude,
        longitude=payload.longitude,
        location_accuracy=payload.location_accuracy,
        address=payload.address or "Corridor Route",
        city=payload.city or "Indore",
        damage_severity=payload.damage_severity.upper() if payload.damage_severity else "MODERATE",
        priority_score=payload.priority_score or 50,
        workflow_status="SUBMITTED"
    )
    db.add(report)
    db.flush()

    # Link evidence file if scan exists
    if scan and scan.storage_key:
        ev = EvidenceFile(
            report_id=report.id,
            file_type="annotated_image" if scan.annotated_storage_key else "original_image",
            private_storage_key=scan.annotated_storage_key or scan.storage_key,
            mime_type="image/jpeg",
            uploaded_by=current_user.id
        )
        db.add(ev)

    # Immutable initial status history
    hist = ReportStatusHistory(
        report_id=report.id,
        previous_status="NONE",
        new_status="SUBMITTED",
        changed_by=current_user.full_name or current_user.email,
        reason="Report submitted by citizen."
    )
    db.add(hist)
    db.commit()

    log_audit_event(
        db,
        action="REPORT_SUBMITTED",
        actor_id=current_user.id,
        target_type="Report",
        target_id=report.id,
        safe_metadata={"reference_id": ref_id, "severity": report.damage_severity}
    )

    return {
        "success": True,
        "data": {
            "id": report.id,
            "reference_id": report.reference_id,
            "title": report.title,
            "workflow_status": report.workflow_status,
            "created_at": report.created_at.isoformat()
        }
    }

@router.get("")
def list_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    limit: int = Query(25, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Public/authorized list of reports with filters and pagination."""
    query = db.query(Report)

    if status_filter:
        query = query.filter(Report.workflow_status == status_filter.upper())
    if severity:
        query = query.filter(Report.damage_severity == severity.upper())
    if city:
        query = query.filter(Report.city.ilike(f"%{city}%"))

    total = query.count()
    reports = query.order_by(Report.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "success": True,
        "total": total,
        "data": [
            {
                "id": r.id,
                "reference_id": r.reference_id,
                "title": r.title,
                "address": r.address,
                "city": r.city,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "damage_severity": r.damage_severity,
                "priority_score": r.priority_score,
                "workflow_status": r.workflow_status,
                "has_repair_evidence": bool(r.repair_evidence_key),
                "created_at": r.created_at.isoformat() if r.created_at else None
            } for r in reports
        ]
    }

@router.get("/{report_id}")
def get_report(
    report_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves full details, evidence references, and status history for a report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    detections = []
    if report.scan:
        detections = [
            {
                "class_name": d.class_name,
                "confidence": d.confidence,
                "bounding_box": d.bounding_box,
                "apparent_area_pct": d.apparent_area_pct
            } for d in report.scan.detections
        ]

    history = [
        {
            "previous_status": h.previous_status,
            "new_status": h.new_status,
            "changed_by": h.changed_by,
            "reason": h.reason,
            "timestamp": h.timestamp.isoformat() if h.timestamp else None
        } for h in report.status_history
    ]

    return {
        "success": True,
        "data": {
            "id": report.id,
            "reference_id": report.reference_id,
            "owner_id": report.owner_id,
            "title": report.title,
            "description": report.description,
            "latitude": report.latitude,
            "longitude": report.longitude,
            "address": report.address,
            "city": report.city,
            "damage_severity": report.damage_severity,
            "priority_score": report.priority_score,
            "workflow_status": report.workflow_status,
            "assigned_authority_id": report.assigned_authority_id,
            "evidence_storage_key": report.scan.annotated_storage_key or report.scan.storage_key if report.scan else None,
            "repair_evidence_key": report.repair_evidence_key,
            "detections": detections,
            "status_history": history,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "updated_at": report.updated_at.isoformat() if report.updated_at else None
        }
    }

@router.get("/{report_id}/pdf")
def download_report_pdf(
    report_id: str,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated PDF Download with strict ownership and role verification:
    - Normal user can only download their own reports.
    - Assigned authority can download reports assigned to their department.
    - Admin can download all reports.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    user_roles = [r.role_name for r in current_user.roles]

    # Ownership and Authorization Check
    is_owner = (report.owner_id == current_user.id)
    is_admin = (ROLE_ADMIN in user_roles)
    is_assigned_authority = (
        ROLE_AUTHORITY in user_roles and
        (report.assigned_authority_id == current_user.id or not report.assigned_authority_id)
    )

    if not (is_owner or is_admin or is_assigned_authority):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You are not authorized to download this report audit PDF."
        )

    # Gather data for ReportLab
    rep_dict = {
        "reference_id": report.reference_id,
        "title": report.title,
        "damage_severity": report.damage_severity,
        "workflow_status": report.workflow_status,
        "priority_score": report.priority_score,
        "city": report.city,
        "address": report.address,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "owner_email": report.owner.email if report.owner else "Citizen Inspector",
        "created_at": report.created_at.isoformat() if report.created_at else None
    }

    detections = []
    ev_key = None
    if report.scan:
        ev_key = report.scan.annotated_storage_key or report.scan.storage_key
        detections = [
            {
                "class_name": d.class_name,
                "confidence": d.confidence,
                "apparent_area_pct": d.apparent_area_pct
            } for d in report.scan.detections
        ]

    history = [
        {
            "previous_status": h.previous_status,
            "new_status": h.new_status,
            "changed_by": h.changed_by,
            "reason": h.reason,
            "timestamp": h.timestamp.isoformat() if h.timestamp else None
        } for h in report.status_history
    ]

    pdf_bytes = pdf_service.generate_pdf(
        report_data=rep_dict,
        detections=detections,
        status_history=history,
        evidence_storage_key=ev_key,
        repair_evidence_key=report.repair_evidence_key
    )

    log_audit_event(
        db,
        action="REPORT_PDF_DOWNLOADED",
        actor_id=current_user.id,
        target_type="Report",
        target_id=report.id,
        safe_metadata={"reference_id": report.reference_id}
    )

    filename = f"{report.reference_id}_Audit_Document.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Cache-Control": "no-cache, no-store, must-revalidate",
        }
    )

@router.get("/{report_id}/evidence")
def download_report_evidence(
    report_id: str,
    evidence_type: str = Query("damage", regex="^(damage|repair)$"),
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Authenticated Evidence Retrieval with permission check."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    user_roles = [r.role_name for r in current_user.roles]
    is_owner = (report.owner_id == current_user.id)
    is_admin = (ROLE_ADMIN in user_roles)
    is_authority = (ROLE_AUTHORITY in user_roles)

    if not (is_owner or is_admin or is_authority):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Access to private evidence is restricted."
        )

    if evidence_type == "repair":
        if not report.repair_evidence_key:
            raise HTTPException(status_code=404, detail="No repair evidence attached to this report.")
        path = storage_service.get_path(report.repair_evidence_key, subfolder="evidence")
    else:
        if not report.scan or not (report.scan.annotated_storage_key or report.scan.storage_key):
            raise HTTPException(status_code=404, detail="No damage evidence available.")
        key = report.scan.annotated_storage_key or report.scan.storage_key
        path = storage_service.get_path(key, subfolder="evidence")

    return FileResponse(path, media_type="image/jpeg", filename=f"{report.reference_id}_{evidence_type}.jpg")

@router.post("/{report_id}/assign")
def assign_report(
    report_id: str,
    payload: AssignReportPayload,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin assigns report to an Authority."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    authority_user = db.query(User).filter(User.id == payload.authority_id).first()
    if not authority_user:
        raise HTTPException(status_code=404, detail="Target authority user not found")

    auth_roles = [r.role_name for r in authority_user.roles]
    if ROLE_AUTHORITY not in auth_roles and ROLE_ADMIN not in auth_roles:
        raise HTTPException(status_code=400, detail="Target user does not have AUTHORITY or ADMIN role.")

    report.assigned_authority_id = authority_user.id
    if report.workflow_status == "SUBMITTED":
        report.workflow_status = "UNDER_INSPECTION"

    assignment = ReportAssignment(
        report_id=report.id,
        authority_id=authority_user.id,
        assigned_by=current_user.id,
        assignment_status="ASSIGNED"
    )
    db.add(assignment)

    hist = ReportStatusHistory(
        report_id=report.id,
        previous_status=report.workflow_status,
        new_status="UNDER_INSPECTION",
        changed_by=f"Admin {current_user.full_name}",
        reason=f"Assigned to Authority official: {authority_user.full_name}"
    )
    db.add(hist)
    db.commit()

    log_audit_event(
        db,
        action="REPORT_ASSIGNED",
        actor_id=current_user.id,
        target_type="Report",
        target_id=report.id,
        safe_metadata={"assigned_to": authority_user.email}
    )

    return {"success": True, "message": f"Report assigned to {authority_user.full_name}."}

@router.post("/{report_id}/status")
def update_report_status(
    report_id: str,
    payload: UpdateStatusPayload,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Enforces strict workflow transition rules:
    - Authority or Admin can change status.
    - Transitions must match VALID_TRANSITIONS.
    - REJECTED requires reason.
    - RESOLVED requires repair proof evidence.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    user_roles = [r.role_name for r in current_user.roles]
    if ROLE_ADMIN not in user_roles and ROLE_AUTHORITY not in user_roles:
        raise HTTPException(status_code=403, detail="Forbidden: Only Authorities or Admins can advance workflow status.")

    current_status = report.workflow_status
    target_status = payload.new_status.upper()

    # Verify transition state machine
    allowed_next = VALID_TRANSITIONS.get(current_status, [])
    if target_status not in allowed_next:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Illegal transition: '{current_status}' cannot be transitioned to '{target_status}'. Allowed next: {allowed_next}"
        )

    # Verification rules
    if target_status == "REJECTED" and not payload.reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A documented rejection reason is mandatory when rejecting a report."
        )

    if target_status == "RESOLVED":
        if not payload.repair_evidence_key and not report.repair_evidence_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resolution requires photographic repair proof evidence before status can be marked RESOLVED."
            )
        if payload.repair_evidence_key:
            report.repair_evidence_key = payload.repair_evidence_key

    # Apply update
    report.workflow_status = target_status
    hist = ReportStatusHistory(
        report_id=report.id,
        previous_status=current_status,
        new_status=target_status,
        changed_by=f"{current_user.full_name} ({', '.join(user_roles)})",
        reason=payload.reason or "Municipal engineering protocol."
    )
    db.add(hist)
    db.commit()

    log_audit_event(
        db,
        action="REPORT_STATUS_CHANGED",
        actor_id=current_user.id,
        target_type="Report",
        target_id=report.id,
        safe_metadata={
            "previous_status": current_status,
            "new_status": target_status,
            "reason": payload.reason
        }
    )

    return {
        "success": True,
        "message": f"Report transitioned from {current_status} to {target_status}.",
        "data": {
            "id": report.id,
            "reference_id": report.reference_id,
            "workflow_status": report.workflow_status
        }
    }
