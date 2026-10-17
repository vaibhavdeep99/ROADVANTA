import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Radar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Download,
  Building2,
  ShieldCheck,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { Navbar } from '../components/Navbar';

const SECTORS = [
  // Bengaluru Corridors (Preserved)
  { id: 'silk-board', name: 'Silk Board & Outer Ring Road Corridor', city: 'Bengaluru', ward: 'BTM / HSR Sector', group: 'Bengaluru Corridors' },
  { id: 'koramangala', name: 'Koramangala 80ft & Sony World Belt', city: 'Bengaluru', ward: 'Ward 151', group: 'Bengaluru Corridors' },
  { id: 'indiranagar', name: 'Indiranagar 100 Feet Road Commercial Zone', city: 'Bengaluru', ward: 'Ward 89', group: 'Bengaluru Corridors' },
  { id: 'whitefield', name: 'Whitefield ITPL Tech Corridor', city: 'Bengaluru', ward: 'Ward 84', group: 'Bengaluru Corridors' },

  // Key Municipal Cities
  { id: 'indore-metro', name: 'Indore Municipal Sector', city: 'Indore', ward: 'Indore Municipal Taskforce', group: 'Municipal Cities' },
  { id: 'kanpur-metro', name: 'Kanpur Central & GT Road Zone', city: 'Kanpur', ward: 'Kanpur Nagar Nigam', group: 'Municipal Cities' },
  { id: 'lucknow-metro', name: 'Lucknow Gomti Nagar & Transit Corridor', city: 'Lucknow', ward: 'Lucknow Nagar Nigam', group: 'Municipal Cities' },
  { id: 'unnao-metro', name: 'Unnao Industrial Highway Zone', city: 'Unnao', ward: 'Unnao Municipality', group: 'Municipal Cities' },
  { id: 'varanasi-metro', name: 'Varanasi Heritage & Cantonment Belt', city: 'Varanasi', ward: 'Varanasi Nagar Nigam', group: 'Municipal Cities' },

  // Highway Corridors
  { id: 'kanpur-lucknow-corridor', name: 'Kanpur–Lucknow NH-27 Corridor', city: 'Kanpur / Lucknow', ward: 'NH-27 Highway Taskforce', group: 'Highway Transit Corridors' },
  { id: 'lucknow-unnao-corridor', name: 'Lucknow–Unnao NH-27 Highway', city: 'Lucknow / Unnao', ward: 'NH-27 Westbound Division', group: 'Highway Transit Corridors' },
  { id: 'kanpur-varanasi-corridor', name: 'Kanpur–Varanasi NH-19 Corridor', city: 'Kanpur / Varanasi', ward: 'NH-19 Grand Trunk Highway', group: 'Highway Transit Corridors' },
];

const COLORS = ['#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899'];

