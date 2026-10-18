import axios from 'axios';
import toast from 'react-hot-toast';

// The client accesses the FastAPI server directly or via Vite proxy
const defaultBaseUrl =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://prism-road-ai-backend.onrender.com'
    : 'http://127.0.0.1:8000';

const rawBaseUrl = import.meta.env.VITE_PRISM_API_URL || defaultBaseUrl;
const PRISM_API_BASE = rawBaseUrl.replace(/\/+$/, '');

const client = axios.create({
  baseURL: PRISM_API_BASE,
  timeout: 60000,
});

export interface DetectionBox {
  class_name: string;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  apparent_area_pct: number;
}

export interface ModelStatusResponse {
  model_configured: boolean;
  status: string;
  model_path: string;
  confidence_threshold: number;
  supported_architectures: string[];
  training_pipeline_compatibility: string[];
  instructions: string;
  engine_version?: string;
  pipeline_type?: string;
}

export interface VisionEnhancementParams {
  mode: 'original' | 'grayscale' | 'clahe' | 'gamma' | 'sharpen' | 'edges' | 'adaptive_thresh';
  contrast?: number;
  brightness?: number;
  gamma?: number;
  sharpen_intensity?: number;
  clip_limit?: number;
}

export interface VisionEnhancementResponse {
  mode: string;
  dimensions: { width: number; height: number; channels: number };
  parameters: Record<string, number>;
  file_url: string;
  base64_data: string;
  disclaimer: string;
}

export interface ImageAnalysisResponse {
  original_image_url: string;
  inference: {
    inference_status: string;
    model_identifier: string;
    detected_count: number;
    detections: DetectionBox[];
    preliminary_severity: string;
    priority_score: number;
    confidence_score: number | null;
    explanation: string;
    annotated_image_url?: string | null;
    processing_time_ms?: number;
    warnings: string[];
  };
  saved_report?: {
    id: string;
    report_number: string;
    workflow_status: string;
  } | null;
}

export interface VideoSampledFrame {
  frame_index: number;
  timestamp_seconds: number;
  timestamp_formatted: string;
  detections_count: number;
  frame_url: string;
  detections: DetectionBox[];
}

export interface VideoAnalysisResponse {
  total_frames_sampled: number;
  frames_with_detections: number;
  total_detections_found: number;
  video_duration_sec: number;
  fps: number;
  sampled_frames: VideoSampledFrame[];
  explanation: string;
}

export interface PrismReport {
  id: string;
  report_number: string;
  title: string;
  description: string;
  category: string;
  estimated_severity: string;
  priority_score: number;
  workflow_status: string;
  verification_status: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  original_image_url: string | null;
  annotated_image_url?: string | null;
  repair_image_url?: string | null;
  model_name?: string | null;
  model_confidence?: number | null;
  detections_count: number;
  is_demo: boolean;
  created_at: string | null;
  detections?: DetectionBox[];
  reviews?: Array<{
    reviewer_name: string;
    decision: string;
    notes: string;
    created_at: string;
  }>;
}

export interface AnalyticsSummary {
  total_reports: number;
  awaiting_inspection: number;
  confirmed_damage: number;
  resolved_reports: number;
  high_priority_candidates: number;
  severity_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
}

