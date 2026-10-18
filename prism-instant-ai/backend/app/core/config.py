import os
from typing import List

class Settings:
    PROJECT_NAME: str = "PRISM INSTANT AI"
    VERSION: str = "2.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Security & Tokens
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "prism_instant_ai_super_secret_jwt_key_2026_change_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours

    # Bootstrap Token for safe Admin initial creation
    BOOTSTRAP_ADMIN_KEY: str = os.getenv("BOOTSTRAP_ADMIN_KEY", "PRISM_ADMIN_BOOTSTRAP_INIT_KEY_2026")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./instant_ai.db")

    # Storage Paths (Private by default, never exposed as unauthenticated static files)
    BASE_STORAGE_PATH: str = os.getenv("STORAGE_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage/private")))
    MAX_IMAGE_SIZE_BYTES: int = 20 * 1024 * 1024 # 20 MB
    MAX_VIDEO_SIZE_BYTES: int = 150 * 1024 * 1024 # 150 MB

    # Model Configuration
    MODEL_PATH: str = os.getenv("POTHOLE_MODEL_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../prism_backend/models/best.pt")))
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))

    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]

settings = Settings()
