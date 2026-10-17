import cv2
import numpy as np
import os
import uuid
import base64
from typing import Dict, Any, Tuple

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class RoadVisionLab:
    """
    OpenCV-powered Road Vision Lab for pavement inspection and damage visibility enhancement.
    Never claims that enhanced pixels confirm the presence or structural depth of damage.
    """

    @staticmethod
    def read_image_from_bytes(image_bytes: bytes) -> np.ndarray:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Unable to decode image bytes into valid OpenCV image.")
        return img

    @staticmethod
    def encode_image_to_base64(img: np.ndarray, format: str = ".jpg") -> str:
        success, encoded = cv2.imencode(format, img)
        if not success:
            raise ValueError("Failed to encode OpenCV image.")
        return base64.b64encode(encoded).decode("utf-8")

    @staticmethod
    def save_image_to_disk(img: np.ndarray, prefix: str = "enhanced") -> Tuple[str, str]:
        filename = f"{prefix}_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        cv2.imwrite(filepath, img)
        return filename, f"/uploads/{filename}"

    @classmethod
    def apply_pipeline(
        cls,
        image_bytes: bytes,
        mode: str = "clahe", # "original", "grayscale", "clahe", "gamma", "sharpen", "edges", "adaptive_thresh"
        contrast: float = 1.0, # 0.5 to 2.5
        brightness: int = 0, # -100 to 100
        gamma: float = 1.0, # 0.2 to 3.0
        sharpen_intensity: float = 1.0, # 0.0 to 2.5
        clip_limit: float = 2.5, # CLAHE clip limit
        tile_grid_size: int = 8
    ) -> Dict[str, Any]:
        img = cls.read_image_from_bytes(image_bytes)
        h, w, c = img.shape
        processed = img.copy()

        # Step 1: Brightness & Contrast adjustment
        if contrast != 1.0 or brightness != 0:
            processed = cv2.convertScaleAbs(processed, alpha=contrast, beta=brightness)

        # Step 2: Gamma Correction (LUT)
        if gamma != 1.0 and gamma > 0:
            inv_gamma = 1.0 / gamma
            table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
            processed = cv2.LUT(processed, table)

        # Step 3: Specific Mode Operations
        active_operation = mode.lower()

        if active_operation == "grayscale":
            gray = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
            processed = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

        elif active_operation == "clahe":
            # Convert to LAB color space for luminance-only histogram equalization
            lab = cv2.cvtColor(processed, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_grid_size, tile_grid_size))
            cl = clahe.apply(l)
            limg = cv2.merge((cl, a, b))
            processed = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

        elif active_operation == "sharpen":
            # Custom 2D convolution sharpening kernel
            if sharpen_intensity > 0:
                kernel = np.array([
                    [0, -1 * sharpen_intensity, 0],
                    [-1 * sharpen_intensity, 1 + 4 * sharpen_intensity, -1 * sharpen_intensity],
                    [0, -1 * sharpen_intensity, 0]
                ], dtype=np.float32)
                processed = cv2.filter2D(processed, -1, kernel)

        elif active_operation == "edges":
            # Canny edge detection on blurred luminance
            gray = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, 50, 150)
            # Create a cyan-highlighted edge overlay on dark road surface
            edge_colored = np.zeros_like(processed)
            edge_colored[edges > 0] = [238, 211, 34] # BGR for cyan #22D3EE
            processed = cv2.addWeighted(processed, 0.4, edge_colored, 0.9, 0)

        elif active_operation == "adaptive_thresh":
            # Useful for highlighting cavitation boundaries
            gray = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
            blurred = cv2.medianBlur(gray, 5)
            thresh = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            processed = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)

        # Save processed copy to disk for download & permanent preview
        filename, file_url = cls.save_image_to_disk(processed, prefix=f"lab_{mode}")
        b64_data = cls.encode_image_to_base64(processed)

        return {
            "mode": mode,
            "dimensions": {"width": w, "height": h, "channels": c},
            "parameters": {
                "contrast": contrast,
                "brightness": brightness,
                "gamma": gamma,
                "sharpen_intensity": sharpen_intensity,
                "clip_limit": clip_limit,
            },
            "file_url": file_url,
            "base64_data": f"data:image/jpeg;base64,{b64_data}",
            "disclaimer": (
                "Image enhancement improves visual inspection contrast but does NOT confirm "
                "the presence, physical depth, or structural severity of road damage."
            )
        }
