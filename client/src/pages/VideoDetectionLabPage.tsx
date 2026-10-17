import React, { useState, useRef } from 'react';
import {
  Video,
  Upload,
  Play,
  Pause,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  FileVideo,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SidebarLayout } from '../components/SidebarLayout';
import prismApi, { getAssetUrl, VideoAnalysisResponse, VideoSampledFrame } from '../services/prismApi';

export const VideoDetectionLabPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [samplingInterval, setSamplingInterval] = useState<number>(1.0);
  const [maxDuration, setMaxDuration] = useState<number>(20.0);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<VideoAnalysisResponse | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<VideoSampledFrame | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Video exceeds 50 MB limit.');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setResults(null);
      setSelectedFrame(null);
      toast.success(`Loaded video: ${file.name}`);
    }
  };

  const handleProcessVideo = async () => {
    if (!selectedFile) {
      toast.error('Please upload a video file first.');
      return;
    }

    setIsProcessing(true);
    toast.loading('Extracting keyframes and processing via OpenCV...', { id: 'vid-proc' });

    try {
      const data = await prismApi.analyzeVideo(selectedFile, samplingInterval, maxDuration);
      setResults(data);
      const frames = data.sampled_frames || (data as any).frames || [];
      if (frames.length > 0) {
        setSelectedFrame(frames[0]);
      }
      toast.success(`Video processed: ${frames.length} frames extracted!`, { id: 'vid-proc' });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Video processing failed.', { id: 'vid-proc' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleVideo = async () => {
    setIsProcessing(true);
    toast.loading('Loading sample patrol footage...', { id: 'sample-vid' });
    try {
      const response = await fetch('/samples/sample_dashcam_patrol.mp4');
      const blob = await response.blob();
      const file = new File([blob], 'sample_dashcam_patrol.mp4', { type: 'video/mp4' });
      setSelectedFile(file);
      setVideoUrl(URL.createObjectURL(blob));
      toast.loading('Running OpenCV & YOLOv8 on sample footage...', { id: 'sample-vid' });

      const data = await prismApi.analyzeVideo(file, samplingInterval, maxDuration);
      setResults(data);
      const frames = data.sampled_frames || (data as any).frames || [];
      if (frames.length > 0) {
        setSelectedFrame(frames[0]);
      }
      toast.success(`Analysis ready: ${frames.length} keyframes extracted with YOLO detections!`, { id: 'sample-vid' });
    } catch (err: any) {
      toast.error('Could not load sample video: ' + (err.message || 'Error'), { id: 'sample-vid' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rp-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-rp-accent/15 text-rp-accent border border-rp-accent/30">
                Video Inspection Lab
              </span>
              <span className="text-xs text-rp-text-muted">Temporal Frame Sampling & Pavement Patrol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text">
              Road Video Defect Analysis
            </h1>
            <p className="text-sm text-rp-text-secondary mt-1">
              Upload dashcam or patrol footage to extract frames at regular intervals and inspect pavement cavitations.
            </p>
          </div>
        </div>

        {/* Deduplication & Model Limitations Alert */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200">
          <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">
              Scientific Guardrail: Defect Deduplication
            </p>
            <p className="text-amber-200/90 leading-relaxed">
              Repeated detections across consecutive video frames do not necessarily indicate separate physical potholes. Without multi-object camera trajectory tracking, frame counts are shown per time-stamp rather than as distinct physical infrastructure hazards.
            </p>
          </div>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Video Player & Frame Gallery (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Video Player */}
            <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rp-text flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-rp-accent" />
                  Patrol Video Stream
                </span>
                {selectedFile && (
                  <span className="text-xs font-mono text-rp-text-muted truncate max-w-xs">
                    {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                )}
              </div>

              <div className="aspect-video w-full rounded-xl bg-rp-bg-secondary flex items-center justify-center overflow-hidden border border-rp-border">
                {videoUrl ? (
                  <video
                    ref={videoPlayerRef}
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 text-center flex flex-col items-center justify-center cursor-pointer hover:border-rp-accent/50 transition-all border-2 border-dashed border-rp-border rounded-xl w-full m-4"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-rp-accent/10 border border-rp-accent/30 flex items-center justify-center text-rp-accent mb-3">
                      <Video className="w-7 h-7" />
                    </div>
                    <h3 className="font-heading font-bold text-rp-text text-sm">
                      Upload Dashcam or Patrol Video
                    </h3>
                    <p className="text-xs text-rp-text-muted mt-1 max-w-xs">
                      Supports MP4 and MOV formats (up to 50 MB, max 30s recommended for instant processing).
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-4 py-2 rounded-xl bg-rp-accent text-rp-bg font-semibold text-xs hover:bg-cyan-400 transition-all shadow-sm"
                      >
                        Browse Video
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadSampleVideo();
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        ⚡ Try Sample Dashcam Video (NH-27)
                      </button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Extracted Sampled Frames Gallery */}
            {results && (
              <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-rp-text flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rp-accent" />
                    Sampled Keyframes ({results.sampled_frames.length})
                  </h3>
                  <span className="text-xs text-rp-text-muted">
                    Interval: {samplingInterval}s | Duration: {results.video_duration_sec}s
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {results.sampled_frames.map((frame) => (
                    <div
                      key={frame.frame_index}
                      onClick={() => setSelectedFrame(frame)}
                      className={`cursor-pointer rounded-xl border overflow-hidden p-1.5 transition-all ${
                        selectedFrame?.frame_index === frame.frame_index
                          ? 'border-rp-accent bg-rp-accent/15 shadow-glow-cyan'
                          : 'border-rp-border bg-rp-bg-secondary hover:border-rp-text-muted'
                      }`}
                    >
                      <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                        <img
                          src={getAssetUrl(frame.frame_url || (frame as any).frame_image_url)}
                          alt={`Frame ${frame.timestamp_formatted || (frame as any).formatted_timestamp}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-rp-text">
                          {frame.timestamp_formatted || (frame as any).formatted_timestamp}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-rp-text-muted">Frame #{frame.frame_index}</span>
                        <span className={frame.detections_count > 0 ? 'text-amber-400 font-bold' : 'text-rp-text-muted'}>
                          {frame.detections_count} detections
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Frame Detail Inspector */}
                {selectedFrame && (
                  <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-rp-text flex items-center gap-2">
                        <Clock className="w-4 h-4 text-rp-accent" />
                        Timestamp: {selectedFrame.timestamp_formatted} ({selectedFrame.timestamp_seconds.toFixed(2)}s)
                      </span>
                      <span className="text-xs text-rp-text-muted">
                        Frame #{selectedFrame.frame_index}
                      </span>
                    </div>

                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                      <img
                        src={getAssetUrl(selectedFrame.frame_url || (selectedFrame as any).frame_image_url)}
                        alt="Inspected Frame"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Processing Controls (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-rp-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rp-accent" />
                Frame Sampling Parameters
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-rp-text-muted mb-1">
                    <span>Sampling Interval</span>
                    <span className="font-mono text-rp-text">{samplingInterval.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.5"
                    value={samplingInterval}
                    onChange={(e) => setSamplingInterval(parseFloat(e.target.value))}
                    className="w-full accent-rp-accent"
                  />
                  <p className="text-[10px] text-rp-text-muted mt-1">
                    Extracts 1 frame every {samplingInterval} second(s) of video footage.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-rp-text-muted mb-1">
                    <span>Max Process Duration</span>
                    <span className="font-mono text-rp-text">{maxDuration}s</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(parseInt(e.target.value))}
                    className="w-full accent-rp-accent"
                  />
                  <p className="text-[10px] text-rp-text-muted mt-1">
                    Caps processing to prevent memory saturation on long dashcam videos.
                  </p>
                </div>
              </div>

              <button
                onClick={handleProcessVideo}
                disabled={isProcessing || !selectedFile}
                className="w-full py-3 rounded-xl bg-rp-accent text-rp-bg font-bold text-xs hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-glow-cyan"
              >
                <Video className="w-4 h-4" />
                {isProcessing ? 'Processing Video Frames...' : 'Extract & Analyze Video'}
              </button>
            </div>

            {/* Results Summary Box */}
            {results && (
              <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-3">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-rp-text-muted">
                  Extraction Metrics
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-rp-bg-secondary border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted block">Duration</span>
                    <span className="font-bold text-rp-text">{results.video_duration_sec}s</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rp-bg-secondary border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted block">FPS</span>
                    <span className="font-bold text-rp-text">{results.fps}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rp-bg-secondary border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted block">Sampled Frames</span>
                    <span className="font-bold text-rp-accent">{results.total_frames_sampled}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rp-bg-secondary border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted block">Frames w/ Defect</span>
                    <span className="font-bold text-amber-400">{results.frames_with_detections}</span>
                  </div>
                </div>

                <p className="text-[11px] text-rp-text-secondary leading-relaxed bg-rp-bg-secondary p-2.5 rounded-xl border border-rp-border">
                  {results.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default VideoDetectionLabPage;
