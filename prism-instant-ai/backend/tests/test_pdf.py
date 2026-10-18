import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from app.services.pdf_service import pdf_service

client = TestClient(app)

def test_pdf_service_direct_generation():
    report_data = {
        "reference_id": "PRISM-2026-UNIT",
        "title": "Severe Pothole Cluster",
        "damage_severity": "CRITICAL",
        "workflow_status": "CONFIRMED",
        "priority_score": 88,
        "city": "Indore",
        "address": "Ring Road Sector 4",
        "latitude": 22.7533,
        "longitude": 75.8937,
        "owner_email": "engineer@roadvanta.org",
        "created_at": "2026-10-18T10:00:00"
    }
    detections = [
        {"class_name": "pothole", "confidence": 0.82, "apparent_area_pct": 14.5},
        {"class_name": "pothole", "confidence": 0.69, "apparent_area_pct": 8.2}
    ]
    status_history = [
        {"previous_status": "NONE", "new_status": "SUBMITTED", "changed_by": "Citizen", "reason": "Initial report", "timestamp": "2026-10-18T10:00:00"},
        {"previous_status": "SUBMITTED", "new_status": "CONFIRMED", "changed_by": "Inspector", "reason": "Severe core damage confirmed", "timestamp": "2026-10-18T11:00:00"}
    ]

    pdf_bytes = pdf_service.generate_pdf(report_data, detections, status_history)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 2000
    assert pdf_bytes.startswith(b"%PDF-")
