import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  MapPin,
  Clock,
  ExternalLink,
  Filter,
  Search,
  ThumbsUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  Download,
} from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { Report } from '../types';
import prismApi, { getAssetUrl } from '../services/prismApi';

export const IncidentReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState<Report | null>(null);

  useEffect(() => {
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
            estimatedSeverity: p.estimated_severity as any,
            priorityScore: p.priority_score,
            workflowStatus: p.workflow_status as any,
            resolutionStatus: (p.workflow_status === 'resolved' ? 'resolved' : 'submitted') as any,
            verificationStatus: p.verification_status as any,
            city: p.city,
            address: p.address,
            latitude: p.latitude || 22.7196,
            longitude: p.longitude || 75.8577,
            originalImageUrl: getAssetUrl(p.original_image_url),
            upvotesCount: p.detections_count || 1,
            reportedBy: p.is_demo ? 'Simulated Inspection' : 'Verified Citizen',
            createdAt: p.created_at || new Date().toISOString(),
            isDemo: p.is_demo,
          }));
          setReports(mapped);
          return;
        }
      } catch (err) {
        console.warn('Prism backend fallback to node:', err);
      }

      try {
        const res = await axios.get('/api/v1/reports');
        if (res.data.success) {
          setReports(res.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchReports();
  }, []);

  const tabs = [
    { id: 'All', label: 'All', count: 54 },
    { id: 'Accidents', label: 'Accidents', count: 18 },
    { id: 'Potholes', label: 'Potholes', count: 22 },
    { id: 'Traffic Signals', label: 'Traffic Signals', count: 7 },
    { id: 'Road Damage', label: 'Road Damage', count: 9 },
  ];

  const filteredReports = reports.filter((r) => {
    if (activeTab === 'Potholes' && r.category !== 'pothole') return false;
    if (activeTab === 'Accidents' && !r.category.includes('accident')) return false;
    if (activeTab === 'Traffic Signals' && r.category !== 'damaged_signal') return false;
    if (activeTab === 'Road Damage' && r.category !== 'road_crack' && r.category !== 'broken_surface' && r.category !== 'damaged_barrier') return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.address.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text">
            Incident Reports
          </h1>
          <p className="text-rp-text-secondary text-xs sm:text-sm mt-0.5">
            Verified community reports, automated hazard tags, and road incident history.
          </p>
        </div>

        {/* Category Tabs matching Screen 5 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-rp-border pb-3">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-rp-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search incidents..."
                className="w-full pl-8 pr-3 py-1.5 bg-rp-card border border-rp-border rounded-lg text-xs text-rp-text placeholder:text-rp-text-muted focus:outline-none focus:border-rp-accent"
              />
            </div>
            <a
              href={prismApi.getExportCsvUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-rp-bg-secondary border border-rp-border text-rp-text hover:text-rp-accent text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Export all reports as CSV"
            >
              <Download className="w-3.5 h-3.5 text-rp-accent" />
              <span className="hidden sm:inline">Export CSV</span>
            </a>
          </div>
        </div>

        {/* Reports Cards Grid matching Screen 5 */}
        <div className="space-y-3">
          {filteredReports.map((r) => (
            <div
              key={r.id}
              className="rp-card bg-rp-card-elevated border-rp-border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-rp-accent/30 transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={r.originalImageUrl}
                  alt={r.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-rp-bg flex-shrink-0 border border-rp-border"
                />

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-rp-text group-hover:text-rp-accent transition-colors truncate">
                      {r.title}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        r.estimatedSeverity === 'critical' || r.estimatedSeverity === 'high'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {r.estimatedSeverity}
                    </span>
                  </div>

                  <div className="text-xs text-rp-text-muted flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rp-text-muted" /> 22 Apr 2026, 03:24 PM
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-rp-accent flex-shrink-0" />
                      <span className="truncate">{r.address}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-rp-border/50">
                <span
                  className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${
                    r.resolutionStatus === 'resolved'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : r.resolutionStatus === 'in_progress'
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {r.resolutionStatus === 'in_progress' ? 'In Progress' : r.resolutionStatus}
                </span>

                <button
                  onClick={() => setSelectedCase(r)}
                  className="px-4 py-2 rounded-lg bg-rp-card border border-rp-border hover:border-rp-accent/50 text-xs font-semibold text-rp-text hover:text-rp-accent transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-rp-bg/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-rp-card-elevated border border-rp-border rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-rp-border pb-3 mb-4">
              <span className="font-mono text-xs text-rp-accent font-bold">
                {selectedCase.reportNumber}
              </span>
              <button onClick={() => setSelectedCase(null)} className="text-rp-text-muted font-bold text-sm">
                ✕
              </button>
            </div>

            <div className="h-52 rounded-xl overflow-hidden mb-4 border border-rp-border bg-rp-bg">
              <img
                src={selectedCase.originalImageUrl}
                alt={selectedCase.title}
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="font-heading font-bold text-base text-rp-text mb-1">
              {selectedCase.title}
            </h3>
            <p className="text-xs text-rp-text-secondary leading-relaxed mb-4">
              {selectedCase.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="p-2.5 rounded-lg bg-rp-bg border border-rp-border">
                <span className="text-[10px] text-rp-text-muted uppercase font-bold block">Location</span>
                <span className="text-rp-text truncate block">{selectedCase.address}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-rp-bg border border-rp-border">
                <span className="text-[10px] text-rp-text-muted uppercase font-bold block">Status</span>
                <span className="text-rp-accent font-bold uppercase block">{selectedCase.resolutionStatus}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCase(null)}
              className="w-full py-2.5 rounded-lg bg-rp-accent text-rp-bg font-heading font-bold text-xs uppercase"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default IncidentReportsPage;
