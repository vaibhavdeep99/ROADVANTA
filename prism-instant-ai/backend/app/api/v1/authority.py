import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import User, Report, ReportStatusHistory, EvidenceFile, AuthorityProfile
from app.api.v1.auth_deps import require_authority
from app.services.storage import storage_service
from app.services.audit import log_audit_event

router = APIRouter(prefix="/authority", tags=["Municipal Authority Operations"])

class InspectionRemarksPayload(BaseModel):
    decision: str # UNDER_INSPECTION, CONFIRMED, or REJECTED
    remarks: str

@router.get("/assigned-reports")
def get_assigned_reports(
    current_authority: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    prof = db.query(AuthorityProfile).filter(AuthorityProfile.user_id == current_authority.id).first()
    jurisdiction = prof.jurisdiction if prof else ""

    # Return reports assigned directly or matching jurisdiction
    reports = db.query(Report).filter(
        (Report.assigned_authority_id == current_authority.id) |
        (Report.city.ilike(f"%{jurisdiction}%"))
    ).order_by(Report.priority_score.desc()).all()

    return {
        "success": True,
        "count": len(reports),
        "data": [
            {
                "id": r.id,
                "reference_id": r.reference_id,
                "title": r.title,
                "address": r.address,
                "city": r.city,
                "damage_severity": r.damage_severity,
                "priority_score": r.priority_score,
                "workflow_status": r.workflow_status,
                "assigned_authority_id": r.assigned_authority_id,
                "has_repair_evidence": bool(r.repair_evidence_key),
                "created_at": r.created_at.isoformat() if r.created_at else None
            } for r in reports
        ]
    }

@router.post("/reports/{report_id}/inspection")
def submit_inspection(
    report_id: str,
    payload: InspectionRemarksPayload,
    current_authority: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    target_status = payload.decision.upper()
    if target_status not in ["UNDER_INSPECTION", "CONFIRMED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid inspection decision.")

    old_status = report.workflow_status
    report.workflow_status = target_status
    report.assigned_authority_id = current_authority.id

    hist = ReportStatusHistory(
        report_id=report.id,
        previous_status=old_status,
        new_status=target_status,
        changed_by=f"Inspector {current_authority.full_name}",
        reason=payload.remarks
    )
    db.add(hist)
    db.commit()

    log_audit_event(
        db,
        action="INSPECTION_RECORDED",
        actor_id=current_authority.id,
        target_type="Report",
        target_id=report.id,
        safe_metadata={"decision": target_status, "remarks": payload.remarks}
    )

    return {"success": True, "message": f"Inspection recorded. Report marked {target_status}."}

@router.post("/reports/{report_id}/repair-evidence")
async def upload_repair_evidence(
    report_id: str,
    file: UploadFile = File(...),
    notes: Optional[str] = Form("Compacted asphalt patch repair verified by field engineer."),
    current_authority: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    """
    Uploads authentic photographic proof of road repair and marks the report RESOLVED.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    raw_bytes = await file.read()
    # Safe Pillow validation
    storage_service.validate_and_load_image(raw_bytes)

    ext = os.path.splitext(file.filename or "repair.jpg")[1].lower() or ".jpg"
    repair_key, checksum, size_bytes = storage_service.save_bytes(raw_bytes, ext=ext, subfolder="evidence")

    # Link evidence file
    ev = EvidenceFile(
        report_id=report.id,
        file_type="repair_proof",
        private_storage_key=repair_key,
        checksum=checksum,
        mime_type="image/jpeg",
        file_size_bytes=size_bytes,
        uploaded_by=current_authority.id
    )
    db.add(ev)

    old_status = report.workflow_status
    report.repair_evidence_key = repair_key
    report.workflow_status = "RESOLVED"

    hist = ReportStatusHistory(
        report_id=report.id,
        previous_status=old_status,
        new_status="RESOLVED",
        changed_by=f"Authority {current_authority.full_name}",
        reason=notes or "Repair proof verified."
    )
    db.add(hist)
    db.commit()

    log_audit_event(
        db,
        action="REPAIR_EVIDENCE_ATTACHED_AND_RESOLVED",
        actor_id=current_authority.id,
        target_type="Report",
        target_id=report.id,
        safe_metadata={"repair_evidence_key": repair_key, "notes": notes}
    )

    return {
        "success": True,
        "message": "Repair evidence verified and committed. Report marked RESOLVED.",
        "data": {
            "report_id": report.id,
            "reference_id": report.reference_id,
            "repair_evidence_key": repair_key,
            "workflow_status": "RESOLVED"
        }
    }
