import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cpu,
  LayoutDashboard,
  RefreshCw,
  Server,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { api, ApiError } from '../services/api';
import { Incident, Investigation, TelemetryEvent } from '../types/api';
import { formatTimeAgo, formatTimestamp } from '../utils/formatters';
import { TelemetryTimeline } from '../components/telemetry/TelemetryTimeline';
import { InvestigationView } from '../components/investigation/InvestigationView';
import {
  PageTransition,
  SeverityBadge,
  StatusBadge,
  GlassPanel,
  SectionHeader,
  AnimatedCard,
  AnimatedButton,
  ProgressRing,
  PulseIndicator,
} from '../components/ui';

interface IncidentDetailsProps {
  incidentId: string;
  onNavigate: (path: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type IncidentTab = 'summary' | 'telemetry' | 'investigation';

export const IncidentDetails: React.FC<IncidentDetailsProps> = ({
  incidentId,
  onNavigate,
  showToast,
}) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>([]);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);

  const [loadingIncident, setLoadingIncident] = useState<boolean>(true);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(true);
  const [investigating, setInvestigating] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<IncidentTab>('summary');

  // Load Incident Details
  const fetchIncidentDetails = async () => {
    setLoadingIncident(true);
    setErrorMsg(null);
    try {
      const incData = await api.getIncident(incidentId);
      setIncident(incData);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 404) {
        setErrorMsg('Incident not found.');
      } else {
        setErrorMsg('Failed to load incident details from backend.');
      }
    } finally {
      setLoadingIncident(false);
    }
  };

  // Load Telemetry Stream
  const fetchTelemetry = async () => {
    setLoadingTelemetry(true);
    try {
      const telData = await api.getIncidentTelemetry(incidentId);
      setTelemetry(telData.telemetry || []);
    } catch {
      // Keep empty if failed
    } finally {
      setLoadingTelemetry(false);
    }
  };

  // Check if investigation was already run & saved
  const fetchInvestigationResult = async () => {
    try {
      const invData = await api.getInvestigationResult(incidentId);
      setInvestigation(invData);
    } catch {
      setInvestigation(null);
    }
  };

  useEffect(() => {
    if (incidentId) {
      fetchIncidentDetails();
      fetchTelemetry();
      fetchInvestigationResult();
    }
  }, [incidentId]);

  // Trigger RCA engine
  const handleTriggerInvestigation = async () => {
    setInvestigating(true);
    try {
      const result = await api.investigateIncident(incidentId, true);
      setInvestigation(result);
      fetchIncidentDetails();

      if (showToast) {
        showToast('Investigation completed successfully.', 'success');
      }
    } catch (err: any) {
      if (showToast) {
        showToast(
          err instanceof ApiError ? err.message : 'Investigation engine failed.',
          'error'
        );
      }
    } finally {
      setInvestigating(false);
    }
  };

  // Handle evidence click -> switch to telemetry tab, highlight event & scroll
  const handleSelectEvidence = (telemetryEventId: string) => {
    setHighlightedEventId(telemetryEventId);
    setActiveTab('telemetry');
  };

  if (loadingIncident) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto stroke-1" />
        <p className="text-sm font-mono text-slate-400">Loading incident data from IAMFixer backend...</p>
      </div>
    );
  }

  if (errorMsg || !incident) {
    return (
      <GlassPanel className="p-10 text-center space-y-4 max-w-lg mx-auto my-12" borderVariant="rose">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">{errorMsg || 'Incident Not Found'}</h3>
        <p className="text-xs text-slate-400 font-sans">
          The requested incident ID does not exist or backend is unreachable.
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
      </GlassPanel>
    );
  }

  return (
    <PageTransition className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ x: -3 }}
          onClick={() => onNavigate('/')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors bg-[#0e1422] px-3 py-1.5 rounded-lg border border-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Incident Console</span>
        </motion.button>

        <span className="text-xs font-mono text-slate-400 bg-[#0e1422] px-2.5 py-1 rounded border border-slate-800">
          ID: {incident.id}
        </span>
      </div>

      {/* Incident Title & Header Banner */}
      <SectionHeader
        title={incident.title}
        subtitle={`Affected Service: ${incident.affected_service} • Detected ${formatTimeAgo(incident.detected_at)}`}
        icon={ShieldAlert}
        action={
          <div className="flex items-center space-x-2">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
        }
      />

      {/* Sliding Active Indicator Tabs Bar */}
      <nav aria-label="Incident Detail Tabs" className="flex items-center space-x-2 border-b border-slate-800 pb-2 relative">
        {[
          { id: 'summary', label: 'Summary', icon: LayoutDashboard },
          { id: 'telemetry', label: 'Telemetry Stream', icon: Zap, count: telemetry.length },
          { id: 'investigation', label: 'Root Cause & RCA', icon: Cpu, badge: investigation?.probable_root_cause ? true : false },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as IncidentTab)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                isActive
                  ? 'text-indigo-300'
                  : 'text-slate-400 hover:text-slate-200 bg-[#0e1422]/60 border border-slate-800/60'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="details-tab-active"
                  className="absolute inset-0 bg-slate-800/90 rounded-lg border border-slate-700/80 shadow-md -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className={`h-4 w-4 relative z-10 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} aria-hidden="true" />
              <span className="relative z-10">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded relative z-10 ${
                  isActive ? 'bg-indigo-950 text-indigo-200 border border-indigo-800' : 'bg-[#090d16] text-slate-400 border border-slate-800'
                }`}>
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse relative z-10" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Animated Tab Content Views */}
      <AnimatePresence mode="wait">
        {activeTab === 'summary' && (
          <motion.div
            key="tab-summary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Overview Card */}
            <GlassPanel className="p-6 space-y-4" borderVariant="indigo">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-100 flex items-center space-x-2 font-mono">
                  <Server className="h-4 w-4 text-indigo-400" />
                  <span>Incident Specification & Scope</span>
                </h3>
                <span className="text-xs font-mono text-indigo-300 bg-[#090d16] px-2.5 py-1 rounded border border-slate-800">
                  service: {incident.affected_service}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#090d16]/80 p-4 rounded-xl border border-slate-800/80">
                {incident.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div className="p-3 bg-[#090d16]/60 rounded-lg border border-slate-800/80 font-mono text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase">Detected Timestamp</span>
                  <div className="flex items-center space-x-1.5 text-slate-200 font-bold mt-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatTimestamp(incident.detected_at)}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {formatTimeAgo(incident.detected_at)}
                  </span>
                </div>

                <div className="p-3 bg-[#090d16]/60 rounded-lg border border-slate-800/80 font-mono text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase">Telemetry Stream Count</span>
                  <div className="flex items-center space-x-1.5 text-indigo-300 font-bold mt-1">
                    <Zap className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{telemetry.length} Recorded Events</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Logs, metrics, & database traces</span>
                </div>

                <div className="p-3 bg-[#090d16]/60 rounded-lg border border-slate-800/80 font-mono text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase">RCA Analysis Status</span>
                  <div className="flex items-center space-x-1.5 font-bold mt-1">
                    {investigation?.status === 'COMPLETED' ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">RCA Completed</span>
                      </>
                    ) : (
                      <>
                        <PulseIndicator color="purple" size="sm" />
                        <span className="text-purple-300">Pending RCA Run</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {investigation?.probable_root_cause ? investigation.probable_root_cause.category : 'Click RCA tab to evaluate'}
                  </span>
                </div>
              </div>
            </GlassPanel>

            {/* Quick Action Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatedCard className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-200 flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-indigo-400" />
                    <span>Telemetry Stream Timeline</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">{telemetry.length} events</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Inspect raw system logs, metric anomalies, database locks, and deployment markers correlated in chronological sequence.
                </p>
                <AnimatedButton
                  onClick={() => setActiveTab('telemetry')}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  View Telemetry Stream →
                </AnimatedButton>
              </AnimatedCard>

              <AnimatedCard className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-200 flex items-center space-x-2">
                    <Cpu className="h-4 w-4 text-purple-400" />
                    <span>RCA Analysis & Evidence</span>
                  </h4>
                  {investigation?.confidence != null && (
                    <ProgressRing confidence={investigation.confidence} size={36} strokeWidth={3} />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Execute the hybrid RCA engine to diagnose failure category, isolate supporting evidence, and view risk-aware remediation guidance.
                </p>
                <AnimatedButton
                  onClick={() => setActiveTab('investigation')}
                  variant="primary"
                  size="sm"
                  className="w-full"
                >
                  Inspect Root Cause Analysis →
                </AnimatedButton>
              </AnimatedCard>
            </div>
          </motion.div>
        )}

        {activeTab === 'telemetry' && (
          <motion.div
            key="tab-telemetry"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TelemetryTimeline
              telemetry={telemetry}
              loading={loadingTelemetry}
              highlightedEventId={highlightedEventId}
              onRefresh={fetchTelemetry}
            />
          </motion.div>
        )}

        {activeTab === 'investigation' && (
          <motion.div
            key="tab-investigation"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <InvestigationView
              investigation={investigation}
              loading={investigating}
              onTriggerInvestigation={handleTriggerInvestigation}
              onSelectEvidence={handleSelectEvidence}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};


