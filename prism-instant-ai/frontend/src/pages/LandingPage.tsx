import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Camera,
  Video,
  FileText,
  MapPin,
  CheckCircle2,
  Lock,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-20 border-b border-gray-800/80 bg-gray-900/60 backdrop-blur-xl sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-black text-xl shadow-glow-cyan">
            P
          </div>
          <div>
            <span className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
              PRISM INSTANT AI
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider block">
              ENTERPRISE ROAD DEFECT INTELLIGENCE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold shadow-glow-emerald transition flex items-center gap-1.5"
          >
            <span>Register Patrol Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>PRODUCTION-GRADE VISION + THREE-ROLE LIFECYCLE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Automated Road Hazard Detection &amp; Verified Municipal Remediation
        </h1>

        <p className="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed">
          Powered by actual Ultralytics YOLOv8 computer vision models, cryptographic role-based access control,
          and tamper-resistant ReportLab engineering audit PDFs.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/scanner/image"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-sm shadow-glow-emerald transition flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Launch Image Scanner</span>
          </Link>
          <Link
            to="/login"
            className="px-6 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm border border-gray-700 transition flex items-center gap-2"
          >
            <Lock className="w-4 h-4 text-gray-400" />
            <span>Portal Login</span>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Real Ultralytics Inference</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              No simulated detections. Direct PyTorch YOLO weights quantify pothole bounding boxes, confidence coefficients, and surface area ratios.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-cyan-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Three-Role RBAC</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Server-enforced authorization matrices distinguishing Citizens, Municipal Authorities, and System Admins. Zero client-side privilege leaks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-amber-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Engineered PDF Audits</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Authentic ReportLab documents generated dynamically with embedded photographic evidence, SHA-256 telemetry, and statutory disclaimers.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-800 py-8 px-6 text-center text-xs text-gray-500 font-mono">
        PRISM INSTANT AI &copy; {new Date().getFullYear()} &bull; HIGHWAY SAFETY &amp; CIVIL INFRASTRUCTURE
      </footer>
    </div>
  );
};
