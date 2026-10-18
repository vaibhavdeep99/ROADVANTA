import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Layers,
  Award,
  Loader2,
  Lock,
  Unlock,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [authorityRequests, setAuthorityRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsData, usersData, requestsData] = await Promise.all([
        api.getPlatformAnalytics(),
        api.listUsers(),
        api.listAuthorityRequests(),
      ]);
      setAnalytics(analyticsData);
      setUsers(usersData.data || []);
      setAuthorityRequests(requestsData || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load governance datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      await api.updateUser(userId, { is_active: !currentStatus });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to alter user account status.');
    }
  };

  const handleAuthorityDecision = async (userId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      await api.authorityDecision(userId, decision);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Authority review action failed.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Platform Governance &amp; Security Administration</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Server-enforced role assignments, municipal authority credential verification, and user state controls.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold flex items-center gap-2 border border-gray-700 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Governance</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800">
            <span className="text-xs text-gray-400 block mb-1">Total Registered Users</span>
            <div className="text-2xl font-bold text-white">{analytics.total_users}</div>
            <span className="text-[10px] text-gray-500 font-mono">Platform Accounts</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800">
            <span className="text-xs text-amber-400 block mb-1">Pending Authority Requests</span>
            <div className="text-2xl font-bold text-amber-300">{authorityRequests.length}</div>
            <span className="text-[10px] text-gray-500 font-mono">Requires Admin Approval</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800">
            <span className="text-xs text-cyan-400 block mb-1">Platform Scans Run</span>
            <div className="text-2xl font-bold text-cyan-300">{analytics.total_scans}</div>
            <span className="text-[10px] text-gray-500 font-mono">Image &amp; Video Inferences</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800">
            <span className="text-xs text-emerald-400 block mb-1">Remediation Resolution Rate</span>
            <div className="text-2xl font-bold text-emerald-300">
              {analytics.total_reports > 0
                ? `${((analytics.resolved_reports / analytics.total_reports) * 100).toFixed(0)}%`
                : '100%'}
            </div>
            <span className="text-[10px] text-gray-500 font-mono">
              {analytics.resolved_reports} of {analytics.total_reports} resolved
            </span>
          </div>
        </div>
      )}

      {/* Authority Requests Queue */}
      <div className="rounded-2xl bg-[#111827] border border-amber-500/30 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Pending Municipal Authority Applications ({authorityRequests.length})</span>
          </h2>
          <span className="text-[10px] text-gray-400 font-mono">Statutory Verification Queue</span>
        </div>

        {authorityRequests.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 font-mono">
            Zero pending authority applications in queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] font-mono border-b border-gray-800">
                <tr>
                  <th className="py-2.5 px-3">Applicant</th>
                  <th className="py-2.5 px-3">Agency / Department</th>
                  <th className="py-2.5 px-3">Jurisdiction</th>
                  <th className="py-2.5 px-3">Badge ID</th>
                  <th className="py-2.5 px-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {authorityRequests.map((req) => (
                  <tr key={req.user_id} className="hover:bg-gray-800/30">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{req.user?.full_name}</div>
                      <div className="text-[11px] text-gray-400">{req.user?.email}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-gray-200">{req.organization}</div>
                      <div className="text-[11px] text-gray-400">{req.department}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-400">
                      {req.jurisdiction}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-400">
                      {req.badge_number || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAuthorityDecision(req.user_id, 'APPROVE')}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleAuthorityDecision(req.user_id, 'REJECT')}
                          className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
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

      {/* User Management */}
      <div className="rounded-2xl bg-[#111827] border border-gray-800 p-5 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>User Directory &amp; Account Suspension Controls</span>
        </h2>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            <span className="text-xs font-mono">Loading user directory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] font-mono border-b border-gray-800">
                <tr>
                  <th className="py-2.5 px-3">Name / Email</th>
                  <th className="py-2.5 px-3">Assigned Role</th>
                  <th className="py-2.5 px-3">Account State</th>
                  <th className="py-2.5 px-3">Registered On</th>
                  <th className="py-2.5 px-3 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-800/30">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{u.full_name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-800 border border-gray-700 text-gray-300">
                        {u.roles?.join(', ') || 'USER'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.is_active
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleToggleUserActive(u.id, u.is_active)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ml-auto ${
                          u.is_active
                            ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Suspend</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>Reactivate</span>
                          </>
                        )}
                      </button>
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
