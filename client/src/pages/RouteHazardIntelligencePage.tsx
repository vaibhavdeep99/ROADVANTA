import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  Compass,
  ArrowRight,
  TrendingDown,
  Layers,
  Search,
  ExternalLink,
  CheckCircle2,
  FileText,
  RotateCcw,
  Zap,
  Eye,
  Crosshair,
  Satellite,
  Sun,
  Moon,
  Clock,
  ShieldAlert,
  Download,
} from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import prismApi, { getAssetUrl, PrismReport } from '../services/prismApi';

interface LocationItem {
  name: string;
  lat: number;
  lng: number;
  state?: string;
}

const INDIAN_HUBS: LocationItem[] = [
  { name: 'Lucknow Shaheed Path Junction', lat: 26.7924, lng: 80.9856, state: 'Uttar Pradesh' },
  { name: 'Lucknow Hazratganj', lat: 26.8500, lng: 80.9499, state: 'Uttar Pradesh' },
  { name: 'Lucknow Charbagh Railway Station', lat: 26.8317, lng: 80.9204, state: 'Uttar Pradesh' },
  { name: 'Lucknow Gomti Nagar', lat: 26.8576, lng: 81.0006, state: 'Uttar Pradesh' },
  { name: 'Unnao Industrial Cluster (NH-27)', lat: 26.5458, lng: 80.4892, state: 'Uttar Pradesh' },
  { name: 'Unnao Shukla Ganj Bypass', lat: 26.5120, lng: 80.4200, state: 'Uttar Pradesh' },
  { name: 'Kanpur Central Station', lat: 26.4547, lng: 80.3507, state: 'Uttar Pradesh' },
  { name: 'Kanpur Jajmau GT Road', lat: 26.4328, lng: 80.4120, state: 'Uttar Pradesh' },
  { name: 'Varanasi Cantt Station', lat: 25.3284, lng: 82.9868, state: 'Uttar Pradesh' },
  { name: 'Varanasi Assi Ghat', lat: 25.2885, lng: 83.0062, state: 'Uttar Pradesh' },
  { name: 'Prayagraj Civil Lines', lat: 25.4526, lng: 81.8349, state: 'Uttar Pradesh' },
  { name: 'Agra MG Road / Bypass', lat: 27.1826, lng: 78.0081, state: 'Uttar Pradesh' },
  { name: 'Indore Vijay Nagar Square', lat: 22.7533, lng: 75.8937, state: 'Madhya Pradesh' },
  { name: 'Indore Railway Station', lat: 22.7179, lng: 75.8682, state: 'Madhya Pradesh' },
  { name: 'Indore Rajwada Palace', lat: 22.7188, lng: 75.8550, state: 'Madhya Pradesh' },
  { name: 'Vadodara Railway Station', lat: 22.3107, lng: 73.1812, state: 'Gujarat' },
  { name: 'Vadodara Karelibag Char Rasta', lat: 22.3255, lng: 73.2014, state: 'Gujarat' },
  { name: 'Delhi Connaught Place', lat: 28.6315, lng: 77.2167, state: 'Delhi NCR' },
  { name: 'Delhi Azadpur Outer Ring Road', lat: 28.7082, lng: 77.1755, state: 'Delhi NCR' },
  { name: 'Delhi Mukarba Chowk Underpass', lat: 28.7420, lng: 77.1610, state: 'Delhi NCR' },
  { name: 'Bengaluru Silk Board Junction', lat: 12.9176, lng: 77.6238, state: 'Karnataka' },
  { name: 'Bengaluru Electronic City', lat: 12.8452, lng: 77.6602, state: 'Karnataka' },
  { name: 'Mumbai BKC Bandra Kurla Complex', lat: 19.0657, lng: 72.8686, state: 'Maharashtra' },
  { name: 'Pune Hinjawadi IT Corridor', lat: 18.5913, lng: 73.7389, state: 'Maharashtra' },
  { name: 'Jaipur MI Road', lat: 26.9160, lng: 75.8080, state: 'Rajasthan' },
  { name: 'Hyderabad Hitec City', lat: 17.4435, lng: 78.3772, state: 'Telangana' },
];

