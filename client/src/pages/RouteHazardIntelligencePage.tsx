import React, { useState } from 'react';
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
} from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';

interface RouteDefect {
  id: string;
  type: string;
  severity: 'low' | 'moderate' | 'high';
  location: string;
  distanceKm: number;
}

export const RouteHazardIntelligencePage: React.FC = () => {
  const [origin, setOrigin] = useState('Indore Railway Station');
  const [destination, setDestination] = useState('Super Corridor IT Park');
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeEvaluated, setRouteEvaluated] = useState(true);

  const sampleDefects: RouteDefect[] = [
    { id: 'DEF-101', type: 'Deep Cavitation Crater', severity: 'high', location: 'Near Bada Ganpati Junction', distanceKm: 2.4 },
    { id: 'DEF-102', type: 'Asphalt Fatigue Cracks', severity: 'moderate', location: 'MR-10 Ring Road Intersection', distanceKm: 5.1 },
    { id: 'DEF-103', type: 'Surface Depression', severity: 'low', location: 'TCS Super Corridor Service Lane', distanceKm: 8.7 },
  ];

  const handleCalculateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setRouteEvaluated(true);
    }, 600);
  };

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
              Evaluate commute corridors for verified pavement damage, potholes, and maintenance disruptions.
            </p>
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
                  className="w-full py-2.5 rounded-xl bg-rp-accent text-rp-bg font-bold text-xs hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 shadow-glow-cyan"
                >
                  <Search className="w-4 h-4" />
                  {isCalculating ? 'Auditing Corridor...' : 'Scan Route for Hazards'}
                </button>
              </form>
            </div>

            {/* Safety Score Card */}
            {routeEvaluated && (
              <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-4">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-rp-text-muted">
                  Corridor Safety Index
                </h4>

                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-rp-bg-secondary border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-300 font-semibold block uppercase">
                      Safety Score
                    </span>
                    <span className="text-3xl font-heading font-bold text-emerald-400">
                      78 / 100
                    </span>
                    <span className="text-[11px] text-rp-text-muted block mt-0.5">
                      Acceptable pavement condition
                    </span>
                  </div>
                  <ShieldCheck className="w-10 h-10 text-emerald-400 opacity-80" />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-rp-border/60">
                    <span className="text-rp-text-muted">Estimated Distance</span>
                    <span className="font-bold text-rp-text">11.8 km</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-rp-border/60">
                    <span className="text-rp-text-muted">Verified Hazards on Route</span>
                    <span className="font-bold text-amber-400">{sampleDefects.length} Defect(s)</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-rp-text-muted">Recommended Speed Advisory</span>
                    <span className="font-bold text-cyan-400">45 km/h on MR-10</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Corridor Inspection (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Map Preview */}
            <div className="bg-rp-card border border-rp-border rounded-2xl overflow-hidden min-h-[340px] relative flex flex-col">
              <iframe
                title="Transit Corridor Route"
                src="https://www.openstreetmap.org/export/embed.html?bbox=75.80%2C22.68%2C75.92%2C22.76&layer=mapnik"
                className="w-full h-80 border-none contrast-[1.05]"
              />
              <div className="p-3 bg-rp-bg/95 border-t border-rp-border flex items-center justify-between text-xs text-rp-text-muted">
                <span>Active Route: {origin} → {destination}</span>
                <span className="text-rp-accent font-mono text-[10px]">OSM Corridor Routing</span>
              </div>
            </div>

            {/* List of Hazards along route */}
            <div className="bg-rp-card border border-rp-border rounded-2xl p-5 space-y-3">
              <h3 className="font-heading font-bold text-sm text-rp-text flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Identified Hazards on Transit Corridor ({sampleDefects.length})
              </h3>

              <div className="space-y-2.5">
                {sampleDefects.map((def) => (
                  <div
                    key={def.id}
                    className="p-3 rounded-xl bg-rp-bg-secondary border border-rp-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rp-text">{def.type}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          def.severity === 'high'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : def.severity === 'moderate'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {def.severity}
                        </span>
                      </div>
                      <span className="text-rp-text-muted text-[11px] block">{def.location}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-rp-accent font-bold">+{def.distanceKm} km</span>
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
