import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  Building2,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Send,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Report, ResolutionStatus, SeverityLevel } from '../types';
import prismApi, { getAssetUrl } from '../services/prismApi';

export const AuthorityDashboardPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Triage modal state
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ResolutionStatus>('in_progress');
  const [department, setDepartment] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingTriage, setSubmittingTriage] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const prismReports = await prismApi.getReports();
      if (prismReports && prismReports.length > 0) {
        const mapped: Report[] = prismReports.map((p) => ({
          id: p.id,
          reportNumber: p.report_number,
          title: p.title,
          description: p.description,
          category: p.category as any,
          estimatedSeverity: p.estimated_severity as any,
          priorityScore: p.priority_score,
          resolutionStatus: (p.workflow_status === 'resolved' ? 'resolved' : p.workflow_status === 'under_inspection' || p.workflow_status === 'confirmed' ? 'in_progress' : 'triaged') as any,
          upvotesCount: p.detections_count || 1,
          reportedBy: p.is_demo ? 'Field Patrol AI' : 'Citizen Inspector',
          createdAt: p.created_at || new Date().toISOString(),
          assignedDepartment: 'Public Works Department (PWD)',
          resolutionNotes: p.reviews && p.reviews.length > 0 ? p.reviews[p.reviews.length - 1].notes : '',
          originalImageUrl: getAssetUrl(p.original_image_url),
          city: p.city,
          address: p.address,
          latitude: p.latitude || 22.7196,
          longitude: p.longitude || 75.8577,
          isDemo: p.is_demo,
        }));
        setReports(mapped);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Prism backend fallback:', e);
    }

    try {
      const res = await axios.get('/api/v1/reports');
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      toast.error('Could not load authority reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openTriage = (r: Report) => {
    setSelectedReport(r);
    setNewStatus(r.resolutionStatus);
    setDepartment(r.assignedDepartment || 'Public Works Department (PWD)');
    setResolutionNotes(r.resolutionNotes || '');
    setTriageModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setSubmittingTriage(true);

    try {
      // Sync to PRISM Python backend
      try {
        await prismApi.updateReportStatus(selectedReport.id, {
          workflow_status: newStatus === 'resolved' ? 'resolved' : 'under_inspection',
          review_notes: resolutionNotes,
          reviewer_name: department || 'Municipal Officer',
        });
      } catch (prismErr) {
        console.warn('Prism update sync:', prismErr);
      }

      toast.success(`Report ${selectedReport.reportNumber} status updated to ${newStatus}!`);
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id
            ? { ...r, resolutionStatus: newStatus, assignedDepartment: department, resolutionNotes }
            : r
        )
      );
      setSelectedReport((prev) =>
        prev ? { ...prev, resolutionStatus: newStatus, assignedDepartment: department, resolutionNotes } : null
      );
      setTriageModalOpen(false);
    } catch (err) {
      toast.error('Failed to update report status.');
    } finally {
      setSubmittingTriage(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter !== 'all' && r.resolutionStatus !== statusFilter) return false;
    if (severityFilter !== 'all' && r.estimatedSeverity !== severityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.reportNumber.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalReports = reports.length;
  const criticalReports = reports.filter((r) => r.estimatedSeverity === 'critical').length;
  const inProgressReports = reports.filter((r) => r.resolutionStatus === 'in_progress').length;
  const resolvedReports = reports.filter((r) => r.resolutionStatus === 'resolved').length;

  return (
    <div className="min-h-screen bg-rp-bg flex flex-col pt-16">
      <Navbar currentRole="authority" />

      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rp-accent/10 border border-rp-accent/20 text-rp-accent text-xs font-semibold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              Municipal Command & Dispatch Center
            </div>
            <h1 className="text-3xl font-heading font-bold text-rp-text">
              Authority Action & Incident Triage
            </h1>
            <p className="text-rp-text-secondary text-sm mt-1">
              Live monitoring, emergency risk ranking, department assignments, and public works tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchReports}
              className="flex items-center gap-2 px-4 py-2 bg-rp-card border border-rp-border rounded-lg text-xs font-semibold text-rp-text hover:bg-rp-card-elevated"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Feed
            </button>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rp-card border-rp-border bg-rp-card-elevated">
            <span className="text-[11px] font-bold text-rp-text-muted uppercase tracking-wider block">
              Total Ingested Hazards
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-heading font-bold text-rp-text">
                {totalReports}
              </span>
              <span className="p-2 rounded-lg bg-rp-accent/10 text-rp-accent">
                <AlertTriangle className="w-5 h-5" />
              </span>
            </div>
            <span className="text-[11px] text-rp-text-secondary mt-1 block">Across metro sectors</span>
          </div>

          <div className="rp-card border-rose-500/30 bg-rp-card-elevated">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
              Critical Life-Safety Risks
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-heading font-bold text-rose-400">
                {criticalReports}
              </span>
              <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </span>
            </div>
            <span className="text-[11px] text-rose-400/80 mt-1 block">Immediate dispatch required</span>
          </div>

          <div className="rp-card border-blue-500/30 bg-rp-card-elevated">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
              Under Active Repair
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-heading font-bold text-blue-400">
                {inProgressReports}
              </span>
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Clock className="w-5 h-5" />
              </span>
            </div>
            <span className="text-[11px] text-blue-400/80 mt-1 block">Field units deployed</span>
          </div>

          <div className="rp-card border-emerald-500/30 bg-rp-card-elevated">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Verified Resolved
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-heading font-bold text-emerald-400">
                {resolvedReports}
              </span>
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>
            <span className="text-[11px] text-emerald-400/80 mt-1 block">
              {totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0}% completion rate
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="rp-card mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-rp-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by ID, location, or keyword..."
              className="w-full pl-9 pr-4 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text placeholder:text-rp-text-muted focus:outline-none focus:border-rp-accent"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-rp-text-muted">
              <Filter className="w-3.5 h-3.5 text-rp-accent" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-rp-bg border border-rp-border rounded px-2.5 py-1.5 text-xs text-rp-text"
              >
                <option value="all">All</option>
                <option value="submitted">Submitted</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-rp-text-muted">
              <span>Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-rp-bg border border-rp-border rounded px-2.5 py-1.5 text-xs text-rp-text"
              >
                <option value="all">All</option>
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incident Triage Table */}
        <div className="rp-card overflow-hidden p-0 border-rp-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-rp-bg border-b border-rp-border text-rp-text-muted font-heading uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Report</th>
                  <th className="py-3 px-4">Hazard</th>
                  <th className="py-3 px-4">Severity & Risk</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Dept</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rp-border/50">
                {filteredReports.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-rp-card-elevated transition-colors cursor-pointer"
                    onClick={() => openTriage(r)}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-rp-accent whitespace-nowrap">
                      {r.reportNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={r.originalImageUrl}
                          alt={r.title}
                          className="w-10 h-10 rounded-lg object-cover bg-rp-bg flex-shrink-0 border border-rp-border"
                        />
                        <div className="min-w-0">
                          <span className="font-heading font-semibold text-rp-text block truncate max-w-xs">
                            {r.title}
                          </span>
                          <span className="text-[11px] text-rp-text-muted capitalize">
                            {r.category.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.estimatedSeverity === 'critical'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : r.estimatedSeverity === 'high'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}
                        >
                          {r.estimatedSeverity}
                        </span>
                        <span className="font-mono text-rp-text font-bold">
                          {r.priorityScore}
                          <span className="text-[10px] text-rp-text-muted">/100</span>
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-rp-text-secondary max-w-xs truncate">
                      {r.address}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          r.resolutionStatus === 'resolved'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : r.resolutionStatus === 'in_progress'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : r.resolutionStatus === 'assigned'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {r.resolutionStatus.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-rp-text-secondary truncate max-w-[180px]">
                      {r.assignedDepartment || '— Pending Assignment —'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTriage(r);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rp-card border border-rp-border hover:border-rp-accent hover:text-rp-accent text-[11px] font-semibold transition-colors"
                      >
                        Triage Case
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Triage & Status Update Modal */}
      {triageModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-rp-bg/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-rp-card-elevated border border-rp-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-rp-border pb-3 mb-4">
              <div>
                <span className="font-mono font-bold text-xs text-rp-accent">
                  {selectedReport.reportNumber}
                </span>
                <h3 className="font-heading font-bold text-lg text-rp-text">
                  {selectedReport.title}
                </h3>
              </div>
              <button
                onClick={() => setTriageModalOpen(false)}
                className="text-rp-text-muted hover:text-rp-text text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="h-44 rounded-lg overflow-hidden bg-rp-bg border border-rp-border">
                <img
                  src={selectedReport.originalImageUrl}
                  alt={selectedReport.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-rp-text-muted block text-[10px] uppercase font-bold">Address</span>
                  <span className="text-rp-text font-medium">{selectedReport.address}</span>
                </div>
                <div>
                  <span className="text-rp-text-muted block text-[10px] uppercase font-bold">Reported By</span>
                  <span className="text-rp-text">{selectedReport.reporterName}</span>
                </div>
                <div>
                  <span className="text-rp-text-muted block text-[10px] uppercase font-bold">Community Upvotes</span>
                  <span className="text-rp-text font-bold text-rp-accent">{selectedReport.votes} citizen verifications</span>
                </div>
                <div>
                  <span className="text-rp-text-muted block text-[10px] uppercase font-bold">AI Priority Score</span>
                  <span className="text-rp-text font-bold text-rose-400">{selectedReport.priorityScore}/100</span>
                </div>
              </div>
            </div>

            {/* Triage Form */}
            <form onSubmit={handleUpdateStatus} className="space-y-4 pt-4 border-t border-rp-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-rp-text-muted uppercase block mb-1">
                    Update Resolution Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ResolutionStatus)}
                    className="w-full px-3 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="awaiting_verification">Awaiting Field Verification</option>
                    <option value="verified">Verified Hazard</option>
                    <option value="assigned">Assigned to Crew</option>
                    <option value="in_progress">In Progress (Active Work)</option>
                    <option value="resolved">Resolved (Complete)</option>
                    <option value="rejected">Rejected (Not a hazard)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-rp-text-muted uppercase block mb-1">
                    Assign Municipal Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                  >
                    <option value="Public Works Department (PWD)">Public Works Department (PWD)</option>
                    <option value="Traffic Police & Enforcement">Traffic Police & Enforcement</option>
                    <option value="Storm Water Drainage & BBMP">Storm Water Drainage & Municipal Corp</option>
                    <option value="Highway Resurfacing Authority">Highway Resurfacing Authority</option>
                    <option value="Electrical & Signals Wing">Electrical & Signals Wing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-rp-text-muted uppercase block mb-1">
                  Official Resolution Notes
                </label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Patch completed using cold-mix bitumen. Resurfacing verified by inspector."
                  className="w-full px-3 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-rp-border">
                <button
                  type="button"
                  onClick={() => setTriageModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-rp-card border border-rp-border text-xs text-rp-text hover:bg-rp-card-elevated"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTriage}
                  className="px-5 py-2 rounded-lg bg-rp-accent text-rp-bg font-heading font-bold text-xs tracking-wide shadow-glow-cyan hover:scale-105 active:scale-95 transition-all"
                >
                  {submittingTriage ? 'Updating...' : 'Save & Dispatch Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorityDashboardPage;
