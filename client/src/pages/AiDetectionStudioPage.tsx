import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Upload,
  Scan,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Download,
  PlusCircle,
  ShieldCheck,
  Info,
  Maximize2,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import { SidebarLayout } from '../components/SidebarLayout';

const SAMPLES = [
  {
    id: 'sample-pothole',
    name: 'Highway Pothole',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    type: 'pothole',
    desc: 'Deep asphalt cavity crater in travel lane',
  },
  {
    id: 'sample-water',
    name: 'Roadway Waterlogging',
    url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
    type: 'waterlogging',
    desc: 'Submerged travel corridor & curb flooding',
  },
  {
    id: 'sample-crack',
    name: 'Asphalt Fatigue Cracks',
    url: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=1200&q=80',
    type: 'road_crack',
    desc: 'Alligator and transverse pavement stress cracks',
  },
  {
    id: 'sample-normal',
    name: 'Undamaged Highway',
    url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
    type: 'normal_road',
    desc: 'Pristine, smooth asphalt surface with no defects',
  },
];

interface AnalysisData {
  hasHazard: boolean;
  detectedCategories: string[];
  suggestedTitle: string;
  suggestedCategory: string;
  suggestedSeverity: string;
  suggestedPriorityScore: number;
  confidence: number;
  explanation: string;
  recommendedAction: string;
  limitations: string;
  modelIdentifier: string;
  timestamp: string;
  boundingBoxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    confidence: number;
  }>;
}

