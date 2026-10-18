import sys
import os
import io
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from fastapi.testclient import TestClient
from main import app
from data.pipeline_rdd2022 import RDD2022Pipeline

client = TestClient(app)

def create_dummy_image_bytes():
    file = io.BytesIO()
    image = Image.new("RGB", (200, 200), color=(128, 128, 128))
    image.save(file, format="JPEG")
    file.seek(0)
    return file.getvalue()

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "PRISM ROAD AI" in data["service"]

def test_model_status_endpoint():
    response = client.get("/api/model/status")
    assert response.status_code == 200
    data = response.json()
    assert "model_configured" in data
    assert "status" in data
    assert "colab_instructions" in data
    assert "roboflow_compatibility" in data

def test_vision_lab_enhancement():
    image_bytes = create_dummy_image_bytes()
    response = client.post(
        "/api/vision/enhance",
        files={"file": ("test_road.jpg", image_bytes, "image/jpeg")},
        data={"mode": "clahe", "contrast": 1.2, "brightness": 5, "gamma": 1.0, "sharpen_intensity": 1.0}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    res = body["data"]
    assert res["mode"] == "clahe"
    assert "base64_data" in res
    assert res["base64_data"].startswith("data:image/jpeg;base64,")
    assert "disclaimer" in res

def test_image_analysis_endpoint():
    image_bytes = create_dummy_image_bytes()
    response = client.post(
        "/api/images/analyze",
        files={"file": ("pothole.jpg", image_bytes, "image/jpeg")},
        data={"auto_save_report": "true", "city": "Indore", "address": "AB Road Bypass"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "inference" in body["data"]
    assert body["data"]["saved_report"] is not None
    assert body["data"]["saved_report"]["id"].startswith("PRISM-")

def test_dataset_status_endpoint():
    response = client.get("/api/dataset/status")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    rdd = body["data"]["rdd2022"]
    assert "RDD2022" in rdd["name"]
    assert "D40" in rdd["classes"]
    assert rdd["classes"]["D40"] == "Pothole"

def test_official_accident_stats_endpoint():
    response = client.get("/api/analytics/official-accidents")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert "national_totals" in data
    assert data["national_totals"]["2022"]["accidents"] == 4446
    assert data["national_totals"]["2022"]["fatalities"] == 1856
    assert len(data["state_rankings"]) > 0
    # Top state is Uttar Pradesh
    assert data["state_rankings"][0]["state"] == "Uttar Pradesh"

def test_traffic_status_guardrail():
    response = client.get("/api/traffic/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Not configured"
    assert "Traffic obstruction detection is not configured" in data["message"]

def test_ai_inspection_verification_agent():
    response = client.post(
        "/api/inspection/verify-defect",
        json={
            "detected_count": 2,
            "max_confidence": 0.72,
            "apparent_area_pct": 18.5,
            "notes": "NH-27 highway approach"
        }
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert "CONFIRMED" in data["verification_verdict"]
    assert "Public Works Department" in data["assigned_department"]
    assert "recommended_repair" in data

def test_rdd2022_voc_xml_parser():
    sample_xml = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/sample/India_001_pothole_crater.xml"))
    if os.path.exists(sample_xml):
        parsed = RDD2022Pipeline.parse_voc_xml(sample_xml)
        assert parsed["objects_count"] >= 1
        assert parsed["objects"][0]["class_code"] == "D40"
        assert parsed["objects"][0]["class_name"] == "Pothole"
        # Bounding box coordinates normalized between 0 and 1
        box = parsed["objects"][0]["box_yolo_normalized"]
        assert len(box) == 4
        assert all(0.0 <= val <= 1.0 for val in box)

def test_pdf_report_generation():
    # 1. Fetch available reports to get an ID
    res = client.get("/api/reports")
    assert res.status_code == 200
    reports = res.json()["data"]
    assert len(reports) > 0
    test_id = reports[0]["id"]

    # 2. Request PDF binary stream
    pdf_res = client.get(f"/api/reports/{test_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in pdf_res.headers["content-disposition"]
    # PDF magic bytes "%PDF-"
    assert pdf_res.content.startswith(b"%PDF-")
    assert len(pdf_res.content) > 1000
