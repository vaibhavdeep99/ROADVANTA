import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Terminal,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  Server,
  Database,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SidebarLayout } from '../components/SidebarLayout';
import prismApi, { ModelStatusResponse } from '../services/prismApi';

export const SettingsModelPage: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  const fetchStatus = () => {
    setLoading(true);
    prismApi.getModelStatus()
      .then((status) => {
        setModelStatus(status);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const colabSnippet = `# 1. Install Ultralytics and Roboflow
!pip install -q ultralytics roboflow

# 2. Download Roboflow Pothole Dataset in YOLO format
from roboflow import Roboflow
rf = Roboflow(api_key="YOUR_ROBOFLOW_API_KEY")
project = rf.workspace("roboflow-universe").project("pothole-detection")
dataset = project.version(1).download("yolov8")

# 3. Train YOLOv8 Detector
from ultralytics import YOLO
model = YOLO("yolov8n.pt")
model.train(data=f"{dataset.location}/data.yaml", epochs=30, imgsz=640)

# 4. Download best.pt for PRISM ROAD AI
from google.colab import files
files.download("runs/detect/train/weights/best.pt")

# 5. Place best.pt inside PRISM ROAD AI backend:
# RoadVantaAI/prism_backend/models/best.pt
# And set in your .env: POTHOLE_MODEL_PATH=./models/best.pt`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(colabSnippet);
    setCopiedSnippet(true);
    toast.success('Google Colab training snippet copied to clipboard!');
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  return (
    <SidebarLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rp-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-rp-accent/15 text-rp-accent border border-rp-accent/30">
                System Architecture
              </span>
              <span className="text-xs text-rp-text-muted">Configuration & Model Integration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text">
              Settings & Model Configuration
            </h1>
            <p className="text-sm text-rp-text-secondary mt-1">
              Manage backend parameters, check YOLO inference engine status, and configure external trained weights.
            </p>
          </div>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rp-bg-secondary border border-rp-border text-xs font-semibold text-rp-text hover:text-rp-accent transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Model Status
          </button>
        </div>

        {/* Status Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rp-text-muted">Inference Adapter</span>
              <Cpu className="w-4 h-4 text-rp-accent" />
            </div>
            <div className="text-base font-bold text-rp-text">
              {modelStatus?.model_configured ? 'Trained YOLOv8 Active' : 'AI Model Not Configured'}
            </div>
            <div className="text-[11px] text-rp-text-secondary">
              {modelStatus?.model_configured ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for live road detection
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Honest fallback mode (no hallucinations)
                </span>
              )}
            </div>
          </div>

          <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rp-text-muted">Configured Model Path</span>
              <FileCode className="w-4 h-4 text-rp-accent" />
            </div>
            <div className="text-xs font-mono text-rp-text truncate">
              {modelStatus?.model_path || 'POTHOLE_MODEL_PATH unset'}
            </div>
            <div className="text-[11px] text-rp-text-muted">
              Confidence Threshold: <strong>{modelStatus?.confidence_threshold ?? 0.45}</strong>
            </div>
          </div>

          <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rp-text-muted">Backend Service</span>
              <Server className="w-4 h-4 text-rp-accent" />
            </div>
            <div className="text-base font-bold text-rp-text">
              FastAPI + OpenCV + SQLite
            </div>
            <div className="text-[11px] text-rp-text-secondary">
              Port 8000 | Zero Colab Runtime Dependency
            </div>
          </div>
        </div>

        {/* Step-by-Step Google Colab & Roboflow Integration Guide */}
        <div className="bg-rp-card border border-rp-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-rp-text flex items-center gap-2">
                <Terminal className="w-5 h-5 text-rp-accent" />
                Google Colab & Roboflow Model Training Guide
              </h3>
              <p className="text-xs text-rp-text-secondary">
                You can train your custom road damage model on free Google Colab GPUs without needing Colab at runtime.
              </p>
            </div>

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rp-accent text-rp-bg font-semibold text-xs hover:bg-cyan-400 transition-all shadow-glow-cyan"
            >
              {copiedSnippet ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSnippet ? 'Copied!' : 'Copy Colab Script'}
            </button>
          </div>

          {/* Code Snippet Box */}
          <div className="relative rounded-xl overflow-hidden bg-rp-bg border border-rp-border font-mono text-xs text-rp-text-secondary p-4">
            <pre className="overflow-x-auto leading-relaxed">{colabSnippet}</pre>
          </div>

          {/* Deployment steps explanation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-1.5">
              <span className="text-xs font-bold text-rp-accent block">Step 1: Train in Colab</span>
              <p className="text-[11px] text-rp-text-muted leading-relaxed">
                Run the script in Google Colab with T4 GPU enabled. Roboflow provides annotated road defect datasets in standard YOLO format.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-1.5">
              <span className="text-xs font-bold text-rp-accent block">Step 2: Export best.pt</span>
              <p className="text-[11px] text-rp-text-muted leading-relaxed">
                Download the trained weights <code className="text-rp-accent">best.pt</code> and place them inside the backend <code className="text-rp-text">prism_backend/models/</code> directory.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-1.5">
              <span className="text-xs font-bold text-rp-accent block">Step 3: Set Environment</span>
              <p className="text-[11px] text-rp-text-muted leading-relaxed">
                Set <code className="text-rp-accent">POTHOLE_MODEL_PATH=./models/best.pt</code> in your environment. The backend auto-detects and loads the model on startup!
              </p>
            </div>
          </div>
        </div>

        {/* Environment Variables Reference */}
        <div className="bg-rp-card border border-rp-border rounded-2xl p-6 space-y-4">
          <h3 className="font-heading font-bold text-sm text-rp-text flex items-center gap-2">
            <Settings className="w-4 h-4 text-rp-accent" />
            Environment Variables Reference
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-rp-border text-rp-text-muted">
                  <th className="py-2.5 px-3">Variable</th>
                  <th className="py-2.5 px-3">Default</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rp-border/50 text-rp-text-secondary">
                <tr>
                  <td className="py-2.5 px-3 font-mono text-rp-accent">POTHOLE_MODEL_PATH</td>
                  <td className="py-2.5 px-3 font-mono text-rp-text-muted">""</td>
                  <td className="py-2.5 px-3">Path to trained YOLO weights file (e.g. ./models/best.pt). If empty, backend operates in honest unconfigured mode.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-rp-accent">POTHOLE_CONFIDENCE_THRESHOLD</td>
                  <td className="py-2.5 px-3 font-mono text-rp-text-muted">0.45</td>
                  <td className="py-2.5 px-3">Minimum confidence score required to register a defect detection box.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-rp-accent">PRISM_DATABASE_URL</td>
                  <td className="py-2.5 px-3 font-mono text-rp-text-muted">sqlite:///./prism_road.db</td>
                  <td className="py-2.5 px-3">SQLAlchemy database connection string. Uses local SQLite with zero external dependencies.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default SettingsModelPage;
