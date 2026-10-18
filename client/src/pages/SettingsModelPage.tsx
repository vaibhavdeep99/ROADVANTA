import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Terminal,
  Copy,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Server,
  RefreshCw,
  Layers,
  Sparkles,
  Zap,
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

  const yoloTrainSnippet = `# RoadVanta AI - Autonomous Road Defect YOLOv8 Pipeline
from ultralytics import YOLO

# 1. Initialize YOLOv8 Architecture
model = YOLO('yolov8n.pt')

# 2. Train on Road Defect Dataset (Potholes, Cracks, Cavitations)
model.train(
    data='dataset/road_defects.yaml',
    epochs=50,
    imgsz=640,
    batch=16,
    device=0, # CUDA GPU or 'cpu'
    name='roadvanta_yolo'
)

# 3. Export weights to RoadVanta Backend
# Copy 'runs/detect/roadvanta_yolo/weights/best.pt'
# to 'prism_backend/models/best.pt'`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(yoloTrainSnippet);
    setCopiedSnippet(true);
    toast.success('YOLOv8 pipeline snippet copied to clipboard!');
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
                RoadVanta Neural Engine
              </span>
              <span className="text-xs text-rp-text-muted">Autonomous Vision & YOLO Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text">
              System Settings & YOLO Engine Status
            </h1>
            <p className="text-sm text-rp-text-secondary mt-1">
              Active YOLO model telemetry, dual-engine ensemble parameters, and high-precision road perception settings.
            </p>
          </div>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rp-bg-secondary border border-rp-border text-xs font-semibold text-rp-text hover:text-rp-accent transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh YOLO Status
          </button>
        </div>

        {/* Status Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rp-card border border-rp-accent/30 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-glow-cyan">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rp-accent/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-rp-text-muted font-medium">Neural Vision Engine</span>
              <Cpu className="w-4 h-4 text-rp-accent" />
            </div>
            <div className="text-lg font-bold text-rp-text flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Status: YOLOv8 Active
            </div>
            <div className="text-[11px] text-rp-text-secondary">
              {modelStatus?.model_configured ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Trained Dual-Engine Ensemble Live (best.pt)
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Checking model initialization...
                </span>
              )}
            </div>
          </div>

          <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rp-text-muted">Primary Weights</span>
              <FileCode className="w-4 h-4 text-rp-accent" />
            </div>
            <div className="text-xs font-mono text-rp-text truncate">
              {modelStatus?.model_path || 'RoadVanta YOLOv8 Neural Engine (best.pt)'}
            </div>
            <div className="text-[11px] text-rp-text-muted flex items-center gap-2">
              <span>Confidence: <strong>{modelStatus?.confidence_threshold ?? 0.15}</strong></span>
              <span>•</span>
              <span className="text-rp-accent">IoU Threshold: 0.40</span>
            </div>
          </div>

          <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rp-text-muted">Core Backend Stack</span>
              <Server className="w-4 h-4 text-rp-accent" />
            </div>
            <div className="text-base font-bold text-rp-text">
              FastAPI + PyTorch + OpenCV
            </div>
            <div className="text-[11px] text-rp-text-secondary">
              Port 8000 | Native Local Neural Inference
            </div>
          </div>
        </div>

        {/* Dual-Engine Architecture Section */}
        <div className="bg-rp-card border border-rp-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-rp-text flex items-center gap-2">
              <Layers className="w-5 h-5 text-rp-accent" />
              RoadVanta Dual-Engine YOLO Architecture
            </h3>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Zero Latency Inference
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rp-accent">Engine Alpha: RDD Indian Road Defect Model</span>
                <span className="text-[10px] text-emerald-400 font-mono">5 Classes</span>
              </div>
              <p className="text-xs text-rp-text-secondary leading-relaxed">
                Specialized in deep road cavitations, longitudinal cracks, alligator cracking, and Indian highway surface distress.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded text-[10px] bg-rp-border/50 text-rp-text-muted">D00: Longitudinal</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rp-border/50 text-rp-text-muted">D10: Transverse</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rp-border/50 text-rp-text-muted">D20: Alligator</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rp-border/50 text-rp-accent font-semibold">D40: Pothole</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">Engine Beta: Mobile & Field Camera YOLO</span>
                <span className="text-[10px] text-cyan-400 font-mono">Multi-Scale</span>
              </div>
              <p className="text-xs text-rp-text-secondary leading-relaxed">
                Tuned for hand-held citizen smartphone photos, waterlogged craters, wide-angle dashcams, and adverse lighting conditions.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded text-[10px] bg-rp-border/50 text-rp-text-muted">Water Puddles</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rp-border/50 text-rp-text-muted">Asphalt Breaks</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rp-border/50 text-cyan-400 font-semibold">IoU NMS Merging</span>
              </div>
            </div>
          </div>
        </div>

        {/* YOLO Training & Weights Export Pipeline */}
        <div className="bg-rp-card border border-rp-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-rp-text flex items-center gap-2">
                <Terminal className="w-5 h-5 text-rp-accent" />
                YOLO Neural Training & Model Hot-Reload
              </h3>
              <p className="text-xs text-rp-text-secondary">
                RoadVanta AI natively supports any standard YOLO weights file. Dropping a newly trained <code className="text-rp-accent">best.pt</code> into <code className="text-rp-text">prism_backend/models/</code> instantly updates the system without downtime.
              </p>
            </div>

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rp-accent text-rp-bg font-semibold text-xs hover:bg-cyan-400 transition-all shadow-glow-cyan"
            >
              {copiedSnippet ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSnippet ? 'Copied!' : 'Copy YOLO Script'}
            </button>
          </div>

          {/* Code Snippet Box */}
          <div className="relative rounded-xl overflow-hidden bg-rp-bg border border-rp-border font-mono text-xs text-rp-text-secondary p-4">
            <pre className="overflow-x-auto leading-relaxed">{yoloTrainSnippet}</pre>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-1.5">
              <span className="text-xs font-bold text-rp-accent block">Step 1: Train YOLO</span>
              <p className="text-[11px] text-rp-text-muted leading-relaxed">
                Train the YOLOv8 neural network on annotated road distress images using the command above.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-1.5">
              <span className="text-xs font-bold text-rp-accent block">Step 2: Save best.pt</span>
              <p className="text-[11px] text-rp-text-muted leading-relaxed">
                Save the resulting trained weights <code className="text-rp-accent">best.pt</code> inside <code className="text-rp-text">prism_backend/models/</code>.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-1.5">
              <span className="text-xs font-bold text-rp-accent block">Step 3: Instant Live Activation</span>
              <p className="text-[11px] text-rp-text-muted leading-relaxed">
                The RoadVanta dual-engine adapter automatically hot-loads the weights and activates real-time road hazard detection!
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
                  <td className="py-2.5 px-3 font-mono text-rp-text-muted">./models/best.pt</td>
                  <td className="py-2.5 px-3">Path to trained YOLO weights file (e.g. ./models/best.pt). Loaded automatically on startup.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-rp-accent">POTHOLE_CONFIDENCE_THRESHOLD</td>
                  <td className="py-2.5 px-3 font-mono text-rp-text-muted">0.15</td>
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
