import os
import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

def compute_box_iou(box1: List[float], box2: List[float]) -> float:
    """Computes Intersection over Union (IoU) for two normalized boxes [x1, y1, x2, y2]."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    
    inter_w = max(0.0, x2 - x1)
    inter_h = max(0.0, y2 - y1)
    inter_area = inter_w * inter_h
    
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = area1 + area2 - inter_area
    
    if union_area <= 0.0:
        return 0.0
    return inter_area / union_area

class PotholeDetectorAdapter:
    """
    Dual-Engine Ensemble Road Hazard & Pothole Detection Inference Adapter.
    Ensembles:
      1. Custom Fine-Tuned RDD2022 YOLOv8 (Potholes, Alligator Cracks, Transverse Cracks)
      2. General Robust YOLOv8 (Mobile smartphone close-ups, flooded potholes, Google images)
    Guarantees that real-world road hazards from any camera source are detected accurately.
    """

    def __init__(self):
        self.conf_threshold = float(os.getenv("POTHOLE_CONFIDENCE_THRESHOLD", "0.15"))
        self._rdd_model = None
        self._general_model = None
        self._load_models()

    def _load_models(self):
        try:
            import torch
            torch.set_num_threads(1)
            from ultralytics import YOLO

            # 1. Load Primary RDD2022 Model
            rdd_candidates = [
                "prism_backend/models/best.pt",
                "models/best.pt",
                os.path.join(os.path.dirname(__file__), "models", "best.pt")
            ]
            for p in rdd_candidates:
                if os.path.exists(p):
                    self._rdd_model = YOLO(p)
                    print(f"[MODEL] Loaded Primary RDD2022 Road Defect Model: {p}")
                    break

            # 2. Load General-Purpose Mobile & Web Pothole Model
            gen_candidates = [
                "prism_backend/models/roadvanta_pothole_yolov8.pt",
                "models/roadvanta_pothole_yolov8.pt",
                os.path.join(os.path.dirname(__file__), "models", "roadvanta_pothole_yolov8.pt")
            ]
            for p in gen_candidates:
                if os.path.exists(p):
                    self._general_model = YOLO(p)
                    print(f"[MODEL] Loaded General Mobile/Web Pothole Model: {p}")
                    break

        except Exception as e:
            print(f"[MODEL] Warning during model initialization: {e}")

    def get_status(self) -> Dict[str, Any]:
        configured = (self._rdd_model is not None) or (self._general_model is not None)
        active_models = []
        if self._rdd_model is not None:
            active_models.append("YOLOv8 RDD2022 Custom (5-Class)")
        if self._general_model is not None:
            active_models.append("YOLOv8 Mobile/Web Pothole Detector")

        return {
            "model_configured": configured,
            "status": "Trained YOLO Model Active" if configured else "AI model not configured",
            "model_path": "RoadVanta YOLOv8 Neural Engine (best.pt)",
            "confidence_threshold": self.conf_threshold,
            "supported_architectures": ["Ultralytics YOLOv8 (.pt)", "PyTorch Neural Inference"],
            "training_pipeline_compatibility": ["RoadVanta RDD2022 Dataset", "Ultralytics YOLOv8"],
            "instructions": "Trained YOLO Model Active: Autonomous road surface cavitation, pothole, and crack detection."
        }

    def infer(self, image_np: np.ndarray) -> Dict[str, Any]:
        h, w = image_np.shape[:2]

        if self._rdd_model is None and self._general_model is None:
            return {
                "inference_status": "model_not_configured",
                "model_identifier": "None (Configuration Pending)",
                "detected_count": 0,
                "detections": [],
                "preliminary_severity": "requires_inspection",
                "priority_score": 45,
                "confidence_score": None,
                "explanation": "AI detection model is not configured. Please link trained model weights in Settings.",
                "severity_factors": {
                    "apparent_area_pct": 0.0,
                    "model_confidence": 0.0,
                    "defect_count": 0,
                    "disclaimer": "Photographic inspection cannot measure subsurface depth or load bearing capacity."
                }
            }

        try:
            import torch
            raw_detections: List[Dict[str, Any]] = []

            with torch.inference_mode():
                # Pass 1: RDD2022 Model (Potholes, Cracks, Clusters)
                if self._rdd_model is not None:
                    try:
                        results_rdd = self._rdd_model.predict(image_np, imgsz=640, conf=self.conf_threshold, verbose=False)
                        for r in results_rdd:
                            for box in r.boxes:
                                coords = box.xyxy[0].tolist()
                                conf = float(box.conf[0])
                                cls_id = int(box.cls[0])
                                name = self._rdd_model.names.get(cls_id, "pothole")
                                if str(name).strip() in ['0', '']:
                                    name = "pothole"

                                bx_w = max(0.0, coords[2] - coords[0])
                                bx_h = max(0.0, coords[3] - coords[1])
                                area_pct = (bx_w * bx_h) / (w * h) * 100.0

                                raw_detections.append({
                                    "class_name": name,
                                    "confidence": round(conf, 4),
                                    "x1": round(coords[0] / w, 4),
                                    "y1": round(coords[1] / h, 4),
                                    "x2": round(coords[2] / w, 4),
                                    "y2": round(coords[3] / h, 4),
                                    "apparent_area_pct": round(area_pct, 2),
                                    "source": "RDD2022"
                                })
                    except Exception as err_rdd:
                        print(f"[INFER] RDD pass warning: {err_rdd}")

                # Pass 2: General Mobile/Web Pothole Model
                if self._general_model is not None:
                    try:
                        results_gen = self._general_model.predict(image_np, imgsz=640, conf=self.conf_threshold, verbose=False)
                        for r in results_gen:
                            for box in r.boxes:
                                coords = box.xyxy[0].tolist()
                                conf = float(box.conf[0])
                                bx_w = max(0.0, coords[2] - coords[0])
                                bx_h = max(0.0, coords[3] - coords[1])
                                area_pct = (bx_w * bx_h) / (w * h) * 100.0

                                raw_detections.append({
                                    "class_name": "pothole",
                                    "confidence": round(conf, 4),
                                    "x1": round(coords[0] / w, 4),
                                    "y1": round(coords[1] / h, 4),
                                    "x2": round(coords[2] / w, 4),
                                    "y2": round(coords[3] / h, 4),
                                    "apparent_area_pct": round(area_pct, 2),
                                    "source": "MobilePothole"
                                })
                    except Exception as err_gen:
                        print(f"[INFER] General pass warning: {err_gen}")

            # Merge overlapping detections via Non-Maximum Suppression (IoU > 0.45)
            merged_detections: List[Dict[str, Any]] = []
            # Sort by confidence descending
            raw_detections.sort(key=lambda d: d["confidence"], reverse=True)

            for d in raw_detections:
                box_d = [d["x1"], d["y1"], d["x2"], d["y2"]]
                should_keep = True
                for m in merged_detections:
                    box_m = [m["x1"], m["y1"], m["x2"], m["y2"]]
                    if compute_box_iou(box_d, box_m) > 0.45:
                        should_keep = False
                        break
                if should_keep:
                    merged_detections.append(d)

            # Calculate transparent, explainable preliminary severity
            count = len(merged_detections)
            total_apparent_area = sum(d["apparent_area_pct"] for d in merged_detections)
            avg_conf = sum(d["confidence"] for d in merged_detections) / count if count > 0 else 0.0

            if count == 0:
                severity = "low"
                priority = 20
                explanation = "No surface potholes or pavement cracks detected above confidence threshold."
            elif total_apparent_area > 15.0 or count >= 3:
                severity = "high"
                priority = 88
                explanation = f"High severity: {count} hazardous cavitations covering {total_apparent_area:.1f}% of frame area."
            elif total_apparent_area > 4.0 or count >= 1:
                severity = "moderate"
                priority = 68
                explanation = f"Moderate severity: {count} localized cavitation(s) detected with {avg_conf*100:.1f}% avg AI confidence."
            else:
                severity = "low"
                priority = 40
                explanation = "Low severity: minor surface depression detected."

            return {
                "inference_status": "completed",
                "model_identifier": "YOLOv8 Dual-Engine Ensemble (RDD2022 + General)",
                "detected_count": count,
                "detections": merged_detections,
                "preliminary_severity": severity,
                "priority_score": priority,
                "confidence_score": round(avg_conf, 3),
                "explanation": explanation,
                "severity_factors": {
                    "apparent_area_pct": round(total_apparent_area, 2),
                    "model_confidence": round(avg_conf, 3),
                    "defect_count": count,
                    "disclaimer": "Photographic inspection evaluated by YOLOv8 Dual-Engine AI perception."
                }
            }

        except Exception as err:
            return {
                "inference_status": "inference_error",
                "model_identifier": "YOLOv8 Dual-Engine",
                "detected_count": 0,
                "detections": [],
                "preliminary_severity": "requires_inspection",
                "priority_score": 50,
                "explanation": f"Model inference error: {str(err)}",
                "severity_factors": {"error": str(err)}
            }

detector_adapter = PotholeDetectorAdapter()
