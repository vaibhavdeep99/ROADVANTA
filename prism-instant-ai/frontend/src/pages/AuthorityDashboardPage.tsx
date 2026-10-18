import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Eye,
  Loader2,
  FileText,
  MapPin,
  RefreshCw,
  Award
} from 'lucide-react';
import { api, ReportItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AuthorityDashboardPage: React.FC = () => {
  const { user, isAuthority, isAdmin } = useAuth();
  const [assignedReports, setAssignedReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssigned = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAssignedReports();
      setAssignedReports(res || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch assigned corridors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-amber-950/20 to-gray-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <Award className="w-4 h-4" />
            <span>MUNICIPAL AUTHORITY PATROL STATION</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            {user?.authority_profile?.organization || 'Highway Maintenance Agency'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Jurisdiction:{' '}
            <strong className="text-gray-200">
              {user?.authority_profile?.jurisdiction || 'Western Sector Division'}
            </strong>{' '}
            &bull; Department: {user?.authority_profile?.department || 'Roadway Remediation'}
          </p>
        </div>

        <button
          onClick={fetchAssigned}
          className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-amber-300 text-xs font-semibold flex items-center gap-2 border border-gray-700 self-start sm:self-auto transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Tasks</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Assigned Tasks Grid */}
      <div className="rounded-2xl bg-[#111827] border border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Assigned Hazard Remediation Tasks ({assignedReports.length})</span>
          </h2>
          <span className="text-[11px] font-mono text-gray-500">
            Enforced by server-side jurisdiction filter
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-mono">Loading assigned work orders...</span>
          </div>
        ) : assignedReports.length === 0 ? (
          <div className="py-16 text-center text-gray-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/60" />
            <p className="text-xs font-semibold text-gray-300">
              Zero pending tasks assigned to your officer account.
            </p>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
              Any reports logged within your assigned jurisdiction will automatically appear here for verification and repair sign-off.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] font-mono border-b border-gray-800">
                <tr>
                  <th className="py-2.5 px-3">Ref ID</th>
                  <th className="py-2.5 px-3">Corridor Location</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Current Status</th>
                  <th className="py-2.5 px-3">Reported</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {assignedReports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-800/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{r.reference_id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{r.title}</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-xs">{r.address}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.damage_severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {r.damage_severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-amber-400">
                      {r.workflow_status}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-gray-400 font-mono">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/reports/${r.id}`}
                        className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] transition"
                      >
                        Inspect &amp; Resolve
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
