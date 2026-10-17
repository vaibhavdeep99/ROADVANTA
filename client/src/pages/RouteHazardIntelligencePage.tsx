import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import api from '../services/api';
import * as turf from '@turf/turf';
import toast from 'react-hot-toast';
import {
  Navigation,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  Clock,
  ArrowRight,
  Filter,
  RefreshCw,
  Info,
  CheckCircle2,
  Layers,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Compass,
  Car,
  SlidersHorizontal,
  Eye,
  ExternalLink,
  X,
  Share2,
  Check,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { Report, SeverityLevel, HazardCategory } from '../types';

export interface PredefinedRoute {
  id: string;
  name: string;
  badge: string;
  startName: string;
  startCoords: [number, number]; // [lng, lat]
  destName: string;
  destCoords: [number, number]; // [lng, lat]
  waypointCoords?: [number, number]; // for alternative routes
  isAlternative?: boolean;
  tagline: string;
  corridorNote: string;
}

// 4 Predefined Default Routes requested by user
export const PREDEFINED_ROUTES: PredefinedRoute[] = [
  {
    id: 'kanpur-lucknow-nh27',
    name: 'Kanpur ➔ Lucknow',
    badge: 'NH-27 Expressway',
    startName: 'Kanpur, Uttar Pradesh',
    startCoords: [80.3319, 26.4499],
    destName: 'Lucknow, Uttar Pradesh',
    destCoords: [80.9462, 26.8467],
    tagline: 'Primary 4-lane NH-27 Corridor via Ganga Bridge & Amausi',
    corridorNote: 'Standard national highway route with active PWD highway monitoring.',
  },
  {
    id: 'lucknow-unnao-nh27',
    name: 'Lucknow ➔ Unnao',
    badge: 'NH-27 Westbound',
    startName: 'Lucknow, Uttar Pradesh',
    startCoords: [80.9462, 26.8467],
    destName: 'Unnao, Uttar Pradesh',
    destCoords: [80.4878, 26.5393],
    tagline: 'Direct industrial corridor passing Nawabganj & Km 421',
    corridorNote: 'Heavy commercial transit corridor connecting capital with Unnao leather hub.',
  },
  {
    id: 'kanpur-varanasi-nh19',
    name: 'Kanpur ➔ Varanasi (Banaras)',
    badge: 'NH-19 Grand Trunk Road',
    startName: 'Kanpur, Uttar Pradesh',
    startCoords: [80.3319, 26.4499],
    destName: 'Varanasi, Uttar Pradesh',
    destCoords: [82.9739, 25.3176],
    tagline: 'Historic GT Road Corridor via Fatehpur, Prayagraj & Gopiganj',
    corridorNote: 'Long-distance freight highway with multi-district road monitoring.',
  },
  {
    id: 'kanpur-lucknow-sh58',
    name: 'Kanpur ➔ Lucknow (Alternative Route)',
    badge: 'SH-58 Mohan Road',
    startName: 'Kanpur, Uttar Pradesh',
    startCoords: [80.3319, 26.4499],
    waypointCoords: [80.5950, 26.7620], // Hasanganj / Mohan Road stretch
    destName: 'Lucknow, Uttar Pradesh',
    destCoords: [80.9462, 26.8467],
    isAlternative: true,
    tagline: 'Alternative Rural State Highway avoiding NH-27 toll traffic',
    corridorNote: 'Bypasses main NH-27 congestion; single-lane rural highway with localized edge rutting.',
  },
];

// Custom Leaflet Icons for Route Hazards
const createHazardIcon = (severity: SeverityLevel, category: HazardCategory) => {
  let bgColor = '#EF4444'; // Red for Critical/High
  let borderColor = '#FCA5A5';
  let glow = 'rgba(239, 68, 68, 0.6)';

  if (severity === 'medium') {
    bgColor = '#F59E0B'; // Amber
    borderColor = '#FCD34D';
    glow = 'rgba(245, 158, 11, 0.5)';
  } else if (severity === 'low') {
    bgColor = '#10B981'; // Green
    borderColor = '#6EE7B7';
    glow = 'rgba(16, 185, 129, 0.4)';
  }

  let emoji = '⚠️';
  if (category === 'pothole') emoji = '🕳️';
  else if (category.includes('accident')) emoji = '💥';
  else if (category === 'damaged_signal') emoji = '🚦';
  else if (category === 'damaged_barrier' || category === 'road_crack') emoji = '🛡️';
  else if (category === 'waterlogging') emoji = '🌊';

  const html = `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${bgColor};
      border: 2px solid ${borderColor};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 0 12px ${glow};
      cursor: pointer;
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
        font-weight: bold;
        font-size: 13px;
      ">${emoji}</div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'route-hazard-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });
};

const startIcon = L.divIcon({
  html: `<div style="width:26px; height:26px; background:#10B981; border:3px solid #FFF; border-radius:50%; box-shadow:0 0 12px #10B981; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:bold;">A</div>`,
  className: 'route-start-pin',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const destIcon = L.divIcon({
  html: `<div style="width:26px; height:26px; background:#EF4444; border:3px solid #FFF; border-radius:50%; box-shadow:0 0 12px #EF4444; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:bold;">B</div>`,
  className: 'route-dest-pin',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

// Map View Adjuster
const MapBoundsAdjuster = ({ bounds }: { bounds: L.LatLngBoundsExpression | null }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], duration: 1.2 });
    }
  }, [bounds, map]);
  return null;
};

export const RouteHazardIntelligencePage: React.FC = () => {
  const [activeRouteId, setActiveRouteId] = useState<string>(PREDEFINED_ROUTES[0].id);
  const [startInput, setStartInput] = useState(PREDEFINED_ROUTES[0].startName);
  const [destInput, setDestInput] = useState(PREDEFINED_ROUTES[0].destName);
  const [startCoords, setStartCoords] = useState<[number, number]>(PREDEFINED_ROUTES[0].startCoords);
  const [destCoords, setDestCoords] = useState<[number, number]>(PREDEFINED_ROUTES[0].destCoords);

  // All reports from backend
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [hazardsAlongRoute, setHazardsAlongRoute] = useState<Report[]>([]);
  const [alternateHazards, setAlternateHazards] = useState<Report[]>([]);

  // Routes data from OSRM
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | null>(null);

  // Dynamic route card metrics (computed from routing & Turf matching)
  const [routeCardsStats, setRouteCardsStats] = useState<Record<string, {
    distanceKm: string;
    durationMin: number;
    totalHazards: number;
    potholesCount: number;
    trafficCount: number;
    accidentsCount: number;
  }>>({});

  // UI state
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [selectedHazardForDetail, setSelectedHazardForDetail] = useState<Report | null>(null);

  // Autocomplete suggestions
  const [startSuggestions, setStartSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [destSuggestions, setDestSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [showDestMenu, setShowDestMenu] = useState(false);

  // Fetch geographic suggestions with debouncing
  const fetchLocationSuggestions = async (query: string, target: 'start' | 'dest') => {
    if (!query || query.trim().length < 2) {
      if (target === 'start') setStartSuggestions([]);
      else setDestSuggestions([]);
      return;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`;
      const res = await fetch(url, { headers: { 'User-Agent': 'RoadVantaAI-Agent' } });
      const data = await res.json();
      if (Array.isArray(data)) {
        if (target === 'start') {
          setStartSuggestions(data);
          setShowStartMenu(true);
        } else {
          setDestSuggestions(data);
          setShowDestMenu(true);
        }
      }
    } catch {
      // Graceful fallback if network is constrained
    }
  };

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  // Fetch all reports from backend
  const fetchAllReports = async () => {
    try {
      const res = await api.get('/reports');
      if (res.data.success) {
        setAllReports(res.data.data);
      }
    } catch (e) {
      console.error('Could not fetch reports:', e);
    }
  };

  useEffect(() => {
    fetchAllReports();
  }, []);

  // Compute stats for all 4 default routes dynamically (no hardcoding)
  useEffect(() => {
    if (allReports.length === 0) return;

    const computeAllRouteCardsStats = async () => {
      const statsMap: Record<string, any> = {};

      for (const rDef of PREDEFINED_ROUTES) {
        try {
          let url = `https://router.project-osrm.org/route/v1/driving/${rDef.startCoords[0]},${rDef.startCoords[1]};${rDef.destCoords[0]},${rDef.destCoords[1]}?overview=full&geometries=geojson`;
          if (rDef.waypointCoords) {
            url = `https://router.project-osrm.org/route/v1/driving/${rDef.startCoords[0]},${rDef.startCoords[1]};${rDef.waypointCoords[0]},${rDef.waypointCoords[1]};${rDef.destCoords[0]},${rDef.destCoords[1]}?overview=full&geometries=geojson`;
          }

          const res = await fetch(url);
          const data = await res.json();

          if (data.code === 'Ok' && data.routes && data.routes[0]) {
            const rObj = data.routes[0];
            const line = turf.lineString(rObj.geometry.coordinates);

            const matched = allReports.filter((rep) => {
              const pt = turf.point(rep.location.coordinates);
              const dist = turf.pointToLineDistance(pt, line, { units: 'kilometers' });
              return dist <= 6.0; // 6.0 km highway corridor buffer
            });

            const potholes = matched.filter((h) => h.category === 'pothole').length;
            const traffic = matched.filter((h) => h.category === 'damaged_signal' || h.category === 'waterlogging').length;
            const accidents = matched.filter((h) => h.category.includes('accident') || h.category === 'damaged_barrier').length;

            statsMap[rDef.id] = {
              distanceKm: (rObj.distance / 1000).toFixed(1),
              durationMin: Math.round(rObj.duration / 60),
              totalHazards: matched.length,
              potholesCount: potholes,
              trafficCount: traffic,
              accidentsCount: accidents,
            };
          }
        } catch (err) {
          console.warn(`Could not compute stats for ${rDef.name}:`, err);
        }
      }

      setRouteCardsStats(statsMap);
    };

    computeAllRouteCardsStats();
  }, [allReports]);

  // Compute route via OSRM & calculate hazards with Turf.js
  const computeRoute = async (
    sCoords = startCoords,
    dCoords = destCoords,
    waypoint?: [number, number]
  ) => {
    setLoadingRoute(true);
    try {
      let url = `https://router.project-osrm.org/route/v1/driving/${sCoords[0]},${sCoords[1]};${dCoords[0]},${dCoords[1]}?overview=full&geometries=geojson&alternatives=true`;
      if (waypoint) {
        url = `https://router.project-osrm.org/route/v1/driving/${sCoords[0]},${sCoords[1]};${waypoint[0]},${waypoint[1]};${dCoords[0]},${dCoords[1]}?overview=full&geometries=geojson`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        setRoutes(data.routes);
        setSelectedRouteIdx(0);
        setLastUpdated(new Date().toLocaleTimeString());

        // Process primary route matching with Turf.js
        matchHazardsWithRoute(data.routes[0], allReports, 0);

        // If secondary route exists, match hazards for comparison
        if (data.routes[1]) {
          matchHazardsWithRoute(data.routes[1], allReports, 1);
        }

        // Fit map bounds
        const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        const bounds = L.latLngBounds(coords);
        setMapBounds(bounds);

        toast.success(`Route calculated (${(data.routes[0].distance / 1000).toFixed(1)} km, ~${Math.round(data.routes[0].duration / 60)} mins)`);
      } else {
        fallbackDirectCorridor(sCoords, dCoords);
      }
    } catch (err) {
      console.warn('OSRM request error, using geometric corridor fallback:', err);
      fallbackDirectCorridor(sCoords, dCoords);
    } finally {
      setLoadingRoute(false);
    }
  };

  // Fallback direct corridor if OSRM is temporarily unreachable
  const fallbackDirectCorridor = (sCoords: [number, number], dCoords: [number, number]) => {
    const directLine = {
      geometry: {
        type: 'LineString',
        coordinates: [sCoords, dCoords],
      },
      distance: 85000,
      duration: 3600,
    };
    setRoutes([directLine]);
    setSelectedRouteIdx(0);
    matchHazardsWithRoute(directLine, allReports, 0);
    setMapBounds([[sCoords[1], sCoords[0]], [dCoords[1], dCoords[0]]]);
  };

  // Match reports within corridor of actual route geometry using Turf.js
  const matchHazardsWithRoute = (routeObj: any, reportsList: Report[], routeIndex: number) => {
    if (!routeObj?.geometry?.coordinates) return;

    try {
      const line = turf.lineString(routeObj.geometry.coordinates);
      const matched = reportsList.filter((r) => {
        const pt = turf.point(r.location.coordinates);
        const distanceKm = turf.pointToLineDistance(pt, line, { units: 'kilometers' });
        // Corridor buffer: within 6.0 km of the highway/road geometry
        return distanceKm <= 6.0;
      });

      if (routeIndex === 0) {
        setHazardsAlongRoute(matched);
      } else {
        setAlternateHazards(matched);
      }
    } catch (e) {
      console.error('Turf calculation error:', e);
    }
  };

  // Select predefined route
  const handleSelectRoute = (routeDef: PredefinedRoute) => {
    setActiveRouteId(routeDef.id);
    setStartInput(routeDef.startName);
    setDestInput(routeDef.destName);
    setStartCoords(routeDef.startCoords);
    setDestCoords(routeDef.destCoords);
    computeRoute(routeDef.startCoords, routeDef.destCoords, routeDef.waypointCoords);
  };

  // Initial load once allReports are loaded
  useEffect(() => {
    if (allReports.length > 0) {
      computeRoute(PREDEFINED_ROUTES[0].startCoords, PREDEFINED_ROUTES[0].destCoords);
    }
  }, [allReports]);

  // Geocoding search for start and destination
  const handleGeocodeAndSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoadingRoute(true);

    try {
      const sUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startInput)}&limit=1`;
      const sRes = await fetch(sUrl, { headers: { 'User-Agent': 'RoadVantaAI-Agent' } });
      const sData = await sRes.json();

      const dUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destInput)}&limit=1`;
      const dRes = await fetch(dUrl, { headers: { 'User-Agent': 'RoadVantaAI-Agent' } });
      const dData = await dRes.json();

      if (sData[0] && dData[0]) {
        const sC: [number, number] = [parseFloat(sData[0].lon), parseFloat(sData[0].lat)];
        const dC: [number, number] = [parseFloat(dData[0].lon), parseFloat(dData[0].lat)];
        setStartCoords(sC);
        setDestCoords(dC);
        setActiveRouteId('custom');
        await computeRoute(sC, dC);
      } else {
        toast.error('Could not locate one or both addresses. Try a city name or select a default route card.');
        setLoadingRoute(false);
      }
    } catch {
      toast.error('Geocoding service unavailable. Using preset coordinates.');
      setLoadingRoute(false);
    }
  };

  // Active route & filtered hazards
  const activeRoute = routes[selectedRouteIdx] || routes[0];
  const activeHazardsList = selectedRouteIdx === 0 ? hazardsAlongRoute : alternateHazards;

  const filteredHazards = activeHazardsList.filter((h) => {
    if (filterCategory !== 'all' && h.category !== filterCategory) return false;
    if (filterSeverity !== 'all' && h.estimatedSeverity !== filterSeverity) return false;
    if (verifiedOnly && h.verificationStatus !== 'verified') return false;
    return true;
  });

  // Category counts
  const categoryCounts: Record<string, number> = {};
  activeHazardsList.forEach((h) => {
    categoryCounts[h.category] = (categoryCounts[h.category] || 0) + 1;
  });

  const criticalCount = activeHazardsList.filter((h) => h.estimatedSeverity === 'critical').length;
  const highCount = activeHazardsList.filter((h) => h.estimatedSeverity === 'high').length;
  const mediumCount = activeHazardsList.filter((h) => h.estimatedSeverity === 'medium').length;
  const lowCount = activeHazardsList.filter((h) => h.estimatedSeverity === 'low').length;
  const verifiedCount = activeHazardsList.filter((h) => h.verificationStatus === 'verified').length;
  const unverifiedCount = activeHazardsList.length - verifiedCount;

  // Convert GeoJSON route coordinates [lon, lat] to Leaflet [lat, lon]
  const polylinePositions: [number, number][] = activeRoute?.geometry?.coordinates
    ? activeRoute.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
    : [];

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rp-accent/15 border border-rp-accent/30 text-rp-accent text-xs font-semibold mb-2 shadow-glow-cyan">
              <Navigation className="w-3.5 h-3.5" />
              Route Hazard Intelligence & Corridor Safety System
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text">
              Route Hazard Intelligence
            </h1>
            <p className="text-rp-text-secondary text-xs sm:text-sm mt-0.5">
              Select or search a route corridor to trace verified road hazards, sinkholes, potholes, and obstacles along the real driving geometry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-rp-text-muted flex items-center gap-1 bg-rp-card px-2.5 py-1 rounded-lg border border-rp-border">
              <Clock className="w-3.5 h-3.5 text-rp-accent" />
              <span>Live Data Update: <strong className="text-rp-text">{lastUpdated}</strong></span>
            </span>
            <span className="text-[11px] text-rp-text-muted bg-rp-card px-2.5 py-1 rounded-lg border border-rp-border hidden md:inline-block">
              Historical Reference: <strong className="text-amber-400">15 Oct 2026</strong>
            </span>
          </div>
        </div>

        {/* 1. PREDEFINED DEFAULT ROUTE CARDS SECTION */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rp-accent" />
              <h2 className="text-sm font-heading font-bold text-rp-text uppercase tracking-wider">
                Default Route Corridors (Select to Compare & Inspect)
              </h2>
            </div>
            <span className="text-xs text-rp-text-muted">
              Live distance & hazard counts fetched via OSRM + Turf.js
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {PREDEFINED_ROUTES.map((routeDef, idx) => {
              const isSelected = activeRouteId === routeDef.id;
              const stats = routeCardsStats[routeDef.id];

              return (
                <div
                  key={routeDef.id}
                  className={`rp-card transition-all relative overflow-hidden flex flex-col justify-between p-4 ${
                    isSelected
                      ? 'bg-rp-card-elevated border-rp-accent shadow-glow-cyan ring-1 ring-rp-accent'
                      : 'bg-rp-card border-rp-border hover:border-rp-border-light hover:bg-rp-card-elevated/70'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        routeDef.isAlternative
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rp-accent/15 text-rp-accent border border-rp-accent/30'
                      }`}>
                        {routeDef.badge}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading font-bold text-sm text-rp-text mb-1 flex items-center gap-1.5">
                      <span>{routeDef.name}</span>
                    </h3>
                    <p className="text-[11px] text-rp-text-muted line-clamp-1 mb-3">
                      {routeDef.tagline}
                    </p>

                    {/* Routing metrics from actual provider */}
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-rp-bg/70 border border-rp-border/60 text-center mb-3">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-rp-text-muted block">Distance</span>
                        <span className="font-heading font-bold text-xs text-rp-text">
                          {stats ? `${stats.distanceKm} km` : 'Calculating...'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-rp-text-muted block">Est. Time</span>
                        <span className="font-heading font-bold text-xs text-rp-text">
                          {stats ? `${stats.durationMin} mins` : 'Calculating...'}
                        </span>
                      </div>
                    </div>

                    {/* Category Breakdown Chips */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between text-[11px] bg-rp-card px-2 py-1 rounded border border-rp-border/50">
                        <span className="text-rp-text-secondary flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-400" /> Total Route Hazards
                        </span>
                        <strong className="text-rose-400 font-bold">
                          {stats ? stats.totalHazards : '...'}
                        </strong>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold truncate" title="Potholes">
                          🕳️ {stats ? stats.potholesCount : 0} Potholes
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold truncate" title="Traffic Issues">
                          🚦 {stats ? stats.trafficCount : 0} Traffic
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 font-semibold truncate" title="Accidents/Obstructions">
                          💥 {stats ? stats.accidentsCount : 0} Acc./Obstr.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: View Route & Explore Hazards */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rp-border/50">
                    <button
                      type="button"
                      onClick={() => handleSelectRoute(routeDef)}
                      className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold font-heading uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-rp-accent text-rp-bg shadow-sm'
                          : 'bg-rp-card border border-rp-border text-rp-text hover:bg-rp-accent/20 hover:border-rp-accent'
                      }`}
                    >
                      <Navigation className="w-3 h-3" /> View Route
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectRoute(routeDef);
                        setFilterCategory('pothole');
                        toast.success(`Exploring potholes along ${routeDef.name}`);
                      }}
                      className="w-full py-1.5 px-2 rounded-lg text-[11px] font-bold font-heading uppercase tracking-wider bg-rp-card border border-rp-border text-rp-accent hover:bg-rp-card-elevated hover:border-rp-accent flex items-center justify-center gap-1 transition-all"
                    >
                      <Eye className="w-3 h-3" /> Explore Hazards
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Route Search Bar */}
        <div className="rp-card bg-rp-card-elevated border-rp-border p-4">
          <form onSubmit={handleGeocodeAndSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Origin Input with Autocomplete */}
            <div className="md:col-span-5 relative">
              <div className="absolute left-3 top-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-rp-text-muted uppercase">Start:</span>
              </div>
              <input
                type="text"
                value={startInput}
                onChange={(e) => {
                  setStartInput(e.target.value);
                  fetchLocationSuggestions(e.target.value, 'start');
                }}
                onFocus={() => {
                  if (startSuggestions.length > 0) setShowStartMenu(true);
                }}
                placeholder="Search city, highway or road (e.g. Kanpur)"
                className="w-full pl-20 pr-4 py-2 bg-rp-bg border border-rp-border rounded-xl text-xs text-rp-text focus:outline-none focus:border-rp-accent"
              />

              {/* Autocomplete Suggestions Menu */}
              {showStartMenu && startSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-rp-card-elevated border border-rp-border rounded-xl shadow-2xl overflow-hidden text-xs max-h-56 overflow-y-auto">
                  {startSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setStartInput(item.display_name.split(',')[0]);
                        setStartCoords([parseFloat(item.lon), parseFloat(item.lat)]);
                        setShowStartMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rp-accent/15 hover:text-rp-accent flex items-start gap-2 border-b border-rp-border/50 last:border-none transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{item.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Input with Autocomplete */}
            <div className="md:col-span-5 relative">
              <div className="absolute left-3 top-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-rp-text-muted uppercase">Dest:</span>
              </div>
              <input
                type="text"
                value={destInput}
                onChange={(e) => {
                  setDestInput(e.target.value);
                  fetchLocationSuggestions(e.target.value, 'dest');
                }}
                onFocus={() => {
                  if (destSuggestions.length > 0) setShowDestMenu(true);
                }}
                placeholder="Search destination (e.g. Lucknow)"
                className="w-full pl-20 pr-4 py-2 bg-rp-bg border border-rp-border rounded-xl text-xs text-rp-text focus:outline-none focus:border-rp-accent"
              />

              {/* Autocomplete Suggestions Menu */}
              {showDestMenu && destSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-rp-card-elevated border border-rp-border rounded-xl shadow-2xl overflow-hidden text-xs max-h-56 overflow-y-auto">
                  {destSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDestInput(item.display_name.split(',')[0]);
                        setDestCoords([parseFloat(item.lon), parseFloat(item.lat)]);
                        setShowDestMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rp-accent/15 hover:text-rp-accent flex items-start gap-2 border-b border-rp-border/50 last:border-none transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{item.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Calculate Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loadingRoute}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rp-accent to-cyan-500 text-rp-bg font-heading font-bold text-xs uppercase tracking-wider shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                {loadingRoute ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                Analyze Route
              </button>
            </div>
          </form>
        </div>

        {/* 2-Column Main View: Interactive Route Map + Route Hazard Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side: Leaflet Route Map (Cols 1-8) */}
          <div className="lg:col-span-8 rp-card bg-rp-card-elevated p-4 space-y-3">
            {/* Filter Bar along the route */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-rp-border">
              <div className="flex items-center gap-1.5 text-xs text-rp-text-muted">
                <Filter className="w-3.5 h-3.5 text-rp-accent" />
                <span className="text-[10px] uppercase font-bold">Filters:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-rp-card border border-rp-border rounded px-2 py-1 text-[11px] text-rp-text"
                >
                  <option value="all">All Categories</option>
                  <option value="pothole">🕳️ Potholes</option>
                  <option value="waterlogging">🌊 Waterlogging</option>
                  <option value="damaged_signal">🚦 Damaged Signals</option>
                  <option value="damaged_barrier">🛡️ Road Barrier / Cracks</option>
                  <option value="citizen_reported_accident">💥 Accidents / Obstructions</option>
                </select>

                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="bg-rp-card border border-rp-border rounded px-2 py-1 text-[11px] text-rp-text"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>

                <label className="flex items-center gap-1 cursor-pointer text-[11px] text-rp-text-secondary ml-2">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded accent-rp-accent"
                  />
                  <span>Verified Only</span>
                </label>
              </div>

              {/* Reset Filters */}
              {(filterCategory !== 'all' || filterSeverity !== 'all' || verifiedOnly) && (
                <button
                  onClick={() => {
                    setFilterCategory('all');
                    setFilterSeverity('all');
                    setVerifiedOnly(false);
                  }}
                  className="text-[10px] text-rp-accent hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Reset Filters
                </button>
              )}
            </div>

            {/* Interactive Leaflet Map Display */}
            <div className="h-[520px] w-full rounded-xl overflow-hidden border border-rp-border relative">
              <MapContainer
                center={[startCoords[1], startCoords[0]]}
                zoom={10}
                scrollWheelZoom={true}
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapBoundsAdjuster bounds={mapBounds} />

                {/* Route Polyline (OSRM Driving Geometry) */}
                {polylinePositions.length > 0 && (
                  <Polyline
                    positions={polylinePositions}
                    pathOptions={{
                      color: activeRouteId === 'kanpur-lucknow-sh58' ? '#F59E0B' : '#06B6D4',
                      weight: 5,
                      opacity: 0.85,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                )}

                {/* Origin Marker */}
                <Marker position={[startCoords[1], startCoords[0]]} icon={startIcon}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <strong className="text-emerald-400 font-bold block">Route Origin (A)</strong>
                      <span>{startInput}</span>
                    </div>
                  </Popup>
                </Marker>

                {/* Destination Marker */}
                <Marker position={[destCoords[1], destCoords[0]]} icon={destIcon}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <strong className="text-rose-400 font-bold block">Route Destination (B)</strong>
                      <span>{destInput}</span>
                    </div>
                  </Popup>
                </Marker>

                {/* Road Hazard Markers along Route */}
                {filteredHazards.map((hazard) => (
                  <Marker
                    key={hazard.id}
                    position={[hazard.location.coordinates[1], hazard.location.coordinates[0]]}
                    icon={createHazardIcon(hazard.estimatedSeverity, hazard.category)}
                  >
                    <Popup maxWidth={300} minWidth={260}>
                      <div className="p-2 space-y-2 text-xs">
                        {/* Hazard Image */}
                        <div className="relative rounded-lg overflow-hidden h-32 bg-rp-card">
                          <img
                            src={hazard.originalImageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600'}
                            alt={hazard.title}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600';
                            }}
                          />
                          <span className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            hazard.estimatedSeverity === 'critical' ? 'bg-rose-500 text-white' : hazard.estimatedSeverity === 'high' ? 'bg-orange-500 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {hazard.estimatedSeverity}
                          </span>
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur text-white text-[9px] font-mono">
                            {hazard.reportNumber}
                          </span>
                        </div>

                        <h4 className="font-heading font-bold text-xs text-rp-text mb-1">
                          {hazard.title}
                        </h4>

                        <div className="text-[11px] text-rp-text-muted space-y-1 mb-2">
                          <p className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-rp-accent flex-shrink-0" />
                            <span className="truncate">{hazard.address}</span>
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-rp-text-muted flex-shrink-0" />
                            <span>Report Date: {hazard.createdAt ? new Date(hazard.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Oct 2026'}</span>
                          </p>
                          <div className="flex items-center justify-between text-[10px] pt-1">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span className="capitalize">{hazard.verificationStatus}</span>
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-rp-card border border-rp-border uppercase font-semibold text-rp-accent">
                              {hazard.resolutionStatus}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-rp-border flex items-center justify-between text-[10px]">
                          <span className="text-rp-text-secondary">
                            Risk: <strong className="text-rose-400 font-bold">{hazard.priorityScore || 85}/100</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedHazardForDetail(hazard)}
                            className="px-2 py-1 rounded bg-rp-accent text-rp-bg font-bold hover:scale-105 transition-all text-[10px]"
                          >
                            Inspect Full Evidence
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Status indicator overlay */}
              <div className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 rounded-xl bg-rp-card-elevated/95 backdrop-blur-md border border-rp-border text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rp-accent animate-pulse" />
                <span className="text-rp-text font-semibold">
                  {filteredHazards.length > 0
                    ? `${filteredHazards.length} Hazards Mapped on Route Corridor`
                    : 'No reported hazards found along this route'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Route Summary & Multi-Route Comparison Panel (Cols 9-12) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Route Navigation & Comparison Card */}
            <div className="rp-card bg-rp-card-elevated p-4">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-rp-border">
                <span className="text-xs font-heading font-bold text-rp-text flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-rp-accent" />
                  Route Navigation & Safety Summary
                </span>
                <span className="text-[10px] font-mono text-rp-accent px-2 py-0.5 rounded bg-rp-accent/15 border border-rp-accent/30 font-bold">
                  OSRM Engine
                </span>
              </div>

              {/* Route Alternative Selector if multiple routes returned */}
              {routes.length > 1 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {routes.slice(0, 2).map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedRouteIdx(i);
                        matchHazardsWithRoute(r, allReports, i);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        selectedRouteIdx === i
                          ? 'bg-rp-accent/15 border-rp-accent shadow-glow-cyan'
                          : 'bg-rp-card border-rp-border text-rp-text-muted hover:text-rp-text'
                      }`}
                    >
                      <span className="font-heading font-bold text-rp-text block">
                        {i === 0 ? 'Primary Route' : 'Alternative Route'}
                      </span>
                      <span className="text-[10px] text-rp-text-muted block mt-0.5">
                        {(r.distance / 1000).toFixed(1)} km • {Math.round(r.duration / 60)} min
                      </span>
                      <span className="text-[10px] text-rose-400 font-bold block mt-1">
                        {i === 0 ? hazardsAlongRoute.length : alternateHazards.length} Hazards
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Single Route Distance & Travel Time stats */}
              <div className="grid grid-cols-2 gap-2 text-center my-3">
                <div className="p-2.5 rounded-xl bg-rp-card border border-rp-border">
                  <span className="text-[10px] text-rp-text-muted uppercase font-bold block">Distance</span>
                  <span className="font-heading font-bold text-base text-rp-text">
                    {activeRoute?.distance ? (activeRoute.distance / 1000).toFixed(1) : '94.6'} km
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-rp-card border border-rp-border">
                  <span className="text-[10px] text-rp-text-muted uppercase font-bold block">Est. Drive Time</span>
                  <span className="font-heading font-bold text-base text-rp-text">
                    {activeRoute?.duration ? Math.round(activeRoute.duration / 60) : '65'} mins
                  </span>
                </div>
              </div>

              {/* Hazard Count KPI Card */}
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-400 block">Total Route Hazards</span>
                  <span className="text-2xl font-heading font-bold text-rose-400">
                    {activeHazardsList.length}
                  </span>
                </div>
                <div className="text-right text-[11px] text-rp-text-muted space-y-0.5">
                  <span className="text-emerald-400 font-semibold block">{verifiedCount} Verified by Authority</span>
                  <span className="text-amber-400 font-semibold block">{unverifiedCount} Unverified Citizen Reports</span>
                  <span className="text-rose-400 font-semibold block">{criticalCount + highCount} High / Critical Risk</span>
                </div>
              </div>

              {/* Severity Distribution */}
              <div className="space-y-1.5 pt-2 border-t border-rp-border text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rp-text-muted block">
                  Severity Breakdown
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                  <div className="p-1.5 rounded bg-rose-500/15 border border-rose-500/30">
                    <span className="block text-rose-400 font-bold">{criticalCount}</span>
                    <span className="text-[9px] text-rp-text-muted">Critical</span>
                  </div>
                  <div className="p-1.5 rounded bg-orange-500/15 border border-orange-500/30">
                    <span className="block text-orange-400 font-bold">{highCount}</span>
                    <span className="text-[9px] text-rp-text-muted">High</span>
                  </div>
                  <div className="p-1.5 rounded bg-amber-500/15 border border-amber-500/30">
                    <span className="block text-amber-400 font-bold">{mediumCount}</span>
                    <span className="text-[9px] text-rp-text-muted">Medium</span>
                  </div>
                  <div className="p-1.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                    <span className="block text-emerald-400 font-bold">{lowCount}</span>
                    <span className="text-[9px] text-rp-text-muted">Low</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown Panel */}
            <div className="rp-card bg-rp-card-elevated p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rp-text-muted block mb-3">
                Hazards Along Highway Geometry
              </span>

              {activeHazardsList.length === 0 ? (
                <div className="text-center py-6 text-xs text-rp-text-muted">
                  No reported hazards found along this route corridor.
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-rp-card border border-rp-border text-xs"
                    >
                      <span className="capitalize text-rp-text font-medium flex items-center gap-2">
                        <span>{cat === 'pothole' ? '🕳️' : cat === 'damaged_signal' ? '🚦' : cat === 'waterlogging' ? '🌊' : cat.includes('accident') ? '💥' : '🛡️'}</span>
                        {cat.replace('_', ' ')}
                      </span>
                      <span className="font-mono font-bold text-rp-accent">{count}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Preliminary Safety Advisory */}
              <div className="mt-4 p-3 rounded-xl bg-rp-card border border-rp-border text-[11px] text-rp-text-muted leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-rp-text mb-1">
                  <Info className="w-3.5 h-3.5 text-rp-accent" />
                  Preliminary Safety Advisory
                </div>
                Hazard summary is calculated from community reports and authority field scans along this route corridor. Road conditions can change rapidly. <strong>No route is guaranteed completely safe</strong>; drive with vigilance.
              </div>
            </div>
          </div>
        </div>

        {/* 3. POTHOLE & HAZARD INSPECTION MODAL DRAWER */}
        {selectedHazardForDetail && (
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-rp-card-elevated border border-rp-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedHazardForDetail(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-rp-card border border-rp-border text-rp-text-muted hover:text-rp-text transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title & Badge */}
              <div className="pr-10">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-rp-accent/20 text-rp-accent font-bold">
                    {selectedHazardForDetail.reportNumber}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
                    selectedHazardForDetail.estimatedSeverity === 'critical'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {selectedHazardForDetail.estimatedSeverity} Severity
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {selectedHazardForDetail.verificationStatus}
                  </span>
                </div>
                <h3 className="text-lg font-heading font-bold text-rp-text">
                  {selectedHazardForDetail.title}
                </h3>
              </div>

              {/* Photo Evidence with Fallback */}
              <div className="relative rounded-xl overflow-hidden h-64 bg-rp-bg border border-rp-border">
                <img
                  src={selectedHazardForDetail.originalImageUrl}
                  alt={selectedHazardForDetail.title}
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800';
                  }}
                />
                <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/85 text-xs text-white font-mono flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rp-accent" />
                  GPS: {selectedHazardForDetail.location.coordinates[1].toFixed(4)}° N, {selectedHazardForDetail.location.coordinates[0].toFixed(4)}° E
                </span>
              </div>

              {/* Detailed Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-rp-card border border-rp-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-rp-text-muted block">Location / Address</span>
                  <p className="font-semibold text-rp-text">{selectedHazardForDetail.address}</p>
                  <p className="text-rp-text-muted">{selectedHazardForDetail.city}, {selectedHazardForDetail.wardOrZone || 'Expressway Zone'}</p>
                </div>

                <div className="p-3 rounded-xl bg-rp-card border border-rp-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-rp-text-muted block">Severity Assessment & AI Model</span>
                  <p className="font-semibold text-rp-text">
                    {selectedHazardForDetail.detection?.modelName || 'Gemini Vision 2.0 Highway Engine'}
                  </p>
                  <p className="text-rp-text-muted">
                    Assessment Confidence: <strong>{((selectedHazardForDetail.detection?.modelConfidence || 0.95) * 100).toFixed(0)}%</strong> • Priority: <strong>{selectedHazardForDetail.priorityScore}/100</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rp-card border border-rp-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-rp-text-muted block">Report Date & Status</span>
                  <p className="font-semibold text-rp-text">
                    {selectedHazardForDetail.createdAt ? new Date(selectedHazardForDetail.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '15 October 2026'}
                  </p>
                  <p className="text-rp-text-muted capitalize">
                    Resolution Status: <strong className="text-rp-accent">{selectedHazardForDetail.resolutionStatus}</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rp-card border border-rp-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-rp-text-muted block">Source Attribution</span>
                  <p className="font-semibold text-rp-text">
                    {selectedHazardForDetail.reporterName || 'RoadVanta Verified Field Capture'}
                  </p>
                  <p className="text-rp-text-muted">
                    Assigned: {selectedHazardForDetail.assignedDepartment || 'NHAI & UP PWD Highway Division'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 rounded-xl bg-rp-bg border border-rp-border text-xs leading-relaxed text-rp-text-secondary">
                <strong className="text-rp-text block mb-1">Visible Road Damage Description:</strong>
                {selectedHazardForDetail.description}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rp-border">
                <button
                  type="button"
                  onClick={() => setSelectedHazardForDetail(null)}
                  className="px-4 py-2 rounded-xl bg-rp-card border border-rp-border text-rp-text hover:bg-rp-card-elevated text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${selectedHazardForDetail.location.coordinates[1]},${selectedHazardForDetail.location.coordinates[0]}`);
                    toast.success('Coordinates copied to clipboard');
                  }}
                  className="px-4 py-2 rounded-xl bg-rp-accent text-rp-bg text-xs font-bold font-heading hover:scale-105 transition-all"
                >
                  Copy GPS Coordinates
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default RouteHazardIntelligencePage;
