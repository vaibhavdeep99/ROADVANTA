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
} from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { Report, ResolutionStatus } from '../types';

export const ResolutionTrackingPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [triageOpen, setTriageOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ResolutionStatus>('in_progress');
  const [assignedDept, setAssignedDept] = useState('');

  const fetchReports = async () => {
    try {
      const res = await axios.get('/api/v1/reports');
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const tabs = [
    { id: 'All', label: 'All', count: 54 },
    { id: 'Pending', label: 'Pending', count: 12 },
    { id: 'In Progress', label: 'In Progress', count: 18 },
    { id: 'Resolved', label: 'Resolved', count: 24 },
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
      const res = await axios.patch(`/api/v1/reports/${selectedReport.id}`, {
        resolutionStatus: newStatus,
        assignedDepartment: assignedDept,
      });

      if (res.data.success) {
        toast.success(`Updated status to ${newStatus}`);
        setReports((prev) =>
          prev.map((r) => (r.id === selectedReport.id ? res.data.data : r))
        );
        setTriageOpen(false);
      }
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
                      <button
                        onClick={() => {
                          setSelectedReport(r);
                          setNewStatus(r.resolutionStatus);
                          setAssignedDept(r.assignedDepartment || 'Public Works Dept');
                          setTriageOpen(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-rp-card border border-rp-border hover:border-rp-accent/50 text-rp-text hover:text-rp-accent font-semibold text-xs transition-colors"
                      >
                        View & Triage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Status Change */}
      {triageOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-rp-bg/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-rp-card-elevated border border-rp-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-heading font-bold text-lg text-rp-text mb-4">
              Update Resolution Pipeline
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-rp-text-muted uppercase block mb-1">
                  Resolution Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ResolutionStatus)}
                  className="w-full px-3 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text"
                >
                  <option value="submitted">Submitted</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

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

              <div className="flex justify-end gap-2 pt-3 border-t border-rp-border">
                <button
                  type="button"
                  onClick={() => setTriageOpen(false)}
                  className="px-4 py-2 rounded-lg bg-rp-card border border-rp-border text-xs text-rp-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rp-accent text-rp-bg font-heading font-bold text-xs"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default ResolutionTrackingPage;
