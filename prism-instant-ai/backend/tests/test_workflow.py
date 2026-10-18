import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from app.core.config import settings

client = TestClient(app)

def get_admin_token() -> str:
    res = client.post("/api/v1/auth/bootstrap-admin", json={
        "bootstrap_key": settings.BOOTSTRAP_ADMIN_KEY,
        "email": "workflow_admin@roadvanta.org",
        "password": "AdminPassword123!",
        "full_name": "Workflow Admin"
    })
    return res.json()["data"]["access_token"]

def test_full_workflow_state_machine_and_validation():
    admin_token = get_admin_token()

    # 1. Create Report (Initial state: SUBMITTED)
    create_res = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Corridor Hazard on MR-10",
            "city": "Indore",
            "damage_severity": "HIGH",
            "priority_score": 75
        }
    )
    assert create_res.status_code == 201
    report_id = create_res.json()["data"]["id"]
    assert create_res.json()["data"]["workflow_status"] == "SUBMITTED"

    # 2. Illegal transition: Trying to jump directly SUBMITTED -> RESOLVED must fail
    illegal_res = client.post(
        f"/api/v1/reports/{report_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"new_status": "RESOLVED"}
    )
    assert illegal_res.status_code == 400
    assert "Illegal transition" in illegal_res.json()["detail"]

    # 3. Valid transition 1: SUBMITTED -> UNDER_INSPECTION
    res_1 = client.post(
        f"/api/v1/reports/{report_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"new_status": "UNDER_INSPECTION", "reason": "Dispatched field engineer."}
    )
    assert res_1.status_code == 200
    assert res_1.json()["data"]["workflow_status"] == "UNDER_INSPECTION"

    # 4. Valid transition 2: UNDER_INSPECTION -> CONFIRMED
    res_2 = client.post(
        f"/api/v1/reports/{report_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"new_status": "CONFIRMED", "reason": "Pavement core defect confirmed."}
    )
    assert res_2.status_code == 200
    assert res_2.json()["data"]["workflow_status"] == "CONFIRMED"

    # 5. Valid transition 3: CONFIRMED -> IN_REPAIR
    res_3 = client.post(
        f"/api/v1/reports/{report_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"new_status": "IN_REPAIR", "reason": "Asphalt patch crew on site."}
    )
    assert res_3.status_code == 200
    assert res_3.json()["data"]["workflow_status"] == "IN_REPAIR"

    # 6. RESOLVED without repair evidence must fail
    res_no_ev = client.post(
        f"/api/v1/reports/{report_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"new_status": "RESOLVED", "reason": "Patch completed."}
    )
    assert res_no_ev.status_code == 400
    assert "photographic repair proof evidence" in res_no_ev.json()["detail"]

    # 7. Valid transition 4: IN_REPAIR -> RESOLVED with evidence
    res_4 = client.post(
        f"/api/v1/reports/{report_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "new_status": "RESOLVED",
            "repair_evidence_key": "repair_sample_key.jpg",
            "reason": "Compacted vibratory cold-mix asphalt completed."
        }
    )
    assert res_4.status_code == 200
    assert res_4.json()["data"]["workflow_status"] == "RESOLVED"

    # 8. Check Status History immutability
    rep_details = client.get(f"/api/v1/reports/{report_id}")
    assert rep_details.status_code == 200
    history = rep_details.json()["data"]["status_history"]
    # Must record: SUBMITTED -> UNDER_INSPECTION -> CONFIRMED -> IN_REPAIR -> RESOLVED
    assert len(history) >= 5
    statuses = [h["new_status"] for h in history]
    assert "SUBMITTED" in statuses
    assert "UNDER_INSPECTION" in statuses
    assert "CONFIRMED" in statuses
    assert "IN_REPAIR" in statuses
    assert "RESOLVED" in statuses
