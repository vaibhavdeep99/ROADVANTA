import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  RotateCcw,
  Navigation,
  Scan,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const JudgeDemoTour: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      step: 1,
      title: '1. Route Hazard Intelligence (Unnao ➔ Kanpur)',
      desc: 'Select an origin and destination (e.g. Unnao to Kanpur NH-27). The system calculates the driving route using OSRM and matches real road hazards along the route geometry using Turf.js.',
      path: '/route-intelligence',
      cta: 'Explore Route Intelligence',
      badge: 'Geospatial Route Analysis',
    },
    {
      step: 2,
      title: '2. Hazard Marker & Image Inspection',
      desc: 'Click on any road hazard along the corridor to inspect uploaded photos, severity level (Critical/High/Medium), address, verification status, and community upvotes.',
      path: '/route-intelligence',
      cta: 'Inspect Route Hazards',
      badge: 'Interactive Satellite Popups',
    },
    {
      step: 3,
      title: '3. Live AI Damage Detection Studio',
      desc: 'Experience our computer vision AI model. Click any sample image to trigger a laser-scan sweep with real-time bounding box overlays (e.g. Pothole 0.93, Crack 0.76) and confidence scores.',
      path: '/detection',
      cta: 'Try AI Detection Studio',
      badge: 'RoadVanta YOLOv8 Engine (Active)',
    },
    {
      step: 4,
      title: '4. Citizen Incident Reporting to Live DB',
      desc: 'Report a road issue with GPS coordinates on the Satellite map and photos. The incident is saved to the database and immediately becomes visible on the Live Map.',
      path: '/report',
      cta: 'Open Reporting Workflow',
      badge: 'Database Ingestion',
    },
    {
      step: 5,
      title: '5. Authority Triage & Resolution Tracking',
      desc: 'Switch to Authority persona (Inspector Vikram) to review incoming hazards, assign municipal departments (PWD, Traffic Police), update repair status, and track completion.',
      path: '/authority',
      cta: 'Inspect Authority Command',
      badge: 'Municipal Governance',
    },
  ];

  const handleStartTour = () => {
    setIsOpen(true);
    setCurrentStep(1);
    navigate(steps[0].path);
    toast.success('Hackathon Judge Demo Tour Started! Step 1: Route Hazard Intelligence');
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      const next = currentStep + 1;
      setCurrentStep(next);
      navigate(steps[next - 1].path);
    } else {
      setIsOpen(false);
      toast.success('Judge Demo Tour Complete! Feel free to explore freely.');
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      navigate(steps[prev - 1].path);
    }
  };

  const handleResetDemo = () => {
    setCurrentStep(1);
    navigate('/route-intelligence');
    toast.success('Demo state reset to Step 1 without modifying database reports.');
  };

  const activeStepData = steps[currentStep - 1];

  return (
    <>
      {/* Floating Trigger Button for Judges (Visible everywhere) */}
      {!isOpen && (
        <button
          onClick={handleStartTour}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-rp-accent via-cyan-400 to-emerald-400 text-rp-bg font-heading font-bold text-xs tracking-wide shadow-glow-cyan hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/40"
        >
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>🏆 Try Interactive Judge Demo</span>
        </button>
      )}

      {/* Floating Guided Tour Modal/Bar */}
      {isOpen && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-[480px] z-50 bg-rp-card-elevated/95 backdrop-blur-xl border-2 border-rp-accent/60 rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-rp-border">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-rp-accent/20 text-rp-accent text-[10px] font-bold uppercase tracking-wider">
                Judge Demo Tour
              </span>
              <span className="text-xs font-mono font-bold text-rp-text-muted">
                Step {currentStep} of {steps.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetDemo}
                className="p-1 text-rp-text-muted hover:text-rp-accent text-[11px] flex items-center gap-1 mr-2"
                title="Reset Tour"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-rp-card text-rp-text-muted hover:text-rp-text"
                title="Close Demo Tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step Badge & Title */}
          <div className="mb-2">
            <span className="text-[10px] text-rp-accent font-bold uppercase tracking-wider block">
              {activeStepData.badge}
            </span>
            <h4 className="font-heading font-bold text-sm text-rp-text mt-0.5">
              {activeStepData.title}
            </h4>
          </div>

          {/* Description */}
          <p className="text-xs text-rp-text-secondary leading-relaxed mb-4">
            {activeStepData.desc}
          </p>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-rp-bg rounded-full overflow-hidden border border-rp-border mb-4">
            <div
              className="h-full bg-gradient-to-r from-rp-accent to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-3 py-1.5 rounded-lg bg-rp-card border border-rp-border text-xs text-rp-text disabled:opacity-30 disabled:pointer-events-none hover:bg-rp-card-elevated flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>

            <button
              onClick={() => navigate(activeStepData.path)}
              className="text-xs text-rp-accent hover:underline font-semibold flex items-center gap-1"
            >
              {activeStepData.cta} <ExternalLink className="w-3 h-3" />
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-rp-accent to-cyan-500 text-rp-bg font-heading font-bold text-xs uppercase tracking-wider shadow-glow-cyan flex items-center gap-1"
            >
              <span>{currentStep === steps.length ? 'Finish' : 'Next Step'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default JudgeDemoTour;
