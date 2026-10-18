import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Filter,
  Search,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Eye,
  Info,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import prismApi, { getAssetUrl, PrismReport } from '../services/prismApi';

const PRESET_CORRIDORS = [
  { name: 'All India View', city: 'all', lat: 23.5937, lng: 78.9629, bbox: '68.0%2C8.0%2C97.0%2C37.0' },
  { name: 'Unnao (NH-27 Leather Belt, UP)', city: 'unnao', lat: 26.5380, lng: 80.4820, bbox: '80.35%2C26.45%2C80.60%2C26.65' },
  { name: 'Lucknow (Shaheed Path, UP)', city: 'lucknow', lat: 26.8467, lng: 80.9462, bbox: '80.85%2C26.75%2C81.05%2C26.95' },
  { name: 'Varanasi (GT Road, UP)', city: 'varanasi', lat: 25.3176, lng: 82.9739, bbox: '82.85%2C25.25%2C83.08%2C25.40' },
  { name: 'Indore (BRTS Corridor, MP)', city: 'indore', lat: 22.7196, lng: 75.8577, bbox: '75.75%2C22.65%2C75.95%2C22.80' },
  { name: 'Kanpur (GT Road Bypass, UP)', city: 'kanpur', lat: 26.4499, lng: 80.3319, bbox: '80.20%2C26.35%2C80.45%2C26.55' },
];

