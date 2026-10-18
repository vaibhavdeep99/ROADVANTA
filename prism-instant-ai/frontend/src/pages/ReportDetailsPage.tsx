import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Camera,
  Activity,
  Layers,
  Loader2,
  Calendar,
  User,
  Check,
  X
} from 'lucide-react';
import { api, ReportItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ReportDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isAuthority } = useAuth();

  const [report, setReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update modal / form
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');

  // Repair evidence upload
  const [repairFile, setRepairFile] = useState<File | null>(null);
  const [repairNotes, setRepairNotes] = useState('');
  const [uploadingRepair, setUploadingRepair] = useState(false);

  const fetchReport = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReport(id);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch report audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!report) return;
    try {
      await api.downloadReportPdf(report.id, report.reference_id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download authenticated PDF.');
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !newStatus) return;
    setUpdatingStatus(true);
    try {
      await api.updateReportStatus(report.id, {
        new_status: newStatus,
        reason: reason || undefined,
      });
      setNewStatus('');
      setReason('');
      await fetchReport();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status transition rejected by server.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUploadRepairEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !repairFile) return;
    setUploadingRepair(true);
    try {
      await api.uploadRepairEvidence(report.id, repairFile, repairNotes);
      setRepairFile(null);
      setRepairNotes('');
      await fetchReport();
      alert('Repair evidence uploaded successfully.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload repair evidence.');
    } finally {
      setUploadingRepair(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <span className="text-xs font-mono">Loading incident telemetry...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Registry
        </button>
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
          {error || 'Report could not be found.'}
        </div>
      </div>
    );
  }

  const token = localStorage.getItem('prism_token');
  const damageEvidenceUrl = `${api.getEvidenceUrl(report.id, 'damage')}&token=${token}`;
  const repairEvidenceUrl = `${api.getEvidenceUrl(report.id, 'repair')}&token=${token}`;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reports')}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-400 uppercase">
                {report.reference_id}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  report.workflow_status === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : report.workflow_status === 'CONFIRMED'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : report.workflow_status === 'REJECTED'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {report.workflow_status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">{report.title}</h1>
          </div>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs shadow-glow-emerald transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download Audit PDF</span>
        </button>
      </div>

      {/* Grid: Optical Evidence & Audit Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Optical Evidence */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
          <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Annotated Road Damage Evidence</span>
          </h2>

          <div className="w-full aspect-video rounded-xl bg-gray-950 border border-gray-800 overflow-hidden flex items-center justify-center">
            {report.evidence_storage_key ? (
              <img
                src={damageEvidenceUrl}
                alt="Damage Evidence"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 200 100"><rect fill="%23111827" width="200" height="100"/><text fill="%239ca3af" font-size="10" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Protected Evidence File</text></svg>';
                }}
              />
            ) : (
              <div className="text-xs text-gray-500">No photographic evidence stored</div>
            )}
          </div>

          {report.has_repair_evidence && (
            <div className="space-y-2 pt-2 border-t border-gray-800">
              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Municipal Repair Completion Photo</span>
              </h3>
              <div className="w-full aspect-video rounded-xl bg-gray-950 border border-gray-800 overflow-hidden flex items-center justify-center">
                <img
                  src={repairEvidenceUrl}
                  alt="Repair Evidence"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Telemetry and Metrics */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
          <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Hazard Telemetry &amp; Location</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Damage Severity</span>
              <span className="text-sm font-bold text-rose-400">{report.damage_severity}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Priority Score</span>
              <span className="text-sm font-bold text-amber-400">{report.priority_score} / 100</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-mono flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-400" /> Location Coordinates
              </span>
              <div className="text-gray-200 font-mono">
                {report.latitude && report.longitude
                  ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`
                  : 'Coordinates not provided at scan time'}
              </div>
              <div className="text-gray-400">{report.address}, {report.city}</div>
            </div>

            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" /> Incident Timestamps
              </span>
              <div className="text-gray-300 font-mono text-[11px]">
                Registered: {new Date(report.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Detections breakdown */}
          {report.detections && report.detections.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-800">
              <span className="text-xs font-bold text-gray-300 block">
                Quantified Neural Detections ({report.detections.length})
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {report.detections.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-gray-950 border border-gray-800 text-[11px] font-mono flex items-center justify-between text-gray-300"
                  >
                    <span className="text-cyan-400 font-semibold">{d.class_name.toUpperCase()}</span>
                    <span>Confidence: {(d.confidence * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status History Audit Trail */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
        <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Statutory Workflow Audit History</span>
        </h2>

        {report.status_history && report.status_history.length > 0 ? (
          <div className="space-y-2">
            {report.status_history.map((h, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
              >
                <div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-gray-500">{h.previous_status}</span>
                    <span className="text-cyan-400 font-bold">&rarr;</span>
                    <span className="text-emerald-400 font-bold">{h.new_status}</span>
                  </div>
                  {h.reason && <p className="text-gray-400 text-[11px] mt-0.5">&ldquo;{h.reason}&rdquo;</p>}
                </div>
                <div className="text-[10px] text-gray-500 font-mono text-right">
                  <div>Officer: {h.changed_by.slice(0, 8)}</div>
                  <div>{new Date(h.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500">No status transitions recorded yet.</div>
        )}
      </div>

      {/* Authority / Admin Actions Panel */}
      {(isAuthority || isAdmin) && (
        <div className="p-6 rounded-2xl bg-[#111827] border border-amber-500/40 space-y-4">
          <h2 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Authority &amp; Governance Remediation Actions</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Update Form */}
            <form onSubmit={handleStatusChange} className="space-y-3 p-4 rounded-xl bg-gray-900 border border-gray-800">
              <span className="text-xs font-semibold text-gray-200 block">Progress Workflow Status</span>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">New State</label>
                <select
                  required
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-white"
                >
                  <option value="">Select Permitted Transition</option>
                  <option value="UNDER_INSPECTION">UNDER_INSPECTION</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="IN_REPAIR">IN_REPAIR</option>
                  <option value="RESOLVED">RESOLVED (Requires repair photo)</option>
                  <option value="REJECTED">REJECTED (Requires justification)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Audit Justification / Notes</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Field inspection verified 40cm pothole on lane 2"
                  className="w-full px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={updatingStatus || !newStatus}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-glow-amber transition disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Commit Status Transition'}
              </button>
            </form>

            {/* Repair Evidence Upload Form */}
            <form onSubmit={handleUploadRepairEvidence} className="space-y-3 p-4 rounded-xl bg-gray-900 border border-gray-800">
              <span className="text-xs font-semibold text-gray-200 block">Attach Remediation Evidence</span>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Remediation Photo (Asphalt / Patching)</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => e.target.files && setRepairFile(e.target.files[0])}
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-gray-800 file:text-cyan-400 file:font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Contractor / Repair Remarks</label>
                <input
                  type="text"
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  placeholder="e.g. Cold-mix patch laid and rolled by crew #4"
                  className="w-full px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingRepair || !repairFile}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-glow-emerald transition disabled:opacity-50"
              >
                {uploadingRepair ? 'Uploading...' : 'Submit Completion Evidence'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
