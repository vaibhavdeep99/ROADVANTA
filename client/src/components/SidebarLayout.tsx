import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Scan,
  FileText,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Bell,
  Search,
  User,
  Menu,
  X,
  Shield,
  LogOut,
  ChevronRight,
  Navigation,
  BarChart3,
} from 'lucide-react';
import { JudgeDemoTour } from './JudgeDemoTour';

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeRole?: 'citizen' | 'authority' | 'admin';
  onRoleChange?: (role: 'citizen' | 'authority' | 'admin') => void;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  activeRole = 'citizen',
  onRoleChange,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Safety Stats', path: '/statistics', icon: <BarChart3 className="w-5 h-5" />, badge: 'MoRTH' },
    { name: 'Route Intelligence', path: '/route-intelligence', icon: <Navigation className="w-5 h-5" />, badge: 'New' },
    { name: 'Live Map', path: '/map', icon: <MapPin className="w-5 h-5" /> },
    { name: 'AI Detection', path: '/detection', icon: <Scan className="w-5 h-5" />, badge: 'Live AI' },
    { name: 'Reports', path: '/reports', icon: <FileText className="w-5 h-5" /> },
    { name: 'Risk Analysis', path: '/intelligence', icon: <TrendingUp className="w-5 h-5" /> },
    { name: 'Authority Portal', path: '/authority', icon: <ShieldAlert className="w-5 h-5" /> },
    { name: 'Resolution Tracking', path: '/tracking', icon: <CheckCircle2 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-rp-bg text-rp-text flex flex-col lg:flex-row">
      {/* ===== DESKTOP LEFT SIDEBAR ===== */}
      <aside className="hidden lg:flex w-64 bg-rp-bg-secondary border-r border-rp-border flex-col justify-between h-screen sticky top-0 z-30">
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-rp-border/60">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-rp-accent to-cyan-500 rounded-lg flex items-center justify-center shadow-glow-cyan">
                  <Shield className="w-5 h-5 text-rp-bg" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rp-success rounded-full border-2 border-rp-bg animate-pulse" />
              </div>
              <div>
                <span className="font-heading font-bold text-rp-text text-base tracking-tight flex items-center gap-1.5">
                  ROADVANTA
                </span>
                <span className="text-[10px] text-rp-text-muted block leading-none">Smart Road & Infrastructure AI</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                    active
                      ? 'bg-rp-accent/15 text-rp-accent border border-rp-accent/30 shadow-glow-cyan'
                      : 'text-rp-text-secondary hover:text-rp-text hover:bg-rp-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-rp-accent' : 'text-rp-text-muted group-hover:text-rp-accent'}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rp-accent text-rp-bg">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Persona & Role Switcher Footer */}
        <div className="p-4 border-t border-rp-border/60">
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-rp-card border border-rp-border hover:border-rp-accent/40 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-rp-accent flex items-center justify-center font-bold text-xs text-rp-bg flex-shrink-0">
                {activeRole === 'authority' ? 'IN' : 'RS'}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-heading font-bold text-xs text-rp-text block truncate">
                  {activeRole === 'authority' ? 'Inspector Vikram' : 'Rahul Sharma'}
                </span>
                <span className="text-[10px] text-rp-accent capitalize block font-medium">
                  {activeRole === 'authority' ? '🛡️ Road Authority' : '👤 Citizen Reporter'}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-rp-text-muted" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-rp-card-elevated border border-rp-border rounded-xl p-2 shadow-2xl z-50 text-xs">
                <div className="text-[10px] font-bold uppercase text-rp-text-muted px-2 py-1">
                  Switch Persona (Demo)
                </div>
                <button
                  onClick={() => {
                    onRoleChange?.('citizen');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg ${
                    activeRole === 'citizen' ? 'bg-rp-accent/15 text-rp-accent font-bold' : 'hover:bg-rp-card text-rp-text'
                  }`}
                >
                  👤 Citizen (Rahul Sharma)
                </button>
                <button
                  onClick={() => {
                    onRoleChange?.('authority');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg ${
                    activeRole === 'authority' ? 'bg-rp-accent/15 text-rp-accent font-bold' : 'hover:bg-rp-card text-rp-text'
                  }`}
                >
                  🛡️ Authority (Inspector Vikram)
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-rp-bg-secondary/80 backdrop-blur-md border-b border-rp-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-rp-card border border-rp-border text-rp-text"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Quick Search Bar */}
            <div className="relative hidden sm:block w-72 md:w-96">
              <Search className="w-4 h-4 text-rp-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search location, hazard type, or report ID..."
                className="w-full pl-9 pr-4 py-2 bg-rp-card border border-rp-border rounded-xl text-xs text-rp-text placeholder:text-rp-text-muted focus:outline-none focus:border-rp-accent transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/map?search=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
                  }
                }}
              />
            </div>
          </div>

          {/* Right Header: CTA + Notification + Profile */}
          <div className="flex items-center gap-3">
            <Link
              to="/detection"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rp-accent to-cyan-400 text-rp-bg font-heading font-bold text-xs tracking-wide shadow-glow-cyan hover:scale-105 transition-all"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>AI Scan Hazard</span>
            </Link>

            <Link
              to="/map"
              className="p-2 rounded-lg bg-rp-card border border-rp-border hover:border-rp-accent/50 text-rp-text relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-rp-accent" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                3
              </span>
            </Link>

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-rp-accent flex items-center justify-center font-bold text-xs text-rp-bg">
              {activeRole === 'authority' ? 'IN' : 'RS'}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-rp-bg/80 backdrop-blur-md flex">
            <div className="w-64 bg-rp-bg-secondary h-full border-r border-rp-border p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-rp-border">
                  <span className="font-heading font-bold text-sm text-rp-text flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rp-accent" /> ROADVANTA
                  </span>
                  <button onClick={() => setMobileSidebarOpen(false)} className="text-rp-text-muted">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="mt-4 space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                        location.pathname === item.path
                          ? 'bg-rp-accent/15 text-rp-accent'
                          : 'text-rp-text-secondary hover:text-rp-text'
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-rp-border">
                <Link
                  to="/"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center gap-2 text-xs text-rp-text-muted hover:text-rp-text"
                >
                  <LogOut className="w-4 h-4" /> Return to Landing Page
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Child Pages Rendered Here */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating Hackathon Judge Demo Tour */}
      <JudgeDemoTour />
    </div>
  );
};

export default SidebarLayout;
