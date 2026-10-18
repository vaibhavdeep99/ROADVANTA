from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database.models import AuditLog

def log_audit_event(
    db: Session,
    action: str,
    actor_id: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    safe_metadata: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """
    Persists structured audit log entries without logging passwords, tokens, or private secrets.
    """
    clean_meta = {}
    if safe_metadata:
        for k, v in safe_metadata.items():
            if k.lower() in ["password", "token", "secret", "authorization", "bearer"]:
                continue
            clean_meta[k] = v

    log_entry = AuditLog(
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        safe_metadata=clean_meta,
        request_id=request_id,
        ip_address=ip_address
    )
    db.add(log_entry)
    try:
        db.commit()
    except Exception:
        db.rollback()
