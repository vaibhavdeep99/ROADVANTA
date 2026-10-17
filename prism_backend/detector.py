import os
import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

class PotholeDetectorAdapter:
    """
    Configurable Pothole Object Detection Inference Adapter.
    Compatible with YOLOv8/v9/v11 models exported from Google Colab or Roboflow.
    If no trained model is configured, clearly indicates 'AI model not configured'
    rather than inventing detections or confidence scores.
    """

    def __init__(self):
        self.model_path = os.getenv("POTHOLE_MODEL_PATH", "")
        self.conf_threshold = float(os.getenv("POTHOLE_CONFIDENCE_THRESHOLD", "0.25"))
        self._model = None
        self._load_model_if_present()

    def _find_or_fetch_model(self) -> str:
        if self.model_path and os.path.exists(self.model_path):
            return self.model_path
        
        candidates = [
            "prism_backend/models/best.pt",
            "models/best.pt",
            "prism_backend/models/best.onnx",
            "models/best.onnx"
        ]
        for c in candidates:
            if os.path.exists(c):
                return c

        # Auto-fetch pre-trained pothole YOLO weights from Hugging Face if missing
        try:
            target_dir = "models" if os.path.exists("main.py") else "prism_backend/models"
            os.makedirs(target_dir, exist_ok=True)
            target_file = os.path.join(target_dir, "best.pt")
            if not os.path.exists(target_file):
                import urllib.request
                print(f"[MODEL] Fetching trained YOLOv8 pothole weights from Hugging Face...")
                urllib.request.urlretrieve(
                    "https://huggingface.co/peterhdd/pothole-detection-yolov8/resolve/main/best.pt",
                    target_file
                )
                print(f"[MODEL] Pre-trained weights ready at: {target_file}")
            return target_file
        except Exception as e:
            print(f"[MODEL] Model download skipped: {e}")
            return ""

    def _load_model_if_present(self):
        model_file = self._find_or_fetch_model()
        if model_file and os.path.exists(model_file):
            self.model_path = model_file
            try:
                from ultralytics import YOLO
                self._model = YOLO(self.model_path)
                print(f"[MODEL] Successfully loaded trained pothole detector: {self.model_path}")
            except Exception as e:
                print(f"[MODEL] Warning: Model present at {self.model_path} but could not be loaded: {e}")
                self._model = None
        else:
            self._model = None

    def get_status(self) -> Dict[str, Any]:
        configured = self._model is not None
        return {
            "model_configured": configured,
            "status": "Trained YOLO Model Active" if configured else "AI model not configured",
            "model_path": self.model_path or "Not configured",
            "confidence_threshold": self.conf_threshold,
            "supported_architectures": ["YOLOv8 (.pt)", "YOLOv9 (.pt)", "YOLOv11 (.pt)", "ONNX"],
            "training_pipeline_compatibility": ["Google Colab", "Roboflow Universe Pothole Dataset"],
            "colab_instructions": (
                "Train a YOLOv8 pothole detector in Google Colab using a Roboflow dataset. "
                "Download best.pt, place it in the prism_backend/models/ directory, and set "
                "POTHOLE_MODEL_PATH=./models/best.pt in your environment."
            ),
            "roboflow_compatibility": (
                "Supports standard YOLO format exported from Roboflow pothole detection projects. "
                "Classes expected: ['pothole'] or ['pothole', 'crack', 'alligator_crack']."
            ),
            "instructions": (
                "Train a YOLOv8 pothole detector in Google Colab using a Roboflow dataset. "
                "Download best.pt, place it in the prism_backend/models/ directory, and set "
                "POTHOLE_MODEL_PATH=./models/best.pt in your environment."
            )
        }

    def infer(self, image_np: np.ndarray) -> Dict[str, Any]:
        h, w = image_np.shape[:2]
        
        # 1. If real model is NOT loaded
        if self._model is None:
            return {
                "inference_status": "model_not_configured",
                "model_identifier": "None (Configuration Pending)",
                "detected_count": 0,
                "detections": [],
                "preliminary_severity": "requires_inspection",
                "priority_score": 45,
                "confidence_score": None,
                "explanation": (
                    "AI detection model is not configured. OpenCV image enhancement is available in "
                    "the Road Vision Lab. To enable automated pothole bounding boxes, link a trained "
                    "YOLO model exported from Google Colab or Roboflow in Settings."
                ),
                "severity_factors": {
                    "apparent_area_pct": 0.0,
                    "model_confidence": 0.0,
                    "defect_count": 0,
                    "disclaimer": "Photographic inspection cannot measure subsurface depth or load bearing capacity."
                }
            }

        # 2. Run genuine model inference
        try:
            results = self._model.predict(image_np, conf=self.conf_threshold, verbose=False)
            detections: List[Dict[str, Any]] = []
            total_apparent_area = 0.0

            for r in results:
                for box in r.boxes:
                    coords = box.xyxy[0].tolist() # x1, y1, x2, y2
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    name = self._model.names.get(cls_id, "pothole") if hasattr(self._model, "names") else "pothole"
                    if str(name).strip() in ['0', '']:
                        name = "pothole"

                    bx_w = max(0, coords[2] - coords[0])
                    bx_h = max(0, coords[3] - coords[1])
                    area_pct = (bx_w * bx_h) / (w * h) * 100.0
                    total_apparent_area += area_pct

                    detections.append({
                        "class_name": name,
                        "confidence": round(conf, 4),
                        "x1": round(coords[0] / w, 4), # normalized 0-1
                        "y1": round(coords[1] / h, 4),
                        "x2": round(coords[2] / w, 4),
                        "y2": round(coords[3] / h, 4),
                        "apparent_area_pct": round(area_pct, 2)
                    })

            # Calculate transparent, explainable preliminary severity
            count = len(detections)
            avg_conf = sum(d["confidence"] for d in detections) / count if count > 0 else 0.0

            if count == 0:
                severity = "low"
                priority = 20
                explanation = "No surface potholes detected above the configured confidence threshold."
            elif total_apparent_area > 15.0 or count >= 3:
                severity = "high"
                priority = 85
                explanation = f"High severity: {count} cavitations covering approx {total_apparent_area:.1f}% of frame."
            elif total_apparent_area > 5.0 or count >= 1:
                severity = "moderate"
                priority = 65
                explanation = f"Moderate severity: {count} localized cavitation(s) detected with {avg_conf*100:.1f}% avg model confidence."
            else:
                severity = "low"
                priority = 40
                explanation = f"Low severity: minor surface depression detected."

            return {
                "inference_status": "completed",
                "model_identifier": os.path.basename(self.model_path),
                "detected_count": count,
                "detections": detections,
                "preliminary_severity": severity,
                "priority_score": priority,
                "confidence_score": round(avg_conf, 3),
                "explanation": explanation,
                "severity_factors": {
                    "apparent_area_pct": round(total_apparent_area, 2),
                    "model_confidence": round(avg_conf, 3),
                    "defect_count": count,
                    "disclaimer": "Preliminary photographic evaluation; does not certify pavement structural integrity."
                }
            }
        except Exception as err:
            return {
                "inference_status": "inference_error",
                "model_identifier": os.path.basename(self.model_path),
                "detected_count": 0,
                "detections": [],
                "preliminary_severity": "requires_inspection",
                "priority_score": 50,
                "explanation": f"Model inference error: {str(err)}",
                "severity_factors": {"error": str(err)}
            }

detector_adapter = PotholeDetectorAdapter()
