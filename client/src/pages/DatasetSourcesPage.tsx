import React, { useState, useEffect } from 'react';
import {
  Database,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  BarChart3,
  TrendingUp,
  Download,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Table as TableIcon,
  BookOpen,
} from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import prismApi from '../services/prismApi';

export const DatasetSourcesPage: React.FC = () => {
  const [datasetMeta, setDatasetMeta] = useState<any>(null);
  const [accidentData, setAccidentData] = useState<any>(null);
  const [trafficStatus, setTrafficStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<'2020' | '2021' | '2022' | 'total'>('2022');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      prismApi.getDatasetStatus().catch(() => null),
      prismApi.getOfficialAccidentStats().catch(() => null),
      prismApi.getTrafficStatus().catch(() => null),
    ]).then(([dMeta, aData, tStat]) => {
      if (dMeta) setDatasetMeta(dMeta);
      if (aData) setAccidentData(aData);
      if (tStat) setTrafficStatus(tStat);
      setLoading(false);
    });
  }, []);

  const stateRankings: any[] = accidentData?.state_rankings || [];
  const filteredStates = stateRankings.filter((s: any) =>
    s.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-rp-border">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-rp-accent/15 text-rp-accent border border-rp-accent/30 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Evidence & Data Provenance
              </span>
              <span className="text-xs text-rp-text-muted">CRDDC RDD2022 + MoRTH Official Records</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-rp-text">
              Real Datasets & Government Statistics
            </h1>
            <p className="text-sm text-rp-text-secondary mt-1 max-w-3xl">
              PRISM ROAD AI maintains zero synthetic hallucinations: AI vision detections are benchmarked against official RDD2022 road damage datasets, while accident analytics are imported directly from published Ministry of Road Transport & Highways (MoRTH) records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://data.gov.in/dataset-group-name/road-accidents"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-rp-card border border-rp-border text-rp-text hover:text-rp-accent text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-rp-accent" />
              data.gov.in Portal
            </a>
          </div>
        </div>

        {/* Triple Scientific Guardrail Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rp-card border border-rp-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-rp-accent font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              1. AI Vision Detections
            </div>
            <p className="text-xs text-rp-text-secondary leading-relaxed">
              Derived from authentic fine-tuned YOLOv8 neural network inference on camera frames. No artificial bounding boxes.
            </p>
          </div>

          <div className="bg-rp-card border border-rp-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <TableIcon className="w-4 h-4" />
              2. Accident Analytics
            </div>
            <p className="text-xs text-rp-text-secondary leading-relaxed">
              Official published MoRTH state statistics (2020–2022). Aggregate accident numbers are never attributed to single camera detections.
            </p>
          </div>

          <div className="bg-rp-card border border-rp-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              3. Traffic Obstruction
            </div>
            <p className="text-xs text-rp-text-secondary leading-relaxed">
              Status: <span className="font-semibold text-purple-300">Not Configured</span>. RDD2022 is a pavement distress dataset, not a traffic congestion dataset.
            </p>
          </div>
        </div>

        {/* SECTION 1: OFFICIAL ACCIDENT STATISTICS (MoRTH INDIA) */}
        <div className="bg-rp-card border border-rp-border rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-heading font-bold text-rp-text">
                  Official MoRTH Pothole Accidents & Fatalities (India)
                </h2>
              </div>
              <p className="text-xs text-rp-text-muted">
                Source: Ministry of Road Transport and Highways (MoRTH) & data.gov.in | Coverage: 36 States & UTs (2020–2022)
              </p>
            </div>

            {/* Year Selector Buttons */}
            <div className="flex items-center gap-1.5 bg-rp-bg-secondary p-1 rounded-xl border border-rp-border">
              {(['2022', '2021', '2020', 'total'] as const).map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedYear === yr
                      ? 'bg-amber-500 text-rp-bg shadow-sm'
                      : 'text-rp-text-muted hover:text-rp-text'
                  }`}
                >
                  {yr === 'total' ? '3-Year Total' : yr}
                </button>
              ))}
            </div>
          </div>

          {/* National Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border">
              <span className="text-[11px] text-rp-text-muted block">Selected Period Accidents</span>
              <span className="text-2xl font-bold font-mono text-amber-400">
                {selectedYear === '2022'
                  ? '4,446'
                  : selectedYear === '2021'
                  ? '3,625'
                  : selectedYear === '2020'
                  ? '3,564'
                  : '11,635'}
              </span>
              <span className="text-[10px] text-rp-text-secondary block mt-1">Verified State Reports</span>
            </div>

            <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border">
              <span className="text-[11px] text-rp-text-muted block">Selected Period Fatalities</span>
              <span className="text-2xl font-bold font-mono text-rose-400">
                {selectedYear === '2022'
                  ? '1,856'
                  : selectedYear === '2021'
                  ? '1,481'
                  : selectedYear === '2020'
                  ? '1,471'
                  : '4,808'}
              </span>
              <span className="text-[10px] text-rp-text-secondary block mt-1">Pothole-Related Deaths</span>
            </div>

            <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border">
              <span className="text-[11px] text-rp-text-muted block">Highest Incident State</span>
              <span className="text-xl font-bold text-rp-text">
                Uttar Pradesh (UP)
              </span>
              <span className="text-[10px] text-amber-400 block mt-1">1,986 Accidents & 1,030 Deaths in 2022</span>
            </div>

            <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border">
              <span className="text-[11px] text-rp-text-muted block">Second Highest State</span>
              <span className="text-xl font-bold text-rp-text">
                Madhya Pradesh (MP)
              </span>
              <span className="text-[10px] text-rp-accent block mt-1">759 Accidents & 199 Deaths in 2022</span>
            </div>
          </div>

          {/* Search State & Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by State or Union Territory..."
                className="w-full sm:w-72 px-3.5 py-1.5 bg-rp-bg-secondary border border-rp-border rounded-xl text-xs text-rp-text placeholder:text-rp-text-muted focus:outline-none focus:border-rp-accent"
              />
              <span className="text-xs text-rp-text-muted">
                Showing {filteredStates.length} of {stateRankings.length} States/UTs
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-rp-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-rp-bg-secondary text-rp-text-muted uppercase text-[10px] tracking-wider border-b border-rp-border">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">State / Union Territory</th>
                    <th className="p-3">2020 Accidents (Deaths)</th>
                    <th className="p-3">2021 Accidents (Deaths)</th>
                    <th className="p-3">2022 Accidents (Deaths)</th>
                    <th className="p-3">3-Year Total Accidents</th>
                    <th className="p-3">3-Year Fatalities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rp-border/50 text-rp-text">
                  {filteredStates.map((row, idx) => (
                    <tr
                      key={row.state}
                      className={
                        row.state === 'Uttar Pradesh'
                          ? 'bg-amber-500/10 font-medium'
                          : row.state === 'Madhya Pradesh'
                          ? 'bg-rp-accent/5'
                          : 'hover:bg-rp-card-hover/40'
                      }
                    >
                      <td className="p-3 font-mono text-rp-text-muted">#{idx + 1}</td>
                      <td className="p-3 font-semibold flex items-center gap-1.5">
                        {row.state}
                        {row.state === 'Uttar Pradesh' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Highest Risk Corridor
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-rp-text-secondary">
                        {row.accidents_2020} <span className="text-rose-400 text-[11px]">({row.fatalities_2020})</span>
                      </td>
                      <td className="p-3 font-mono text-rp-text-secondary">
                        {row.accidents_2021} <span className="text-rose-400 text-[11px]">({row.fatalities_2021})</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-400">
                        {row.accidents_2022} <span className="text-rose-400 text-[11px]">({row.fatalities_2022})</span>
                      </td>
                      <td className="p-3 font-mono font-bold">{row.total_accidents_3yr}</td>
                      <td className="p-3 font-mono font-bold text-rose-400">{row.total_fatalities_3yr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 2: RDD2022 ROAD DAMAGE DATASET SPECIFICATION */}
        <div className="bg-rp-card border border-rp-border rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-5 h-5 text-rp-accent" />
                <h2 className="text-lg font-heading font-bold text-rp-text">
                  Primary Dataset: RDD2022 (Road Damage Dataset CRDDC 2022)
                </h2>
              </div>
              <p className="text-xs text-rp-text-muted">
                Released through the IEEE BigData / CRDDC 2022 Challenge | Seki Lab, University of Tokyo
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://github.com/sekilab/RoadDamageDetector"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-rp-bg-secondary border border-rp-border text-rp-text hover:text-rp-accent text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-rp-accent" />
                Seki Lab GitHub
              </a>
              <a
                href="https://figshare.com/articles/dataset/RDD2022_-_The_multi-national_Road_Damage_Dataset_released_through_CRDDC_2022/21431547"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-rp-accent text-rp-bg text-xs font-semibold flex items-center gap-1.5 hover:bg-cyan-400 transition-all shadow-sm"
              >
                Figshare Dataset ↗
              </a>
            </div>
          </div>

          {/* Classes Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rp-text-muted">
              Official Damage Classes (CRDDC Standard)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-amber-400">D40</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">Primary Model Focus</span>
                </div>
                <h4 className="font-bold text-sm text-rp-text">Pothole</h4>
                <p className="text-[11px] text-rp-text-secondary leading-snug">
                  Cavitations with visible surface depression, perimeter shear, and ballast displacement.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-1">
                <span className="font-mono font-bold text-xs text-rp-accent">D00</span>
                <h4 className="font-bold text-sm text-rp-text">Longitudinal Crack</h4>
                <p className="text-[11px] text-rp-text-secondary leading-snug">
                  Linear fissures parallel to vehicle transit trajectory along wheel-path pavement stresses.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-1">
                <span className="font-mono font-bold text-xs text-rp-accent">D10</span>
                <h4 className="font-bold text-sm text-rp-text">Transverse Crack</h4>
                <p className="text-[11px] text-rp-text-secondary leading-snug">
                  Perpendicular thermal expansion or shrinkage fractures crossing lane boundaries.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-1">
                <span className="font-mono font-bold text-xs text-purple-400">D20</span>
                <h4 className="font-bold text-sm text-rp-text">Alligator Crack</h4>
                <p className="text-[11px] text-rp-text-secondary leading-snug">
                  Interconnected multi-directional fatigue cracking indicating structural base-layer failure.
                </p>
              </div>
            </div>
          </div>

          {/* Dataset Pipeline Spec */}
          <div className="p-4 rounded-xl bg-rp-bg-secondary border border-rp-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rp-text-muted flex items-center gap-2">
              <Layers className="w-4 h-4 text-rp-accent" />
              Verified Architecture & Attribution
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-rp-card border border-rp-border">
                <span className="text-rp-text-muted block text-[10px]">Target Subset:</span>
                <span className="font-semibold text-rp-text">India (India_train & India_test)</span>
              </div>
              <div className="p-3 rounded-lg bg-rp-card border border-rp-border">
                <span className="text-rp-text-muted block text-[10px]">Annotation Schema:</span>
                <span className="font-semibold text-rp-text">Pascal VOC XML → YOLOv8 Normalization</span>
              </div>
              <div className="p-3 rounded-lg bg-rp-card border border-rp-border">
                <span className="text-rp-text-muted block text-[10px]">Attribution License:</span>
                <span className="font-semibold text-rp-accent">CC BY-SA 4.0 International</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default DatasetSourcesPage;
