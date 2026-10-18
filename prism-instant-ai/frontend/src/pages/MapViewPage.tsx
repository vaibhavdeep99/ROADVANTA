import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Loader2,
  FileText
} from 'lucide-react';
import { api, ReportItem } from '../services/api';

// Fix Leaflet's default icon paths in bundler environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const MapViewPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.listReports({ limit: 100 });
        setReports(res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load mapped reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([22.3072, 73.1812], 12); // Default Vadodara / Highway hub
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const validReports = reports.filter(
      (r) =>
        r.latitude !== null &&
        r.longitude !== null &&
        (!severityFilter || r.damage_severity === severityFilter)
    );

    const bounds = L.latLngBounds([]);

    validReports.forEach((r) => {
      if (r.latitude === null || r.longitude === null) return;

      const color =
        r.damage_severity === 'CRITICAL'
          ? '#f43f5e'
          : r.damage_severity === 'HIGH'
          ? '#f59e0b'
          : '#10b981';

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([r.latitude, r.longitude], { icon: customIcon });
      marker.on('click', () => {
        setSelectedReport(r);
      });

      marker.bindTooltip(
        `<strong>${r.reference_id}</strong><br/>${r.title}<br/>Status: ${r.workflow_status}`,
        { direction: 'top' }
      );

      markersLayerRef.current?.addLayer(marker);
      bounds.extend([r.latitude, r.longitude]);
    });

    if (validReports.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [reports, severityFilter]);

  const validCount = reports.filter((r) => r.latitude !== null && r.longitude !== null).length;

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <span>Geospatial Corridor Hazards Map</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Visual inspection of verified road hazards plotted strictly from real GPS telemetry coordinates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white outline-none"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical Severities</option>
            <option value="HIGH">High Severities</option>
            <option value="MEDIUM">Medium Severities</option>
          </select>
          <div className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs font-mono text-cyan-400">
            {validCount} Geocoded Points
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Map View and Side Detail Drawer */}
      <div className="relative flex-1 rounded-2xl overflow-hidden border border-gray-800 bg-gray-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {selectedReport && (
          <div className="absolute bottom-6 right-6 z-10 w-80 p-5 rounded-2xl bg-[#111827]/95 backdrop-blur-md border border-gray-700 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan-400">
                {selectedReport.reference_id}
              </span>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-white text-xs font-mono"
              >
                CLOSE [X]
              </button>
            </div>

            <div>
              <div className="font-bold text-sm text-white">{selectedReport.title}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {selectedReport.address}, {selectedReport.city}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-800">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedReport.damage_severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {selectedReport.damage_severity}
              </span>
              <span className="font-mono text-[11px] text-gray-400">
                {selectedReport.workflow_status}
              </span>
            </div>

            <Link
              to={`/reports/${selectedReport.id}`}
              className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition block text-center"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Open Detailed Audit</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
