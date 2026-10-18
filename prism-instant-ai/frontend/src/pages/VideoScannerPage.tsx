import React, { useState, useRef } from 'react';
import {
  Video,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';

export const VideoScannerPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [intervalSec, setIntervalSec] = useState<number>(1.0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    const validExts = ['.mp4', '.avi', '.mov', '.mkv'];
    const lower = file.name.toLowerCase();
    if (!validExts.some((ext) => lower.endsWith(ext))) {
      setError('Please upload a valid video file (MP4, AVI, MOV, MKV).');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('Video file exceeds 100MB patrol limit.');
      return;
    }
    setSelectedFile(file);
    setResult(null);
    setError(null);
  };

  const runVideoScan = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await api.scanVideo(selectedFile, intervalSec);
      setResult(res);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Video frame analysis failed.';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Video className="w-5 h-5 text-cyan-400" />
          <span>Continuous Video Corridor Scanner</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          OpenCV frame extraction with synchronized Ultralytics inference across roadway video feeds.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload and Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
          <h2 className="text-sm font-bold text-gray-200">Video Feed Input</h2>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 hover:border-cyan-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-gray-900/40 transition group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            />
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="text-xs font-semibold text-gray-200">
              Drag &amp; drop corridor video, or <span className="text-cyan-400 underline">browse files</span>
            </p>
            <p className="text-[10px] text-gray-500 mt-1">MP4, MOV, AVI up to 100MB</p>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
              <div className="truncate max-w-[300px]">
                <div className="font-semibold text-gray-200 truncate">{selectedFile.name}</div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                type="button"
                onClick={runVideoScan}
                disabled={processing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs shadow-glow-emerald transition flex items-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Frames...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" />
                    <span>ANALYZE VIDEO</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Sampling Configuration */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
          <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Sampling Controls</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Frame Sample Interval ({intervalSec}s)
            </label>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={intervalSec}
              onChange={(e) => setIntervalSec(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
              <span>Dense (0.5s)</span>
              <span>Default (1.0s)</span>
              <span>Sparse (5.0s)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 text-[11px] text-gray-400 space-y-2">
            <span className="font-semibold text-gray-300 block">Deduplication Standard:</span>
            <span>
              Consecutive frame detections represent instantaneous camera observations along a moving vehicle and are aggregated per timestamp.
            </span>
          </div>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="p-6 rounded-2xl bg-[#111827] border border-cyan-500/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Video Analysis Complete</span>
              </h2>
              <span className="text-xs text-gray-400 font-mono">
                SCAN ID: {result.scan_id} &bull; Latency: {result.total_duration_ms?.toFixed(0)} ms
              </span>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-mono">
                {result.frames_analyzed} Frames Sampled
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono">
                {result.total_detections} Total Detections
              </span>
            </div>
          </div>

          {result.frame_results && result.frame_results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] font-mono border-b border-gray-800">
                  <tr>
                    <th className="py-2.5 px-3">Frame #</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Hazard Detections</th>
                    <th className="py-2.5 px-3">Peak Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-gray-300">
                  {result.frame_results.map((f: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-800/30 font-mono">
                      <td className="py-2.5 px-3 font-semibold text-white">#{f.frame_number}</td>
                      <td className="py-2.5 px-3 text-cyan-400">{f.timestamp_sec?.toFixed(2)}s</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.detection_count > 0
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {f.detection_count} defects
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-400">
                        {f.max_confidence ? `${(f.max_confidence * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-500 font-mono">
              No hazard defects detected along the sampled video frames.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
