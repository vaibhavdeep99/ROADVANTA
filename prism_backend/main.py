import os
import uuid
import datetime
import csv
import io
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import init_db, get_db, Report, Detection, Review
from vision_lab import RoadVisionLab, UPLOAD_DIR
from detector import detector_adapter
from video_processor import RoadVideoProcessor
from seed_data import seed_demo_data

# Initialize DB & Seeds
init_db()
seed_demo_data()

app = FastAPI(
    title="PRISM ROAD AI API",
    description="AI-powered road damage detection, visualization, and infrastructure intelligence API.",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded media files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Pydantic Schemas
class StatusUpdatePayload(BaseModel):
    workflow_status: Optional[str] = None
    verification_status: Optional[str] = None
    estimated_severity: Optional[str] = None
    reviewer_name: Optional[str] = "Inspector"
    review_notes: Optional[str] = None

class ReportCreatePayload(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "pothole"
    city: Optional[str] = "Indore"
    address: Optional[str] = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    original_image_url: Optional[str] = None
    reporter_name: Optional[str] = "Anonymous Citizen"
    reporter_email: Optional[str] = None

# ==========================================
# 1. System Health & Model Status
# ==========================================
@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "service": "PRISM ROAD AI Backend",
        "version": "1.0.0",
        "framework": "FastAPI + OpenCV + SQLAlchemy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": "connected"
    }

@app.get("/api/model/status")
def get_model_status():
    return detector_adapter.get_status()

# ==========================================
# 2. Road Vision Lab: Real OpenCV Enhancement
# ==========================================
@app.post("/api/vision/enhance")
async def enhance_image(
    file: UploadFile = File(...),
    mode: str = Form("clahe"),
    contrast: float = Form(1.0),
    brightness: int = Form(0),
    gamma: float = Form(1.0),
    sharpen_intensity: float = Form(1.0),
):
    try:
        content = await file.read()
        res = RoadVisionLab.apply_pipeline(
            image_bytes=content,
            mode=mode,
            contrast=contrast,
            brightness=brightness,
            gamma=gamma,
            sharpen_intensity=sharpen_intensity,
        )
        return {"success": True, "data": res}
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Image enhancement error: {str(err)}")

# ==========================================
# 3. Image Damage Analysis & Reporting
# ==========================================
@app.post("/api/images/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    auto_save_report: bool = Form(False),
    city: str = Form("Indore"),
    address: str = Form(""),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        img_np = RoadVisionLab.read_image_from_bytes(content)
        
        # Save original file
        filename, original_url = RoadVisionLab.save_image_to_disk(img_np, prefix="orig")
        
        # Run Detection Adapter (Genuine inference or honest unconfigured status)
        inference = detector_adapter.infer(img_np)
        
        report_data = None
        if auto_save_report:
            rep_id = f"PRISM-{uuid.uuid4().hex[:6].upper()}"
            rep = Report(
                id=rep_id,
                report_number=f"PRISM-{datetime.datetime.utcnow().year}-{uuid.uuid4().hex[:4].upper()}",
                title=f"Road Defect Inspection - {city}",
                description=inference.get("explanation", ""),
                category="pothole" if inference.get("detected_count", 0) > 0 else "broken_surface",
                estimated_severity=inference.get("preliminary_severity", "moderate"),
                priority_score=inference.get("priority_score", 50),
                workflow_status="submitted",
                verification_status="pending",
                city=city,
                address=address or f"{city} Transport Corridor",
                latitude=latitude,
                longitude=longitude,
                original_image_url=original_url,
                model_name=inference.get("model_identifier", "YOLO Adapter"),
                model_confidence=inference.get("confidence_score"),
                detections_count=inference.get("detected_count", 0),
                is_demo=False
            )
            db.add(rep)
            
            # Save detections
            for d in inference.get("detections", []):
                det = Detection(
                    report_id=rep_id,
                    class_name=d.get("class_name", "pothole"),
                    confidence=d.get("confidence", 0.0),
                    x1=d.get("x1", 0.0),
                    y1=d.get("y1", 0.0),
                    x2=d.get("x2", 0.0),
                    y2=d.get("y2", 0.0),
                    apparent_area_pct=d.get("apparent_area_pct", 0.0)
                )
                db.add(det)
                
            db.commit()
            db.refresh(rep)
            report_data = {
                "id": rep.id,
                "report_number": rep.report_number,
                "workflow_status": rep.workflow_status
            }

        return {
            "success": True,
            "data": {
                "original_image_url": original_url,
                "inference": inference,
                "saved_report": report_data
            }
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Image analysis error: {str(err)}")

# ==========================================
# 4. Video Inspection Lab
# ==========================================
@app.post("/api/videos/analyze")
async def analyze_video(
    file: UploadFile = File(...),
    sampling_interval_sec: float = Form(1.0),
    max_duration_sec: float = Form(20.0),
):
    try:
        # Save temp video file
        temp_filename = f"vid_{uuid.uuid4().hex[:8]}_{file.filename}"
        temp_filepath = os.path.join(UPLOAD_DIR, temp_filename)
        
        content = await file.read()
        with open(temp_filepath, "wb") as f:
            f.write(content)

        results = RoadVideoProcessor.process_video(
            video_path=temp_filepath,
            sampling_interval_sec=sampling_interval_sec,
            max_duration_sec=max_duration_sec,
            run_detector=True
        )

        return {"success": True, "data": results}
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Video analysis error: {str(err)}")

# ==========================================
# 5. Report Management & Queries
# ==========================================
@app.get("/api/reports")
def list_reports(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    is_demo: Optional[bool] = Query(None),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    query = db.query(Report)
    if status and status != "all":
        query = query.filter(Report.workflow_status == status)
    if severity and severity != "all":
        query = query.filter(Report.estimated_severity == severity)
    if city and city != "all":
        query = query.filter(Report.city.ilike(f"%{city}%"))
    if is_demo is not None:
        query = query.filter(Report.is_demo == is_demo)

    reports = query.order_by(Report.created_at.desc()).limit(limit).all()

    items = []
    for r in reports:
        items.append({
            "id": r.id,
            "report_number": r.report_number,
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "estimated_severity": r.estimated_severity,
            "priority_score": r.priority_score,
            "workflow_status": r.workflow_status,
            "verification_status": r.verification_status,
            "city": r.city,
            "address": r.address,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "original_image_url": r.original_image_url,
            "detections_count": r.detections_count,
            "is_demo": r.is_demo,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return {"success": True, "count": len(items), "data": items}

@app.get("/api/reports/export")
def export_reports_csv(db: Session = Depends(get_db)):
    reports = db.query(Report).all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Report ID", "Report Number", "Title", "Category", "Severity", 
        "Priority Score", "Status", "Verification", "City", "Latitude", "Longitude", 
        "Detections Count", "Is Demo", "Submitted At"
    ])

    for r in reports:
        writer.writerow([
            r.id, r.report_number, r.title, r.category, r.estimated_severity,
            r.priority_score, r.workflow_status, r.verification_status,
            r.city, r.latitude or "", r.longitude or "", r.detections_count,
            r.is_demo, r.created_at.isoformat() if r.created_at else ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=prism_road_reports.csv"}
    )

@app.get("/api/reports/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "success": True,
        "data": {
            "id": r.id,
            "report_number": r.report_number,
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "estimated_severity": r.estimated_severity,
            "priority_score": r.priority_score,
            "workflow_status": r.workflow_status,
            "verification_status": r.verification_status,
            "city": r.city,
            "address": r.address,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "original_image_url": r.original_image_url,
            "annotated_image_url": r.annotated_image_url,
            "model_name": r.model_name,
            "model_confidence": r.model_confidence,
            "detections_count": r.detections_count,
            "is_demo": r.is_demo,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "detections": [
                {
                    "class_name": d.class_name,
                    "confidence": d.confidence,
                    "x1": d.x1, "y1": d.y1, "x2": d.x2, "y2": d.y2,
                    "apparent_area_pct": d.apparent_area_pct
                } for d in r.detections
            ],
            "reviews": [
                {
                    "reviewer_name": rev.reviewer_name,
                    "decision": rev.decision,
                    "notes": rev.notes,
                    "created_at": rev.created_at.isoformat() if rev.created_at else None
                } for rev in r.reviews
            ]
        }
    }

@app.post("/api/reports")
def create_report(payload: ReportCreatePayload, db: Session = Depends(get_db)):
    rep_id = f"PRISM-{uuid.uuid4().hex[:6].upper()}"
    rep = Report(
        id=rep_id,
        report_number=f"PRISM-{datetime.datetime.utcnow().year}-{uuid.uuid4().hex[:4].upper()}",
        title=payload.title,
        description=payload.description,
        category=payload.category,
        city=payload.city,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        original_image_url=payload.original_image_url,
        reporter_name=payload.reporter_name,
        reporter_email=payload.reporter_email,
        workflow_status="submitted",
        verification_status="pending",
        is_demo=False
    )
    db.add(rep)
    db.commit()
    db.refresh(rep)
    return {"success": True, "data": {"id": rep.id, "report_number": rep.report_number}}

@app.patch("/api/reports/{report_id}")
def update_report_status(report_id: str, payload: StatusUpdatePayload, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")

    if payload.workflow_status:
        r.workflow_status = payload.workflow_status
    if payload.verification_status:
        r.verification_status = payload.verification_status
    if payload.estimated_severity:
        r.estimated_severity = payload.estimated_severity

    if payload.review_notes:
        rev = Review(
            report_id=r.id,
            reviewer_name=payload.reviewer_name or "Inspector",
            decision=payload.workflow_status or "reviewed",
            notes=payload.review_notes
        )
        db.add(rev)

    db.commit()
    return {"success": True, "message": "Report status updated successfully."}

# ==========================================
# 6. Analytics & CSV Export
# ==========================================
@app.get("/api/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    total = db.query(Report).count()
    awaiting = db.query(Report).filter(Report.workflow_status.in_(["submitted", "awaiting_review"])).count()
    confirmed = db.query(Report).filter(Report.workflow_status.in_(["confirmed", "under_inspection", "maintenance_planned"])).count()
    resolved = db.query(Report).filter(Report.workflow_status == "resolved").count()
    high_priority = db.query(Report).filter(Report.priority_score >= 80).count()

    severities = {
        "high": db.query(Report).filter(Report.estimated_severity == "high").count(),
        "moderate": db.query(Report).filter(Report.estimated_severity == "moderate").count(),
        "low": db.query(Report).filter(Report.estimated_severity == "low").count(),
        "requires_inspection": db.query(Report).filter(Report.estimated_severity == "requires_inspection").count(),
    }

    categories = {
        "pothole": db.query(Report).filter(Report.category == "pothole").count(),
        "road_crack": db.query(Report).filter(Report.category == "road_crack").count(),
        "broken_surface": db.query(Report).filter(Report.category == "broken_surface").count(),
        "waterlogging": db.query(Report).filter(Report.category == "waterlogging").count(),
        "road_obstruction": db.query(Report).filter(Report.category == "road_obstruction").count(),
    }

    return {
        "success": True,
        "data": {
            "total_reports": total,
            "awaiting_inspection": awaiting,
            "confirmed_damage": confirmed,
            "resolved_reports": resolved,
            "high_priority_candidates": high_priority,
            "severity_distribution": severities,
            "category_distribution": categories
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
