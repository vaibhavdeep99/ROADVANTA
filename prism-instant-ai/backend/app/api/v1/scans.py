import os
import cv2
import numpy as np
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import User, Scan, Detection, VideoFrame
from app.services.storage import storage_service
from app.services.audit import log_audit_event
from app.ml.detector import detector_engine
from app.ml.video import video_scanner
from app.api.v1.auth_deps import get_current_user, require_user
from app.core.security import ROLE_ADMIN

router = APIRouter(prefix="/scans", tags=["AI Scanning Pipelines"])

@router.post("/image")
async def scan_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated Road Damage Image Scanner:
    Validates file -> Private Storage -> Real Ultralytics Inference -> Annotated Evidence -> Persisted Scan.
    """
    raw_bytes = await file.read()
    
    # 1. Validation & Image Decode (Pillow decompression safeguard)
    pil_img = storage_service.validate_and_load_image(raw_bytes)
    
    # 2. Save original raw image to private storage
    ext = os.path.splitext(file.filename or "image.jpg")[1].lower() or ".jpg"
    orig_key, orig_checksum, orig_size = storage_service.save_bytes(raw_bytes, ext=ext, subfolder="evidence")

    # 3. Create Scan record in database
    scan = Scan(
        owner_id=current_user.id,
        source_type="image",
        original_filename=file.filename or "uploaded_road_image.jpg",
        storage_key=orig_key,
        scan_status="PROCESSING",
        started_at=datetime.now(timezone.utc)
    )
    db.add(scan)
    db.flush()

    # 4. Run real model inference
    # Convert PIL RGB to OpenCV BGR
    img_np = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    inf_res = detector_engine.infer(img_np)

    # 5. Save annotated image evidence to private storage
    annotated_np = inf_res["annotated_image_np"]
    success, buffer = cv2.imencode(".jpg", annotated_np)
    annotated_key = None
    if success:
        annotated_key, _, _ = storage_service.save_bytes(buffer.tobytes(), ext=".jpg", subfolder="evidence")

    # 6. Update Scan status and record detections
    scan.scan_status = inf_res["inference_status"]
    scan.annotated_storage_key = annotated_key
    scan.model_version = inf_res["model_identifier"]
    scan.inference_duration_ms = inf_res["inference_duration_ms"]
    scan.completed_at = datetime.now(timezone.utc)

    if inf_res["warnings"]:
        scan.error_message = "; ".join(inf_res["warnings"])

    # Persist detection bounding boxes
    for det in inf_res["detections"]:
        db_det = Detection(
            scan_id=scan.id,
            class_name=det["class_name"],
            confidence=det["confidence"],
            bounding_box=det["bounding_box"],
            apparent_area_pct=det["apparent_area_pct"],
            evidence_storage_key=annotated_key
        )
        db.add(db_det)

    db.commit()

    log_audit_event(
        db,
        action="SCAN_IMAGE_COMPLETED",
        actor_id=current_user.id,
        target_type="Scan",
        target_id=scan.id,
        safe_metadata={
            "detected_count": inf_res["detected_count"],
            "duration_ms": inf_res["inference_duration_ms"],
            "status": inf_res["inference_status"]
        }
    )

    return {
        "success": True,
        "data": {
            "scan_id": scan.id,
            "status": scan.scan_status,
            "detected_count": inf_res["detected_count"],
            "preliminary_severity": inf_res["preliminary_severity"],
            "priority_score": inf_res["priority_score"],
            "confidence_score": inf_res["confidence_score"],
            "inference_duration_ms": inf_res["inference_duration_ms"],
            "model_version": inf_res["model_identifier"],
            "detections": inf_res["detections"],
            "storage_keys": {
                "original": orig_key,
                "annotated": annotated_key
            },
            "warnings": inf_res["warnings"]
        }
    }

@router.post("/video")
async def scan_video(
    file: UploadFile = File(...),
    sampling_interval_sec: float = Form(1.0),
    max_duration_sec: int = Form(45),
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated Video Defect Scanner:
    Validates video format -> Sequential frame extraction -> Inference -> Aggregated persistent tracking.
    """
    ext = os.path.splitext(file.filename or ".mp4")[1].lower()
    if ext not in [".mp4", ".avi", ".mov", ".mkv"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format '{ext}'. Allowed: .mp4, .avi, .mov, .mkv."
        )

    raw_bytes = await file.read()
    video_key, _, _ = storage_service.save_bytes(raw_bytes, ext=ext, subfolder="evidence")
    video_path = storage_service.get_path(video_key, subfolder="evidence")

    scan = Scan(
        owner_id=current_user.id,
        source_type="video",
        original_filename=file.filename or "dashcam_video.mp4",
        storage_key=video_key,
        scan_status="PROCESSING",
        started_at=datetime.now(timezone.utc)
    )
    db.add(scan)
    db.flush()

    try:
        proc_res = video_scanner.process_video_file(
            video_path,
            sampling_interval_sec=sampling_interval_sec,
            max_duration_sec=max_duration_sec
        )

        scan.scan_status = "COMPLETED"
        scan.completed_at = datetime.now(timezone.utc)

        # Persist frame records
        for f in proc_res["sampled_frames"]:
            v_frame = VideoFrame(
                scan_id=scan.id,
                frame_number=f["frame_number"],
                timestamp_seconds=f["timestamp_seconds"],
                evidence_storage_key=f["evidence_storage_key"] or "",
                detections_count=f["detections_count"]
            )
            db.add(v_frame)

            for d in f["detections"]:
                db_det = Detection(
                    scan_id=scan.id,
                    class_name=d["class_name"],
                    confidence=d["confidence"],
                    bounding_box=d["bounding_box"],
                    frame_timestamp=f["timestamp_seconds"],
                    apparent_area_pct=d["apparent_area_pct"],
                    evidence_storage_key=f["evidence_storage_key"]
                )
                db.add(db_det)

        db.commit()

        log_audit_event(
            db,
            action="SCAN_VIDEO_COMPLETED",
            actor_id=current_user.id,
            target_type="Scan",
            target_id=scan.id,
            safe_metadata={
                "frames_sampled": proc_res["total_frames_sampled"],
                "total_detections": proc_res["total_detections_found"]
            }
        )

        return {
            "success": True,
            "data": {
                "scan_id": scan.id,
                "status": "COMPLETED",
                "total_frames_sampled": proc_res["total_frames_sampled"],
                "frames_with_detections": proc_res["frames_with_detections"],
                "total_detections_found": proc_res["total_detections_found"],
                "video_duration_sec": proc_res["video_duration_sec"],
                "sampled_frames": proc_res["sampled_frames"]
            }
        }
    except Exception as e:
        scan.scan_status = "FAILED"
        scan.error_message = str(e)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video processing failed: {str(e)}"
        )

