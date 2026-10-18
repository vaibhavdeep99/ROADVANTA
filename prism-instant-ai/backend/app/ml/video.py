import os
import cv2
import numpy as np
from typing import Dict, Any, List
from app.ml.detector import detector_engine
from app.services.storage import storage_service

class VideoScannerEngine:
    """
    Video defect scanner using OpenCV for safe sequential frame extraction without loading the full video into RAM.
    """

    def process_video_file(
        self,
        video_path: str,
        sampling_interval_sec: float = 1.0,
        max_duration_sec: int = 45
    ) -> Dict[str, Any]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        duration_sec = total_frames / fps if fps > 0 else 0.0

        sample_step = max(1, int(fps * sampling_interval_sec))
        max_frames_to_read = int(min(duration_sec, max_duration_sec) * fps)

        frame_idx = 0
        sampled_frames_data: List[Dict[str, Any]] = []
        total_detections_found = 0
        frames_with_detections = 0

        while cap.isOpened() and frame_idx < max_frames_to_read:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_step == 0:
                timestamp = round(frame_idx / fps, 2)
                # Run inference on frame
                inference = detector_engine.infer(frame)
                det_count = inference["detected_count"]

                # Encode frame to JPEG
                success, buffer = cv2.imencode(".jpg", inference["annotated_image_np"])
                frame_key = None
                if success:
                    frame_key, _, _ = storage_service.save_bytes(buffer.tobytes(), ext=".jpg", subfolder="frames")

                sampled_frames_data.append({
                    "frame_number": frame_idx,
                    "timestamp_seconds": timestamp,
                    "evidence_storage_key": frame_key,
                    "detections_count": det_count,
                    "detections": inference["detections"],
                })

                if det_count > 0:
                    total_detections_found += det_count
                    frames_with_detections += 1

            frame_idx += 1

        cap.release()

        return {
            "total_frames_sampled": len(sampled_frames_data),
            "frames_with_detections": frames_with_detections,
            "total_detections_found": total_detections_found,
            "video_duration_sec": round(duration_sec, 2),
            "fps": round(fps, 1),
            "sampled_frames": sampled_frames_data
        }

video_scanner = VideoScannerEngine()