export const AiDetectionStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeImage, setActiveImage] = useState<string>(SAMPLES[0].url);
  const [activeBoxes, setActiveBoxes] = useState<any[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanLaser, setScanLaser] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  // Trigger AI Vision Detection via backend /api/v1/detect
  const triggerAnalysis = async (imageUrlOrBlob: string, file?: File) => {
    setAnalyzing(true);
    setScanLaser(true);
    setSelectedBoxId(null);

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        res = await api.post('/detect', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/detect', { imageUrl: imageUrlOrBlob });
      }

      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        const boxes = (d.detection?.boundingBoxes || d.boundingBoxes || []).map((b: any, idx: number) => ({
          id: `box-${idx}`,
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          label: `${b.label || d.suggestedCategory} ${(b.confidence ? (b.confidence * 100).toFixed(0) : '90')}%`,
          severity: d.suggestedSeverity || 'medium',
          color:
            d.suggestedSeverity === 'critical'
              ? '#F43F5E'
              : d.suggestedSeverity === 'high'
              ? '#FB7185'
              : d.suggestedSeverity === 'medium'
              ? '#F59E0B'
              : '#06B6D4',
        }));

        setActiveBoxes(d.hasHazard ? boxes : []);
        setAnalysisResult({
          hasHazard: d.hasHazard ?? (d.suggestedCategory !== 'normal_road' && d.suggestedCategory !== 'unrelated'),
          detectedCategories: d.detectedCategories || [d.suggestedCategory],
          suggestedTitle: d.suggestedTitle || (d.hasHazard ? 'Hazard Identified' : 'Undamaged Road Surface'),
          suggestedCategory: d.suggestedCategory || 'other',
          suggestedSeverity: d.suggestedSeverity || 'none',
          suggestedPriorityScore: d.suggestedPriorityScore ?? (d.hasHazard ? 75 : 0),
          confidence: Math.round((d.confidence || d.detection?.modelConfidence || 0.92) * 100),
          explanation: d.explanation || d.safetySummary || 'Optical road surface evaluation complete.',
          recommendedAction: d.recommendedAction || 'Schedule road inspection.',
          limitations: d.limitations || 'Optical visual analysis only. Does not replace core ultrasound testing.',
          modelIdentifier: d.modelIdentifier || d.detection?.modelName || 'RoadVanta YOLOv8 Neural Engine (Active)',
          timestamp: d.timestamp || new Date().toISOString(),
          boundingBoxes: boxes,
        });

        if (d.hasHazard === false) {
          toast.success('Clean Road Detected: No visible hazards found!');
        } else {
          toast.success(`Hazard Detected: ${d.suggestedCategory.replace('_', ' ').toUpperCase()} (${Math.round((d.confidence || 0.92) * 100)}%)`);
        }
      }
    } catch (err: any) {
      console.warn('Vision detection note:', err.message);
      toast.error('AI Vision analysis unavailable. Please check image format or retry.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLES[0]) => {
    setActiveImage(sample.url);
    triggerAnalysis(sample.url);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    setActiveImage(url);
    triggerAnalysis(url, file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleCreateReport = () => {
    navigate('/report', {
      state: {
        prefilledCategory: analysisResult?.hasHazard ? analysisResult.suggestedCategory : 'pothole',
        prefilledTitle: analysisResult?.suggestedTitle,
        prefilledSeverity: analysisResult?.hasHazard ? analysisResult.suggestedSeverity : 'medium',
      },
    });
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Title Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rp-accent/15 border border-rp-accent/30 text-rp-accent text-xs font-semibold mb-2 shadow-glow-cyan">
            <Sparkles className="w-3.5 h-3.5" />
            RoadVanta YOLOv8 Neural Vision Engine (Active)
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text">
            AI Detection Studio
          </h1>
          <p className="text-rp-text-secondary text-xs sm:text-sm mt-1">
            Real-time multimodal computer vision to classify potholes, asphalt cracks, waterlogging, and normal road surfaces.
          </p>
        </div>

        {/* 2-Column Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Upload Box + Sample Images (Cols 1-5) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Drag & Drop Upload Container */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rp-card border-dashed border-2 transition-all cursor-pointer p-8 text-center rounded-2xl group relative overflow-hidden ${
                isDragOver
                  ? 'border-rp-accent bg-rp-accent/10 shadow-glow-cyan scale-[1.01]'
                  : 'border-rp-border hover:border-rp-accent/70 bg-rp-card/50 hover:bg-rp-card'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-rp-accent/10 border border-rp-accent/20 flex items-center justify-center mx-auto mb-4 text-rp-accent group-hover:scale-110 transition-transform shadow-glow-cyan">
                <Upload className="w-8 h-8" />
              </div>

              <h4 className="font-heading font-bold text-sm text-rp-text">
                {isDragOver ? 'Drop road photo now...' : 'Drag & drop a road photo here'}
              </h4>
              <p className="text-xs text-rp-accent hover:underline mt-1 font-medium">
                or Click to browse file
              </p>

              <div className="mt-4 pt-3 border-t border-rp-border/50 text-[10px] text-rp-text-muted">
                Supports: JPG, PNG, WEBP (Max 10MB) • Official Vision Model
              </div>
            </div>

            {/* Analyze Road Primary Button */}
            <div className="flex gap-2">
              <button
                onClick={() => triggerAnalysis(activeImage)}
                disabled={analyzing}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-rp-accent to-cyan-500 text-rp-bg font-heading font-bold text-sm tracking-wide shadow-glow-cyan hover:shadow-glow-cyan-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing with YOLOv8 Engine...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    Re-Analyze Active Image
                  </>
                )}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-3.5 rounded-xl bg-rp-card border border-rp-border hover:border-rp-accent/40 text-xs font-semibold text-rp-text hover:bg-rp-card-elevated transition-colors"
                title="Upload Another Image"
              >
                Try Another
              </button>
            </div>

            {/* Sample Images Gallery */}
            <div className="rp-card bg-rp-card-elevated">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rp-text-muted block mb-3">
                Pre-Tested Benchmark Images (Click to Scan)
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                {SAMPLES.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className={`relative rounded-xl overflow-hidden border-2 text-left transition-all aspect-video group ${
                      activeImage === sample.url
                        ? 'border-rp-accent shadow-glow-cyan scale-[1.02]'
                        : 'border-rp-border hover:border-rp-accent/50 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2">
                      <span className="text-[10px] font-bold text-white truncate">
                        {sample.name}
                      </span>
                      <span className="text-[8px] text-rp-text-muted truncate">
                        {sample.type === 'normal_road' ? '🟢 Normal Road' : '⚠️ Hazard Scene'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Visual Bounding Box Tracer + Detection Results (Cols 6-12) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Live Bounding Box Image Canvas */}
            <div className="rp-card bg-rp-card-elevated p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-rp-text">
                    Visual Inference Trace
                  </span>
                  <span className="text-[10px] text-rp-text-muted">
                    {analyzing
                      ? '(Tracing features...)'
                      : analysisResult?.hasHazard === false
                      ? '(0 hazards detected — Surface clean)'
                      : `(${activeBoxes.length} hazard zone${activeBoxes.length === 1 ? '' : 's'} localized)`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {analyzing ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rp-accent/15 border border-rp-accent/30 text-rp-accent text-[10px] font-bold uppercase tracking-wider animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Neural Sweep Active
                    </span>
                  ) : analysisResult?.hasHazard === false ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3" /> Undamaged Road
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" /> Hazard Confirmed
                    </span>
                  )}
                </div>
              </div>

              {/* Main Image with Live Traced Bounding Boxes */}
              <div className="relative rounded-xl overflow-hidden border border-rp-border bg-black aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center select-none shadow-2xl">
                <img
                  src={activeImage}
                  alt="Road Visual"
                  className="w-full h-full object-cover"
                />

                {/* Laser scan line animation */}
                {scanLaser && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-glow-cyan animate-scan-line" />
                  </div>
                )}

                {/* Bounding Box Overlays */}
                {activeBoxes.map((box) => {
                  const isSelected = selectedBoxId === box.id;
                  return (
                    <div
                      key={box.id}
                      onClick={() => setSelectedBoxId(isSelected ? null : box.id)}
                      className={`absolute border-2 transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-rp-accent shadow-glow-cyan z-20 scale-[1.02]'
                          : 'border-rose-500 hover:border-rp-accent z-10'
                      }`}
                      style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                      }}
                    >
                      {/* Top Label Tag */}
                      <div className="absolute -top-6 left-0 bg-rose-600/90 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-t tracking-wider shadow-lg whitespace-nowrap flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {box.label}
                      </div>

                      {/* Corner crosshairs */}
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
                      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analysis Results Card */}
            {analysisResult && (
              <div className="rp-card bg-rp-card-elevated space-y-4">
                {/* Result Status Banner */}
                {analysisResult.hasHazard === false ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-emerald-300">
                        No Visible Road Hazards Detected
                      </h4>
                      <p className="text-xs text-rp-text-secondary mt-1">
                        {analysisResult.explanation}
                      </p>
                      <div className="mt-2 text-[11px] text-emerald-400 font-medium">
                        ✓ Recommendation: {analysisResult.recommendedAction}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rp-text-muted block">
                        Hazard Engineering Assessment
                      </span>
                      <span className="text-xs font-mono text-rp-accent font-bold">
                        Priority Score: {analysisResult.suggestedPriorityScore}/100
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rp-card border border-rp-border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-heading font-bold text-sm text-rp-text">
                          {analysisResult.suggestedTitle}
                        </h4>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          analysisResult.suggestedSeverity === 'critical'
                            ? 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                            : analysisResult.suggestedSeverity === 'high'
                            ? 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                            : 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                        }`}>
                          {analysisResult.suggestedSeverity} Severity
                        </span>
                      </div>

                      <p className="text-xs text-rp-text-secondary leading-relaxed mb-3">
                        {analysisResult.explanation}
                      </p>

                      <div className="p-2.5 rounded-lg bg-rp-bg-secondary border border-rp-border/60 text-[11px] space-y-1">
                        <div className="text-rp-accent font-medium">
                          🛠️ Recommended Action: <span className="text-rp-text">{analysisResult.recommendedAction}</span>
                        </div>
                        <div className="text-rp-text-muted text-[10px]">
                          ⚠️ Disclaimer: {analysisResult.limitations}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Model Details Bar */}
                <div className="flex items-center justify-between text-[10px] text-rp-text-muted pt-2 border-t border-rp-border">
                  <span>Engine: <strong className="text-rp-text">{analysisResult.modelIdentifier}</strong></span>
                  <span>Confidence: <strong className="text-rp-accent">{analysisResult.confidence}%</strong></span>
                  <span>Evaluated: {new Date(analysisResult.timestamp).toLocaleTimeString()}</span>
                </div>

                {/* Action Buttons: Create Road Report & Download */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleCreateReport}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rp-accent to-cyan-400 text-rp-bg font-heading font-bold text-xs tracking-wider uppercase shadow-glow-cyan hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    File Official Road Report
                  </button>

                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify({ activeImage, analysisResult }, null, 2)], {
                        type: 'application/json',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `roadvanta-analysis-${Date.now()}.json`;
                      a.click();
                      toast.success('Hazard assessment report exported!');
                    }}
                    className="px-5 py-3 rounded-xl bg-rp-card border border-rp-border hover:border-rp-accent/40 text-xs font-semibold text-rp-text hover:bg-rp-card-elevated transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Assessment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default AiDetectionStudioPage;
