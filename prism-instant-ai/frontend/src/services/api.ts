import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// Automatic JWT Authorization Header Injection
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('prism_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
  authority_profile?: {
    organization: string;
    department: string;
    jurisdiction: string;
    verification_status: string;
    badge_number?: string;
  } | null;
}

export interface DetectionBox {
  class_name: string;
  confidence: number;
  bounding_box: { x1: number; y1: number; x2: number; y2: number };
  apparent_area_pct: number;
  frame_timestamp?: number;
}

export interface ScanResult {
  scan_id: string;
  status: string;
  detected_count: number;
  preliminary_severity: string;
  priority_score: number;
  confidence_score: number | null;
  inference_duration_ms: number;
  model_version: string;
  detections: DetectionBox[];
  storage_keys: { original: string; annotated?: string };
  warnings: string[];
}

export interface ReportItem {
  id: string;
  reference_id: string;
  title: string;
  description?: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  damage_severity: string;
  priority_score: number;
  workflow_status: string;
  has_repair_evidence: boolean;
  created_at: string;
  owner_id?: string;
  assigned_authority_id?: string;
  evidence_storage_key?: string;
  repair_evidence_key?: string;
  detections?: DetectionBox[];
  status_history?: Array<{
    previous_status: string;
    new_status: string;
    changed_by: string;
    reason: string;
    timestamp: string;
  }>;
}

export const api = {
  // Auth
  async login(payload: any) {
    const res = await client.post('/auth/login', payload);
    return res.data;
  },

  async register(payload: any) {
    const res = await client.post('/auth/register', payload);
    return res.data;
  },

  async getMe(): Promise<UserProfile> {
    const res = await client.get('/auth/me');
    return res.data.data;
  },

  async bootstrapAdmin(payload: any) {
    const res = await client.post('/auth/bootstrap-admin', payload);
    return res.data;
  },

  // Scans
  async scanImage(file: File): Promise<ScanResult> {
    const form = new FormData();
    form.append('file', file);
    const res = await client.post('/scans/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async scanVideo(file: File, intervalSec: number = 1.0): Promise<any> {
    const form = new FormData();
    form.append('file', file);
    form.append('sampling_interval_sec', intervalSec.toString());
    const res = await client.post('/scans/video', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async listScans() {
    const res = await client.get('/scans');
    return res.data;
  },

  async getScan(id: string) {
    const res = await client.get(`/scans/${id}`);
    return res.data.data;
  },

  // Reports
  async createReport(payload: any) {
    const res = await client.post('/reports', payload);
    return res.data.data;
  },

  async listReports(params: any = {}) {
    const res = await client.get('/reports', { params });
    return res.data;
  },

  async getReport(id: string): Promise<ReportItem> {
    const res = await client.get(`/reports/${id}`);
    return res.data.data;
  },

  async updateReportStatus(id: string, payload: { new_status: string; reason?: string; repair_evidence_key?: string }) {
    const res = await client.post(`/reports/${id}/status`, payload);
    return res.data;
  },

  async assignReport(reportId: string, authorityId: string) {
    const res = await client.post(`/reports/${reportId}/assign`, { authority_id: authorityId });
    return res.data;
  },

  async downloadReportPdf(reportId: string, referenceId: string) {
    const res = await client.get(`/reports/${reportId}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${referenceId}_Audit_Report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getEvidenceUrl(reportId: string, type: 'damage' | 'repair' = 'damage') {
    return `${API_BASE_URL}/reports/${reportId}/evidence?evidence_type=${type}`;
  },

  // Authority
  async getAssignedReports() {
    const res = await client.get('/authority/assigned-reports');
    return res.data.data;
  },

  async submitInspection(reportId: string, decision: string, remarks: string) {
    const res = await client.post(`/authority/reports/${reportId}/inspection`, { decision, remarks });
    return res.data;
  },

  async uploadRepairEvidence(reportId: string, file: File, notes: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('notes', notes);
    const res = await client.post(`/authority/reports/${reportId}/repair-evidence`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Admin
  async listUsers() {
    const res = await client.get('/admin/users');
    return res.data;
  },

  async updateUser(userId: string, payload: any) {
    const res = await client.patch(`/admin/users/${userId}`, payload);
    return res.data;
  },

  async listAuthorityRequests() {
    const res = await client.get('/admin/authority-requests');
    return res.data.data;
  },

  async authorityDecision(userId: string, decision: 'APPROVE' | 'REJECT', reason?: string) {
    const res = await client.post(`/admin/authority-requests/${userId}/decision`, { decision, reason });
    return res.data;
  },

  async getAuditLogs(params: any = {}) {
    const res = await client.get('/admin/audit-logs', { params });
    return res.data;
  },

  async getPlatformAnalytics() {
    const res = await client.get('/admin/analytics');
    return res.data.data;
  },

  // Health & Readiness
  async getHealth() {
    const res = await client.get('/health');
    return res.data;
  },

  async getReadiness() {
    const res = await client.get('/readiness');
    return res.data;
  }
};

export default api;
