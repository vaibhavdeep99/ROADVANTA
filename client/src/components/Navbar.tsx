import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  MapPin,
  AlertTriangle,
  BarChart3,
  Building2,
  Menu,
  X,
  UserCheck,
  ChevronDown,
  Sparkles,
  Navigation,
} from 'lucide-react';

interface NavbarProps {
  currentRole?: 'citizen' | 'authority' | 'admin';
  onRoleChange?: (role: 'citizen' | 'authority' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole = 'citizen', onRoleChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Route Intelligence', path: '/route-intelligence', icon: <Navigation className="w-4 h-4" /> },
    { name: 'Live Hazard Map', path: '/map', icon: <MapPin className="w-4 h-4" /> },
    { name: 'AI Studio', path: '/detection', icon: <AlertTriangle className="w-4 h-4" /> },
    { name: 'Authority Portal', path: '/authority', icon: <Building2 className="w-4 h-4" /> },
  ];

  const roles = [
    { id: 'citizen', label: 'Citizen (Aarav)', desc: 'Report & track hazards' },
    { id: 'authority', label: 'Authority (Insp. Vikram)', desc: 'Triage & assign repair units' },
    { id: 'admin', label: 'Smart City Admin', desc: 'Full citywide command' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-rp-bg/95 backdrop-blur-xl border-b border-rp-border shadow-2xl'
          : 'bg-rp-bg/80 backdrop-blur-md border-b border-rp-border/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-rp-accent to-cyan-400 rounded-lg flex items-center justify-center shadow-glow-cyan group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-rp-bg" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rp-success rounded-full border-2 border-rp-bg animate-pulse" />
            </div>
            <div>
              <span className="font-heading font-bold text-rp-text text-lg tracking-tight flex items-center gap-1.5">
                ROADVANTA
              </span>
              <p className="text-[10px] text-rp-text-muted leading-none hidden sm:block">
                Detect. Predict. Protect.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'text-rp-accent bg-rp-accent/10 border border-rp-accent/20 shadow-sm'
                      : 'text-rp-text-secondary hover:text-rp-text hover:bg-rp-card'
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right Side: Demo Role Switcher & Report Button */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-full bg-rp-card border border-rp-border hover:border-rp-accent/40 text-rp-text transition-colors"
                title="Switch demo persona"
              >
                <UserCheck className="w-3.5 h-3.5 text-rp-accent" />
                <span className="capitalize font-semibold text-rp-accent">
                  {currentRole === 'citizen' ? '👤 Citizen' : currentRole === 'authority' ? '🛡️ Authority' : '⚡ Admin'}
                </span>
                <ChevronDown className="w-3 h-3 text-rp-text-muted" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-rp-card-elevated border border-rp-border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 text-[11px] font-semibold text-rp-text-muted uppercase tracking-wider border-b border-rp-border/50">
                    Switch Active Persona
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onRoleChange?.(r.id as any);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 mt-1 ${
                        currentRole === r.id
                          ? 'bg-rp-accent/15 text-rp-accent font-medium border border-rp-accent/20'
                          : 'hover:bg-rp-card text-rp-text'
                      }`}
                    >
                      <span className="font-semibold">{r.label}</span>
                      <span className="text-[10px] text-rp-text-muted">{r.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            <Link
              to="/report"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-rp-accent to-cyan-400 text-rp-bg font-heading font-semibold text-xs tracking-wide shadow-glow-cyan hover:shadow-glow-cyan-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Report Hazard
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-rp-text-secondary hover:text-rp-text hover:bg-rp-card"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-rp-card border-b border-rp-border px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                location.pathname === link.path
                  ? 'bg-rp-accent/10 text-rp-accent'
                  : 'text-rp-text-secondary hover:text-rp-text hover:bg-rp-card-elevated'
              }`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}

          <div className="pt-3 border-t border-rp-border/60 flex flex-col gap-2">
            <div className="text-xs text-rp-text-muted px-2">Active Persona:</div>
            <div className="grid grid-cols-3 gap-1">
              {(['citizen', 'authority', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    onRoleChange?.(r);
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1.5 px-2 rounded text-xs capitalize ${
                    currentRole === r ? 'bg-rp-accent text-rp-bg font-bold' : 'bg-rp-card-elevated text-rp-text'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-rp-accent text-rp-bg font-bold text-sm mt-2"
            >
              + Report Road Hazard
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
