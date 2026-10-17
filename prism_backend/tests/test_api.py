import sys
import os
import io
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from main import app

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
    assert data["model_configured"] is False
    assert "AI model not configured" in data["status"]
    assert "colab_instructions" in data
    assert "roboflow_compatibility" in data

def test_vision_lab_enhancement():
    image_bytes = create_dummy_image_bytes()
    # Test CLAHE mode
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

def test_image_analysis_without_model():
    image_bytes = create_dummy_image_bytes()
    response = client.post(
        "/api/images/analyze",
        files={"file": ("pothole.jpg", image_bytes, "image/jpeg")},
        data={"auto_save_report": "true", "city": "Indore", "address": "AB Road Bypass"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    inference = body["data"]["inference"]
    # When no model is configured, it must honestly say model_not_configured
    assert inference["inference_status"] == "model_not_configured"
    assert inference["detected_count"] == 0
    assert len(inference["detections"]) == 0
    # Must save report when requested
    assert body["data"]["saved_report"] is not None
    assert body["data"]["saved_report"]["id"].startswith("PRISM-")

def test_get_reports_and_filters():
    response = client.get("/api/reports")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    reports = body["data"]
    assert isinstance(reports, list)
    assert len(reports) > 0

    # Test filtering by is_demo
    resp_demo = client.get("/api/reports?is_demo=true")
    assert resp_demo.status_code == 200
    demo_reports = resp_demo.json()["data"]
    assert len(demo_reports) > 0
    assert all(r["is_demo"] is True for r in demo_reports)

def test_analytics_summary():
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    summary = body["data"]
    assert "total_reports" in summary
    assert "awaiting_inspection" in summary
    assert "confirmed_damage" in summary
    assert "resolved_reports" in summary
    assert "severity_distribution" in summary

def test_csv_export():
    response = client.get("/api/reports/export")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "Report ID,Report Number,Title" in response.text
