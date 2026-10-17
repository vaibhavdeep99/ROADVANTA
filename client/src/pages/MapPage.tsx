import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Filter,
  Layers,
  Search,
  ThumbsUp,
  MapPin,
  Clock,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Maximize2,
  RefreshCw,
  LocateFixed,
  Globe,
} from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { Report, HazardCategory, SeverityLevel } from '../types';

// Custom Colored Dot Marker
const createMapMarkerIcon = (severity: SeverityLevel) => {
  let color = '#EF4444'; // Red for critical/high
  let shadow = 'rgba(239, 68, 68, 0.7)';

  if (severity === 'high') {
    color = '#F97316';
    shadow = 'rgba(249, 115, 22, 0.6)';
  } else if (severity === 'medium') {
    color = '#F59E0B';
    shadow = 'rgba(245, 158, 11, 0.5)';
  } else if (severity === 'low') {
    color = '#10B981';
    shadow = 'rgba(16, 185, 129, 0.5)';
  }

  const html = `
    <div style="
      position: relative;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${color};
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 14px ${shadow};
      cursor: pointer;
    ">
      <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-dot-leaflet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};

// Map Pan Helper
const MapRecenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.2 });
  }, [center, map]);
  return null;
};

// Map Click Listener to pick ANY location
const MapClickDetector = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const MapPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.7196, 75.8577]); // Default Indore / Central Metro
  const [searchLocation, setSearchLocation] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Left Filter Panel State matching Screen 4
  const [hazardTypes, setHazardTypes] = useState({
    potholes: true,
    accidents: true,
    signals: true,
    roadDamage: true,
    waterlogging: true,
  });

  const [priorities, setPriorities] = useState({
    high: true,
    medium: true,
    low: true,
  });

  const [statuses, setStatuses] = useState({
    open: true,
    inProgress: true,
    resolved: true,
  });

  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/reports');
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Search ANY location on Earth via Nominatim OpenStreetMap API (Free, zero billing)
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchLocation.trim()) return;

    setIsGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'RoadPatrolAI-SmartCityApp' },
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCenter([lat, lon]);
        toast.success(`Found location: ${data[0].display_name.split(',').slice(0, 3).join(',')}`);
      } else {
        toast.error('Location not found. Try searching another city or landmark.');
      }
    } catch (err) {
      toast.error('Could not connect to geocoding service.');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Reverse geocoding on map click
  const handleMapClick = async (lat: number, lng: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'RoadPatrolAI-SmartCityApp' },
      });
      const data = await res.json();
      const addr = data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      setClickedLocation({ lat, lng, address: addr });
      toast.success(`Selected: ${addr}`);
    } catch {
      setClickedLocation({ lat, lng, address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}` });
    }
  };

  // Upvote report
  const handleVote = async (reportId: string) => {
    try {
      const res = await axios.post(`/api/v1/reports/${reportId}/vote`);
      if (res.data.success) {
        toast.success(res.data.data.message || 'Report verified!');
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, votes: res.data.data.votes } : r))
        );
      }
    } catch {
      toast.error('Failed to register upvote');
    }
  };

  // Apply filters
  const filteredReports = reports.filter((r) => {
    if (r.category === 'pothole' && !hazardTypes.potholes) return false;
    if (r.category.includes('accident') && !hazardTypes.accidents) return false;
    if (r.category === 'damaged_signal' && !hazardTypes.signals) return false;
    if ((r.category === 'road_crack' || r.category === 'damaged_barrier') && !hazardTypes.roadDamage) return false;
    if (r.category === 'waterlogging' && !hazardTypes.waterlogging) return false;

    if (r.estimatedSeverity === 'critical' || r.estimatedSeverity === 'high') {
      if (!priorities.high) return false;
    } else if (r.estimatedSeverity === 'medium') {
      if (!priorities.medium) return false;
    } else if (r.estimatedSeverity === 'low') {
      if (!priorities.low) return false;
    }

    if (r.resolutionStatus === 'resolved' && !statuses.resolved) return false;
    if (r.resolutionStatus === 'in_progress' && !statuses.inProgress) return false;
    if (r.resolutionStatus === 'submitted' && !statuses.open) return false;

    return true;
  });

  return (
    <SidebarLayout>
      <div className="h-[calc(100vh-100px)] flex flex-col relative rounded-2xl overflow-hidden border border-rp-border shadow-2xl">
        {/* Top Control Bar: Search ANY Location on Map */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
          {/* Location Search Bar */}
          <form
            onSubmit={handleSearchLocation}
            className="w-full sm:w-96 flex items-center bg-rp-card-elevated/95 backdrop-blur-md border border-rp-border rounded-xl p-1 shadow-2xl pointer-events-auto"
          >
            <Search className="w-4 h-4 text-rp-text-muted ml-3" />
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Search ANY city/location (e.g. Indore, Palasia, MG Road)..."
              className="w-full px-2.5 py-1.5 bg-transparent text-xs text-rp-text placeholder:text-rp-text-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={isGeocoding}
              className="px-3 py-1.5 rounded-lg bg-rp-accent text-rp-bg font-heading font-bold text-xs shadow-glow-cyan"
            >
              {isGeocoding ? 'Locating...' : 'Go'}
            </button>
          </form>

          {/* Quick Stats Pill */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-rp-card-elevated/95 backdrop-blur-md border border-rp-border rounded-xl shadow-2xl text-xs pointer-events-auto">
            <span className="font-semibold text-rp-text flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-rp-accent" />
              Showing <span className="text-rp-accent font-bold">{filteredReports.length}</span> Hazards
            </span>
          </div>
        </div>

        {/* Left Floating Filter Panel matching Screen 4 */}
        <div className="absolute top-20 left-4 z-[1000] w-64 bg-rp-card-elevated/95 backdrop-blur-md border border-rp-border rounded-2xl p-4 shadow-2xl hidden md:block max-h-[calc(100%-100px)] overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-rp-border">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-rp-text flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-rp-accent" />
              Filters
            </h4>
            <button onClick={fetchReports} className="text-[10px] text-rp-accent hover:underline">
              Reset
            </button>
          </div>

          {/* Hazard Type Checkboxes */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rp-text-muted block mb-1.5">
                Hazard Type
              </span>
              <div className="space-y-1.5 text-xs">
                {[
                  { key: 'potholes', label: '🕳️ Potholes' },
                  { key: 'accidents', label: '💥 Accidents' },
                  { key: 'signals', label: '🚦 Traffic Signals' },
                  { key: 'roadDamage', label: '⚡ Road Damage' },
                  { key: 'waterlogging', label: '🌊 Waterlogging' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer text-rp-text-secondary hover:text-rp-text">
                    <input
                      type="checkbox"
                      checked={(hazardTypes as any)[item.key]}
                      onChange={(e) => setHazardTypes({ ...hazardTypes, [item.key]: e.target.checked })}
                      className="rounded accent-rp-accent"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Level */}
            <div className="pt-2 border-t border-rp-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rp-text-muted block mb-1.5">
                Priority Level
              </span>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-rose-400">
                  <input
                    type="checkbox"
                    checked={priorities.high}
                    onChange={(e) => setPriorities({ ...priorities, high: e.target.checked })}
                    className="rounded accent-rose-500"
                  />
                  <span>🔴 High Priority</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-amber-400">
                  <input
                    type="checkbox"
                    checked={priorities.medium}
                    onChange={(e) => setPriorities({ ...priorities, medium: e.target.checked })}
                    className="rounded accent-amber-500"
                  />
                  <span>🟡 Medium Priority</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-emerald-400">
                  <input
                    type="checkbox"
                    checked={priorities.low}
                    onChange={(e) => setPriorities({ ...priorities, low: e.target.checked })}
                    className="rounded accent-emerald-500"
                  />
                  <span>🟢 Low Priority</span>
                </label>
              </div>
            </div>

            {/* Status */}
            <div className="pt-2 border-t border-rp-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rp-text-muted block mb-1.5">
                Status
              </span>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-rp-text-secondary hover:text-rp-text">
                  <input
                    type="checkbox"
                    checked={statuses.open}
                    onChange={(e) => setStatuses({ ...statuses, open: e.target.checked })}
                    className="rounded accent-rp-accent"
                  />
                  <span>Open</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-rp-text-secondary hover:text-rp-text">
                  <input
                    type="checkbox"
                    checked={statuses.inProgress}
                    onChange={(e) => setStatuses({ ...statuses, inProgress: e.target.checked })}
                    className="rounded accent-rp-accent"
                  />
                  <span>In Progress</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-rp-text-secondary hover:text-rp-text">
                  <input
                    type="checkbox"
                    checked={statuses.resolved}
                    onChange={(e) => setStatuses({ ...statuses, resolved: e.target.checked })}
                    className="rounded accent-rp-accent"
                  />
                  <span>Resolved</span>
                </label>
              </div>
            </div>

            <button
              onClick={() => toast.success('Filters applied')}
              className="w-full mt-2 py-2 rounded-xl bg-rp-accent text-rp-bg font-heading font-bold text-xs uppercase tracking-wider shadow-glow-cyan"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Leaflet OpenStreetMap Engine */}
        <div className="flex-1 w-full h-full relative">
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
            className="z-10"
          >
            {/* OpenStreetMap Tile Layer - strict compliance with usage policy */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapRecenter center={mapCenter} />
            <MapClickDetector onMapClick={handleMapClick} />

            {/* Clicked location custom pin */}
            {clickedLocation && (
              <Marker
                position={[clickedLocation.lat, clickedLocation.lng]}
                icon={createMapMarkerIcon('critical')}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <strong className="block text-rp-accent font-bold">Selected Pin Location</strong>
                    <span className="text-[11px] text-rp-text mt-1 block">{clickedLocation.address}</span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Incident Markers */}
            {filteredReports.map((report) => (
              <Marker
                key={report.id}
                position={[report.location.coordinates[1], report.location.coordinates[0]]}
                icon={createMapMarkerIcon(report.estimatedSeverity)}
              >
                {/* Popup matching Screen 4 */}
                <Popup className="rp-popup-dark">
                  <div className="w-64 p-1">
                    <div className="h-28 rounded-lg overflow-hidden mb-2 bg-rp-bg border border-rp-border relative">
                      <img
                        src={report.originalImageUrl}
                        alt={report.title}
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        report.estimatedSeverity === 'critical' || report.estimatedSeverity === 'high'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {report.estimatedSeverity} Priority
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-xs text-rp-text mb-1">
                      {report.title}
                    </h4>

                    <div className="text-[11px] text-rp-text-muted space-y-0.5 mb-2">
                      <p className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-rp-accent flex-shrink-0" />
                        <span className="truncate">{report.address}</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-rp-text-muted flex-shrink-0" />
                        <span>Reported: 2 hours ago</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="text-rp-accent font-bold">Status:</span>
                        <span className="uppercase font-semibold">{report.resolutionStatus}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-rp-border flex items-center justify-between">
                      <button
                        onClick={() => handleVote(report.id)}
                        className="flex items-center gap-1 text-[11px] text-rp-text hover:text-rp-accent px-2 py-1 rounded bg-rp-card border border-rp-border"
                      >
                        <ThumbsUp className="w-3 h-3 text-rp-accent" />
                        <span>Verify ({report.votes})</span>
                      </button>

                      <span className="text-[10px] font-bold text-rose-400">
                        Risk: {report.priorityScore}/100
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default MapPage;
