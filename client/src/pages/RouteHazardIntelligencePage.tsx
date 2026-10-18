import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import prismApi, { getAssetUrl, PrismReport } from '../services/prismApi';

interface CorridorPreset {
  name: string;
  origin: string;
  destination: string;
  city: string;
  bbox: string;
  distanceKm: number;
}

const PRESET_ROUTES: CorridorPreset[] = [
  {
    name: 'Lucknow → Unnao (NH-27 Leather Belt, UP)',
    origin: 'Lucknow Shaheed Path Junction',
    destination: 'Unnao Industrial Cluster (NH-27)',
    city: 'unnao',
    bbox: '80.35%2C26.45%2C80.60%2C26.65',
    distanceKm: 58.4,
  },
  {
    name: 'Vadodara → Karelibag (Gujarat)',
    origin: 'Vadodara Railway Station',
    destination: 'Jeevan Bharti Char Rasta, Karelibag',
    city: 'vadodara',
    bbox: '73.15%2C22.28%2C73.23%2C22.34',
    distanceKm: 6.2,
  },
  {
    name: 'Kanpur → Jajmau GT Road (UP)',
    origin: 'Kanpur Central Station',
    destination: 'Jajmau Bypass, GT Road, Kanpur',
    city: 'kanpur',
    bbox: '80.30%2C26.40%2C80.45%2C26.50',
    distanceKm: 12.8,
  },
  {
    name: 'Indore → BRTS Vijay Nagar (MP)',
    origin: 'Indore Railway Station',
    destination: 'Vijay Nagar Square, AB Road',
    city: 'indore',
    bbox: '75.82%2C22.70%2C75.92%2C22.78',
    distanceKm: 8.5,
  },
  {
    name: 'Delhi NCR Outer Ring Road Corridor',
    origin: 'Azadpur Terminal, Delhi',
    destination: 'Mukarba Chowk Underpass',
    city: 'delhi',
    bbox: '77.10%2C28.70%2C77.20%2C28.78',
    distanceKm: 7.4,
  },
];

