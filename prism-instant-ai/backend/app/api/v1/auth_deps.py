from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.security import security_scheme, decode_access_token, ROLE_ADMIN, ROLE_AUTHORITY, ROLE_USER
from app.database.session import get_db
from app.database.models import User, UserRole, AuthorityProfile

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Extracts and verifies JWT bearer token, loading the active User record from database."""
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_role(allowed_roles: List[str]):
    """Enforces server-side role validation against the database records."""
    def _role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        user_roles = [r.role_name for r in current_user.roles]
        
        # Admin has superuser access across endpoints
        if ROLE_ADMIN in user_roles:
            return current_user

        has_role = any(r in user_roles for r in allowed_roles)
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Insufficient privileges. Required one of: {allowed_roles}"
            )
        
        # If accessing as AUTHORITY, enforce verified approval check
        if ROLE_AUTHORITY in allowed_roles and ROLE_AUTHORITY in user_roles:
            prof = db.query(AuthorityProfile).filter(AuthorityProfile.user_id == current_user.id).first()
            if not prof or prof.verification_status != "APPROVED":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Authority account verification is pending administrator review and approval."
                )
                
        return current_user
    return _role_checker

require_admin = require_role([ROLE_ADMIN])
require_authority = require_role([ROLE_AUTHORITY])
require_user = require_role([ROLE_USER, ROLE_AUTHORITY, ROLE_ADMIN])
