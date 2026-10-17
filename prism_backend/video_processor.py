import os
import cv2
import uuid
from typing import Dict, Any, List

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
FRAMES_DIR = os.path.join(UPLOAD_DIR, "video_frames")
os.makedirs(FRAMES_DIR, exist_ok=True)

class RoadVideoProcessor:
    """
    Processes road video footage for inspection by sampling frames at regular intervals.
    Avoids loading full videos into RAM. Explains frame-level versus unique physical defect counts.
    """

    @staticmethod
    def process_video(
        video_path: str,
        sampling_interval_sec: float = 1.0,
        max_duration_sec: float = 30.0,
        run_detector: bool = True
    ) -> Dict[str, Any]:
        from detector import detector_adapter

        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Unable to open video stream with OpenCV.")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0.0

        sample_every_n_frames = max(1, int(fps * sampling_interval_sec))
        sampled_results: List[Dict[str, Any]] = []

        frame_idx = 0
        total_detections_in_video = 0
        max_detections_single_frame = 0

        while cap.isOpened() and (frame_idx / fps) <= max_duration_sec:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_every_n_frames == 0:
                timestamp_sec = round(frame_idx / fps, 2)
                mins = int(timestamp_sec // 60)
                secs = int(timestamp_sec % 60)
                ms = int((timestamp_sec - int(timestamp_sec)) * 10)
                formatted_ts = f"{mins:02d}:{secs:02d}.{ms}"

                # Run detector on frame
                inference = detector_adapter.infer(frame) if run_detector else {"detected_count": 0, "detections": []}
                det_count = inference.get("detected_count", 0)
                total_detections_in_video += det_count
                max_detections_single_frame = max(max_detections_single_frame, det_count)

                # Save thumbnail of sampled frame
                frame_filename = f"frame_{uuid.uuid4().hex[:8]}_{mins}m{secs}s.jpg"
                frame_filepath = os.path.join(FRAMES_DIR, frame_filename)
                
                # Draw boxes if detections exist
                display_frame = frame.copy()
                h, w = display_frame.shape[:2]
                for b in inference.get("detections", []):
                    x1 = int(b["x1"] * w)
                    y1 = int(b["y1"] * h)
                    x2 = int(b["x2"] * w)
                    y2 = int(b["y2"] * h)
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 165, 255), 2)
                    cv2.putText(
                        display_frame,
                        f"{b['class_name']} {int(b['confidence']*100)}%",
                        (x1, max(20, y1 - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 165, 255),
                        2
                    )

                cv2.imwrite(frame_filepath, display_frame)

                sampled_results.append({
                    "frame_index": frame_idx,
                    "timestamp_sec": timestamp_sec,
                    "formatted_timestamp": formatted_ts,
                    "frame_image_url": f"/uploads/video_frames/{frame_filename}",
                    "detections_count": det_count,
                    "detections": inference.get("detections", []),
                    "severity": inference.get("preliminary_severity", "low")
                })

            frame_idx += 1

        cap.release()

        return {
            "video_duration_sec": round(duration, 2),
            "sampled_frames_count": len(sampled_results),
            "sampling_interval_sec": sampling_interval_sec,
            "total_frame_detections": total_detections_in_video,
            "max_detections_per_frame": max_detections_single_frame,
            "frames": sampled_results,
            "tracking_note": (
                "Frame detections indicate defect observations across video playback. "
                "Multiple detections across successive frames may represent the same physical pothole "
                "viewed from changing vehicle perspectives."
            )
        }