export const AreaIntelligencePage: React.FC = () => {
  const [sectorSearch, setSectorSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAreaAnalytics = async (sectorName: string) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/v1/analytics/area', {
        areaName: sectorName,
      });
      if (res.data.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load area analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreaAnalytics(selectedSector.name);
  }, [selectedSector]);

  // Demo trend data for charts
  const weeklyTrends = [
    { day: 'Mon', incidents: 12, resolved: 8 },
    { day: 'Tue', incidents: 19, resolved: 14 },
    { day: 'Wed', incidents: 15, resolved: 11 },
    { day: 'Thu', incidents: 27, resolved: 18 },
    { day: 'Fri', incidents: 32, resolved: 22 },
    { day: 'Sat', incidents: 24, resolved: 19 },
    { day: 'Sun', incidents: 18, resolved: 16 },
  ];

  const deptWorkload = [
    { name: 'PWD', active: 14, resolved: 22 },
    { name: 'Traffic', active: 6, resolved: 18 },
    { name: 'Drainage', active: 9, resolved: 12 },
    { name: 'Signals', active: 3, resolved: 15 },
  ];

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-rp-bg flex flex-col pt-16">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        {/* Header & Sector Dropdown */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rp-accent/10 border border-rp-accent/20 text-rp-accent text-xs font-semibold mb-2">
              <Radar className="w-3.5 h-3.5" />
              Area-Wise Road Intelligence Engine
            </div>
            <h1 className="text-3xl font-heading font-bold text-rp-text">
              Sector Road Safety & Pavement Analytics
            </h1>
            <p className="text-rp-text-secondary text-sm mt-1">
              Automated hazard clustering, risk vulnerability scoring, and AI municipal repair recommendations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search sector, city, or route..."
                value={sectorSearch}
                onChange={(e) => setSectorSearch(e.target.value)}
                className="bg-rp-card border border-rp-border rounded-xl pl-3 pr-7 py-2 text-xs text-rp-text placeholder-rp-text-muted focus:outline-none focus:border-rp-accent w-44 sm:w-60"
              />
              {sectorSearch && (
                <button
                  type="button"
                  onClick={() => setSectorSearch('')}
                  className="absolute right-2.5 top-2 text-rp-text-muted hover:text-rp-text text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={selectedSector.id}
              onChange={(e) => {
                const found = SECTORS.find((s) => s.id === e.target.value);
                if (found) setSelectedSector(found);
              }}
              className="bg-rp-card border border-rp-border rounded-xl px-4 py-2.5 text-xs text-rp-text font-semibold focus:outline-none focus:border-rp-accent max-w-xs"
            >
              {['Bengaluru Corridors', 'Municipal Cities', 'Highway Transit Corridors'].map((grp) => {
                const groupItems = SECTORS.filter(
                  (s) =>
                    s.group === grp &&
                    (sectorSearch === '' ||
                      s.name.toLowerCase().includes(sectorSearch.toLowerCase()) ||
                      s.city.toLowerCase().includes(sectorSearch.toLowerCase()))
                );
                if (groupItems.length === 0) return null;
                return (
                  <optgroup key={grp} label={`── ${grp} ──`}>
                    {groupItems.map((s) => (
                      <option key={s.id} value={s.id}>
                        📍 {s.name} ({s.city})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rp-accent text-rp-bg font-heading font-bold text-xs tracking-wide shadow-glow-cyan hover:scale-105 transition-all"
            >
              <Download className="w-4 h-4" />
              Export Safety Dossier
            </button>
          </div>
        </div>

        {/* Top Intelligence Grid: Safety Index + Breakdown */}
        {analyticsData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Safety Index Dial (Cols 1-4) */}
            <div className="lg:col-span-4 rp-card bg-rp-card-elevated flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
              <div className="w-40 h-40 rounded-full border-8 border-rp-border flex flex-col items-center justify-center relative mb-4">
                <span className="text-4xl font-heading font-bold text-rp-accent">
                  {analyticsData.safetyIndex}
                </span>
                <span className="text-[11px] text-rp-text-muted uppercase font-bold">
                  Road Safety Index
                </span>
                <div
                  className="absolute inset-0 rounded-full border-8 border-rp-accent border-t-transparent animate-spin-slow pointer-events-none"
                  style={{ animationDuration: '8s' }}
                />
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${analyticsData.safetyIndex < 50
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : analyticsData.safetyIndex < 75
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
              >
                {analyticsData.riskLevel}
              </span>

              <p className="text-xs text-rp-text-muted mt-3">
                Calculated across {analyticsData.totalReports} active reported hazard points in this sector.
              </p>
            </div>

            {/* AI Executive Summary & Smart Recommendations (Cols 5-12) */}
            <div className="lg:col-span-8 rp-card bg-rp-card-elevated flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-rp-border pb-3 mb-4">
                  <ShieldCheck className="w-5 h-5 text-rp-accent" />
                  <h3 className="font-heading font-bold text-base text-rp-text">
                    AI Municipal Pavement & Safety Diagnosis
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-rp-text-secondary leading-relaxed bg-rp-bg/70 p-4 rounded-xl border border-rp-border mb-4">
                  {analyticsData.aiSummary}
                </p>

                <h4 className="text-xs font-heading font-bold text-rp-text uppercase tracking-wider mb-2">
                  Actionable Engineering Directives
                </h4>

                <div className="space-y-2">
                  {analyticsData.recommendations?.map((rec: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-rp-card border border-rp-border text-xs text-rp-text-secondary"
                    >
                      <CheckCircle2 className="w-4 h-4 text-rp-accent flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Hazard Category Distribution */}
          <div className="rp-card bg-rp-card-elevated">
            <h3 className="font-heading font-bold text-sm text-rp-text mb-4 flex items-center justify-between">
              <span>Hazard Classification Breakdown</span>
              <span className="text-xs font-normal text-rp-text-muted">By Type</span>
            </h3>

            <div className="h-64 w-full">
              {analyticsData?.categoryBreakdown && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryBreakdown}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {analyticsData.categoryBreakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#111827',
                        border: '1px solid #263449',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#F8FAFC',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-rp-border">
              {analyticsData?.categoryBreakdown?.map((cat: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-rp-text-secondary">
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="truncate capitalize">{cat.category.replace('_', ' ')}</span>
                  <span className="text-rp-text font-bold">({cat.count})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Weekly Incident Trends */}
          <div className="rp-card bg-rp-card-elevated">
            <h3 className="font-heading font-bold text-sm text-rp-text mb-4 flex items-center justify-between">
              <span>Incident Velocity & Resolutions</span>
              <span className="text-xs font-normal text-rp-text-muted">7-Day Run</span>
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrends}>
                  <defs>
                    <linearGradient id="incidentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263449" />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid #263449',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#F8FAFC',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="incidents"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#incidentGrad)"
                    name="Reported Incidents"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#resolvedGrad)"
                    name="Repairs Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-rp-border text-xs">
              <div className="flex items-center gap-1.5 text-rp-accent">
                <div className="w-3 h-1 bg-rp-accent rounded" />
                <span>Reported Incidents</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <div className="w-3 h-1 bg-emerald-400 rounded" />
                <span>Repairs Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Workload Bar Chart */}
        <div className="rp-card bg-rp-card-elevated">
          <h3 className="font-heading font-bold text-sm text-rp-text mb-4 flex items-center justify-between">
            <span>Municipal Department Dispatch Efficiency</span>
            <span className="text-xs font-normal text-rp-text-muted">Active vs Completed</span>
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptWorkload}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263449" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid #263449',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                />
                <Bar dataKey="active" fill="#F59E0B" name="Active Repairs" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="#10B981" name="Completed Works" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaIntelligencePage;
