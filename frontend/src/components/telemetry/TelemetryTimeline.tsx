import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  FileText,
  Filter,
  GitBranch,
  Globe,
  RefreshCw,
  Search,
  Server,
  Zap,
} from 'lucide-react';
import { TelemetryEvent, TelemetrySource } from '../../types/api';
import { formatTimestamp } from '../../utils/formatters';
import { SeverityBadge } from '../ui/SeverityBadge';
import { EmptyState } from '../ui/EmptyState';

interface TelemetryTimelineProps {
  telemetry: TelemetryEvent[];
  loading: boolean;
  highlightedEventId?: string | null;
  onRefresh?: () => void;
}

export const TelemetryTimeline: React.FC<TelemetryTimelineProps> = ({
  telemetry,
  loading,
  highlightedEventId,
  onRefresh,
}) => {
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [expandedMetadata, setExpandedMetadata] = useState<Record<string, boolean>>({});
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(highlightedEventId || null);

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const shouldReduceMotion = useReducedMotion();

  // Chronological sorting (ascending by timestamp)
  const sorted = [...telemetry].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const filtered = sorted.filter((evt) => {
    if (sourceFilter !== 'ALL' && evt.source !== sourceFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const msgMatch = evt.message.toLowerCase().includes(q);
      const svcMatch = evt.service.toLowerCase().includes(q);
      const typeMatch = evt.event_type.toLowerCase().includes(q);
      const idMatch = evt.id.toLowerCase().includes(q);
      if (!msgMatch && !svcMatch && !typeMatch && !idMatch) return false;
    }
    return true;
  });

  // Scroll to highlighted target when evidence is selected & auto-clear highlight after 3.5s
  useEffect(() => {
    if (highlightedEventId) {
      setActiveHighlightId(highlightedEventId);

      const scrollToTarget = () => {
        const el = itemRefs.current[highlightedEventId] || document.getElementById(`telemetry-${highlightedEventId}`);
        if (el) {
          el.scrollIntoView({
            behavior: shouldReduceMotion ? 'auto' : 'smooth',
            block: 'center',
          });
        }
      };

      // Initial scroll attempts to handle DOM mounting / tab transitions
      scrollToTarget();
      const t1 = setTimeout(scrollToTarget, 50);
      const t2 = setTimeout(scrollToTarget, 200);

      // Auto-remove highlight after 3.5s
      const clearTimer = setTimeout(() => {
        setActiveHighlightId(null);
      }, 3500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightedEventId, telemetry, loading, shouldReduceMotion]);

  const toggleMetadata = (id: string) => {
    setExpandedMetadata((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getSourceIcon = (source: TelemetrySource | string, eventType: string) => {
    if (eventType === 'ALERT') return <Bell className="h-4 w-4 text-rose-400" aria-hidden="true" />;
    switch (source) {
      case 'deployment':
        return <GitBranch className="h-4 w-4 text-indigo-400" aria-hidden="true" />;
      case 'database':
        return <Database className="h-4 w-4 text-purple-400" aria-hidden="true" />;
      case 'metrics':
        return <BarChart3 className="h-4 w-4 text-amber-400" aria-hidden="true" />;
      case 'logs':
        return <FileText className="h-4 w-4 text-slate-300" aria-hidden="true" />;
      case 'network':
        return <Globe className="h-4 w-4 text-blue-400" aria-hidden="true" />;
      case 'service':
      default:
        return <Server className="h-4 w-4 text-emerald-400" aria-hidden="true" />;
    }
  };

  return (
    <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl overflow-hidden shadow-xl">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-800/90 bg-[#090d16]/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-indigo-400" aria-hidden="true" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-100 font-mono">
            Chronological Telemetry Stream
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#090d16] text-slate-300 border border-slate-800">
            {filtered.length} events
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search telemetry logs/metrics..."
              aria-label="Search telemetry logs and metrics"
              className="bg-[#090d16] border border-slate-800 focus:border-indigo-500 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono w-48 sm:w-60"
            />
          </div>

          {/* Source Filter */}
          <div className="flex items-center space-x-1 bg-[#090d16] border border-slate-800 rounded-md px-2 py-1 text-xs">
            <Filter className="h-3 w-3 text-slate-500" aria-hidden="true" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              aria-label="Filter telemetry by source"
              className="bg-transparent text-slate-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#090d16] text-slate-300">Source: All</option>
              <option value="deployment" className="bg-[#090d16] text-indigo-400">Deployment</option>
              <option value="metrics" className="bg-[#090d16] text-amber-400">Metrics</option>
              <option value="logs" className="bg-[#090d16] text-slate-300">Logs</option>
              <option value="database" className="bg-[#090d16] text-purple-400">Database</option>
              <option value="service" className="bg-[#090d16] text-emerald-400">Service</option>
              <option value="network" className="bg-[#090d16] text-blue-400">Network</option>
            </select>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh Telemetry"
              className="p-1.5 bg-[#090d16] border border-slate-800 hover:border-slate-700 text-slate-300 rounded hover:text-slate-100 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs animate-pulse">
            Loading telemetry stream from backend...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No telemetry events match current criteria"
            description="Try changing source filters or search terms."
          />
        ) : (
          <AnimatePresence>
            {filtered.map((evt) => {
              const isHighlighted = activeHighlightId === evt.id;
              const isMetadataOpen = !!expandedMetadata[evt.id];
              const hasMetadata = evt.metadata && Object.keys(evt.metadata).length > 0;

              return (
                <motion.div
                  key={evt.id}
                  ref={(el) => (itemRefs.current[evt.id] = el)}
                  id={`telemetry-${evt.id}`}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                  className={`relative pl-6 pb-2 transition-all rounded-lg border p-3.5 ${
                    isHighlighted
                      ? 'highlight-evidence border-indigo-500 bg-indigo-950/50 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/60'
                      : evt.event_type === 'ALERT' || evt.severity === 'CRITICAL' || evt.severity === 'ERROR'
                      ? 'bg-[#090d16]/80 border-slate-800/80 hover:border-slate-700'
                      : 'bg-[#090d16]/40 border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  {/* Visual Connector Node */}
                  <div className="absolute -left-2.5 top-4 h-5 w-5 rounded-full bg-[#090d16] border-2 border-slate-700 flex items-center justify-center shadow-md">
                    {getSourceIcon(evt.source, evt.event_type)}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    {/* Left Metadata Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-slate-500" aria-hidden="true" />
                        <span>{formatTimestamp(evt.timestamp)}</span>
                      </span>

                      <span className="text-slate-600">•</span>

                      <span className="px-1.5 py-0.5 rounded bg-[#090d16] text-slate-300 border border-slate-800 font-semibold uppercase">
                        {evt.source}
                      </span>

                      <span className="px-1.5 py-0.5 rounded bg-[#090d16] text-indigo-300 border border-slate-800">
                        {evt.event_type}
                      </span>

                      <span className="px-1.5 py-0.5 rounded bg-[#090d16] text-slate-400 border border-slate-800">
                        {evt.service}
                      </span>
                    </div>

                    {/* Severity Badge */}
                    <SeverityBadge severity={evt.severity as any} />
                  </div>

                  {/* Event Message */}
                  <div className="text-xs font-mono text-slate-200 bg-[#090d16]/80 p-2.5 rounded border border-slate-800/80 break-words leading-relaxed">
                    {evt.message}
                  </div>

                  {/* Metadata Accordion Toggle */}
                  {hasMetadata && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleMetadata(evt.id)}
                        aria-expanded={isMetadataOpen}
                        className="inline-flex items-center space-x-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded px-1"
                      >
                        <span>{isMetadataOpen ? 'Hide Metadata' : 'View Event Metadata'}</span>
                        {isMetadataOpen ? <ChevronUp className="h-3 w-3" aria-hidden="true" /> : <ChevronDown className="h-3 w-3" aria-hidden="true" />}
                      </button>

                      <AnimatePresence>
                        {isMetadataOpen && (
                          <motion.pre
                            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                            className="mt-2 p-3 bg-[#090d16] rounded border border-slate-800 text-[11px] font-mono text-indigo-200/90 overflow-x-auto leading-normal"
                          >
                            {JSON.stringify(evt.metadata, null, 2)}
                          </motion.pre>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

