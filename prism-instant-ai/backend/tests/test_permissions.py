import os
import sys
import io
from PIL import Image
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)

def get_auth_token(email: str, password: str = "TestPass123!", role_req: bool = False) -> str:
    # Try login first
    l_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    if l_res.status_code == 200:
        return l_res.json()["data"]["access_token"]
    # Register if not exists
    r_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "full_name": email.split('@')[0],
        "request_authority": role_req
    })
    return r_res.json()["data"]["access_token"]

def create_dummy_jpeg() -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (300, 300), color=(100, 150, 200))
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_user_a_vs_user_b_scan_isolation():
    token_a = get_auth_token("citizen_user_a@roadvanta.org")
    token_b = get_auth_token("citizen_user_b@roadvanta.org")

    # User A creates a scan
    img_bytes = create_dummy_jpeg()
    scan_res = client.post(
        "/api/v1/scans/image",
        headers={"Authorization": f"Bearer {token_a}"},
        files={"file": ("pothole_a.jpg", img_bytes, "image/jpeg")}
    )
    assert scan_res.status_code == 200
    scan_id = scan_res.json()["data"]["scan_id"]

    # User B attempts to access User A's scan
    b_res = client.get(
        f"/api/v1/scans/{scan_id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    # Security Rule: User B must be strictly forbidden from accessing User A's scan
    assert b_res.status_code == 403
    assert "Forbidden" in b_res.json()["detail"]

    # User B attempts to download User A's evidence
    b_ev_res = client.get(
        f"/api/v1/scans/{scan_id}/evidence",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert b_ev_res.status_code == 403

def test_user_a_vs_user_b_pdf_download_protection():
    token_a = get_auth_token("citizen_user_a@roadvanta.org")
    token_b = get_auth_token("citizen_user_b@roadvanta.org")

    # User A creates a report
    rep_res = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"title": "Severe Crater on NH-52", "city": "Indore", "damage_severity": "HIGH"}
    )
    assert rep_res.status_code == 201
    report_id = rep_res.json()["data"]["id"]

    # User B attempts to download User A's PDF
    b_pdf_res = client.get(
        f"/api/v1/reports/{report_id}/pdf",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    # Security Rule: User B must be rejected with 403 Forbidden
    assert b_pdf_res.status_code == 403
    assert "not authorized to download" in b_pdf_res.json()["detail"]

    # User A can successfully download their own PDF
    a_pdf_res = client.get(
        f"/api/v1/reports/{report_id}/pdf",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert a_pdf_res.status_code == 200
    assert a_pdf_res.headers["content-type"] == "application/pdf"
    assert a_pdf_res.content.startswith(b"%PDF-")

def test_normal_user_blocked_from_admin_endpoints():
    token_normal = get_auth_token("citizen_user_b@roadvanta.org")
    
    res = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token_normal}"}
    )
    assert res.status_code == 403
    assert "Insufficient privileges" in res.json()["detail"]

def test_unverified_authority_blocked_from_authority_routes():
    # User registering with pending authority profile
    token_pending_auth = get_auth_token("pending_official@roadvanta.org", role_req=True)

    res = client.get(
        "/api/v1/authority/assigned-reports",
        headers={"Authorization": f"Bearer {token_pending_auth}"}
    )
    assert res.status_code == 403
    assert "Insufficient privileges" in res.json()["detail"] or "pending administrator review" in res.json()["detail"]
