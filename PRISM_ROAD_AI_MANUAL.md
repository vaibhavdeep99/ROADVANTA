# PRISM ROAD AI — System Architecture & Run Guide

> **Tagline:** *See the Damage. Map the Risk. Fix Roads Smarter.*  
> **Project Type:** AI-Powered Road Damage Detection, OpenCV Vision Enhancement Lab, Geospatial Infrastructure Intelligence & Maintenance Management Platform.

---

## 1. Project Overview & Product Vision

PRISM ROAD AI is an end-to-end infrastructure intelligence web application designed for citizens, municipal authorities, PWD engineers, and highway maintenance contractors.

### Core Principles & Scientific Guardrails
1. **Zero Hallucination / Honest AI Fallback:** When no trained neural weight file (`.pt`) is linked, the system explicitly reports `"AI model not configured"` and refuses to generate synthetic bounding boxes or fabricated confidence scores.
2. **OpenCV Separation:** Image enhancements (CLAHE, Gamma LUT, Laplacian sharpening, Canny/Sobel edge visualization, Adaptive thresholding) are explicitly labeled as human visual aids, never as physical structural certifications of pavement depth.
3. **Temporal Defect Deduplication:** Video frame defect counts are presented per timestamp with a scientific disclaimer that multiple detections across successive frames represent the same defect and require tracking for physical pothole counts.
4. **No Synthetic GPS:** Reports without GPS coordinates are cataloged as `"Location Unavailable"` rather than assigned random real-world coordinates.

---

## 2. Directory Structure

```
RoadVantaAI/
├── prism_backend/                     # Python FastAPI Computer Vision Backend
│   ├── database.py                    # SQLAlchemy Models (Report, Detection, Review) & SQLite Engine
│   ├── vision_lab.py                  # Real OpenCV Pipeline (CLAHE, Gamma, Sharpen, Edges, Adaptive Thresh)
│   ├── detector.py                    # Modular YOLO-Compatible Inference Adapter
│   ├── video_processor.py             # OpenCV Video Frame Extractor & Temporal Defect Analyzer
│   ├── seed_data.py                   # Initial Demo Reports (Indore, Bengaluru, Kanpur, Lucknow, etc.)
│   ├── main.py                        # FastAPI Server & REST Endpoints
│   ├── uploads/                       # Uploaded and Enhanced Media Storage
│   └── tests/
│       └── test_api.py                # Pytest Test Suite (Health, Enhancement, Inference, CRUD, CSV)
│
├── client/                            # React + TypeScript + Vite + Tailwind Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx        # Hero with Tagline & Value Proposition
│   │   │   ├── MainDashboardPage.tsx  # Overview Dashboard with Live Database KPIs & Leaflet Map
│   │   │   ├── RoadVisionLabPage.tsx  # OpenCV Image Processing & Pothole Detection Lab
│   │   │   ├── VideoDetectionLabPage.tsx # Video Patrol Sampling & Frame Inspector
│   │   │   ├── MapPage.tsx            # Fullscreen Interactive Leaflet Road Map & Marker Filters
│   │   │   ├── IncidentReportsPage.tsx# Report Registry with CSV Export & Category Tabs
│   │   │   ├── AuthorityDashboardPage.tsx # Maintenance Priorities & Administrative Triage
│   │   │   ├── SettingsModelPage.tsx  # Model Configuration & Colab/Roboflow Integration Guide
│   │   │   └── RouteHazardIntelligencePage.tsx # Corridor Transit Vulnerability Evaluation
│   │   ├── services/
│   │   │   └── prismApi.ts            # Typed Axios Client for FastAPI Backend
│   │   └── components/
│   │       └── SidebarLayout.tsx      # Responsive Sidebar with PRISM ROAD AI Navigation
│   └── vite.config.ts                 # Vite Proxy & Build Configurations
```

---

## 3. Installation & Setup

### A. Python Backend Dependencies
Ensure Python 3.10+ is installed:
```bash
pip install fastapi uvicorn pydantic opencv-python-headless pillow sqlalchemy numpy pytest httpx
```

*(Optional for custom YOLO inference):*
```bash
pip install ultralytics
```

### B. Frontend Dependencies
In the `client/` directory:
```bash
npm install
```

---

## 4. Running the Application

### Step 1: Start the Python FastAPI Backend (Port 8000)
From the project root:
```bash
python -m uvicorn main:app --app-dir prism_backend --port 8000 --reload
```
- Health Check: `http://127.0.0.1:8000/api/health`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Direct CSV Export: `http://127.0.0.1:8000/api/reports/export`

### Step 2: Start the React Frontend (Port 5173)
From the `client/` directory:
```bash
npx vite --host
```
Open `http://localhost:5173` in your browser.

---

## 5. Environment Variables Configuration

| Variable | Default Value | Purpose |
|---|---|---|
| `POTHOLE_MODEL_PATH` | `""` (Empty) | Path to trained YOLO `.pt` model weights (e.g. `./models/best.pt`). If empty, backend runs in honest fallback mode. |
| `POTHOLE_CONFIDENCE_THRESHOLD` | `0.45` | Minimum confidence score threshold for object detection boxes. |
| `PRISM_DATABASE_URL` | `sqlite:///./prism_road.db` | SQLAlchemy database URI. Automatically initialized on startup. |
| `VITE_PRISM_API_URL` | `http://127.0.0.1:8000` | Backend API URL used by the React frontend client. |

---

## 6. How to Train & Integrate a YOLO Model (Google Colab + Roboflow)

Google Colab is **NOT** required to run the deployed website. You can train a model on Colab's free GPU and drop the weights into the backend:

1. **Annotate & Export Dataset:**
   - Create a free project on [Roboflow Universe](https://universe.roboflow.com/) or search for `pothole-detection`.
   - Export dataset format as `YOLOv8`.
2. **Train in Google Colab:**
   ```python
   !pip install -q ultralytics roboflow
   from ultralytics import YOLO
   model = YOLO("yolov8n.pt")
   model.train(data="/content/potholes/data.yaml", epochs=30, imgsz=640)
   ```
3. **Export and Load into PRISM ROAD AI:**
   - Download `runs/detect/train/weights/best.pt`.
   - Save the file to `prism_backend/models/best.pt`.
   - Set in your environment:
     ```bash
     $env:POTHOLE_MODEL_PATH="models/best.pt"
     ```
   - Restart the backend. The Settings page will display: `Trained YOLO Model Active`.

---

## 7. Verification & Testing

Run the automated backend test suite:
```bash
python -m pytest prism_backend/tests
```
**Test Results:**
- `test_health_endpoint` ✅ PASSED
- `test_model_status_endpoint` ✅ PASSED
- `test_vision_lab_enhancement` ✅ PASSED
- `test_image_analysis_without_model` ✅ PASSED
- `test_get_reports_and_filters` ✅ PASSED
- `test_analytics_summary` ✅ PASSED
- `test_csv_export` ✅ PASSED

Verify frontend compilation:
```bash
node ./client/node_modules/vite/bin/vite.js build
```
Result: `✓ built in 3.45s (0 errors)`.
