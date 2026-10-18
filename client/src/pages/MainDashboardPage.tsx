import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import {
  AlertTriangle,
  Car,
  CircleDot,
  Radio,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { Report } from '../types';

// Custom Marker Generator
const makeDotIcon = (color: string) => {
  return L.divIcon({
    html: `
      <div style="
        width: 18px;
        height: 18px;
        background: ${color};
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 0 10px ${color};
      "></div>
    `,
    className: 'custom-dot-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

import prismApi, { AnalyticsSummary, PrismReport, getAssetUrl } from '../services/prismApi';

export const MainDashboardPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.7196, 75.8577]);

  useEffect(() => {
    // 1. Fetch live analytics summary from PRISM backend
    prismApi.getAnalyticsSummary()
      .then((s) => setSummary(s))
      .catch((e) => console.warn('Could not fetch prism summary:', e));

    // 2. Fetch reports
    const loadData = async () => {
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
            resolutionStatus: (p.workflow_status === 'resolved' ? 'resolved' : 'triaged') as any,
            upvotesCount: p.detections_count || 1,
            reportedBy: p.is_demo ? 'Field Patrol AI' : 'Citizen Inspector',
            createdAt: p.created_at || new Date().toISOString(),
            originalImageUrl: getAssetUrl(p.original_image_url),
            city: p.city,
            address: p.address,
            latitude: p.latitude || 22.7196,
            longitude: p.longitude || 75.8577,
            isDemo: p.is_demo,
          }));
          setReports(mapped);
          if (mapped[0]?.latitude && mapped[0]?.longitude) {
            setMapCenter([mapped[0].latitude, mapped[0].longitude]);
          }
          return;
        }
      } catch (err) {
        console.warn('Prism reports fallback:', err);
      }

      try {
        const res = await axios.get('/api/v1/reports');
        if (res.data.success && Array.isArray(res.data.data)) {
          setReports(res.data.data);
          if (res.data.data[0]?.location?.coordinates) {
            const [lng, lat] = res.data.data[0].location.coordinates;
            setMapCenter([lat, lng]);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, []);

  const totalCount = summary?.total_reports ?? reports.length;
  const awaitingCount = summary?.awaiting_inspection ?? reports.filter((r) => (r.workflowStatus === 'submitted' || r.resolutionStatus === 'submitted')).length;
  const confirmedCount = summary?.confirmed_damage ?? reports.filter((r) => r.estimatedSeverity === 'high').length;
  const resolvedCount = summary?.resolved_reports ?? reports.filter((r) => r.resolutionStatus === 'resolved').length;

  const stats = [
    { title: 'Total Submitted', value: totalCount, change: 'Real database records', isIncrease: true, icon: <AlertTriangle className="w-5 h-5 text-rp-accent" /> },
    { title: 'Awaiting Inspection', value: awaitingCount, change: 'Pending field review', isIncrease: true, icon: <Clock className="w-5 h-5 text-amber-400" /> },
    { title: 'Confirmed Damage', value: confirmedCount, change: 'Priority maintenance candidates', isIncrease: false, icon: <Car className="w-5 h-5 text-rose-400" /> },
    { title: 'Resolved Reports', value: resolvedCount, change: 'Repaired & verified', isIncrease: false, icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
  ];

  const categoryChips = ['All', 'Potholes', 'Accidents', 'Traffic Signals', 'Road Damage'];

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text flex items-center gap-2">
              Good Morning, Rahul! 👋
            </h1>
            <p className="text-rp-text-secondary text-xs sm:text-sm mt-0.5">
              Here's what's happening on the roads today across the municipal sectors.
            </p>
          </div>

          <Link
            to="/report"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rp-accent to-cyan-400 text-rp-bg font-heading font-bold text-xs tracking-wide shadow-glow-cyan hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            Report New Incident
          </Link>
        </div>

        {/* 4 KPI Metric Cards matching Screen 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="rp-card bg-rp-card-elevated border-rp-border">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rp-text-muted uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className="p-2 rounded-lg bg-rp-card border border-rp-border">
                  {stat.icon}
                </div>
              </div>

              <div className="text-3xl font-heading font-bold text-rp-text mt-2">
                {stat.value}
              </div>

              <div className="text-[10px] text-rp-text-muted mt-1 flex items-center gap-1">
                <span className={stat.isIncrease ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 2-Column Main Section: Live Hazard Map + Recent Incidents List (Screen 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side: Live Hazard Map (Cols 1-8) */}
          <div className="lg:col-span-8 rp-card bg-rp-card-elevated p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-sm text-rp-text">
                  Live Hazard Map
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rp-accent/15 text-rp-accent font-bold">
                  Indore / Metro Cluster
                </span>
              </div>

              {/* Category Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                {categoryChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setActiveCategory(chip)}
                    className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap ${activeCategory === chip
                        ? 'bg-rp-accent text-rp-bg font-bold shadow-sm'
                        : 'bg-rp-card border border-rp-border text-rp-text-secondary hover:text-rp-text'
                      }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Embedded Leaflet Map */}
            <div className="h-96 w-full rounded-xl overflow-hidden border border-rp-border relative">
              <MapContainer
                center={mapCenter}
                zoom={12}
                scrollWheelZoom={false}
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer
                  attribution='RoadVanta Neural Engine'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {reports.map((r) => {
                  let color = '#10B981';
                  if (r.estimatedSeverity === 'critical') color = '#EF4444';
                  else if (r.estimatedSeverity === 'high') color = '#F97316';
                  else if (r.estimatedSeverity === 'medium') color = '#F59E0B';

                  const lat = r.latitude ?? (r.location ? r.location.coordinates[1] : 22.7196);
                  const lng = r.longitude ?? (r.location ? r.location.coordinates[0] : 75.8577);

                  return (
                    <Marker
                      key={r.id}
                      position={[lat, lng]}
                      icon={makeDotIcon(color)}
                    >
                      <Popup>
                        <div className="p-1 text-xs">
                          <strong className="block text-rp-text font-bold mb-1">{r.title}</strong>
                          <span className="text-[10px] text-rp-text-muted block">{r.address}</span>
                          <span className="text-[10px] font-bold text-rose-400 uppercase mt-1 block">
                            Severity: {r.estimatedSeverity}
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Legend & Full View overlay bar at bottom */}
              <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center justify-between px-3 py-2 bg-rp-card-elevated/90 backdrop-blur-md border border-rp-border rounded-xl text-xs">
                <div className="flex items-center gap-3 text-[11px] text-rp-text-muted">
                  <span className="flex items-center gap-1 font-semibold text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> High
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
                  </span>
                </div>

                <Link
                  to="/map"
                  className="text-xs font-bold text-rp-accent hover:underline flex items-center gap-1"
                >
                  View Full Map <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side: Recent Incidents List matching Screen 2 (Cols 9-12) */}
          <div className="lg:col-span-4 rp-card bg-rp-card-elevated">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-rp-border">
              <h3 className="font-heading font-bold text-sm text-rp-text">
                Recent Incidents
              </h3>
              <Link to="/reports" className="text-xs text-rp-accent hover:underline flex items-center gap-0.5">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {reports.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  to="/map"
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-rp-card border border-rp-border hover:border-rp-accent/40 transition-colors group"
                >
                  <img
                    src={r.originalImageUrl}
                    alt={r.title}
                    className="w-12 h-12 rounded-lg object-cover bg-rp-bg flex-shrink-0 border border-rp-border"
                  />

                  <div className="flex-1 min-w-0">
                    <span className="font-heading font-bold text-xs text-rp-text group-hover:text-rp-accent block truncate transition-colors">
                      {r.title}
                    </span>
                    <span className="text-[10px] text-rp-text-muted block truncate mt-0.5">
                      {r.address}
                    </span>
                    <span className="text-[9px] text-rp-text-muted mt-0.5 block flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> 2 hours ago
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 ${r.estimatedSeverity === 'critical' || r.estimatedSeverity === 'high'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : r.estimatedSeverity === 'medium'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                  >
                    {r.estimatedSeverity}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default MainDashboardPage;
