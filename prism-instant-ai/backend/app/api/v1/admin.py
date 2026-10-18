from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.database.models import User, UserRole, AuthorityProfile, Report, Scan, AuditLog
from app.api.v1.auth_deps import require_admin
from app.core.security import ROLE_ADMIN, ROLE_AUTHORITY, ROLE_USER
from app.services.audit import log_audit_event

router = APIRouter(prefix="/admin", tags=["Administrator Management & Platform Governance"])

class UpdateUserPayload(BaseModel):
    is_active: Optional[bool] = None
    add_role: Optional[str] = None
    remove_role: Optional[str] = None

class AuthorityDecisionPayload(BaseModel):
    decision: str # APPROVE or REJECT
    reason: Optional[str] = None

@router.get("/users")
def list_users(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total = db.query(User).count()
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "success": True,
        "total": total,
        "data": [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "is_active": u.is_active,
                "roles": [r.role_name for r in u.roles],
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
                "authority_profile": {
                    "organization": u.authority_profile.organization,
                    "jurisdiction": u.authority_profile.jurisdiction,
                    "verification_status": u.authority_profile.verification_status,
                } if u.authority_profile else None
            } for u in users
        ]
    }

@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    payload: UpdateUserPayload,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.is_active is not None:
        user.is_active = payload.is_active

    if payload.add_role:
        role_to_add = payload.add_role.upper()
        if role_to_add in [ROLE_USER, ROLE_ADMIN, ROLE_AUTHORITY]:
            existing_roles = {r.role_name for r in user.roles}
            if role_to_add not in existing_roles:
                db.add(UserRole(user_id=user.id, role_name=role_to_add))

    if payload.remove_role:
        role_to_remove = payload.remove_role.upper()
        for r in user.roles:
            if r.role_name == role_to_remove:
                db.delete(r)

    db.commit()

    log_audit_event(
        db,
        action="USER_MODIFIED_BY_ADMIN",
        actor_id=current_admin.id,
        target_type="User",
        target_id=user.id,
        safe_metadata={
            "is_active": payload.is_active,
            "add_role": payload.add_role,
            "remove_role": payload.remove_role
        }
    )

    return {"success": True, "message": "User updated successfully."}

@router.get("/authority-requests")
def list_authority_requests(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    requests = db.query(AuthorityProfile).filter(AuthorityProfile.verification_status == "PENDING").all()
    return {
        "success": True,
        "data": [
            {
                "user_id": p.user_id,
                "email": p.user.email if p.user else None,
                "full_name": p.user.full_name if p.user else None,
                "organization": p.organization,
                "department": p.department,
                "jurisdiction": p.jurisdiction,
                "badge_number": p.badge_number,
                "verification_status": p.verification_status,
                "created_at": p.created_at.isoformat() if p.created_at else None
            } for p in requests
        ]
    }

@router.post("/authority-requests/{user_id}/decision")
def authority_decision(
    user_id: str,
    payload: AuthorityDecisionPayload,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    prof = db.query(AuthorityProfile).filter(AuthorityProfile.user_id == user_id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Authority profile not found")

    decision = payload.decision.upper()
    if decision not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=400, detail="Decision must be APPROVE or REJECT")

    prof.verification_status = "APPROVED" if decision == "APPROVE" else "REJECTED"
    prof.reviewed_by = current_admin.id
    prof.reviewed_at = datetime.now(timezone.utc)

    # If approved, grant ROLE_AUTHORITY
    if decision == "APPROVE":
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            existing_roles = {r.role_name for r in user.roles}
            if ROLE_AUTHORITY not in existing_roles:
                db.add(UserRole(user_id=user.id, role_name=ROLE_AUTHORITY))

    db.commit()

    log_audit_event(
        db,
        action="AUTHORITY_APPLICATION_REVIEWED",
        actor_id=current_admin.id,
        target_type="AuthorityProfile",
        target_id=user_id,
        safe_metadata={"decision": decision, "reason": payload.reason}
    )

    return {"success": True, "message": f"Authority request {decision.lower()}d."}

@router.get("/audit-logs")
def get_audit_logs(
    action: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    
    total = query.count()
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

    return {
        "success": True,
        "total": total,
        "data": [
            {
                "id": l.id,
                "actor_id": l.actor_id,
                "action": l.action,
                "target_type": l.target_type,
                "target_id": l.target_id,
                "safe_metadata": l.safe_metadata,
                "ip_address": l.ip_address,
                "timestamp": l.timestamp.isoformat() if l.timestamp else None
            } for l in logs
        ]
    }

@router.get("/analytics")
def get_platform_analytics(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_reports = db.query(Report).count()
    submitted = db.query(Report).filter(Report.workflow_status == "SUBMITTED").count()
    under_inspection = db.query(Report).filter(Report.workflow_status == "UNDER_INSPECTION").count()
    confirmed = db.query(Report).filter(Report.workflow_status == "CONFIRMED").count()
    in_repair = db.query(Report).filter(Report.workflow_status == "IN_REPAIR").count()
    resolved = db.query(Report).filter(Report.workflow_status == "RESOLVED").count()

    total_scans = db.query(Scan).count()
    total_users = db.query(User).count()
    active_authorities = db.query(AuthorityProfile).filter(AuthorityProfile.verification_status == "APPROVED").count()

    return {
        "success": True,
        "data": {
            "total_reports": total_reports,
            "submitted": submitted,
            "under_inspection": under_inspection,
            "confirmed": confirmed,
            "in_repair": in_repair,
            "resolved": resolved,
            "total_scans": total_scans,
            "total_users": total_users,
            "active_authorities": active_authorities,
        }
    }
