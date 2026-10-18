import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Video,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  ArrowRight,
  TrendingUp,
  Loader2,
  FileSearch
} from 'lucide-react';
import { api, ReportItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const UserDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.listReports({ limit: 10 });
        if (mounted) {
          setReports(res.data || []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load reports');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    fetchReports();
    return () => {
      mounted = false;
    };
  }, []);

  const totalReports = reports.length;
  const awaitingInspection = reports.filter(
    (r) => r.workflow_status === 'SUBMITTED' || r.workflow_status === 'UNDER_INSPECTION'
  ).length;
  const confirmed = reports.filter(
    (r) => r.workflow_status === 'CONFIRMED' || r.workflow_status === 'IN_REPAIR'
  ).length;
  const resolved = reports.filter((r) => r.workflow_status === 'RESOLVED').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900 to-cyan-950/40 border border-gray-800">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            Field Patrol Overview
          </span>
          <h1 className="text-xl font-bold text-white mt-1">
            Welcome, {user?.full_name || 'Inspector'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time telemetry and road hazard remediation tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/scanner/image"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs shadow-glow-emerald transition flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Road Image</span>
          </Link>
          <Link
            to="/scanner/video"
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs border border-gray-700 transition flex items-center gap-2"
          >
            <Video className="w-4 h-4 text-cyan-400" />
            <span>Video Sweep</span>
          </Link>
        </div>
      </div>

      {/* Real Statistics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Total Registered</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalReports}</div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">Live database count</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium">Awaiting Inspection</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-300">{awaitingInspection}</div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">SUBMITTED / UNDER_INSPECTION</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-medium">Confirmed / Repairing</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-cyan-300">{confirmed}</div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">CONFIRMED / IN_REPAIR</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium">Resolved Remediation</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-300">{resolved}</div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">Verified with evidence</div>
        </div>
      </div>

      {/* Recent Hazard Activity */}
      <div className="rounded-2xl bg-[#111827] border border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Recent Road Damage Reports</h2>
          </div>
          <Link
            to="/reports"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>View All Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            <span className="text-xs">Querying PostgreSQL/SQLite records...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-rose-300 text-xs">
            {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-gray-500 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-gray-600" />
            <p className="text-xs font-medium text-gray-400">No reports recorded yet.</p>
            <p className="text-[11px] text-gray-600 max-w-sm mx-auto">
              Run your first image scan to detect real road surface defects and generate authenticated PDF reports.
            </p>
            <Link
              to="/scanner/image"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Launch Scan</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/60 text-gray-400 uppercase text-[10px] font-mono border-b border-gray-800">
                <tr>
                  <th className="py-2.5 px-3">Reference ID</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Logged Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {reports.slice(0, 5).map((r) => (
                  <tr key={r.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-2.5 px-3 font-mono font-semibold text-cyan-400">
                      {r.reference_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-white">{r.title}</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-xs">{r.address || r.city}</div>
                    </td>
                    <td className="py-2.5 px-3">
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
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.workflow_status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : r.workflow_status === 'CONFIRMED'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {r.workflow_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-gray-400 font-mono">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/reports/${r.id}`}
                        className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-medium"
                      >
                        Inspect
                      </Link>
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
