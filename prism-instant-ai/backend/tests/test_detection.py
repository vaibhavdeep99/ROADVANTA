import os
import sys
import io
from PIL import Image
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from app.ml.detector import detector_engine

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/v1/auth/login", json={"email": "citizen_test_user@roadvanta.org", "password": "Password123!"})
    if res.status_code == 200:
        return res.json()["data"]["access_token"]
    res = client.post("/api/v1/auth/register", json={
        "email": "citizen_test_user@roadvanta.org", "password": "Password123!", "full_name": "Test User"
    })
    return res.json()["data"]["access_token"]

def test_model_status_endpoint():
    res = client.get("/api/readiness")
    assert res.status_code == 200
    data = res.json()
    assert "model_engine" in data
    assert data["database_connected"] is True

def test_real_model_inference_on_known_pothole_image():
    """
    Runs actual inference on the real test image 'sample_pothole_nh27.jpg'
    using the configured trained YOLO model.
    """
    token = get_auth_token()
    sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../client/public/samples/sample_pothole_nh27.jpg"))
    if not os.path.exists(sample_path):
        pytest.skip("Sample pothole image not found on disk")

    with open(sample_path, "rb") as f:
        img_bytes = f.read()

    res = client.post(
        "/api/v1/scans/image",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("sample_pothole_nh27.jpg", img_bytes, "image/jpeg")}
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]

    # Verify authentic inference output
    assert data["status"] == "COMPLETED"
    assert data["detected_count"] >= 1
    assert data["confidence_score"] is not None
    assert data["confidence_score"] > 0.35
    assert len(data["detections"]) == data["detected_count"]
    
    # Check bounding box validity
    box = data["detections"][0]["bounding_box"]
    assert box["x2"] > box["x1"]
    assert box["y2"] > box["y1"]
    assert data["inference_duration_ms"] > 0.0

def test_zero_detections_on_clear_road_surface():
    """
    Verifies that a clear road image produces an honest 0-detection result
    without raising an error or fabricating defects.
    """
    token = get_auth_token()
    sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../client/public/samples/sample_clear_road.jpg"))
    if not os.path.exists(sample_path):
        pytest.skip("Sample clear road image not found on disk")

    with open(sample_path, "rb") as f:
        img_bytes = f.read()

    res = client.post(
        "/api/v1/scans/image",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("sample_clear_road.jpg", img_bytes, "image/jpeg")}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "COMPLETED"
    assert data["detected_count"] == 0
    assert data["preliminary_severity"] == "LOW"
    assert len(data["detections"]) == 0

def test_corrupt_image_upload_rejected():
    token = get_auth_token()
    corrupt_bytes = b"NOT_A_VALID_JPEG_HEADER_CORRUPTED_FILE_DATA_9999"

    res = client.post(
        "/api/v1/scans/image",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("broken.jpg", corrupt_bytes, "image/jpeg")}
    )
    assert res.status_code == 400
    assert "Corrupt" in res.json()["detail"] or "rejected" in res.json()["detail"]
