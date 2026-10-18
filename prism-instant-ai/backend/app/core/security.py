import time
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

# Explicit Role Constants
ROLE_USER = "USER"
ROLE_ADMIN = "ADMIN"
ROLE_AUTHORITY = "AUTHORITY"
ALLOWED_ROLES = [ROLE_USER, ROLE_ADMIN, ROLE_AUTHORITY]

security_scheme = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    pw_bytes = password.encode('utf-8')[:72] # Bcrypt standard 72-byte safe limit
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against bcrypt hash."""
    try:
        pw_bytes = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(pw_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(subject: str, role: str, email: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generate short-lived signed JWT access token containing subject, email, and role."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": subject,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

# In-Memory Rate Limiter for Login/Register (sliding window)
_rate_limits: Dict[str, list] = {}

def check_rate_limit(key: str, max_requests: int = 15, window_seconds: int = 60):
    """Enforces rate limiting to protect authentication endpoints against brute force."""
    now = time.time()
    timestamps = _rate_limits.get(key, [])
    # Filter within window
    timestamps = [t for t in timestamps if now - t < window_seconds]
    if len(timestamps) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait before retrying."
        )
    timestamps.append(now)
    _rate_limits[key] = timestamps
