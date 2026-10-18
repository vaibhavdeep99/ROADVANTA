import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Loader2,
  FileText,
  Eye,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api, ScanResult } from '../services/api';

export const ImageScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Report creation state after scan
  const [submittingReport, setSubmittingReport] = useState(false);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [reportCreatedId, setReportCreatedId] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files (JPEG, PNG, WebP) are supported.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('Image file exceeds 25MB maximum limit.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScanResult(null);
    setError(null);
    setReportCreatedId(null);
    setTitle(`Pothole Hazard - ${file.name.replace(/\.[^/.]+$/, '')}`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const runScan = async () => {
    if (!selectedFile) return;
    setScanning(true);
    setError(null);
    try {
      const res = await api.scanImage(selectedFile);
      setScanResult(res);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Scan inference failed.';
      setError(msg);
    } finally {
      setScanning(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult) return;
    setSubmittingReport(true);
    setError(null);
    try {
      const payload: any = {
        scan_id: scanResult.scan_id,
        title: title || 'Road Surface Anomaly',
        address: address || 'High-Risk Road Segment',
        city: city || 'Field Patrol Sector',
        latitude: latitude !== '' ? Number(latitude) : undefined,
        longitude: longitude !== '' ? Number(longitude) : undefined,
        damage_severity: scanResult.preliminary_severity,
      };
      const rep = await api.createReport(payload);
      setReportCreatedId(rep.id);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit report.';
      setError(msg);
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span>High-Precision Road Image Scanner</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real Ultralytics YOLOv8 inference with bounding box telemetry and genuine confidence scoring.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Upload & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Card */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
          <h2 className="text-sm font-bold text-gray-200">Select Road Photographic Evidence</h2>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 hover:border-cyan-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-gray-900/40 transition group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            />
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="text-xs font-semibold text-gray-200">
              Drag &amp; drop road photo, or <span className="text-cyan-400 underline">browse files</span>
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              Supports JPEG, PNG, WebP up to 25MB (automatic decompression bomb safeguard)
            </p>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
              <div className="truncate max-w-[280px]">
                <div className="font-semibold text-gray-200 truncate">{selectedFile.name}</div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                type="button"
                onClick={runScan}
                disabled={scanning}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs shadow-glow-emerald transition flex items-center gap-2 disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Inference...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" />
                    <span>SCAN NOW</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Quick sample loader notice */}
          <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/80 text-[11px] text-gray-400">
            <span className="font-semibold text-gray-300">True Computer Vision: </span>
            Inference executes genuine YOLO weights. Detections, bounding boxes, and confidence numbers reflect real neural model activations.
          </div>
        </div>

        {/* Preview Card */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-200">Optical Preview &amp; Detections</h2>
              {scanResult && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    scanResult.detected_count > 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {scanResult.detected_count} Hazards Found
                </span>
              )}
            </div>

            <div className="w-full aspect-video rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-center overflow-hidden relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Road Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-600 space-y-2">
                  <Camera className="w-8 h-8 mx-auto" />
                  <span className="text-xs block">No image selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Inference Telemetry readout */}
          {scanResult && (
            <div className="mt-4 p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-gray-950 border border-gray-800">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Detections</div>
                  <div className="text-lg font-bold text-white">{scanResult.detected_count}</div>
                </div>
                <div className="p-2 rounded-lg bg-gray-950 border border-gray-800">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Severity</div>
                  <div
                    className={`text-lg font-bold ${
                      scanResult.preliminary_severity === 'CRITICAL'
                        ? 'text-rose-400'
                        : scanResult.preliminary_severity === 'HIGH'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {scanResult.preliminary_severity}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gray-950 border border-gray-800">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Latency</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {scanResult.inference_duration_ms.toFixed(0)} ms
                  </div>
                </div>
              </div>

              {scanResult.detections.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                    Detected Bounding Coordinates:
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {scanResult.detections.map((d, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded bg-gray-950 border border-gray-800 text-[11px] font-mono flex items-center justify-between text-gray-300"
                      >
                        <span className="text-cyan-400 font-semibold">
                          #{idx + 1} {d.class_name.toUpperCase()}
                        </span>
                        <span>Confidence: {(d.confidence * 100).toFixed(1)}%</span>
                        <span className="text-gray-500">
                          [{d.bounding_box.x1.toFixed(0)}, {d.bounding_box.y1.toFixed(0)} &rarr;{' '}
                          {d.bounding_box.x2.toFixed(0)}, {d.bounding_box.y2.toFixed(0)}]
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Submit Report Form if Scan Succeeded */}
      {scanResult && !reportCreatedId && (
        <div className="p-6 rounded-2xl bg-[#111827] border border-cyan-500/30 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Log Road Damage Report to Municipal Registry
            </h2>
          </div>
          <p className="text-xs text-gray-400">
            Commit this verified AI detection to the PostgreSQL/SQLite database to generate official ReportLab engineering PDFs and initiate municipal repair workflows.
          </p>

          <form onSubmit={handleCreateReport} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Report Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">City / Region</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Vadodara Highway Division"
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">Road / Corridor Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. NH-48 Km 104 Near Karelibaug Interchange"
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Latitude (Optional)</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 22.3072"
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Longitude (Optional)</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 73.1812"
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white font-mono"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={submittingReport}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs shadow-glow-emerald transition flex items-center gap-2 disabled:opacity-50"
              >
                {submittingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Persisting Report...</span>
                  </>
                ) : (
                  <>
                    <span>Submit to Official Registry</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Created Confirmation Banner */}
      {reportCreatedId && (
        <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Report Successfully Logged in Database</span>
            </div>
            <p className="text-xs text-gray-300">
              Assigned unique reference identifier with verified status history tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/reports/${reportCreatedId}`)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-glow-emerald transition flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>View Audit Details &amp; PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
