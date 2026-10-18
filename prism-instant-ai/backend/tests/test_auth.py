import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from app.core.config import settings

client = TestClient(app)

def test_public_registration_assigns_user_role_only():
    email = "citizen_test_user@roadvanta.org"
    res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Citizen Ramesh",
        "role": "ADMIN" # Attempting to tamper role in payload
    })
    assert res.status_code == 201
    data = res.json()["data"]
    # Security Rule: Role must strictly be USER, never elevated by request payload
    assert data["roles"] == ["USER"]
    assert "access_token" in data

def test_duplicate_email_registration_blocked():
    email = "citizen_test_user@roadvanta.org"
    res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Duplicate Submitter"
    })
    assert res.status_code == 409
    assert "already registered" in res.json()["detail"]

def test_login_success_and_jwt_issuance():
    email = "citizen_test_user@roadvanta.org"
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    assert res.status_code == 200
    data = res.json()["data"]
    assert "access_token" in data
    assert data["primary_role"] == "USER"

def test_login_invalid_password_rejected():
    email = "citizen_test_user@roadvanta.org"
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "WrongPassword999"
    })
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

def test_bootstrap_admin_with_valid_key():
    admin_email = "super_admin_verified@roadvanta.org"
    res = client.post("/api/v1/auth/bootstrap-admin", json={
        "bootstrap_key": settings.BOOTSTRAP_ADMIN_KEY,
        "email": admin_email,
        "password": "AdminStrongPassword2026!",
        "full_name": "Lead System Administrator"
    })
    assert res.status_code == 200
    data = res.json()["data"]
    assert "ADMIN" in data["roles"]
    assert "access_token" in data

def test_bootstrap_admin_with_invalid_key_rejected():
    res = client.post("/api/v1/auth/bootstrap-admin", json={
        "bootstrap_key": "FORGED_KEY_12345",
        "email": "hacker@evil.org",
        "password": "HackerPassword!"
    })
    assert res.status_code == 403
    assert "Invalid bootstrap key" in res.json()["detail"]