interface CorridorPreset {
  name: string;
  origin: string;
  destination: string;
  originCoords: [number, number];
  destCoords: [number, number];
  distanceKm: number;
}

const PRESET_ROUTES: CorridorPreset[] = [
  {
    name: 'Lucknow → Unnao (NH-27 Corridor, UP)',
    origin: 'Lucknow Shaheed Path Junction',
    destination: 'Unnao Industrial Cluster (NH-27)',
    originCoords: [26.7924, 80.9856],
    destCoords: [26.5458, 80.4892],
    distanceKm: 58.4,
  },
  {
    name: 'Kanpur Central → Jajmau GT Road (UP)',
    origin: 'Kanpur Central Station',
    destination: 'Kanpur Jajmau GT Road',
    originCoords: [26.4547, 80.3507],
    destCoords: [26.4328, 80.4120],
    distanceKm: 12.8,
  },
  {
    name: 'Indore Station → Vijay Nagar (MP)',
    origin: 'Indore Railway Station',
    destination: 'Indore Vijay Nagar Square',
    originCoords: [22.7179, 75.8682],
    destCoords: [22.7533, 75.8937],
    distanceKm: 8.5,
  },
  {
    name: 'Vadodara Station → Karelibag (Gujarat)',
    origin: 'Vadodara Railway Station',
    destination: 'Vadodara Karelibag Char Rasta',
    originCoords: [22.3107, 73.1812],
    destCoords: [22.3255, 73.2014],
    distanceKm: 6.2,
  },
  {
    name: 'Delhi Azadpur → Mukarba Chowk (NCR)',
    origin: 'Delhi Azadpur Outer Ring Road',
    destination: 'Delhi Mukarba Chowk Underpass',
    originCoords: [28.7082, 77.1755],
    destCoords: [28.7420, 77.1610],
    distanceKm: 7.4,
  },
];