export const MapPage: React.FC = () => {
  const [reports, setReports] = useState<PrismReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<PrismReport[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<PrismReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch reports from backend
  const loadReports = () => {
    setLoading(true);
    prismApi.getReports()
      .then((data) => {
        setReports(data);
        setFilteredReports(data);
        if (data.length > 0) {
          setSelectedReport(data[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Filter logic
  useEffect(() => {
    let list = reports;
    if (selectedCity !== 'all') {
      list = list.filter((r) => r.city.toLowerCase() === selectedCity.toLowerCase());
    }
    if (selectedSeverity !== 'all') {
      list = list.filter((r) => r.estimated_severity === selectedSeverity);
    }
    if (selectedStatus !== 'all') {
      list = list.filter((r) => r.workflow_status === selectedStatus);
    }
    if (search.trim()) {
      const tokens = search.toLowerCase().split(/[\s,]+/).filter((t) => t.length > 1);
      list = list.filter((r) => {
        const text = `${r.title} ${r.address} ${r.city} ${r.id} ${r.category}`.toLowerCase();
        return tokens.some((tok) => text.includes(tok));
      });
    }
    setFilteredReports(list);
    if (list.length > 0 && (!selectedReport || !list.some((r) => r.id === selectedReport.id))) {
      setSelectedReport(list[0]);
    }
  }, [selectedCity, selectedSeverity, selectedStatus, search, reports]);

  // Request browser geolocation with consent
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        alert(`Location permission denied or unavailable: ${err.message}`);
      }
    );
  };

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'high':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'moderate':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <SidebarLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rp-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-rp-accent/15 text-rp-accent border border-rp-accent/30">
                Geospatial Intelligence
              </span>
              <span className="text-xs text-rp-text-muted">RoadVanta Geospatial Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text">
              Live Road Damage Map
            </h1>
            <p className="text-sm text-rp-text-secondary mt-1">
              Interactive visualization of verified cavitation hazards, municipal priority zones, and citizen reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLocateMe}
              className="px-3.5 py-2 rounded-xl bg-rp-card border border-rp-border hover:border-rp-accent text-xs font-semibold text-rp-text hover:text-rp-accent transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Compass className="w-3.5 h-3.5 text-rp-accent" />
              Use My Location
            </button>
            <button
              onClick={loadReports}
              className="p-2 rounded-xl bg-rp-card border border-rp-border text-rp-text-muted hover:text-rp-text text-xs"
              title="Refresh Reports"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-rp-card border border-rp-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-rp-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search location or ID..."
                className="w-full pl-8 pr-3 py-1.5 bg-rp-bg-secondary border border-rp-border rounded-xl text-xs text-rp-text focus:outline-none focus:border-rp-accent"
              />
            </div>

            {/* City Filter */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-1.5 bg-rp-bg-secondary border border-rp-border rounded-xl text-xs text-rp-text focus:outline-none focus:border-rp-accent"
            >
              <option value="all">All Municipalities</option>
              <option value="indore">Indore</option>
              <option value="bengaluru">Bengaluru</option>
              <option value="kanpur">Kanpur</option>
              <option value="lucknow">Lucknow</option>
              <option value="varanasi">Varanasi</option>
              <option value="unnao">Unnao</option>
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-1.5 bg-rp-bg-secondary border border-rp-border rounded-xl text-xs text-rp-text focus:outline-none focus:border-rp-accent"
            >
              <option value="all">All Severities</option>
              <option value="high">High Severity</option>
              <option value="moderate">Moderate Severity</option>
              <option value="low">Low Severity</option>
              <option value="requires_inspection">Requires Inspection</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-rp-bg-secondary border border-rp-border rounded-xl text-xs text-rp-text focus:outline-none focus:border-rp-accent"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="awaiting_review">Awaiting Review</option>
              <option value="under_inspection">Under Inspection</option>
              <option value="confirmed">Confirmed Damage</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="text-xs text-rp-text-muted">
            Showing <strong>{filteredReports.length}</strong> markers
          </div>
        </div>

        {/* Map Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Map Box (8 cols) */}
          <div className="lg:col-span-8 bg-rp-card border border-rp-border rounded-2xl overflow-hidden relative min-h-[500px] flex flex-col">
            {/* Map Canvas with OpenStreetMap Iframe / Interactive View */}
            <div className="relative flex-1 bg-rp-bg-secondary">
              <iframe
                title="OpenStreetMap Live View"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  selectedReport?.longitude ? `${(selectedReport.longitude - 0.08).toFixed(4)}%2C${(selectedReport.latitude! - 0.06).toFixed(4)}%2C${(selectedReport.longitude + 0.08).toFixed(4)}%2C${(selectedReport.latitude! + 0.06).toFixed(4)}` : '73.0%2C12.0%2C84.0%2C28.0'
                }&layer=mapnik&marker=${
                  selectedReport?.latitude || 22.7196
                }%2C${selectedReport?.longitude || 75.8577}`}
                className="w-full h-full min-h-[500px] border-none grayscale-[0.2] contrast-[1.1]"
              />

              {/* Floating Map Legend */}
              <div className="absolute top-4 left-4 bg-rp-bg/90 backdrop-blur-md border border-rp-border p-3 rounded-xl shadow-lg space-y-1.5 text-[11px] z-10">
                <span className="font-bold text-rp-text block mb-1">Severity Legend</span>
                <div className="flex items-center gap-2 text-rose-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> High Damage (Immediate Action)
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Moderate Cavitation
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Low Severity / Minor Crack
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Requires Inspection
                </div>
              </div>

              {/* Notice Banner */}
              <div className="absolute bottom-3 left-3 right-3 bg-rp-bg/95 backdrop-blur border border-rp-border p-2.5 rounded-xl text-[11px] text-rp-text-muted flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-rp-accent" />
                  <span>
                    Reports without validated GPS coordinates are categorized as "Location Unavailable" and excluded from map pins.
                  </span>
                </div>
                <span className="font-mono text-[10px] text-rp-accent">RoadVanta Neural Geospatial</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Selected Report Details & Marker List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Selected Marker Inspector */}
            {selectedReport ? (
              <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rp-accent">
                    {selectedReport.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {selectedReport.is_demo && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                        DEMO DATA
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getSeverityBadgeClass(selectedReport.estimated_severity)}`}>
                      {selectedReport.estimated_severity.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-rp-bg-secondary border border-rp-border">
                  <img
                    src={getAssetUrl(selectedReport.original_image_url)}
                    alt={selectedReport.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-heading font-bold text-sm text-rp-text">
                    {selectedReport.title}
                  </h3>
                  <p className="text-xs text-rp-text-muted flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rp-accent flex-shrink-0" />
                    <span>{selectedReport.address}, {selectedReport.city}</span>
                  </p>
                  {selectedReport.latitude && selectedReport.longitude ? (
                    <p className="text-[10px] font-mono text-rp-text-secondary">
                      GPS: {selectedReport.latitude.toFixed(5)}, {selectedReport.longitude.toFixed(5)}
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-400 font-mono">
                      Location coordinates unverified
                    </p>
                  )}
                </div>

                <p className="text-xs text-rp-text-secondary leading-relaxed bg-rp-bg-secondary p-3 rounded-xl border border-rp-border">
                  {selectedReport.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-rp-bg-secondary border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted block">Workflow Status</span>
                    <span className="font-bold capitalize text-rp-text">
                      {selectedReport.workflow_status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rp-bg-secondary border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted block">Priority Score</span>
                    <span className="font-bold text-rp-accent">
                      {selectedReport.priority_score}/100
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-rp-card border border-rp-border rounded-2xl p-6 text-center text-xs text-rp-text-muted">
                Select a report to view details.
              </div>
            )}

            {/* List of Other Incident Pins */}
            <div className="bg-rp-card border border-rp-border rounded-2xl p-4 space-y-2">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-rp-text-muted px-1">
                Active Reports in Area
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredReports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      selectedReport?.id === r.id
                        ? 'border-rp-accent bg-rp-accent/15'
                        : 'border-rp-border bg-rp-bg-secondary hover:border-rp-text-muted'
                    }`}
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <span className="font-bold text-rp-text block truncate">{r.title}</span>
                      <span className="text-[10px] text-rp-text-muted truncate block">
                        {r.city} • {r.address}
                      </span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase flex-shrink-0 ${getSeverityBadgeClass(r.estimated_severity)}`}>
                      {r.estimated_severity.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default MapPage;
