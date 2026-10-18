import os
import uuid
import hashlib
from typing import Tuple
from PIL import Image
from fastapi import HTTPException, status
from app.core.config import settings

# Enforce decompression bomb safeguards
Image.MAX_IMAGE_PIXELS = 50_000_000

class PrivateStorageService:
    def __init__(self):
        self.base_dir = os.path.abspath(settings.BASE_STORAGE_PATH)
        self.evidence_dir = os.path.join(self.base_dir, "evidence")
        self.reports_dir = os.path.join(self.base_dir, "reports")
        self.frames_dir = os.path.join(self.base_dir, "frames")

        for d in [self.evidence_dir, self.reports_dir, self.frames_dir]:
            os.makedirs(d, exist_ok=True)

    def _safe_resolve(self, storage_key: str, subfolder: str = "evidence") -> str:
        """Prevent path traversal by verifying that the resolved path is strictly within the allowed directory."""
        clean_name = os.path.basename(storage_key.replace("\\", "/"))
        target_dir = os.path.join(self.base_dir, subfolder)
        resolved = os.path.abspath(os.path.join(target_dir, clean_name))
        if not resolved.startswith(os.path.abspath(target_dir)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security violation: Illegal file path traversal attempt."
            )
        return resolved

    def save_bytes(self, data: bytes, ext: str = ".jpg", subfolder: str = "evidence") -> Tuple[str, str, int]:
        """Saves binary data into secure private storage under a randomly generated UUID. Returns (storage_key, sha256_checksum, size_bytes)."""
        file_id = f"{uuid.uuid4().hex}{ext}"
        target_path = self._safe_resolve(file_id, subfolder)
        
        with open(target_path, "wb") as f:
            f.write(data)

        checksum = hashlib.sha256(data).hexdigest()
        size_bytes = len(data)
        return file_id, checksum, size_bytes

    def get_path(self, storage_key: str, subfolder: str = "evidence") -> str:
        """Returns the absolute filesystem path for an authorized request."""
        target_path = self._safe_resolve(storage_key, subfolder)
        if not os.path.exists(target_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Evidence or document file '{storage_key}' not found in private storage."
            )
        return target_path

    def validate_and_load_image(self, data: bytes) -> Image.Image:
        """Safely verifies image headers, format, and dimension limits against decompression attacks."""
        import io
        if len(data) > settings.MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Uploaded image exceeds maximum permitted size of {settings.MAX_IMAGE_SIZE_BYTES // (1024*1024)} MB."
            )
        try:
            img = Image.open(io.BytesIO(data))
            img.verify() # Validate integrity of header and payload
            # Reopen because verify() closes the stream
            img = Image.open(io.BytesIO(data))
            if img.format not in ["JPEG", "PNG", "WEBP"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported image format '{img.format}'. Allowed formats: JPEG, PNG, WEBP."
                )
            return img.convert("RGB")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Corrupt, invalid, or malicious image file rejected."
            )

storage_service = PrivateStorageService()
