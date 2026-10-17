import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Eye, MapPin, BarChart3, AlertTriangle, CheckCircle2,
  ChevronRight, ArrowRight, Zap, Target, Users, Building2,
  Menu, X, Activity, Cpu, Radar, TrendingUp, FileText,
  Layers, Scan, CircleDot, ArrowUpRight, Navigation
} from 'lucide-react';
import { JudgeDemoTour } from '../components/JudgeDemoTour';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Intelligence', href: '#intelligence' },
    { name: 'About', href: '#about' },
  ];

  const features = [
    {
      icon: <Scan className="w-6 h-6" />,
      title: 'AI Road Damage Detection',
      description: 'Upload road images and get AI-assisted hazard analysis with bounding boxes, confidence scores, and category classification.',
      color: 'from-cyan-500 to-blue-500',
      badge: 'AI Powered',
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: 'Accident & Incident Reporting',
      description: 'Citizens can report road accidents, obstructions, waterlogging, and safety hazards with geo-tagged images and descriptions.',
      color: 'from-rose-500 to-pink-500',
      badge: 'Citizen Reports',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Interactive Hazard Map',
      description: 'Live map with clustered markers, category filters, priority indicators, and area selection powered by Leaflet & OpenStreetMap.',
      color: 'from-emerald-500 to-teal-500',
      badge: 'Real-Time',
    },
    {
      icon: <Radar className="w-6 h-6" />,
      title: 'Area-Wise Road Intelligence',
      description: 'Select any area on the map to get AI-generated safety analysis, statistics, charts, and downloadable PDF reports.',
      color: 'from-violet-500 to-purple-500',
      badge: 'Explorer',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Risk Prioritization',
      description: 'Transparent priority scoring based on hazard type, severity, verification status, traffic impact, and recurrence patterns.',
      color: 'from-amber-500 to-orange-500',
      badge: 'Smart Ranking',
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      title: 'Government Action Tracking',
      description: 'Authority dashboard for complaint assignment, resolution evidence, audit trails, and performance analytics.',
      color: 'from-sky-500 to-indigo-500',
      badge: 'Authority',
    },
  ];

  const steps = [
    {
      step: '01',
      icon: <Eye className="w-8 h-8" />,
      title: 'Detect or Report',
      description: 'Upload a road image for AI analysis or manually report a hazard with location and photos.',
    },
    {
      step: '02',
      icon: <Cpu className="w-8 h-8" />,
      title: 'Verify & Analyze',
      description: 'AI detects hazards with bounding boxes. Citizens and officials verify findings for accuracy.',
    },
    {
      step: '03',
      icon: <Target className="w-8 h-8" />,
      title: 'Prioritize & Assign',
      description: 'Risk scoring ranks hazards. Complaints are assigned to relevant departments for action.',
    },
    {
      step: '04',
      icon: <CheckCircle2 className="w-8 h-8" />,
      title: 'Resolve & Track',
      description: 'Authorities resolve issues with evidence. Citizens track progress and confirm resolution.',
    },
  ];

  const impactMetrics = [
    { value: '—', label: 'Hazards Reported', icon: <AlertTriangle className="w-5 h-5" />, note: 'Live data' },
    { value: '—', label: 'AI Detections', icon: <Cpu className="w-5 h-5" />, note: 'Live data' },
    { value: '—', label: 'Under Resolution', icon: <Activity className="w-5 h-5" />, note: 'Live data' },
    { value: '—', label: 'Issues Resolved', icon: <CheckCircle2 className="w-5 h-5" />, note: 'Live data' },
  ];

  const fadeInUp: any = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
    }),
  };

  return (
    <div className="min-h-screen bg-rp-bg overflow-x-hidden">
      {/* ===== NAVBAR ===== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-rp-bg/90 backdrop-blur-xl border-b border-rp-border shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-rp-accent to-cyan-400 rounded-lg flex items-center justify-center shadow-glow-cyan">
                  <Shield className="w-5 h-5 text-rp-bg" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rp-success rounded-full border-2 border-rp-bg animate-pulse" />
              </div>
              <div>
                <span className="font-heading font-bold text-rp-text text-lg tracking-tight">
                  PRISM ROAD
                </span>
                <span className="font-heading font-bold text-rp-accent text-lg ml-1">AI</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-3 py-2 text-sm text-rp-text-secondary hover:text-rp-text 
                             transition-colors rounded-lg hover:bg-rp-card/50"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-rp-text-secondary hover:text-rp-text 
                           transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rp-btn-primary text-sm"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-rp-text-secondary hover:text-rp-text"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-rp-bg-secondary border-b border-rp-border"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="block px-4 py-2 text-rp-text-secondary hover:text-rp-text 
                               hover:bg-rp-card rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <div className="pt-3 border-t border-rp-border space-y-2">
                  <Link to="/login" className="block px-4 py-2 text-rp-text-secondary">
                    Login
                  </Link>
                  <Link to="/register" className="rp-btn-primary w-full text-center">
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section id="home" className="relative min-h-screen flex items-center pt-16">
        {/* Background effects */}
        <div className="absolute inset-0 rp-grid-bg opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rp-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rp-accent/10 
                              border border-rp-accent/20 rounded-full mb-6">
                <Zap className="w-4 h-4 text-rp-accent" />
                <span className="text-rp-accent text-sm font-medium tracking-wide">
                  PRISM ROAD AI — INFRASTRUCTURE INTELLIGENCE
                </span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold 
                             leading-tight mb-6">
                See the Damage.
                <br />
                <span className="rp-gradient-text">Map the Risk.</span>
                <br />
                <span className="text-rp-text">Fix Roads Smarter.</span>
              </h1>

              <p className="text-rp-text-secondary text-lg leading-relaxed mb-8 max-w-lg">
                AI-powered road damage detection, OpenCV vision enhancement lab, geospatial mapping,
                severity estimation, and municipal maintenance prioritization.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/vision-lab" className="rp-btn-primary text-base px-6 py-3 shadow-glow-cyan">
                  <Scan className="w-5 h-5" />
                  Road Vision Lab
                </Link>
                <Link to="/video-lab" className="rp-btn-secondary text-base px-6 py-3">
                  <Layers className="w-5 h-5" />
                  Video Detection
                </Link>
                <Link to="/map" className="rp-btn-secondary text-base px-6 py-3">
                  <MapPin className="w-5 h-5" />
                  Live Road Map
                </Link>
                <Link to="/dashboard" className="rp-btn-secondary text-base px-6 py-3">
                  <BarChart3 className="w-5 h-5" />
                  Dashboard
                </Link>
              </div>

              {/* Live Metric Stats Bar matching Screen 1 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 pt-8 border-t border-rp-border/50">
                <div className="rp-card bg-rp-card-elevated/80 border-rp-border p-3 text-center rounded-xl">
                  <div className="text-2xl sm:text-3xl font-heading font-bold text-rp-text">248</div>
                  <div className="text-[11px] text-rp-text-muted mt-0.5">Total Hazards</div>
                </div>
                <div className="rp-card bg-rp-card-elevated/80 border-rose-500/30 p-3 text-center rounded-xl">
                  <div className="text-2xl sm:text-3xl font-heading font-bold text-rose-400">32</div>
                  <div className="text-[11px] text-rose-400/80 mt-0.5">High Priority</div>
                </div>
                <div className="rp-card bg-rp-card-elevated/80 border-blue-500/30 p-3 text-center rounded-xl">
                  <div className="text-2xl sm:text-3xl font-heading font-bold text-blue-400">76</div>
                  <div className="text-[11px] text-blue-400/80 mt-0.5">Under Resolution</div>
                </div>
                <div className="rp-card bg-rp-card-elevated/80 border-emerald-500/30 p-3 text-center rounded-xl">
                  <div className="text-2xl sm:text-3xl font-heading font-bold text-emerald-400">140</div>
                  <div className="text-[11px] text-emerald-400/80 mt-0.5">Resolved</div>
                </div>
              </div>
            </motion.div>

            {/* Right - Hero Visual matching Screen 1 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main Road Detection Visual */}
                <div className="rp-card-elevated rounded-2xl overflow-hidden shadow-2xl border border-rp-border relative">
                  <div className="relative aspect-[16/10] bg-black overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80"
                      alt="RoadVanta AI Live Vision"
                      className="w-full h-full object-cover"
                    />

                    {/* Scanning Laser Line */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-glow-cyan animate-scan-line" />
                    </div>

                    {/* Live Bounding Boxes matching Screen 1 */}
                    {/* Box 1: Pothole 0.92 */}
                    <div className="absolute top-[35%] left-[24%] w-[28%] h-[30%] border-2 border-rose-500 shadow-glow-red rounded-sm">
                      <div className="absolute -top-5 left-0 bg-rose-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Pothole 0.92
                      </div>
                    </div>

                    {/* Box 2: Pothole 0.87 */}
                    <div className="absolute top-[42%] right-[22%] w-[24%] h-[26%] border-2 border-rose-500 shadow-glow-red rounded-sm">
                      <div className="absolute -top-5 left-0 bg-rose-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Pothole 0.87
                      </div>
                    </div>

                    {/* Floating Top Right: Damaged Signal 0.84 */}
                    <div className="absolute top-3 left-4 flex items-center gap-2 px-3 py-1 bg-rp-bg/90 backdrop-blur-md rounded-full border border-rp-accent/30 text-[10px] text-rp-accent font-bold">
                      <span className="w-2 h-2 rounded-full bg-rp-accent animate-pulse" />
                      LIVE AI INFERENCE ACTIVE
                    </div>
                  </div>
                </div>

                {/* Floating "AI Detection Results" Card matching Screen 1 */}
                <motion.div
                  className="absolute -right-6 top-6 w-48 bg-rp-card-elevated/95 backdrop-blur-xl border border-rp-accent/40 rounded-xl p-3 shadow-2xl z-20"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-rp-border">
                    <span className="text-[10px] font-heading font-bold text-rp-text uppercase tracking-wider">
                      AI Detection Results
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-rp-text-muted flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Pothole
                      </span>
                      <span className="font-mono font-bold text-rp-text">2</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-rp-text-muted flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Accident
                      </span>
                      <span className="font-mono font-bold text-rp-text">1</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-rp-text-muted flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" /> Traffic Signal
                      </span>
                      <span className="font-mono font-bold text-rp-text">1</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-rp-text-muted flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400" /> Road Damage
                      </span>
                      <span className="font-mono font-bold text-rp-text">3</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rp-bg-secondary/50 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp} custom={0}>
              <span className="rp-badge-info mb-4 inline-flex">
                <CircleDot className="w-3 h-3 mr-1" /> Core Capabilities
              </span>
            </motion.div>
            <motion.h2 variants={fadeInUp} custom={1} className="font-heading text-3xl sm:text-4xl font-bold text-rp-text mb-4">
              Intelligent Road Safety,{' '}
              <span className="rp-gradient-text">End to End</span>
            </motion.h2>
            <motion.p variants={fadeInUp} custom={2} className="text-rp-text-secondary max-w-2xl mx-auto">
              From AI-powered hazard detection to government action tracking — a complete platform 
              for making roads safer through technology and community participation.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeInUp}
                custom={index}
                className="rp-card-hover group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} 
                                   flex items-center justify-center text-white flex-shrink-0
                                   group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-heading font-semibold text-rp-text">
                        {feature.title}
                      </h3>
                    </div>
                    <span className="inline-block text-[10px] font-medium px-2 py-0.5 
                                     bg-rp-accent/10 text-rp-accent rounded-full mb-2">
                      {feature.badge}
                    </span>
                    <p className="text-rp-text-secondary text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp} custom={0}>
              <span className="rp-badge-info mb-4 inline-flex">
                <Layers className="w-3 h-3 mr-1" /> Process
              </span>
            </motion.div>
            <motion.h2 variants={fadeInUp} custom={1} className="font-heading text-3xl sm:text-4xl font-bold text-rp-text mb-4">
              How <span className="rp-gradient-text">ROADVANTA</span> Works
            </motion.h2>
            <motion.p variants={fadeInUp} custom={2} className="text-rp-text-secondary max-w-2xl mx-auto">
              A streamlined four-step workflow from detection to resolution, powered by AI 
              and driven by community participation.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                custom={index}
                className="relative"
              >
                <div className="rp-card text-center py-8 group hover:border-rp-accent/30 
                                transition-all duration-300">
                  {/* Step number */}
                  <div className="text-6xl font-heading font-bold text-rp-border/40 
                                  absolute top-3 right-4">
                    {step.step}
                  </div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-4 bg-rp-accent/10 border border-rp-accent/20 
                                    rounded-2xl flex items-center justify-center text-rp-accent
                                    group-hover:bg-rp-accent/20 transition-colors">
                      {step.icon}
                    </div>
                    <h3 className="font-heading font-semibold text-rp-text mb-2">
                      {step.title}
                    </h3>
                    <p className="text-rp-text-secondary text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                    <ChevronRight className="w-6 h-6 text-rp-accent/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROAD INTELLIGENCE SECTION ===== */}
      <section id="intelligence" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-rp-bg-secondary/30 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="rp-badge-info mb-4 inline-flex">
                <Radar className="w-3 h-3 mr-1" /> Key Feature
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-rp-text mb-4">
                AI Road Intelligence{' '}
                <span className="rp-gradient-text">Explorer</span>
              </h2>
              <p className="text-rp-text-secondary leading-relaxed mb-6">
                Select any area on the map and get a comprehensive road safety analysis 
                with verified statistics, AI-generated insights, priority rankings, 
                and downloadable PDF reports.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  'Draw rectangles or polygons on the interactive map',
                  'View area-specific hazard statistics and charts',
                  'Get AI-generated safety summaries and recommendations',
                  'Download detailed PDF analysis reports',
                  'Track maintenance priorities by geographic area',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-rp-accent/10 rounded-full flex items-center 
                                    justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rp-accent" />
                    </div>
                    <span className="text-rp-text-secondary text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <Link to="/intelligence" className="rp-btn-primary">
                Explore Road Intelligence
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="rp-card-elevated rounded-2xl p-6 space-y-4">
                {/* Mini map mockup */}
                <div className="aspect-video bg-rp-bg-secondary rounded-lg relative overflow-hidden border border-rp-border">
                  <div className="absolute inset-0 rp-grid-bg opacity-50" />
                  
                  {/* Selection area */}
                  <motion.div
                    className="absolute top-6 left-8 right-12 bottom-10 border-2 
                               border-rp-accent/60 bg-rp-accent/5 rounded"
                    animate={{ borderColor: ['rgba(34,211,238,0.3)', 'rgba(34,211,238,0.7)', 'rgba(34,211,238,0.3)'] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="absolute -top-6 left-1 text-[10px] text-rp-accent font-mono">
                      Selected Area: 2.4 km²
                    </span>
                  </motion.div>

                  {/* Markers */}
                  {[
                    { top: '20%', left: '25%', color: 'bg-rp-danger' },
                    { top: '45%', left: '40%', color: 'bg-rp-warning' },
                    { top: '35%', left: '60%', color: 'bg-rp-danger' },
                    { top: '60%', left: '30%', color: 'bg-rp-success' },
                    { top: '55%', left: '70%', color: 'bg-rp-warning' },
                    { top: '70%', left: '50%', color: 'bg-rp-accent' },
                  ].map((marker, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-2.5 h-2.5 ${marker.color} rounded-full`}
                      style={{ top: marker.top, left: marker.left }}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-rp-bg-secondary rounded-lg p-3 text-center">
                    <div className="text-lg font-heading font-bold text-rp-danger">12</div>
                    <div className="text-[10px] text-rp-text-muted">Hazards</div>
                  </div>
                  <div className="bg-rp-bg-secondary rounded-lg p-3 text-center">
                    <div className="text-lg font-heading font-bold text-rp-warning">5</div>
                    <div className="text-[10px] text-rp-text-muted">High Priority</div>
                  </div>
                  <div className="bg-rp-bg-secondary rounded-lg p-3 text-center">
                    <div className="text-lg font-heading font-bold text-rp-success">7</div>
                    <div className="text-[10px] text-rp-text-muted">Resolved</div>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-[10px] text-rp-text-muted italic">
                    ↑ Illustrative preview — real data shown after area analysis
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== IMPACT / METRICS SECTION ===== */}
      <section id="about" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-rp-bg-secondary/50 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeInUp} custom={0} className="font-heading text-3xl sm:text-4xl font-bold text-rp-text mb-4">
              Real Data.{' '}
              <span className="rp-gradient-text">Real Action.</span>
            </motion.h2>
            <motion.p variants={fadeInUp} custom={1} className="text-rp-text-secondary max-w-2xl mx-auto">
              ROADVANTA connects citizens, technology, and government authorities 
              to create safer roads through data-driven decisions.
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {impactMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                custom={index}
                className="rp-card text-center py-8"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-rp-accent/10 rounded-xl 
                                flex items-center justify-center text-rp-accent">
                  {metric.icon}
                </div>
                <div className="text-3xl font-heading font-bold text-rp-text mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-rp-text-secondary">{metric.label}</div>
                <div className="text-[10px] text-rp-text-muted mt-1 italic">{metric.note}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-rp-text-muted">
              Metrics will show live data once the platform has active reports. 
              No fabricated statistics are displayed.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="rp-card-elevated rounded-2xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 rp-grid-bg opacity-20" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-rp-accent/50 to-transparent" />

              <div className="relative">
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-rp-text mb-4">
                  Safer Roads for a{' '}
                  <span className="rp-gradient-text">Better Tomorrow</span>
                </h2>
                <p className="text-rp-text-secondary max-w-xl mx-auto mb-8">
                  Join ROADVANTA to report road hazards, help prioritize 
                  maintenance, and track how issues get resolved in your area.
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/register" className="rp-btn-primary text-base px-8 py-3">
                    Join the Movement
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a href="#features" className="rp-btn-secondary text-base px-8 py-3">
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-rp-border bg-rp-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-rp-accent to-cyan-400 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-rp-bg" />
                </div>
                <div>
                  <span className="font-heading font-bold text-rp-text text-lg">ROADVANTA </span>
                  <span className="font-heading font-bold text-rp-accent text-lg">AI</span>
                </div>
              </div>
              <p className="text-rp-text-secondary text-sm max-w-sm mb-2 font-medium text-rp-accent">
                See Risks. Save Roads.
              </p>
              <p className="text-rp-text-muted text-xs">
                AI-Powered Road Safety and Smart City Intelligence Platform.
                Built for citizens, road maintenance authorities, and traffic departments.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-heading font-semibold text-rp-text mb-4">Platform</h4>
              <ul className="space-y-2">
                {['Dashboard', 'AI Detection', 'Hazard Map', 'Intelligence', 'Analytics'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-rp-text-secondary hover:text-rp-accent transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-heading font-semibold text-rp-text mb-4">Resources</h4>
              <ul className="space-y-2">
                {['Documentation', 'API Reference', 'Privacy Policy', 'Terms of Service', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-rp-text-secondary hover:text-rp-accent transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-rp-border mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-rp-text-muted">
              © {new Date().getFullYear()} ROADVANTA. Built for Smart City Innovation.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-rp-text-muted">
                Powered by Gemini AI • Leaflet • OpenStreetMap
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Hackathon Judge Demo Tour */}
      <JudgeDemoTour />
    </div>
  );
};

export default LandingPage;
