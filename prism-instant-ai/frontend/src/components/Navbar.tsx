import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Activity, ShieldCheck, UserCheck } from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin, isAuthority } = useAuth();
  const [serverStatus, setServerStatus] = useState<'online' | 'checking' | 'offline'>('checking');
  const [modelStatus, setModelStatus] = useState<string>('detecting');

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        if (mounted) {
          setServerStatus('online');
          setModelStatus(res.model_status || 'YOLOv8 Active');
        }
      } catch {
        if (mounted) {
          setServerStatus('offline');
          setModelStatus('Service Offline');
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="h-16 bg-[#111827]/90 backdrop-blur-md border-b border-[#374151] px-6 flex items-center justify-between z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              serverStatus === 'online'
                ? 'bg-emerald-500 animate-pulse'
                : serverStatus === 'checking'
                ? 'bg-amber-400'
                : 'bg-rose-500'
            }`}
          />
          <span className="text-xs font-mono text-gray-300">
            SYSTEM: <strong className={serverStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'}>
              {serverStatus.toUpperCase()}
            </strong>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800/80 border border-gray-700/60 text-[11px] text-gray-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-gray-400">ENGINE:</span>
          <span className="font-semibold text-cyan-300">{modelStatus}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-gray-200">{user?.full_name || 'Inspector'}</div>
            <div className="text-[10px] text-gray-400 font-mono">
              ROLE:{' '}
              <span className={isAdmin ? 'text-cyan-400' : isAuthority ? 'text-amber-400' : 'text-emerald-400'}>
                {user?.role}
              </span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center text-white text-xs font-bold border border-cyan-400/30">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out of PRISM"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-rose-950/40 text-gray-400 hover:text-rose-300 border border-gray-700 hover:border-rose-800/60 text-xs transition-all font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
