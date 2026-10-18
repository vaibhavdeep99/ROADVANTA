from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    hash_password, verify_password, create_access_token, check_rate_limit,
    ROLE_USER, ROLE_ADMIN, ROLE_AUTHORITY
)
from app.database.session import get_db
from app.database.models import User, UserRole, AuthorityProfile
from app.services.audit import log_audit_event
from app.api.v1.auth_deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & Roles"])

# Schemas
class RegisterPayload(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=6, max_length=72)
    full_name: str = Field(min_length=2, max_length=150)
    request_authority: Optional[bool] = False
    organization: Optional[str] = "Public Works Department"
    department: Optional[str] = "Road Maintenance"
    jurisdiction: Optional[str] = "Municipal District"
    badge_number: Optional[str] = None

class LoginPayload(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str

class BootstrapAdminPayload(BaseModel):
    bootstrap_key: str
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8)
    full_name: str = "System Administrator"

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    roles: List[str]
    full_name: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterPayload, request: Request, db: Session = Depends(get_db)):
    # Rate limit registration attempts per client IP
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(f"reg_{client_ip}", max_requests=10, window_seconds=60)

    # Check for existing email
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address is already registered."
        )

    # Security Rule: Public registration always assigns standard USER role
    hashed_pwd = hash_password(payload.password)
    user = User(
        email=payload.email.lower().strip(),
        password_hash=hashed_pwd,
        full_name=payload.full_name.strip(),
        is_active=True
    )
    db.add(user)
    db.flush()

    # Assign default USER role
    user_role = UserRole(user_id=user.id, role_name=ROLE_USER)
    db.add(user_role)

    # If authority requested, create pending profile
    if payload.request_authority:
        auth_profile = AuthorityProfile(
            user_id=user.id,
            organization=payload.organization or "Public Works Department",
            department=payload.department or "Road Maintenance",
            jurisdiction=payload.jurisdiction or "Municipal District",
            badge_number=payload.badge_number,
            verification_status="PENDING"
        )
        db.add(auth_profile)

    db.commit()

    log_audit_event(
        db,
        action="USER_REGISTERED",
        actor_id=user.id,
        target_type="User",
        target_id=user.id,
        safe_metadata={"email": user.email, "requested_authority": payload.request_authority},
        ip_address=client_ip
    )

    token = create_access_token(subject=user.id, role=ROLE_USER, email=user.email)
    return {
        "success": True,
        "message": "Account registered successfully.",
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
            "roles": [ROLE_USER],
            "full_name": user.full_name,
            "authority_pending": payload.request_authority
        }
    }

@router.post("/login")
def login(payload: LoginPayload, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(f"login_{client_ip}_{payload.email}", max_requests=10, window_seconds=60)

    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        log_audit_event(
            db,
            action="LOGIN_FAILED",
            safe_metadata={"attempted_email": payload.email.lower().strip()},
            ip_address=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password combination."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended. Please contact the administrator."
        )

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    roles = [r.role_name for r in user.roles]
    primary_role = ROLE_ADMIN if ROLE_ADMIN in roles else (ROLE_AUTHORITY if ROLE_AUTHORITY in roles else ROLE_USER)
    token = create_access_token(subject=user.id, role=primary_role, email=user.email)

    log_audit_event(
        db,
        action="LOGIN_SUCCESS",
        actor_id=user.id,
        target_type="User",
        target_id=user.id,
        safe_metadata={"primary_role": primary_role},
        ip_address=client_ip
    )

    return {
        "success": True,
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
            "roles": roles,
            "primary_role": primary_role,
            "full_name": user.full_name,
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roles = [r.role_name for r in current_user.roles]
    auth_profile = db.query(AuthorityProfile).filter(AuthorityProfile.user_id == current_user.id).first()
    
    return {
        "success": True,
        "data": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "roles": roles,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "authority_profile": {
                "organization": auth_profile.organization,
                "department": auth_profile.department,
                "jurisdiction": auth_profile.jurisdiction,
                "verification_status": auth_profile.verification_status,
                "badge_number": auth_profile.badge_number,
            } if auth_profile else None
        }
    }

@router.post("/bootstrap-admin")
def bootstrap_admin(payload: BootstrapAdminPayload, request: Request, db: Session = Depends(get_db)):
    """
    Secure bootstrap endpoint to initialize the primary Admin user using deployment-time secret.
    Does not ship public default credentials in source code.
    """
    client_ip = request.client.host if request.client else "unknown"
    if payload.bootstrap_key != settings.BOOTSTRAP_ADMIN_KEY:
        log_audit_event(
            db,
            action="BOOTSTRAP_ADMIN_UNAUTHORIZED_ATTEMPT",
            ip_address=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid bootstrap key."
        )

    # Check if user already exists
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user:
        user = User(
            email=payload.email.lower().strip(),
            password_hash=hash_password(payload.password),
            full_name=payload.full_name,
            is_active=True
        )
        db.add(user)
        db.flush()

    # Ensure user has ADMIN and USER roles
    existing_roles = {r.role_name for r in user.roles}
    for r_name in [ROLE_USER, ROLE_ADMIN]:
        if r_name not in existing_roles:
            db.add(UserRole(user_id=user.id, role_name=r_name))

    db.commit()

    log_audit_event(
        db,
        action="ADMIN_BOOTSTRAPPED",
        actor_id=user.id,
        target_type="User",
        target_id=user.id,
        safe_metadata={"email": user.email},
        ip_address=client_ip
    )

    token = create_access_token(subject=user.id, role=ROLE_ADMIN, email=user.email)
    return {
        "success": True,
        "message": "Administrator account provisioned successfully.",
        "data": {
            "access_token": token,
            "user_id": user.id,
            "email": user.email,
            "roles": [ROLE_USER, ROLE_ADMIN]
        }
    }