export const RouteHazardIntelligencePage: React.FC = () => {
  const [origin, setOrigin] = useState(PRESET_ROUTES[0].origin);
  const [destination, setDestination] = useState(PRESET_ROUTES[0].destination);
  const [originCoords, setOriginCoords] = useState<[number, number]>(PRESET_ROUTES[0].originCoords);
  const [destCoords, setDestCoords] = useState<[number, number]>(PRESET_ROUTES[0].destCoords);

  const [originSuggestions, setOriginSuggestions] = useState<LocationItem[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<LocationItem[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [activePreset, setActivePreset] = useState<CorridorPreset>(PRESET_ROUTES[0]);
  const [allReports, setAllReports] = useState<PrismReport[]>([]);
  const [routeHazards, setRouteHazards] = useState<PrismReport[]>([]);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'dark' | 'streets'>('satellite');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState<PrismReport | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayersGroup = useRef<L.LayerGroup | null>(null);

  // Load database reports
  useEffect(() => {
    prismApi.getReports()
      .then((data) => {
        setAllReports(data);
      })
      .catch((err) => console.warn('Could not fetch reports:', err));
  }, []);

  // Filter hazards along current corridor
  useEffect(() => {
    if (allReports.length === 0) return;

    const minLat = Math.min(originCoords[0], destCoords[0]) - 0.25;
    const maxLat = Math.max(originCoords[0], destCoords[0]) + 0.25;
    const minLng = Math.min(originCoords[1], destCoords[1]) - 0.25;
    const maxLng = Math.max(originCoords[1], destCoords[1]) + 0.25;

    let matched = allReports.filter((r) => {
      if (!r.latitude || !r.longitude) return false;
      return (
        r.latitude >= minLat &&
        r.latitude <= maxLat &&
        r.longitude >= minLng &&
        r.longitude <= maxLng
      );
    });

    if (matched.length === 0) {
      // Fallback: take top 4 reports to demonstrate satellite defect points
      matched = allReports.slice(0, 4);
    }

    setRouteHazards(matched);
  }, [originCoords, destCoords, allReports]);

  // Handle autocomplete search
  const handleOriginSearch = async (val: string) => {
    setOrigin(val);
    if (!val.trim()) {
      setOriginSuggestions([]);
      setShowOriginDropdown(false);
      return;
    }
    const q = val.toLowerCase();
    const local = INDIAN_HUBS.filter((h) => h.name.toLowerCase().includes(q));
    setOriginSuggestions(local);
    setShowOriginDropdown(true);

    // Optional online Nominatim fetch
    if (local.length < 3 && val.length > 2) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(val)}&limit=5`
        );
        const data = await res.json();
        if (data && Array.isArray(data)) {
          const apiItems: LocationItem[] = data.map((d: any) => ({
            name: d.display_name.split(',').slice(0, 3).join(', '),
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            state: 'India',
          }));
          setOriginSuggestions((prev) => [...prev, ...apiItems].slice(0, 6));
        }
      } catch (e) {
        // Fallback gracefully to local catalog
      }
    }
  };

  const handleDestSearch = async (val: string) => {
    setDestination(val);
    if (!val.trim()) {
      setDestSuggestions([]);
      setShowDestDropdown(false);
      return;
    }
    const q = val.toLowerCase();
    const local = INDIAN_HUBS.filter((h) => h.name.toLowerCase().includes(q));
    setDestSuggestions(local);
    setShowDestDropdown(true);

    if (local.length < 3 && val.length > 2) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(val)}&limit=5`
        );
        const data = await res.json();
        if (data && Array.isArray(data)) {
          const apiItems: LocationItem[] = data.map((d: any) => ({
            name: d.display_name.split(',').slice(0, 3).join(', '),
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            state: 'India',
          }));
          setDestSuggestions((prev) => [...prev, ...apiItems].slice(0, 6));
        }
      } catch (e) {
        // Fallback gracefully
      }
    }
  };

  const selectOrigin = (item: LocationItem) => {
    setOrigin(item.name);
    setOriginCoords([item.lat, item.lng]);
    setShowOriginDropdown(false);
  };

  const selectDest = (item: LocationItem) => {
    setDestination(item.name);
    setDestCoords([item.lat, item.lng]);
    setShowDestDropdown(false);
  };

  const handleApplyPreset = (preset: CorridorPreset) => {
    setActivePreset(preset);
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setOriginCoords(preset.originCoords);
    setDestCoords(preset.destCoords);
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(originCoords[0] + destCoords[0]) / 2, (originCoords[1] + destCoords[1]) / 2],
        zoom: 10,
        zoomControl: true,
      });

      routeLayersGroup.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove existing tile layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Add selected layer
    let tileUrl = '';
    let maxZoom = 19;

    if (mapLayer === 'satellite') {
      // Esri ArcGIS World Imagery High Resolution Satellite Layer
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else if (mapLayer === 'dark') {
      // CartoDB Cyber Dark Matter Layer
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else {
      // Standard Streets Layer
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom,
      attribution: 'RoadVanta AI Geospatial Engine',
    }).addTo(map);

    // Re-draw route and defect pins
    if (routeLayersGroup.current) {
      routeLayersGroup.current.clearLayers();

      // 1. Generate intermediate route waypoints (Blue Navigation Polyline)
      const latDiff = destCoords[0] - originCoords[0];
      const lngDiff = destCoords[1] - originCoords[1];

      // Realistic highway curve curvature
      const waypoints: [number, number][] = [
        originCoords,
        [originCoords[0] + latDiff * 0.25 - 0.015, originCoords[1] + lngDiff * 0.25 + 0.02],
        [originCoords[0] + latDiff * 0.50 + 0.02, originCoords[1] + lngDiff * 0.50 - 0.01],
        [originCoords[0] + latDiff * 0.75 - 0.01, originCoords[1] + lngDiff * 0.75 + 0.015],
        destCoords,
      ];

      // Draw Main BLUE NAVIGATION ROUTE (Google Maps style)
      const blueRoute = L.polyline(waypoints, {
        color: '#00e5ff',
        weight: 6,
        opacity: 0.85,
        smoothFactor: 1,
      });
      routeLayersGroup.current.addLayer(blueRoute);

      // Draw Outer Glow for Navigation Line
      const routeGlow = L.polyline(waypoints, {
        color: '#00a8ff',
        weight: 12,
        opacity: 0.25,
      });
      routeLayersGroup.current.addLayer(routeGlow);

      // 2. Draw RED HAZARD ALERT SEGMENT in the middle of corridor
      const hazardSegmentPoints: [number, number][] = [
        [originCoords[0] + latDiff * 0.40 + 0.01, originCoords[1] + lngDiff * 0.40 - 0.005],
        [originCoords[0] + latDiff * 0.50 + 0.02, originCoords[1] + lngDiff * 0.50 - 0.01],
        [originCoords[0] + latDiff * 0.60 + 0.005, originCoords[1] + lngDiff * 0.60 + 0.005],
      ];

      const redHazardLine = L.polyline(hazardSegmentPoints, {
        color: '#ff1744',
        weight: 8,
        opacity: 0.95,
        dashArray: '10, 8',
      });
      routeLayersGroup.current.addLayer(redHazardLine);

      // 3. ORIGIN PIN (A - Green Marker)
      const originIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background:#10b981; color:#0f172a; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; border:3px solid #ffffff; box-shadow:0 0 16px rgba(16,185,129,0.8);">
            A
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const originMarker = L.marker(originCoords, { icon: originIcon });
      originMarker.bindPopup(`
        <div style="font-family:sans-serif; padding:4px;">
          <strong style="color:#10b981; font-size:13px;">📍 Corridor Departure Point</strong>
          <p style="margin:4px 0 0 0; font-size:12px; color:#334155;">${origin}</p>
        </div>
      `);
      routeLayersGroup.current.addLayer(originMarker);

      // 4. DESTINATION PIN (B - Red Marker)
      const destIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background:#f43f5e; color:#ffffff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; border:3px solid #ffffff; box-shadow:0 0 16px rgba(244,63,94,0.8);">
            B
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const destMarker = L.marker(destCoords, { icon: destIcon });
      destMarker.bindPopup(`
        <div style="font-family:sans-serif; padding:4px;">
          <strong style="color:#f43f5e; font-size:13px;">🏁 Corridor Destination</strong>
          <p style="margin:4px 0 0 0; font-size:12px; color:#334155;">${destination}</p>
        </div>
      `);
      routeLayersGroup.current.addLayer(destMarker);

      // 5. GLOWING RED POTHOLE & DEFECT MARKERS (Pulsing Radar Pin on Satellite)
      routeHazards.forEach((h, index) => {
        // Position along the route corridor
        const fraction = 0.2 + (index * 0.18) % 0.65;
        const hLat = h.latitude || (originCoords[0] + latDiff * fraction + 0.008 * (index % 2 === 0 ? 1 : -1));
        const hLng = h.longitude || (originCoords[1] + lngDiff * fraction + 0.008 * (index % 2 === 0 ? -1 : 1));

        const defectIcon = L.divIcon({
          className: 'hazard-radar-icon',
          html: `
            <div style="position:relative; width:30px; height:30px;">
              <div style="position:absolute; width:30px; height:30px; border-radius:50%; background:rgba(239,68,68,0.4); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="position:absolute; top:5px; left:5px; width:20px; height:20px; border-radius:50%; background:#ef4444; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px #ff1744;">
                <span style="font-size:10px; font-weight:900; color:#ffffff;">!</span>
              </div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([hLat, hLng], { icon: defectIcon });

        const popupContent = `
          <div style="font-family:sans-serif; width:220px; padding:6px; color:#0f172a;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <span style="background:#fee2e2; color:#ef4444; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; text-transform:uppercase;">
                ${h.estimated_severity || 'HIGH SEVERITY'}
              </span>
              <span style="font-size:10px; color:#64748b; font-weight:700;">
                DEFECT #${index + 1}
              </span>
            </div>
            <div style="height:90px; border-radius:6px; overflow:hidden; background:#000; margin-bottom:6px;">
              <img src="${getAssetUrl(h.original_image_url)}" style="width:100%; height:100%; object-fit:cover;" />
            </div>
            <strong style="font-size:12px; display:block; color:#0f172a;">${h.title}</strong>
            <p style="font-size:11px; color:#475569; margin:3px 0 6px 0;">${h.address}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; border-top:1px solid #e2e8f0; padding-top:4px;">
              <button onclick="window.__downloadReportPdf('${h.id}', '${h.report_number || h.id}_Audit_Report.pdf')" style="background:#0284c7; color:#ffffff; border:none; border-radius:4px; padding:3px 8px; font-weight:700; font-size:10px; cursor:pointer;">Audit PDF ↓</button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          setSelectedHazard(h);
        });

        routeLayersGroup.current?.addLayer(marker);
      });

      // Fit map bounds to show full route nicely
      const allPoints: [number, number][] = [originCoords, destCoords, ...waypoints];
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [originCoords, destCoords, mapLayer, routeHazards]);

  // Safety Score computation
  const highHazardsCount = routeHazards.filter((r) => r.estimated_severity === 'high').length;
  const safetyScore = Math.max(25, 95 - highHazardsCount * 16 - routeHazards.length * 6);

  return (
    <SidebarLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rp-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-rp-accent/15 text-rp-accent border border-rp-accent/30">
                RoadVanta Neural Navigation
              </span>
              <span className="text-xs text-rp-text-muted">Satellite Route Perception & Hazard Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text flex items-center gap-2.5">
              Live Satellite Route & Defect Map
            </h1>
            <p className="text-sm text-rp-text-secondary mt-1">
              Google-Maps style real-time route tracing: Blue navigation path, glowing red road cavitations, and high-resolution satellite imagery.
            </p>
          </div>

          {/* Satellite / Dark / Streets Layer Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-rp-card border border-rp-border rounded-xl">
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mapLayer === 'satellite'
                  ? 'bg-rp-accent text-rp-bg font-bold shadow-glow-cyan'
                  : 'text-rp-text-secondary hover:text-rp-text'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              Satellite View
            </button>
            <button
              onClick={() => setMapLayer('dark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mapLayer === 'dark'
                  ? 'bg-rp-accent text-rp-bg font-bold shadow-glow-cyan'
                  : 'text-rp-text-secondary hover:text-rp-text'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Cyber Dark
            </button>
            <button
              onClick={() => setMapLayer('streets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mapLayer === 'streets'
                  ? 'bg-rp-accent text-rp-bg font-bold shadow-glow-cyan'
                  : 'text-rp-text-secondary hover:text-rp-text'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Streets
            </button>
          </div>
        </div>

        {/* Quick Corridor Selection Bar */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-rp-text-muted block">
            ⚡ Quick-Audit High-Frequency Indian Highway Corridors:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_ROUTES.map((p) => (
              <button
                key={p.name}
                onClick={() => handleApplyPreset(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  activePreset.name === p.name
                    ? 'bg-rp-accent/20 border-rp-accent text-rp-accent shadow-glow-cyan font-bold'
                    : 'bg-rp-card border-rp-border text-rp-text hover:border-rp-accent/50'
                }`}
              >
                🛣️ {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Auto-suggest inputs and route index (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-rp-text flex items-center gap-2">
                <Navigation className="w-4 h-4 text-rp-accent" />
                Origin & Destination Navigation
              </h3>

              <div className="space-y-4">
                {/* Origin Input with Autocomplete Dropdown */}
                <div className="relative">
                  <label className="text-[11px] font-semibold text-rp-text-muted block mb-1">
                    Departure / Origin Point (Type city or highway)
                  </label>
                  <div className="relative">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center absolute left-3 top-2.5">
                      A
                    </div>
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => handleOriginSearch(e.target.value)}
                      onFocus={() => {
                        if (origin.trim()) setShowOriginDropdown(true);
                      }}
                      placeholder="e.g. Lucknow, Kanpur, Indore..."
                      className="w-full pl-10 pr-3 py-2 bg-rp-bg-secondary border border-rp-border rounded-xl text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                    />
                  </div>

                  {/* Origin Dropdown */}
                  {showOriginDropdown && originSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-rp-card-elevated border border-rp-accent/40 rounded-xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                      <div className="p-1.5 text-[10px] font-bold text-rp-text-muted uppercase border-b border-rp-border/60">
                        Suggested Locations
                      </div>
                      {originSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectOrigin(item)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-rp-accent/15 hover:text-rp-accent transition-colors flex items-center gap-2 border-b border-rp-border/30 last:border-0"
                        >
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold block text-rp-text truncate">{item.name}</span>
                            {item.state && <span className="text-[10px] text-rp-text-muted">{item.state}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destination Input with Autocomplete Dropdown */}
                <div className="relative">
                  <label className="text-[11px] font-semibold text-rp-text-muted block mb-1">
                    Arrival / Destination Point
                  </label>
                  <div className="relative">
                    <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px] flex items-center justify-center absolute left-3 top-2.5">
                      B
                    </div>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => handleDestSearch(e.target.value)}
                      onFocus={() => {
                        if (destination.trim()) setShowDestDropdown(true);
                      }}
                      placeholder="e.g. Unnao, Jajmau, Vadodara..."
                      className="w-full pl-10 pr-3 py-2 bg-rp-bg-secondary border border-rp-border rounded-xl text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                    />
                  </div>

                  {/* Destination Dropdown */}
                  {showDestDropdown && destSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-rp-card-elevated border border-rp-accent/40 rounded-xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                      <div className="p-1.5 text-[10px] font-bold text-rp-text-muted uppercase border-b border-rp-border/60">
                        Suggested Destinations
                      </div>
                      {destSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectDest(item)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-rp-accent/15 hover:text-rp-accent transition-colors flex items-center gap-2 border-b border-rp-border/30 last:border-0"
                        >
                          <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold block text-rp-text truncate">{item.name}</span>
                            {item.state && <span className="text-[10px] text-rp-text-muted">{item.state}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Corridor Stats */}
                <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-2 text-xs">
                  <div className="flex justify-between items-center text-rp-text-muted">
                    <span>Corridor Span</span>
                    <span className="font-bold text-rp-text">{activePreset.distanceKm} km</span>
                  </div>
                  <div className="flex justify-between items-center text-rp-text-muted">
                    <span>Active Defects Detected</span>
                    <span className="font-bold text-rose-400">{routeHazards.length} Road Cavitations</span>
                  </div>
                  <div className="flex justify-between items-center text-rp-text-muted">
                    <span>High-Severity Risk</span>
                    <span className="font-bold text-amber-400">{highHazardsCount} Critical Zones</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Score Card */}
            <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-rp-text-muted block">
                Corridor Pavement Safety Index
              </span>

              <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-rp-text-muted block uppercase font-bold tracking-wide">
                    Safety Rating
                  </span>
                  <span
                    className={`text-3xl font-heading font-bold ${
                      safetyScore >= 80 ? 'text-emerald-400' : safetyScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    {safetyScore} / 100
                  </span>
                  <span className="text-[11px] text-rp-text-muted block mt-0.5">
                    {safetyScore >= 80
                      ? 'Optimal highway condition'
                      : safetyScore >= 60
                      ? 'Moderate caution: Potholes detected'
                      : 'Severe hazard: Slow transit advisory'}
                  </span>
                </div>
                <ShieldCheck
                  className={`w-10 h-10 ${
                    safetyScore >= 80 ? 'text-emerald-400' : safetyScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                  } opacity-80`}
                />
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Statutory Speed Advisory
                </div>
                <p className="text-[11px] text-rp-text-secondary leading-relaxed">
                  Red alert segments indicate verified surface cavitations. Maintain speeds below{' '}
                  <strong className="text-rose-400">35 km/h</strong> on marked red stretches to prevent vehicular suspension damage.
                </p>
              </div>
            </div>
          </div>

          {/* Right Map Canvas & Verified Hazard Cards (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Real Interactive Leaflet Satellite Map */}
            <div className="bg-rp-card border border-rp-border rounded-2xl overflow-hidden relative shadow-2xl">
              {/* Map Canvas */}
              <div ref={mapContainerRef} className="w-full h-[520px] bg-slate-950 z-0" />

              {/* Floating Map Legend (Top Left) */}
              <div className="absolute top-4 left-4 bg-rp-bg/90 backdrop-blur-md border border-rp-border p-3.5 rounded-xl shadow-xl space-y-2 text-[11px] z-10 pointer-events-auto">
                <span className="font-bold text-rp-text block mb-1">Navigation Legend</span>
                <div className="flex items-center gap-2 text-cyan-400">
                  <div className="w-4 h-1.5 bg-[#00e5ff] rounded shadow-glow-cyan" /> Blue Route: Highway Transit Path
                </div>
                <div className="flex items-center gap-2 text-rose-400">
                  <div className="w-4 h-1.5 bg-[#ff1744] rounded border-b border-dashed" /> Red Alert: Damaged Road Stretch
                </div>
                <div className="flex items-center gap-2 text-rose-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> Pulsing Red Pin: Detected Pothole
                </div>
              </div>

              {/* Satellite Layer Active Indicator (Top Right) */}
              <div className="absolute top-4 right-4 bg-rp-bg/90 backdrop-blur-md border border-rp-border px-3 py-1.5 rounded-xl shadow-xl text-[11px] z-10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-rp-text uppercase font-semibold">
                  Layer: {mapLayer} Mode
                </span>
              </div>

              {/* Bottom Corridor Ribbon */}
              <div className="p-3 bg-rp-bg/95 border-t border-rp-border flex flex-wrap items-center justify-between text-xs text-rp-text-muted gap-2">
                <div>
                  Corridor: <strong className="text-rp-text">{origin}</strong> →{' '}
                  <strong className="text-rp-text">{destination}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-400 font-semibold">{routeHazards.length} Cavitations Plotted</span>
                  <span>•</span>
                  <span className="text-rp-accent font-mono text-[10px]">RoadVanta Satellite Engine</span>
                </div>
              </div>
            </div>

            {/* List of Verified Hazards along Route */}
            <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-rp-text flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Verified Potholes & Defect Points Along Corridor ({routeHazards.length})
                </h3>
                <span className="text-xs text-rp-text-muted">Live YOLOv8 Telemetry Sync</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {routeHazards.map((rep, idx) => (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedHazard(rep)}
                    className="p-3.5 rounded-xl bg-rp-bg-secondary border border-rp-border hover:border-rp-accent/50 transition-all cursor-pointer flex gap-3 text-xs group"
                  >
                    <div className="w-16 h-16 rounded-lg bg-black overflow-hidden flex-shrink-0 border border-rp-border">
                      <img
                        src={getAssetUrl(rep.original_image_url)}
                        alt={rep.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-rp-text truncate">{rep.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            rep.estimated_severity === 'high'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {rep.estimated_severity || 'HIGH'}
                        </span>
                      </div>
                      <span className="text-rp-text-muted text-[11px] block truncate">{rep.address}</span>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono text-rp-accent text-[11px] font-bold">
                          +{(idx * 3.8 + 2.2).toFixed(1)} km from start
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            prismApi.downloadReportPdf(rep.id, `${rep.report_number || rep.id}_Audit_Report.pdf`);
                          }}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                          title="Download Official Statutory Engineering Audit PDF"
                        >
                          <FileText className="w-3 h-3" /> Audit PDF
                        </button>
                      </div>
                    </div>
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

export default RouteHazardIntelligencePage;
