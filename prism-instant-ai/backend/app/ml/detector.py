import os
import time
import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings

class PotholeInferenceEngine:
    """
    Production-ready Ultralytics YOLO-compatible road damage inference engine.
    Performs authentic inference without hallucinating detections, fake confidence values, or falsified coordinates.
    """

    def __init__(self):
        self.model_path = settings.MODEL_PATH
        self.conf_threshold = settings.CONFIDENCE_THRESHOLD
        self._model = None
        self._load_model()

    def _load_model(self):
        # Look for model path
        candidates = [
            self.model_path,
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../prism_backend/models/best.pt")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../prism_backend/models/best.onnx")),
            "models/best.pt"
        ]
        chosen = None
        for c in candidates:
            if c and os.path.exists(c):
                chosen = c
                break

        if chosen:
            self.model_path = chosen
            try:
                import torch
                torch.set_num_threads(1)
                from ultralytics import YOLO
                self._model = YOLO(self.model_path)
                print(f"[PRISM INSTANT AI] Model loaded successfully from {self.model_path}")
            except Exception as e:
                print(f"[PRISM INSTANT AI] Warning: Failed to load model: {e}")
                self._model = None
        else:
            print("[PRISM INSTANT AI] Warning: No trained YOLO model file found at configured paths.")
            self._model = None

    def get_status(self) -> Dict[str, Any]:
        return {
            "model_configured": self._model is not None,
            "status": "Trained YOLOv8 Active" if self._model else "MODEL_NOT_CONFIGURED",
            "model_path": self.model_path if self._model else "None",
            "confidence_threshold": self.conf_threshold,
            "classes": self._model.names if self._model else {},
            "supported_architectures": ["YOLOv8 (.pt)", "YOLOv9 (.pt)", "YOLOv11 (.pt)", "ONNX"],
        }

    def infer(self, image_np: np.ndarray) -> Dict[str, Any]:
        """
        Runs actual model inference on decoded BGR image array.
        Returns parsed detections, severity score, and annotated image bytes.
        """
        h, w = image_np.shape[:2]

        if self._model is None:
            return {
                "inference_status": "MODEL_NOT_CONFIGURED",
                "model_identifier": "None",
                "detected_count": 0,
                "detections": [],
                "preliminary_severity": "REQUIRES_INSPECTION",
                "priority_score": 0,
                "confidence_score": None,
                "inference_duration_ms": 0.0,
                "annotated_image_np": image_np,
                "warnings": ["AI detection model is not configured. No detections were performed."]
            }

        start_time = time.time()
        try:
            results = self._model(image_np, conf=self.conf_threshold, verbose=False)
            duration_ms = round((time.time() - start_time) * 1000, 2)
            
            res = results[0]
            boxes = res.boxes
            detected_count = len(boxes) if boxes is not None else 0

            detections_list: List[Dict[str, Any]] = []
            annotated_img = image_np.copy()
            total_area_pct = 0.0

            if detected_count > 0:
                confs = [float(c) for c in boxes.conf]
                mean_conf = round(sum(confs) / len(confs), 3)

                for i, box in enumerate(boxes):
                    coords = box.xyxy[0].tolist()
                    x1, y1, x2, y2 = [int(v) for v in coords]
                    c_conf = float(box.conf[0])
                    cls_id = int(box.cls[0]) if box.cls is not None else 0
                    cls_name = self._model.names.get(cls_id, "pothole") if hasattr(self._model, 'names') else "pothole"

                    box_w = max(0, x2 - x1)
                    box_h = max(0, y2 - y1)
                    area_pct = round(((box_w * box_h) / (w * h)) * 100, 2)
                    total_area_pct += area_pct

                    detections_list.append({
                        "class_name": cls_name,
                        "confidence": round(c_conf, 3),
                        "bounding_box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                        "normalized_box": {
                            "x1": round(x1 / w, 4),
                            "y1": round(y1 / h, 4),
                            "x2": round(x2 / w, 4),
                            "y2": round(y2 / h, 4)
                        },
                        "apparent_area_pct": area_pct
                    })

                    # Draw authentic bounding box
                    cv2.rectangle(annotated_img, (x1, y1), (x2, y2), (0, 220, 255), 2)
                    label = f"{cls_name} {c_conf:.2f}"
                    (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                    cv2.rectangle(annotated_img, (x1, max(0, y1 - 20)), (x1 + lw + 6, max(0, y1)), (0, 180, 220), -1)
                    cv2.putText(annotated_img, label, (x1 + 3, max(12, y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)

                # Compute preliminary severity
                if detected_count >= 3 or total_area_pct > 15.0 or mean_conf > 0.8:
                    severity = "CRITICAL"
                    priority = min(100, 75 + int(total_area_pct))
                elif detected_count >= 1 or total_area_pct > 5.0:
                    severity = "HIGH"
                    priority = min(85, 55 + int(total_area_pct * 2))
                else:
                    severity = "MODERATE"
                    priority = 45
            else:
                mean_conf = None
                severity = "LOW"
                priority = 10

            return {
                "inference_status": "COMPLETED",
                "model_identifier": os.path.basename(self.model_path),
                "detected_count": detected_count,
                "detections": detections_list,
                "preliminary_severity": severity,
                "priority_score": priority,
                "confidence_score": mean_conf,
                "inference_duration_ms": duration_ms,
                "annotated_image_np": annotated_img,
                "warnings": []
            }
        except Exception as e:
            return {
                "inference_status": "MODEL_ERROR",
                "model_identifier": os.path.basename(self.model_path) if self.model_path else "Error",
                "detected_count": 0,
                "detections": [],
                "preliminary_severity": "REQUIRES_INSPECTION",
                "priority_score": 0,
                "confidence_score": None,
                "inference_duration_ms": 0.0,
                "annotated_image_np": image_np,
                "warnings": [f"Inference execution failed: {str(e)}"]
            }

detector_engine = PotholeInferenceEngine()
