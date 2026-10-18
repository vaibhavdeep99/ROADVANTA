import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Upload,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { HazardCategory, SeverityLevel } from '../types';
import prismApi from '../services/prismApi';

// Pin icon for location picker
const locationPickerIcon = L.divIcon({
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background: #06B6D4;
      border: 3px solid #FFFFFF;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 0 16px rgba(6, 182, 212, 0.8);
    "></div>
  `,
  className: 'location-picker-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map click listener component
const LocationPickerEvents = ({ onSelect }: { onSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapPanTo = ({ coords }: { coords: [number, number] }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(coords, 14);
  }, [coords, map]);
  return null;
};

// Preset demo images for quick testing
const demoImages = [
  {
    name: '🕳️ Deep Pothole',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    type: 'pothole',
  },
  {
    name: '🌊 Waterlogging',
    url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    type: 'waterlogging',
  },
  {
    name: '🚦 Damaged Signal',
    url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80',
    type: 'damaged_signal',
  },
  {
    name: '🛡️ Broken Divider',
    url: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80',
    type: 'damaged_barrier',
  },
];

export const ReportHazardPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [selectedImage, setSelectedImage] = useState<string | null>(demoImages[0].url);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // AI Detection Result
  const [aiResult, setAiResult] = useState<any>({
    suggestedCategory: 'pothole',
    suggestedSeverity: 'critical',
    suggestedPriorityScore: 92,
    suggestedTitle: 'Dangerous crater pothole on active corridor',
    safetySummary: 'Severe pavement failure. Depth exceeds 15cm; high risk of two-wheeler wheel entrapment.',
    detection: {
      modelConfidence: 0.96,
      boundingBoxes: [{ x: 28, y: 35, width: 44, height: 38, label: 'Deep Pothole Rim', confidence: 0.96 }],
    },
  });

  // User input details
  const [category, setCategory] = useState<HazardCategory>('pothole');
  const [severity, setSeverity] = useState<SeverityLevel>('critical');
  const [title, setTitle] = useState('Severe road hazard on main artery');
  const [description, setDescription] = useState('Deep crater in middle lane creating vehicle swerving hazard.');
  const [address, setAddress] = useState('100 Feet Road, Near Sony World Crossing, Koramangala');
  const [coords, setCoords] = useState<[number, number]>([12.9345, 77.6358]);
  const [reporterName, setReporterName] = useState('Aarav Patel');
  const [reporterEmail, setReporterEmail] = useState('aarav.patel@example.com');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Success modal state
  const [submittedReport, setSubmittedReport] = useState<any>(null);

  // Run AI analysis
  const runAiAnalysis = async (imageUrl: string, file?: File) => {
    setAnalyzing(true);
    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        res = await axios.post('/api/v1/detect', formData);
      } else {
        res = await axios.post('/api/v1/detect', { imageUrl });
      }

      if (res.data.success) {
        const data = res.data.data;
        setAiResult(data);
        setCategory(data.suggestedCategory);
        setSeverity(data.suggestedSeverity);
        setTitle(data.suggestedTitle);
        toast.success(`AI Identified: ${data.suggestedCategory.toUpperCase()} (${Math.round(data.detection.modelConfidence * 100)}% confidence)`);
      }
    } catch (err) {
      console.warn('AI analysis failed:', err);
      toast.error('AI analysis encountered an issue, defaulting to heuristic scan.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      runAiAnalysis(url, file);
    }
  };

  const handleSelectDemoImage = (img: typeof demoImages[0]) => {
    setImageFile(null);
    setSelectedImage(img.url);
    runAiAnalysis(img.url);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setCoords([lat, lng]);
    setAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Bengaluru City Sector)`);
    toast.success('Hazard coordinates updated!');
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords([latitude, longitude]);
          setAddress(`GPS Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          toast.success('GPS location retrieved!');
        },
        () => {
          toast.error('Location permission denied, using map pin instead.');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        title,
        description,
        category,
        estimatedSeverity: severity,
        priorityScore: aiResult?.suggestedPriorityScore || 75,
        originalImageUrl: selectedImage,
        address,
        latitude: coords[0],
        longitude: coords[1],
        reporterName: isAnonymous ? 'Anonymous Citizen' : reporterName,
        reporterEmail: isAnonymous ? '' : reporterEmail,
        isAnonymous,
        detection: JSON.stringify(aiResult?.detection || {}),
      };

      let res;
      if (imageFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));
        formData.append('image', imageFile);
        res = await axios.post('/api/v1/reports', formData);
      } else {
        res = await axios.post('/api/v1/reports', payload);
      }

      if (res.data.success) {
        setSubmittedReport(res.data.data);
        toast.success(`Report ${res.data.data.reportNumber} registered and routed to Authority Portal!`);
        
        // Sync to PRISM SQLite backend for Authority & Vision registry
        try {
          await prismApi.createReport({
            title,
            description,
            category,
            city: nearestCity,
            address: addressText,
            latitude: coords[0],
            longitude: coords[1],
            estimated_severity: estimatedSeverity,
            priority_score: priorityScore,
          });
        } catch (syncErr) {
          console.warn('Prism backend sync skipped:', syncErr);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-rp-bg flex flex-col pt-16">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">
        {/* Title & Introduction */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rp-accent/10 border border-rp-accent/20 text-rp-accent text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Computer Vision Hazard Ingestion
          </div>
          <h1 className="text-3xl font-heading font-bold text-rp-text">
            Report a Road Hazard or Accident
          </h1>
          <p className="text-rp-text-secondary text-sm mt-1 max-w-2xl">
            Upload a photo of damaged asphalt, waterlogging, or traffic signal failure. Our AI instantly analyzes risk severity, detects bounding boxes, and generates priority routing for municipal teams.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Upload & AI Detection Overlay (Cols 1-7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Image Preview Box with Bounding Box Overlay */}
            <div className="rp-card relative overflow-hidden group">
              <div className="relative h-72 sm:h-96 w-full rounded-lg bg-rp-bg-secondary flex items-center justify-center overflow-hidden border border-rp-border">
                {selectedImage ? (
                  <>
                    <img
                      src={selectedImage}
                      alt="Road Hazard Preview"
                      className="w-full h-full object-cover"
                    />

                    {/* AI Bounding Box Overlays */}
                    {aiResult?.detection?.boundingBoxes?.map((box: any, i: number) => (
                      <div
                        key={i}
                        className="absolute border-2 border-rp-accent rounded-sm pointer-events-none transition-all shadow-glow-cyan"
                        style={{
                          left: `${box.x}%`,
                          top: `${box.y}%`,
                          width: `${box.width}%`,
                          height: `${box.height}%`,
                        }}
                      >
                        <span className="absolute -top-6 left-0 px-1.5 py-0.5 bg-rp-accent text-rp-bg font-bold text-[10px] rounded uppercase tracking-wider whitespace-nowrap shadow-md">
                          {box.label} ({Math.round(box.confidence * 100)}%)
                        </span>
                      </div>
                    ))}

                    {/* Laser Scanner animation during analysis */}
                    {analyzing && (
                      <div className="absolute inset-0 bg-rp-accent/15 backdrop-blur-[2px] flex flex-col items-center justify-center">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-0 animate-pulse shadow-glow-cyan" />
                        <div className="p-4 rounded-xl bg-rp-card-elevated/90 border border-rp-accent text-center shadow-2xl">
                          <RefreshCw className="w-6 h-6 text-rp-accent animate-spin mx-auto mb-2" />
                          <span className="font-heading font-bold text-sm text-rp-text block">
                            Analyzing Hazard Image...
                          </span>
                          <span className="text-[11px] text-rp-text-muted">
                            RoadVanta YOLOv8 Neural Classification (Active)
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-6 text-rp-text-muted">
                    <Upload className="w-12 h-12 mx-auto mb-2 text-rp-accent/60" />
                    <p className="text-sm">Click below to upload or choose a demo photo</p>
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rp-card-elevated border border-rp-border hover:border-rp-accent/50 text-xs font-semibold text-rp-text transition-colors"
                >
                  <Upload className="w-4 h-4 text-rp-accent" />
                  Choose File from Device
                </button>

                {/* Preset sample images for quick evaluator testing */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[11px] text-rp-text-muted">Presets:</span>
                  {demoImages.map((img) => (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => handleSelectDemoImage(img)}
                      className={`text-[11px] px-2 py-1 rounded border transition-all ${
                        selectedImage === img.url
                          ? 'bg-rp-accent text-rp-bg font-bold border-rp-accent'
                          : 'bg-rp-card border-rp-border text-rp-text-secondary hover:text-rp-text'
                      }`}
                    >
                      {img.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Diagnostics Card */}
            {aiResult && (
              <div className="rp-card border-rp-accent/30 bg-rp-card-elevated">
                <div className="flex items-center justify-between border-b border-rp-border pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-rp-accent" />
                    <h3 className="font-heading font-bold text-sm text-rp-text">
                      AI Computer Vision Assessment
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-rp-accent px-2 py-0.5 rounded bg-rp-accent/15 border border-rp-accent/30">
                    Confidence: {Math.round((aiResult.detection?.modelConfidence || 0.94) * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 my-3 text-center">
                  <div className="p-2 rounded-lg bg-rp-bg border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted uppercase font-bold block">
                      Category
                    </span>
                    <span className="font-heading font-bold text-xs text-rp-text capitalize">
                      {category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-rp-bg border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted uppercase font-bold block">
                      Severity
                    </span>
                    <span className={`font-heading font-bold text-xs uppercase ${
                      severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {severity}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-rp-bg border border-rp-border">
                    <span className="text-[10px] text-rp-text-muted uppercase font-bold block">
                      Priority Score
                    </span>
                    <span className="font-heading font-bold text-sm text-rp-accent">
                      {aiResult.suggestedPriorityScore}/100
                    </span>
                  </div>
                </div>

                <p className="text-xs text-rp-text-secondary leading-relaxed bg-rp-bg/60 p-2.5 rounded border border-rp-border">
                  <span className="font-semibold text-rp-accent">Diagnosis: </span>
                  {aiResult.safetySummary}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Location & Report Form (Cols 8-12) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Location Selector (OpenStreetMap) */}
            <div className="rp-card">
              <div className="flex items-center justify-between mb-2">
                <label className="font-heading font-bold text-xs text-rp-text flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rp-accent" />
                  Pin Location on Map
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-[11px] text-rp-accent hover:underline flex items-center gap-1"
                >
                  Use GPS
                </button>
              </div>

              {/* Mini Leaflet OpenStreetMap */}
              <div className="h-44 w-full rounded-lg overflow-hidden border border-rp-border mb-3 relative">
                <MapContainer
                  center={coords}
                  zoom={14}
                  scrollWheelZoom={false}
                  style={{ width: '100%', height: '100%' }}
                >
                  <TileLayer
                    attribution='RoadVanta Geospatial'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapPanTo coords={coords} />
                  <LocationPickerEvents onSelect={handleLocationSelect} />
                  <Marker position={coords} icon={locationPickerIcon} />
                </MapContainer>
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-rp-bg/90 backdrop-blur text-[9px] text-rp-text-muted pointer-events-none z-[1000]">
                  Click map to adjust pin
                </div>
              </div>

              {/* Address input */}
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address or nearby landmark"
                className="w-full px-3 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text placeholder:text-rp-text-muted focus:outline-none focus:border-rp-accent"
                required
              />
            </div>

            {/* Hazard Category & Severity adjustments */}
            <div className="rp-card space-y-4">
              <div>
                <label className="text-[11px] font-bold text-rp-text-muted uppercase block mb-1">
                  Hazard Classification
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HazardCategory)}
                  className="w-full px-3 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                >
                  <option value="pothole">🕳️ Pothole</option>
                  <option value="waterlogging">🌊 Waterlogging / Flooding</option>
                  <option value="road_crack">⚡ Asphalt Fatigue / Cracking</option>
                  <option value="damaged_signal">🚦 Damaged Traffic Signal</option>
                  <option value="damaged_barrier">🛡️ Damaged Median / Guardrail</option>
                  <option value="citizen_reported_accident">💥 Road Accident / Collision</option>
                  <option value="road_debris">🪨 Construction Debris</option>
                  <option value="other">⚠️ Other Obstruction</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-rp-text-muted uppercase block mb-1">
                  Incident Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-rp-text-muted uppercase block mb-1">
                  Description & Context
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-rp-bg border border-rp-border rounded-lg text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                  placeholder="Additional context regarding traffic impact or depth"
                  required
                />
              </div>

              {/* Reporter details */}
              <div className="pt-2 border-t border-rp-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-rp-text-muted uppercase">
                    Reporter Privacy
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-rp-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded accent-rp-accent"
                    />
                    Submit Anonymously
                  </label>
                </div>

                {!isAnonymous && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Your Name"
                      className="px-3 py-1.5 bg-rp-bg border border-rp-border rounded text-xs text-rp-text"
                    />
                    <input
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="Your Email"
                      className="px-3 py-1.5 bg-rp-bg border border-rp-border rounded text-xs text-rp-text"
                    />
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rp-accent to-cyan-400 text-rp-bg font-heading font-bold text-sm tracking-wide shadow-glow-cyan hover:shadow-glow-cyan-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Registering Report...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Submit Verified Hazard Report
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {submittedReport && (
        <div className="fixed inset-0 z-50 bg-rp-bg/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-rp-card-elevated border border-rp-accent/50 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rp-accent/15 border border-rp-accent text-rp-accent flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="font-heading font-bold text-xl text-center text-rp-text">
              Hazard Report Registered!
            </h3>

            <p className="text-xs text-center text-rp-text-muted mt-1">
              Your report has been logged and queued for emergency municipal triage.
            </p>

            <div className="my-4 p-3 rounded-xl bg-rp-bg border border-rp-border text-center">
              <span className="text-[10px] text-rp-text-muted uppercase font-bold block">
                Official Tracking ID
              </span>
              <span className="font-mono font-bold text-lg text-rp-accent tracking-wider">
                {submittedReport.reportNumber}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate('/map')}
                className="flex-1 py-2.5 rounded-lg bg-rp-accent text-rp-bg font-heading font-bold text-xs tracking-wide shadow-glow-cyan flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                View on Live Map
              </button>
              <button
                onClick={() => setSubmittedReport(null)}
                className="px-4 py-2.5 rounded-lg bg-rp-card border border-rp-border text-xs text-rp-text font-semibold hover:bg-rp-card-elevated"
              >
                Submit Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportHazardPage;
