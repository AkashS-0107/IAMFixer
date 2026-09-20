import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Brain,
  Database,
  FlaskConical,
  LayoutDashboard,
  RefreshCw,
  ServerOff,
} from 'lucide-react';
import { api } from '../../services/api';
import { HealthStatus } from '../../types/api';
import { PulseIndicator } from '../ui/PulseIndicator';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const shouldReduceMotion = useReducedMotion();

  const checkHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
      setError(false);
    } catch {
      setError(true);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getAiProviderLabel = (provider?: string) => {
    if (!provider || provider === 'auto') return 'AI: AUTO';
    if (provider === 'bedrock') return 'AI: AWS BEDROCK';
    if (provider === 'baseline') return 'AI: BASELINE RCA';
    if (provider === 'bedrock_fallback_baseline') return 'AI: BEDROCK → FALLBACK';
    return `AI: ${provider.toUpperCase()}`;
  };

  const getDbStatusLabel = (dbStatus?: string) => {
    if (!dbStatus || dbStatus === 'connected') return 'Database: SQLite Connected';
    return 'Database: Offline';
  };

  const isHomeActive = currentPath === '/' || currentPath === '';
  const isDashboardActive = currentPath === '/dashboard' || currentPath.startsWith('/incidents');
  const isSimulationActive = currentPath === '/simulation';

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand Wordmark & Tagline (NO LOGO) */}
        <div
          tabIndex={0}
          role="button"
          aria-label="IAMFixer Home Console"
          onClick={() => onNavigate('/')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate('/');
            }
          }}
          className="flex items-center space-x-3 cursor-pointer group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-lg py-1 px-1.5 transition-colors"
        >
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white font-sans group-hover:text-indigo-300 transition-colors">
              IAMFixer
            </span>
            <p className="text-[11px] text-slate-400 font-medium">Find the failure. Understand the cause. Fix it.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Main Navigation" className="flex items-center space-x-1 bg-[#0e1422] p-1 rounded-xl border border-slate-800 relative">
          <button
            onClick={() => onNavigate('/')}
            aria-current={isHomeActive ? 'page' : undefined}
            className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              isHomeActive
                ? 'text-indigo-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isHomeActive && (
              <motion.div
                layoutId="header-nav-active"
                className="absolute inset-0 bg-slate-800/90 rounded-lg border border-slate-700/80 shadow-sm -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">Home</span>
          </button>

          <button
            onClick={() => onNavigate('/dashboard')}
            aria-current={isDashboardActive ? 'page' : undefined}
            className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              isDashboardActive
                ? 'text-indigo-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isDashboardActive && (
              <motion.div
                layoutId="header-nav-active"
                className="absolute inset-0 bg-slate-800/90 rounded-lg border border-slate-700/80 shadow-sm -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <LayoutDashboard className={`h-3.5 w-3.5 relative z-10 ${isDashboardActive ? 'text-indigo-400' : 'text-slate-500'}`} aria-hidden="true" />
            <span className="relative z-10">Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('/simulation')}
            aria-current={isSimulationActive ? 'page' : undefined}
            className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              isSimulationActive
                ? 'text-indigo-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isSimulationActive && (
              <motion.div
                layoutId="header-nav-active"
                className="absolute inset-0 bg-slate-800/90 rounded-lg border border-slate-700/80 shadow-sm -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <FlaskConical className={`h-3.5 w-3.5 relative z-10 ${isSimulationActive ? 'text-indigo-400' : 'text-slate-500'}`} aria-hidden="true" />
            <span className="relative z-10">Simulation Lab</span>
          </button>
        </nav>

        {/* Health Status Indicator & Operational Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* AI Provider Badge */}
          {health && (
            <div className="hidden md:flex items-center space-x-1.5 bg-[#0e1422] px-2.5 py-1.5 rounded-lg border border-purple-900/50 text-purple-300">
              <Brain className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
              <PulseIndicator color="purple" size="sm" />
              <span className="font-semibold">{getAiProviderLabel(health.ai_provider)}</span>
            </div>
          )}

          {/* Database Status Badge */}
          {health && (
            <div className="hidden lg:flex items-center space-x-1.5 bg-[#0e1422] px-2.5 py-1.5 rounded-lg border border-indigo-900/50 text-indigo-300">
              <Database className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
              <PulseIndicator color="cyan" size="sm" />
              <span className="font-semibold">{getDbStatusLabel(health.database_status)}</span>
            </div>
          )}

          {/* Backend Health Badge */}
          <div
            tabIndex={0}
            role="button"
            aria-label="Backend Health Status. Click to refresh health check."
            onClick={checkHealth}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                checkHealth();
              }
            }}
            title="Click to re-check backend health"
            className="flex items-center space-x-2 bg-[#0e1422] px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 text-slate-400 animate-spin" aria-hidden="true" />
                <span className="text-slate-400 font-medium">Connecting...</span>
              </>
            ) : error ? (
              <>
                <ServerOff className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                <span className="text-rose-400 font-medium uppercase font-bold">OFFLINE</span>
              </>
            ) : health ? (
              <>
                <PulseIndicator color="emerald" size="sm" />
                <span className="text-emerald-400 font-bold uppercase tracking-wide">
                  CONNECTED <span className="text-slate-500 font-normal text-[10px] lowercase font-mono">v{health.version}</span>
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

