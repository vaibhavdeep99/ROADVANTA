import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Clock,
  Building2,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  FileText,
  Download,
} from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { Report, ResolutionStatus } from '../types';
import prismApi, { getAssetUrl } from '../services/prismApi';

export const ResolutionTrackingPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [triageOpen, setTriageOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ResolutionStatus>('in_progress');
  const [assignedDept, setAssignedDept] = useState('Public Works Dept (PWD)');
  const [repairPhoto, setRepairPhoto] = useState('/evidence/repair_asphalt_patching.jpg');
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchReports = async () => {
    try {
      const prismData = await prismApi.getReports();
      if (prismData && prismData.length > 0) {
        const mapped: Report[] = prismData.map((p) => ({
          id: p.id,
          reportNumber: p.report_number,
          title: p.title,
          description: p.description,
          category: p.category as any,
          estimatedSeverity: (p.estimated_severity || 'moderate') as any,
          priorityScore: p.priority_score,
          resolutionStatus: (p.workflow_status === 'resolved' ? 'resolved' : p.workflow_status === 'under_inspection' || p.workflow_status === 'assigned' ? 'in_progress' : 'submitted') as any,
          upvotesCount: p.detections_count || 1,
          reportedBy: p.is_demo ? 'Field Patrol AI' : 'Citizen Inspector',
          createdAt: p.created_at || new Date().toISOString(),
          originalImageUrl: getAssetUrl(p.original_image_url),
          repairImageUrl: getAssetUrl(p.repair_image_url),
          repair_image_url: p.repair_image_url || undefined,
          city: p.city,
          address: p.address,
          latitude: p.latitude || 22.7196,
          longitude: p.longitude || 75.8577,
          isDemo: p.is_demo,
          assignedDepartment: 'Public Works Dept (PWD)',
        }));
        setReports(mapped);
        return;
      }
    } catch (e) {
      console.warn('Prism backend fallback:', e);
    }

    try {
      const res = await axios.get('/api/v1/reports');
      if (res.data.success && Array.isArray(res.data.data)) {
        setReports(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.resolutionStatus === 'submitted' || r.resolutionStatus === 'awaiting_verification').length,
    inProgress: reports.filter((r) => r.resolutionStatus === 'in_progress' || r.resolutionStatus === 'assigned').length,
    resolved: reports.filter((r) => r.resolutionStatus === 'resolved').length,
  };

  const tabs = [
    { id: 'All', label: 'All', count: counts.all },
    { id: 'Pending', label: 'Pending', count: counts.pending },
    { id: 'In Progress', label: 'In Progress', count: counts.inProgress },
    { id: 'Resolved', label: 'Resolved', count: counts.resolved },
  ];

  const filteredReports = reports.filter((r) => {
    if (activeTab === 'Pending' && r.resolutionStatus !== 'submitted' && r.resolutionStatus !== 'awaiting_verification') return false;
    if (activeTab === 'In Progress' && r.resolutionStatus !== 'in_progress' && r.resolutionStatus !== 'assigned') return false;
    if (activeTab === 'Resolved' && r.resolutionStatus !== 'resolved') return false;
    return true;
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      // 1. Update in PRISM SQLite backend
      try {
        await prismApi.updateReportStatus(selectedReport.id, {
          workflow_status: newStatus === 'resolved' ? 'resolved' : 'under_inspection',
          verification_status: 'verified',
          reviewer_name: assignedDept,
          review_notes: reviewNotes || (newStatus === 'resolved' ? 'Compacted cold-mix asphalt patch verified.' : 'Dispatched inspection crew.'),
          repair_image_url: newStatus === 'resolved' ? repairPhoto : undefined,
        });
      } catch (err) {
        console.warn('Prism direct update fallback:', err);
      }

      // 2. Update in Express backend if applicable
      try {
        await axios.patch(`/api/v1/reports/${selectedReport.id}`, {
          resolutionStatus: newStatus,
          assignedDepartment: assignedDept,
        });
      } catch (err) {
        // Ignored if only in PRISM DB
      }

      toast.success(`Updated status to ${newStatus}`);
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id
            ? {
                ...r,
                resolutionStatus: newStatus,
                assignedDepartment: assignedDept,
                repairImageUrl: newStatus === 'resolved' ? getAssetUrl(repairPhoto) : r.repairImageUrl,
                repair_image_url: newStatus === 'resolved' ? repairPhoto : r.repair_image_url,
              }
            : r
        )
      );
      setTriageOpen(false);
    } catch (err) {
      toast.error('Failed to update resolution status');
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text">
            Resolution Tracking
          </h1>
          <p className="text-rp-text-secondary text-xs sm:text-sm mt-0.5">
            Track the end-to-end status of all reported road issues and municipal repair progress.
          </p>
        </div>

        {/* Status Filter Tabs matching Screen 7 */}
        <div className="flex items-center gap-2 border-b border-rp-border pb-3 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-rp-accent text-rp-bg font-bold shadow-glow-cyan'
                  : 'bg-rp-card border border-rp-border text-rp-text-secondary hover:text-rp-text'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-rp-bg text-rp-accent' : 'bg-rp-border text-rp-text-muted'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Resolution Tracking Table matching Screen 7 */}
        <div className="rp-card bg-rp-card-elevated border-rp-border overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-rp-bg border-b border-rp-border text-rp-text-muted font-heading uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Issue Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rp-border/50">
                {filteredReports.map((r, i) => (
                  <tr key={r.id} className="hover:bg-rp-card transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rp-accent whitespace-nowrap">
                      RP-{String(i + 1).padStart(3, '0')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-rp-text capitalize">
                      {r.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-rp-text-secondary max-w-xs truncate">
                      {r.address}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.estimatedSeverity === 'critical' || r.estimatedSeverity === 'high'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : r.estimatedSeverity === 'medium'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {r.estimatedSeverity}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          r.resolutionStatus === 'resolved'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : r.resolutionStatus === 'in_progress'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {r.resolutionStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-rp-text-secondary truncate max-w-[160px]">
                      {r.assignedDepartment || 'Road Maintenance Dept'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.resolutionStatus === 'resolved' && (r.repairImageUrl || r.repair_image_url) && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" /> Repaired
                          </span>
                        )}
                        <a
                          href={`/api/reports/${r.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-rp-accent/15 border border-rp-accent/30 text-rp-accent hover:bg-rp-accent hover:text-rp-bg font-semibold text-xs flex items-center gap-1 transition-all shadow-sm"
                          title="Download Statutory Engineering Audit PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>

                        <button
                          onClick={() => {
                            setSelectedReport(r);
                            setNewStatus(r.resolutionStatus);
                            setAssignedDept(r.assignedDepartment || 'Public Works Dept (PWD)');
                            setRepairPhoto(r.repair_image_url || '/evidence/repair_asphalt_patching.jpg');
                            setReviewNotes('');
                            setTriageOpen(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-rp-card border border-rp-border hover:border-rp-accent/50 text-rp-text hover:text-rp-accent font-semibold text-xs transition-colors"
                        >
                          View & Triage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Status Change & Repair Evidence */}
      {triageOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-rp-bg/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-rp-card-elevated border border-rp-border rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-start justify-between border-b border-rp-border pb-3 mb-4">
              <div>
                <span className="font-mono text-rp-accent text-xs font-bold block">
                  {selectedReport.reportNumber || `RP-${selectedReport.id.slice(0, 8)}`}
                </span>
                <h3 className="font-heading font-bold text-base text-rp-text">
                  {selectedReport.title || 'Road Hazard Resolution Pipeline'}
                </h3>
                <p className="text-xs text-rp-text-muted mt-0.5">
                  {selectedReport.address}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                selectedReport.estimatedSeverity === 'critical' || selectedReport.estimatedSeverity === 'high'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {selectedReport.estimatedSeverity}
              </span>
            </div>

            {/* Before / After Evidence Images */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rp-text-muted block">
                  Reported Damage Photo
                </span>
                <div className="h-28 rounded-xl bg-black border border-rp-border overflow-hidden">
                  <img
                    src={selectedReport.originalImageUrl}
                    alt="Reported Damage"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rp-text-muted block">
                  {newStatus === 'resolved' ? 'Repair Proof Evidence' : 'Field Inspection Status'}
                </span>
                <div className="h-28 rounded-xl bg-black border border-rp-border overflow-hidden flex items-center justify-center text-center p-2">
                  {newStatus === 'resolved' ? (
                    <img
                      src={getAssetUrl(repairPhoto)}
                      alt="Repair Evidence"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-[11px] text-rp-text-muted flex flex-col items-center gap-1">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <span>Pending Repair Verification</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-rp-text-muted uppercase block mb-1">
                  Resolution Pipeline Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ResolutionStatus)}
                  className="w-full px-3 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text"
                >
                  <option value="submitted">Submitted (Awaiting Triage)</option>
                  <option value="in_progress">In Progress (Field Crew Dispatched)</option>
                  <option value="resolved">Resolved (Repaired & Audited)</option>
                </select>
              </div>

              {newStatus === 'resolved' && (
                <div>
                  <label className="text-xs font-bold text-rp-text-muted uppercase block mb-1">
                    Select Official PWD Repair Proof Evidence
                  </label>
                  <select
                    value={repairPhoto}
                    onChange={(e) => setRepairPhoto(e.target.value)}
                    className="w-full px-3 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text font-mono"
                  >
                    <option value="/evidence/repair_asphalt_patching.jpg">
                      repair_asphalt_patching.jpg (Compacted Cold-Mix Pothole Patch)
                    </option>
                    <option value="/evidence/repair_highway_paving.jpg">
                      repair_highway_paving.jpg (Heavy Highway Resurfacing & Paving)
                    </option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-rp-text-muted uppercase block mb-1">
                  Assigned Department
                </label>
                <select
                  value={assignedDept}
                  onChange={(e) => setAssignedDept(e.target.value)}
                  className="w-full px-3 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text"
                >
                  <option value="Public Works Dept (PWD)">Public Works Dept (PWD)</option>
                  <option value="Traffic Police Division">Traffic Police Division</option>
                  <option value="Drainage & Municipal Corp">Drainage & Municipal Corp</option>
                  <option value="Electrical & Signals Wing">Electrical & Signals Wing</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-rp-text-muted uppercase block mb-1">
                  Engineering Review / Inspection Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Surface compacted with vibratory roller. 0mm gradient deviation."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text placeholder:text-rp-text-muted"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-rp-border">
                <a
                  href={`/api/reports/${selectedReport.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-rp-accent/15 border border-rp-accent/30 text-rp-accent hover:bg-rp-accent hover:text-rp-bg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  title="Generate Statutory PDF Audit Report"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Official PDF Audit Report
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTriageOpen(false)}
                    className="px-4 py-2 rounded-lg bg-rp-card border border-rp-border text-xs text-rp-text hover:bg-rp-bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-rp-accent text-rp-bg font-heading font-bold text-xs shadow-glow-cyan"
                  >
                    Commit Status & Evidence
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default ResolutionTrackingPage;
