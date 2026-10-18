import React, { useState, useEffect } from 'react';
import {
  FileSearch,
  Filter,
  Clock,
  User,
  Activity,
  Loader2,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAuditLogs({ limit: 50 });
      setLogs(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to retrieve immutable audit ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-cyan-400" />
            <span>Immutable Platform Audit Ledger</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Tamper-evident system activity log capturing administrative decisions, status shifts, and logins.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold flex items-center gap-2 border border-gray-700 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Ledger Table */}
      <div className="rounded-2xl bg-[#111827] border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            <span className="text-xs font-mono">Querying audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500 font-mono">
            No audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] font-mono border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor ID</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Metadata Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono text-[11px] text-gray-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/30">
                    <td className="py-2.5 px-4 text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-cyan-300">{log.action}</td>
                    <td className="py-2.5 px-4 text-gray-400">{log.actor_id?.slice(0, 8) || 'SYSTEM'}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-gray-300">{log.target_type}</span>{' '}
                      <span className="text-gray-500">[{log.target_id?.slice(0, 8)}]</span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-400 truncate max-w-xs">
                      {log.metadata_json ? JSON.stringify(log.metadata_json) : '—'}
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