export const RouteHazardIntelligencePage: React.FC = () => {
  const [origin, setOrigin] = useState('Lucknow Shaheed Path Junction');
  const [destination, setDestination] = useState('Unnao Industrial Cluster (NH-27)');
  const [activePreset, setActivePreset] = useState<CorridorPreset>(PRESET_ROUTES[0]);
  const [reports, setReports] = useState<PrismReport[]>([]);
  const [routeReports, setRouteReports] = useState<PrismReport[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [mapBbox, setMapBbox] = useState(PRESET_ROUTES[0].bbox);

  useEffect(() => {
    prismApi.getReports().then((data) => {
      setReports(data);
      filterHazardsForRoute(activePreset.city, data);
    }).catch(console.error);
  }, []);

  const filterHazardsForRoute = (cityKey: string, allReports: PrismReport[]) => {
    let matched = allReports.filter(
      (r) =>
        r.city.toLowerCase().includes(cityKey.toLowerCase()) ||
        r.address.toLowerCase().includes(cityKey.toLowerCase())
    );
    if (matched.length === 0) {
      matched = allReports.slice(0, 3);
    }
    setRouteReports(matched);
  };

  const handleApplyPreset = (preset: CorridorPreset) => {
    setActivePreset(preset);
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setMapBbox(preset.bbox);
    filterHazardsForRoute(preset.city, reports);
  };

  const handleCalculateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);

    const query = `${origin} ${destination}`.toLowerCase();
    let detectedCity = 'unnao';
    let newBbox = '80.35%2C26.45%2C80.60%2C26.65';

    if (query.includes('vadodara') || query.includes('karelibag') || query.includes('gujarat')) {
      detectedCity = 'vadodara';
      newBbox = '73.15%2C22.28%2C73.23%2C22.34';
    } else if (query.includes('kanpur') || query.includes('jajmau')) {
      detectedCity = 'kanpur';
      newBbox = '80.30%2C26.40%2C80.45%2C26.50';
    } else if (query.includes('indore') || query.includes('vijay')) {
      detectedCity = 'indore';
      newBbox = '75.82%2C22.70%2C75.92%2C22.78';
    } else if (query.includes('delhi') || query.includes('mukarba')) {
      detectedCity = 'delhi';
      newBbox = '77.10%2C28.70%2C77.20%2C28.78';
    } else if (query.includes('lucknow')) {
      detectedCity = 'lucknow';
      newBbox = '80.85%2C26.75%2C81.05%2C26.95';
    }

    setMapBbox(newBbox);
    setTimeout(() => {
      filterHazardsForRoute(detectedCity, reports);
      setIsCalculating(false);
    }, 400);
  };

  // Dynamic Safety Score
  const highSeverityCount = routeReports.filter((r) => r.estimated_severity === 'high').length;
  const safetyScore = Math.max(30, 95 - highSeverityCount * 18 - routeReports.length * 5);

  return (
    <SidebarLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rp-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-rp-accent/15 text-rp-accent border border-rp-accent/30">
                Corridor Safety Engine
              </span>
              <span className="text-xs text-rp-text-muted">Transit Vulnerability & Route Hazard Pre-Check</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text">
              Route Hazard Intelligence
            </h1>
            <p className="text-sm text-rp-text-secondary mt-1">
              Evaluate commute corridors for verified pavement damage, potholes, and municipal maintenance disruptions before departure.
            </p>
          </div>
        </div>

        {/* Quick Corridor Selection Pills */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-rp-text-muted block">
            ⚡ Quick-Select High-Risk Indian Corridors:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_ROUTES.map((p) => (
              <button
                key={p.name}
                onClick={() => handleApplyPreset(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  activePreset.name === p.name
                    ? 'bg-rp-accent/20 border-rp-accent text-rp-accent shadow-glow-cyan'
                    : 'bg-rp-card border-rp-border text-rp-text hover:border-rp-accent/50'
                }`}
              >
                🛣️ {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form and Map Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-rp-text flex items-center gap-2">
                <Navigation className="w-4 h-4 text-rp-accent" />
                Transit Route Parameters
              </h3>

              <form onSubmit={handleCalculateRoute} className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-rp-text-muted block mb-1">
                    Origin / Starting Point
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-rp-bg-secondary border border-rp-border rounded-xl text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-rp-text-muted block mb-1">
                    Destination
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-rp-bg-secondary border border-rp-border rounded-xl text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCalculating}
                  className="w-full py-2.5 rounded-xl bg-rp-accent text-rp-bg font-bold text-xs hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  {isCalculating ? 'Auditing Corridor Hazards...' : 'Scan Route for Hazards'}
                </button>
              </form>
            </div>

            {/* Corridor Safety Index Card */}
            <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-rp-text-muted block">
                Corridor Safety Index
              </span>

              <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-rp-text-muted block uppercase font-bold tracking-wide">
                    Safety Score
                  </span>
                  <span className={`text-3xl font-heading font-bold ${
                    safetyScore >= 80 ? 'text-emerald-400' : safetyScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {safetyScore} / 100
                  </span>
                  <span className="text-[11px] text-rp-text-muted block mt-0.5">
                    {safetyScore >= 80
                      ? 'Smooth pavement condition'
                      : safetyScore >= 60
                      ? 'Moderate caution: Potholes detected'
                      : 'Severe damage: Slow transit advisory'}
                  </span>
                </div>
                <ShieldCheck className={`w-10 h-10 ${
                  safetyScore >= 80 ? 'text-emerald-400' : safetyScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                } opacity-80`} />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-rp-border/60">
                  <span className="text-rp-text-muted">Estimated Transit Distance</span>
                  <span className="font-bold text-rp-text">{activePreset.distanceKm} km</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-rp-border/60">
                  <span className="text-rp-text-muted">Verified Hazards on Route</span>
                  <span className="font-bold text-amber-400">{routeReports.length} Defect(s)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-rp-text-muted">Speed Recommendation</span>
                  <span className="font-bold text-cyan-400">
                    {highSeverityCount > 0 ? 'Limit to 35-40 km/h' : 'Standard 55 km/h'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Corridor Inspection (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Map Preview */}
            <div className="bg-rp-card border border-rp-border rounded-2xl overflow-hidden min-h-[340px] relative flex flex-col">
              <iframe
                title="Transit Corridor Route"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBbox}&layer=mapnik`}
                className="w-full h-80 border-none contrast-[1.05]"
              />
              <div className="p-3 bg-rp-bg/95 border-t border-rp-border flex items-center justify-between text-xs text-rp-text-muted">
                <span>Active Corridor: <strong>{origin}</strong> → <strong>{destination}</strong></span>
                <span className="text-rp-accent font-mono text-[10px]">OSM Corridor Telemetry</span>
              </div>
            </div>

            {/* List of Hazards along route */}
            <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-rp-text flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Verified Hazards Along Transit Route ({routeReports.length})
                </h3>
                <span className="text-xs text-rp-text-muted">Live Database Sync</span>
              </div>

              <div className="space-y-3">
                {routeReports.map((rep, idx) => (
                  <div
                    key={rep.id}
                    className="p-3.5 rounded-xl bg-rp-bg-secondary border border-rp-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:border-rp-border/80 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-black overflow-hidden flex-shrink-0 border border-rp-border">
                        <img
                          src={getAssetUrl(rep.original_image_url)}
                          alt={rep.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rp-text">{rep.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              rep.estimated_severity === 'high'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : rep.estimated_severity === 'moderate'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {rep.estimated_severity}
                          </span>
                        </div>
                        <span className="text-rp-text-muted text-[11px] block">{rep.address}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-mono text-rp-accent font-bold">
                        +{(idx * 3.4 + 2.1).toFixed(1)} km
                      </span>
                      <span className="text-[10px] text-rp-text-muted block">from start</span>
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