@router.get("")
def list_scans(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Lists scans. Regular users see only their own scans; Admins can see all."""
    user_roles = [r.role_name for r in current_user.roles]
    query = db.query(Scan)
    if ROLE_ADMIN not in user_roles:
        query = query.filter(Scan.owner_id == current_user.id)
    
    total = query.count()
    scans = query.order_by(Scan.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "success": True,
        "total": total,
        "data": [
            {
                "id": s.id,
                "source_type": s.source_type,
                "original_filename": s.original_filename,
                "scan_status": s.scan_status,
                "model_version": s.model_version,
                "inference_duration_ms": s.inference_duration_ms,
                "detections_count": len(s.detections),
                "created_at": s.created_at.isoformat() if s.created_at else None
            } for s in scans
        ]
    }

@router.get("/{scan_id}")
def get_scan(
    scan_id: str,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    user_roles = [r.role_name for r in current_user.roles]
    # Ownership Check: User A cannot view User B's scan unless Admin
    if scan.owner_id != current_user.id and ROLE_ADMIN not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to view another user's scan."
        )

    return {
        "success": True,
        "data": {
            "id": scan.id,
            "owner_id": scan.owner_id,
            "source_type": scan.source_type,
            "original_filename": scan.original_filename,
            "scan_status": scan.scan_status,
            "model_version": scan.model_version,
            "inference_duration_ms": scan.inference_duration_ms,
            "storage_keys": {
                "original": scan.storage_key,
                "annotated": scan.annotated_storage_key
            },
            "created_at": scan.created_at.isoformat() if scan.created_at else None,
            "detections": [
                {
                    "class_name": d.class_name,
                    "confidence": d.confidence,
                    "bounding_box": d.bounding_box,
                    "apparent_area_pct": d.apparent_area_pct,
                    "frame_timestamp": d.frame_timestamp
                } for d in scan.detections
            ]
        }
    }

@router.get("/{scan_id}/evidence")
def download_scan_evidence(
    scan_id: str,
    evidence_type: str = Query("annotated", regex="^(original|annotated)$"),
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    user_roles = [r.role_name for r in current_user.roles]
    # Ownership Check: User A cannot access User B's evidence
    if scan.owner_id != current_user.id and ROLE_ADMIN not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Access denied to private evidence files of another user."
        )

    key = scan.annotated_storage_key if evidence_type == "annotated" else scan.storage_key
    if not key:
        key = scan.storage_key

    file_path = storage_service.get_path(key, subfolder="evidence")
    return FileResponse(file_path, media_type="image/jpeg", filename=f"scan_{scan.id}_{evidence_type}.jpg")
