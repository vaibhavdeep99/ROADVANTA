import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  RefreshCw,
  Maximize2,
  FileText,
  Scan,
  ShieldAlert,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SidebarLayout } from '../components/SidebarLayout';
import prismApi, {
  VisionEnhancementResponse,
  ImageAnalysisResponse,
  ModelStatusResponse,
} from '../services/prismApi';

export const RoadVisionLabPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Uploaded image state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Enhancement parameters
  const [activeMode, setActiveMode] = useState<'original' | 'clahe' | 'grayscale' | 'gamma' | 'sharpen' | 'edges' | 'adaptive_thresh'>('clahe');
  const [contrast, setContrast] = useState<number>(1.2);
  const [brightness, setBrightness] = useState<number>(5);
  const [gamma, setGamma] = useState<number>(1.0);
  const [sharpenIntensity, setSharpenIntensity] = useState<number>(1.0);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [enhancedResult, setEnhancedResult] = useState<VisionEnhancementResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Model status
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);

  // View state: 'split', 'enhanced_only', 'original_only'
  const [viewMode, setViewMode] = useState<'split' | 'enhanced_only' | 'original_only'>('split');
  const [splitPos, setSplitPos] = useState<number>(50);

  // Form details for auto-saving report
  const [reportCity, setReportCity] = useState<string>('Indore');
  const [reportAddress, setReportAddress] = useState<string>('AB Road Corridor, Near Bypass');
  const [savedReportId, setSavedReportId] = useState<string | null>(null);

  // Fetch model status on mount
  useEffect(() => {
    prismApi.getModelStatus()
      .then(setStatus => setModelStatus(setStatus))
      .catch(() => {
        // Fallback status if offline
        setModelStatus({
          model_configured: false,
          status: 'AI model not configured',
          model_path: 'Not configured',
          confidence_threshold: 0.45,
          supported_architectures: ['YOLOv8 (.pt)', 'YOLOv11 (.pt)', 'ONNX'],
          training_pipeline_compatibility: ['Google Colab', 'Roboflow'],
          colab_instructions: 'Train a YOLO model in Google Colab and place best.pt into prism_backend/models/',
          roboflow_compatibility: 'Supports Roboflow pothole dataset export',
          instructions: 'Configure POTHOLE_MODEL_PATH in environment',
        });
      });
  }, []);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File size exceeds 15 MB limit.');
        return;
      }
      setSelectedFile(file);
      const objUrl = URL.createObjectURL(file);
      setPreviewUrl(objUrl);
      setEnhancedResult(null);
      setAnalysisResult(null);
      setSavedReportId(null);
      toast.success(`Loaded image: ${file.name}`);
    }
  };

  // Run OpenCV enhancement pipeline
  const runEnhancement = async (mode = activeMode) => {
    if (!selectedFile) {
      toast.error('Please upload an image first.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await prismApi.enhanceImage(selectedFile, {
        mode,
        contrast,
        brightness,
        gamma,
        sharpen_intensity: sharpenIntensity,
      });
      setEnhancedResult(res);
      toast.success(`OpenCV ${mode.toUpperCase()} applied`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Image enhancement failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run AI pothole analysis
  const runDetection = async (save = true) => {
    if (!selectedFile) {
      toast.error('Please upload an image first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await prismApi.analyzeImage(selectedFile, {
        autoSaveReport: save,
        city: reportCity,
        address: reportAddress,
      });
      setAnalysisResult(res);
      if (res.saved_report) {
        setSavedReportId(res.saved_report.id);
        toast.success(`Saved as report ${res.saved_report.id}!`);
      } else {
        toast.success('Inference completed.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Inference analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset controls
  const handleReset = () => {
    setActiveMode('clahe');
    setContrast(1.2);
    setBrightness(5);
    setGamma(1.0);
    setSharpenIntensity(1.0);
    if (selectedFile) {
      runEnhancement('clahe');
    }
  };

  const displayImage = enhancedResult?.base64_data || previewUrl;

  return (
    <SidebarLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header with Product Tagline */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rp-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-rp-accent/15 text-rp-accent border border-rp-accent/30">
                Road Vision Lab
              </span>
              <span className="text-xs text-rp-text-muted">OpenCV Image Enhancement & AI Workstation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text">
              Pothole Vision & Detection Studio
            </h1>
            <p className="text-sm text-rp-text-secondary mt-1">
              Enhance low-contrast road surfaces, inspect cavitation edges, and run trained neural detection.
            </p>
          </div>

          {/* Model Status Pill */}
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${
              modelStatus?.model_configured 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' 
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <Cpu className="w-4 h-4" />
              <span>
                {modelStatus?.model_configured ? 'Trained YOLO Model Active' : 'AI Model Not Configured (Lab Active)'}
              </span>
            </div>
          </div>
        </div>

        {/* Model Disclaimer Notice */}
        {!modelStatus?.model_configured && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">
                Honest Fallback: Zero Synthetic Hallucination
              </p>
              <p className="text-amber-200/90 leading-relaxed">
                No YOLO model weight file (.pt) is linked in <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-300">POTHOLE_MODEL_PATH</code>. The system will NOT generate fake bounding boxes. All OpenCV enhancement algorithms (CLAHE, Gamma correction, Canny Edge highlight, Adaptive Thresholding) are running live on the Python backend.
              </p>
            </div>
          </div>
        )}

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Canvas & Viewer Area (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-rp-card border border-rp-border rounded-2xl p-4 overflow-hidden relative min-h-[460px] flex flex-col justify-between">
              {/* Top Canvas Controls Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-rp-border/60 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-rp-text flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-rp-accent" />
                    Inspection Viewport
                  </span>
                  {enhancedResult && (
                    <span className="text-[10px] bg-rp-accent/20 text-rp-accent px-2 py-0.5 rounded font-mono">
                      MODE: {enhancedResult.mode.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* View toggles */}
                <div className="flex items-center gap-1 bg-rp-bg-secondary p-1 rounded-xl border border-rp-border">
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                      viewMode === 'split' ? 'bg-rp-accent text-rp-bg font-semibold' : 'text-rp-text-muted hover:text-rp-text'
                    }`}
                  >
                    Split Compare
                  </button>
                  <button
                    onClick={() => setViewMode('enhanced_only')}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                      viewMode === 'enhanced_only' ? 'bg-rp-accent text-rp-bg font-semibold' : 'text-rp-text-muted hover:text-rp-text'
                    }`}
                  >
                    Enhanced
                  </button>
                  <button
                    onClick={() => setViewMode('original_only')}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                      viewMode === 'original_only' ? 'bg-rp-accent text-rp-bg font-semibold' : 'text-rp-text-muted hover:text-rp-text'
                    }`}
                  >
                    Original
                  </button>
                </div>
              </div>

              {/* Main Image Viewport Area */}
              <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden rounded-xl bg-rp-bg/80 border border-rp-border/40 select-none">
                {previewUrl ? (
                  <div className="relative w-full h-[400px] flex items-center justify-center">
                    {/* View Modes */}
                    {viewMode === 'enhanced_only' && (
                      <img
                        src={enhancedResult?.base64_data || previewUrl}
                        alt="Enhanced View"
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    )}

                    {viewMode === 'original_only' && (
                      <img
                        src={previewUrl}
                        alt="Original View"
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    )}

                    {viewMode === 'split' && (
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* Background: Original */}
                        <img
                          src={previewUrl}
                          alt="Original Road"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                        {/* Foreground: Enhanced clipped */}
                        {enhancedResult?.base64_data && (
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
                          >
                            <img
                              src={enhancedResult.base64_data}
                              alt="Enhanced Road"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        {/* Split Slider Handle */}
                        {enhancedResult?.base64_data && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-rp-accent cursor-ew-resize z-20"
                            style={{ left: `${splitPos}%` }}
                          >
                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-rp-accent text-rp-bg flex items-center justify-center shadow-lg text-[10px] font-bold">
                              ⇄
                            </div>
                          </div>
                        )}
                        {/* Interactive Range Input overlay */}
                        {enhancedResult?.base64_data && (
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={splitPos}
                            onChange={(e) => setSplitPos(Number(e.target.value))}
                            className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-12 text-center flex flex-col items-center justify-center cursor-pointer hover:border-rp-accent/50 transition-all border-2 border-dashed border-rp-border rounded-xl w-full m-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-rp-accent/10 border border-rp-accent/30 flex items-center justify-center text-rp-accent mb-4">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <h3 className="font-heading font-bold text-rp-text text-base">
                      Upload Road Damage Photograph
                    </h3>
                    <p className="text-xs text-rp-text-muted mt-1 max-w-sm">
                      Select or drag-and-drop a JPG, PNG, or WebP road image (up to 15 MB).
                    </p>
                    <button className="mt-4 px-4 py-2 rounded-xl bg-rp-accent text-rp-bg font-semibold text-xs hover:bg-cyan-400 transition-all">
                      Choose File
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Bottom Enhancement Disclaimer */}
              <div className="text-[11px] text-rp-text-muted flex items-center gap-2 pt-2 border-t border-rp-border/60">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  Vision disclaimer: Image enhancement clarifies surface contrast for human review but does NOT certify pavement structural depth or core integrity.
                </span>
              </div>
            </div>

            {/* Analysis & Inference Card */}
            {analysisResult && (
              <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scan className="w-5 h-5 text-rp-accent" />
                    <h3 className="font-heading font-bold text-sm text-rp-text">
                      Neural Inference & Severity Assessment
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-rp-text-muted">
                    STATUS: {analysisResult.inference.inference_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-rp-bg-secondary p-3 rounded-xl border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted block">Detected Defects</span>
                    <span className="text-lg font-bold text-rp-accent">
                      {analysisResult.inference.detected_count}
                    </span>
                  </div>
                  <div className="bg-rp-bg-secondary p-3 rounded-xl border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted block">Preliminary Severity</span>
                    <span className="text-sm font-bold capitalize text-amber-400">
                      {analysisResult.inference.preliminary_severity.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="bg-rp-bg-secondary p-3 rounded-xl border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted block">Priority Score</span>
                    <span className="text-lg font-bold text-rp-text">
                      {analysisResult.inference.priority_score}/100
                    </span>
                  </div>
                  <div className="bg-rp-bg-secondary p-3 rounded-xl border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted block">Model Identifier</span>
                    <span className="text-xs font-semibold text-rp-text-secondary truncate block">
                      {analysisResult.inference.model_identifier}
                    </span>
                  </div>
                </div>

                <div className="bg-rp-bg-secondary/60 rounded-xl p-3 border border-rp-border text-xs text-rp-text-secondary">
                  <p className="leading-relaxed">
                    <strong className="text-rp-text">Assessment Note: </strong>
                    {analysisResult.inference.explanation}
                  </p>
                </div>

                {savedReportId && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Report saved in database as <strong>{savedReportId}</strong></span>
                    </div>
                    <a
                      href="/reports"
                      className="flex items-center gap-1 font-semibold underline text-emerald-300 hover:text-emerald-200"
                    >
                      View in Report Registry <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Controls Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Action Bar */}
            <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-rp-text flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rp-accent" />
                OpenCV Enhancement Suite
              </h3>

              {/* Mode Selection Chips */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'clahe', label: 'CLAHE Contrast' },
                  { id: 'sharpen', label: 'Edge Sharpening' },
                  { id: 'edges', label: 'Canny / Sobel' },
                  { id: 'adaptive_thresh', label: 'Adaptive Boundary' },
                  { id: 'gamma', label: 'Gamma Correction' },
                  { id: 'grayscale', label: 'Monochrome Grayscale' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveMode(m.id as any);
                      if (selectedFile) runEnhancement(m.id as any);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all ${
                      activeMode === m.id
                        ? 'bg-rp-accent/20 border-rp-accent text-rp-accent font-semibold shadow-glow-cyan'
                        : 'bg-rp-bg-secondary border-rp-border text-rp-text-secondary hover:text-rp-text'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Sliders */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs text-rp-text-muted mb-1">
                    <span>Contrast Multiplier</span>
                    <span className="font-mono text-rp-text">{contrast.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={contrast}
                    onChange={(e) => setContrast(parseFloat(e.target.value))}
                    className="w-full accent-rp-accent"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-rp-text-muted mb-1">
                    <span>Brightness Offset</span>
                    <span className="font-mono text-rp-text">{brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="5"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full accent-rp-accent"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-rp-text-muted mb-1">
                    <span>Gamma Power</span>
                    <span className="font-mono text-rp-text">{gamma.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="2.2"
                    step="0.1"
                    value={gamma}
                    onChange={(e) => setGamma(parseFloat(e.target.value))}
                    className="w-full accent-rp-accent"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-rp-text-muted mb-1">
                    <span>Sharpening Intensity</span>
                    <span className="font-mono text-rp-text">{sharpenIntensity.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.2"
                    value={sharpenIntensity}
                    onChange={(e) => setSharpenIntensity(parseFloat(e.target.value))}
                    className="w-full accent-rp-accent"
                  />
                </div>
              </div>

              {/* Enhancement Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => runEnhancement()}
                  disabled={isProcessing || !selectedFile}
                  className="flex-1 py-2.5 rounded-xl bg-rp-accent text-rp-bg font-semibold text-xs hover:bg-cyan-400 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isProcessing ? 'Processing OpenCV...' : 'Apply Filters'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-2.5 rounded-xl bg-rp-bg-secondary border border-rp-border text-rp-text-secondary hover:text-rp-text text-xs"
                  title="Reset to defaults"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Run AI Detection & Auto-Save */}
            <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-rp-text flex items-center gap-2">
                <Scan className="w-4 h-4 text-rp-accent" />
                Report Registration
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-rp-text-muted block mb-1">
                    Municipal City
                  </label>
                  <input
                    type="text"
                    value={reportCity}
                    onChange={(e) => setReportCity(e.target.value)}
                    className="w-full px-3 py-2 bg-rp-bg-secondary border border-rp-border rounded-xl text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-rp-text-muted block mb-1">
                    Corridor / Address
                  </label>
                  <input
                    type="text"
                    value={reportAddress}
                    onChange={(e) => setReportAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-rp-bg-secondary border border-rp-border rounded-xl text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                  />
                </div>
              </div>

              <button
                onClick={() => runDetection(true)}
                disabled={isAnalyzing || !selectedFile}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rp-accent to-blue-500 text-rp-bg font-bold text-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-glow-cyan"
              >
                <Scan className="w-4 h-4" />
                {isAnalyzing ? 'Running Inference...' : 'Run Detection & Save Report'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default RoadVisionLabPage;