export const prismApi = {
  // 1. Health & Model status
  async getHealth() {
    const res = await client.get('/api/health');
    return res.data;
  },

  async getModelStatus(): Promise<ModelStatusResponse> {
    const res = await client.get('/api/model/status');
    return res.data;
  },

  // 2. Road Vision Lab: OpenCV processing
  async enhanceImage(file: File, params: VisionEnhancementParams): Promise<VisionEnhancementResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', params.mode);
    if (params.contrast !== undefined) formData.append('contrast', params.contrast.toString());
    if (params.brightness !== undefined) formData.append('brightness', params.brightness.toString());
    if (params.gamma !== undefined) formData.append('gamma', params.gamma.toString());
    if (params.sharpen_intensity !== undefined) formData.append('sharpen_intensity', params.sharpen_intensity.toString());
    if (params.clip_limit !== undefined) formData.append('clip_limit', params.clip_limit.toString());

    const res = await client.post('/api/vision/enhance', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // 3. Photo Detection Lab: AI analysis + Auto-report creation
  async analyzeImage(
    file: File,
    options: {
      autoSaveReport?: boolean;
      city?: string;
      address?: string;
      latitude?: number | null;
      longitude?: number | null;
    } = {}
  ): Promise<ImageAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('auto_save_report', options.autoSaveReport ? 'true' : 'false');
    if (options.city) formData.append('city', options.city);
    if (options.address) formData.append('address', options.address);
    if (options.latitude !== undefined && options.latitude !== null) {
      formData.append('latitude', options.latitude.toString());
    }
    if (options.longitude !== undefined && options.longitude !== null) {
      formData.append('longitude', options.longitude.toString());
    }

    const res = await client.post('/api/images/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // 4. Video Inspection Lab
  async analyzeVideo(
    file: File,
    samplingIntervalSec = 1.0,
    maxDurationSec = 20.0
  ): Promise<VideoAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sampling_interval_sec', samplingIntervalSec.toString());
    formData.append('max_duration_sec', maxDurationSec.toString());

    const res = await client.post('/api/videos/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // 5. Reports
  async getReports(params: {
    status?: string;
    severity?: string;
    city?: string;
    is_demo?: boolean;
    limit?: number;
  } = {}): Promise<PrismReport[]> {
    const res = await client.get('/api/reports', { params });
    return res.data.data;
  },

  async getReport(id: string): Promise<PrismReport> {
    const res = await client.get(`/api/reports/${id}`);
    return res.data.data;
  },

  async updateReportStatus(
    id: string,
    payload: {
      workflow_status?: string;
      verification_status?: string;
      estimated_severity?: string;
      reviewer_name?: string;
      review_notes?: string;
      repair_image_url?: string;
    }
  ) {
    const res = await client.patch(`/api/reports/${id}/status`, payload);
    return res.data;
  },

  // 6. Analytics & CSV Export
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const res = await client.get('/api/analytics/summary');
    return res.data.data;
  },

  getExportCsvUrl(): string {
    return `${PRISM_API_BASE}/api/reports/export`;
  },

  getReportPdfUrl(reportId: string): string {
    return `${PRISM_API_BASE}/api/reports/${reportId}/pdf`;
  },

  async downloadReportPdf(reportId: string, filename?: string): Promise<void> {
    toast.loading('Generating Statutory Engineering Audit PDF...', { id: 'pdf-dl' });
    const directUrl = this.getReportPdfUrl(reportId);
    const proxyUrl = `/api/reports/${reportId}/pdf`;

    let response: Response | null = null;
    try {
      // 1. Try direct FastAPI backend URL first
      response = await fetch(directUrl, { method: 'GET' });
    } catch {
      // 2. Fallback to Vite proxy URL
      try {
        response = await fetch(proxyUrl, { method: 'GET' });
      } catch (err: any) {
        console.warn('Both direct and proxy fetch failed:', err);
      }
    }

    if (!response || !response.ok) {
      // If direct fetch didn't succeed, try proxy if not tried yet
      if (response && !response.ok) {
        try {
          const fallbackRes = await fetch(proxyUrl, { method: 'GET' });
          if (fallbackRes.ok) {
            response = fallbackRes;
          }
        } catch {
          // ignore
        }
      }
    }

    try {
      if (!response || !response.ok) {
        throw new Error(`Server returned HTTP ${response?.status || 500}`);
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Received empty PDF file');
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const downloadName = filename || `${reportId}_Engineering_Audit_Report.pdf`;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Delay revocation by 20 seconds so browser download manager has time to read the stream
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 20000);

      toast.success(`Statutory Audit PDF Downloaded: ${downloadName}`, { id: 'pdf-dl', duration: 4000 });
    } catch (err: any) {
      console.warn('Blob download error, trying direct window.open:', err);
      try {
        window.open(directUrl, '_blank');
        toast.success('Opening Engineering Audit PDF in new tab...', { id: 'pdf-dl' });
      } catch (openErr: any) {
        toast.error(`Could not download PDF: ${err.message}`, { id: 'pdf-dl' });
      }
    }
  },

  // 7. Dataset Pipeline & Official Accident Analytics
  async getDatasetStatus() {
    const res = await client.get('/api/dataset/status');
    return res.data.data;
  },

  async getOfficialAccidentStats() {
    const res = await client.get('/api/analytics/official-accidents');
    return res.data.data;
  },

  async getTrafficStatus() {
    const res = await client.get('/api/traffic/status');
    return res.data;
  },

  // 8. AI Structural Engineer Verification Agent
  async verifyDefectWithAi(payload: {
    report_id?: string;
    detected_count?: number;
    max_confidence?: number;
    apparent_area_pct?: number;
    notes?: string;
  }) {
    const res = await client.post('/api/inspection/verify-defect', payload);
    return res.data.data;
  },

  async createReport(payload: {
    title: string;
    description?: string;
    category?: string;
    estimated_severity?: string;
    priority_score?: number;
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    original_image_url?: string;
  }) {
    const res = await client.post('/api/reports', payload);
    return res.data.data;
  },
};

export const getAssetUrl = (path?: string | null): string => {
  if (!path) {
    return 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80';
  }
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${PRISM_API_BASE}${clean}`;
};

if (typeof window !== 'undefined') {
  (window as any).__downloadReportPdf = (id: string, filename?: string) => prismApi.downloadReportPdf(id, filename);
}

export default prismApi;

