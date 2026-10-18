import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { api, ReportItem } from '../services/api';

export const MyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      const res = await api.listReports(params);
      setReports(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to retrieve reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, severityFilter]);

  const filteredReports = reports.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.reference_id?.toLowerCase().includes(term) ||
      r.title?.toLowerCase().includes(term) ||
      r.address?.toLowerCase().includes(term) ||
      r.city?.toLowerCase().includes(term)
    );
  });

  const handleDownloadPdf = async (e: React.MouseEvent, report: ReportItem) => {
    e.stopPropagation();
    try {
      await api.downloadReportPdf(report.id, report.reference_id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download authenticated PDF.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Hazard Registry &amp; Incident Log</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Complete database of recorded road defect incidents with statutory audit trails.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold flex items-center gap-2 border border-gray-700 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Reference ID, City, Road..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white placeholder-gray-500 outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white outline-none"
          >
            <option value="">All Workflow Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_INSPECTION">UNDER_INSPECTION</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="IN_REPAIR">IN_REPAIR</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white outline-none"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="rounded-2xl bg-[#111827] border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            <span className="text-xs">Querying database...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center text-gray-500 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-gray-600" />
            <p className="text-xs font-semibold text-gray-400">No records found matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] font-mono border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Hazard Description</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Coordinates</th>
                  <th className="py-3 px-4">Date Logged</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {r.reference_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{r.title}</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-xs">
                        {r.address}, {r.city}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.damage_severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : r.damage_severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {r.damage_severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.workflow_status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : r.workflow_status === 'CONFIRMED'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : r.workflow_status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {r.workflow_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] font-mono text-gray-400">
                      {r.latitude && r.longitude ? (
                        <span>
                          {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-gray-600">Unspecified</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] font-mono text-gray-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/reports/${r.id}`}
                          className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Audit</span>
                        </Link>
                        <button
                          onClick={(e) => handleDownloadPdf(e, r)}
                          title="Download Authenticated ReportLab PDF"
                          className="p-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-800/60"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
