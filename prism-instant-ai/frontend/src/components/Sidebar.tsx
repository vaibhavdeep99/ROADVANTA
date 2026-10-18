import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  Camera,
  Video,
  FileText,
  MapPin,
  LayoutDashboard,
  ShieldCheck,
  Users,
  CheckCircle2,
  FileSearch,
  Activity,
  Award,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, isAuthority } = useAuth();

  const userNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Image Scanner', path: '/scanner/image', icon: Camera },
    { name: 'Video Scanner', path: '/scanner/video', icon: Video },
    { name: 'Reports Registry', path: '/reports', icon: FileText },
    { name: 'Geospatial Map', path: '/map', icon: MapPin },
  ];

  const authorityNav = [
    { name: 'Assigned Corridor Tasks', path: '/authority/tasks', icon: ShieldCheck },
  ];

  const adminNav = [
    { name: 'Platform Governance', path: '/admin/dashboard', icon: Activity },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Authority Approvals', path: '/admin/approvals', icon: Award },
    { name: 'System Audit Logs', path: '/admin/audit', icon: FileSearch },
  ];

  return (
    <aside className="w-64 bg-[#111827] border-r border-[#374151] flex flex-col justify-between p-4 flex-shrink-0">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-black text-xl shadow-glow-cyan">
            P
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
              PRISM INSTANT AI
            </h1>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider block">
              ENTERPRISE ROAD DEFECT
            </span>
          </div>
        </div>

        {/* User Navigation */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 block mb-2">
            Citizen & Field Patrol
          </span>
          {userNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Authority Navigation */}
        {isAuthority && (
          <div className="space-y-1 pt-2 border-t border-gray-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-3 block mb-2 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Municipal Authority
            </span>
            {authorityNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        {/* Admin Navigation */}
        {isAdmin && (
          <div className="space-y-1 pt-2 border-t border-gray-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-3 block mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> System Admin
            </span>
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Profile Badge */}
      <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-gray-200 truncate max-w-[130px]">
            {user?.full_name || 'Inspector'}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
              isAdmin
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : isAuthority
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isAdmin ? 'ADMIN' : isAuthority ? 'AUTHORITY' : 'USER'}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 truncate block">
          {user?.email}
        </span>
      </div>
    </aside>
  );
};
